import prisma from "../db/prisma";
import emailService, { EmailSendJob } from "../services/EmailService";
import logger from "../utils/logger";

type EmailJobRow = EmailSendJob & {
  template: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lockedAt: Date | null;
  lockedBy: string | null;
  lastError: string | null;
  providerMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const WORKER_ID =
  process.env.EMAIL_WORKER_ID || `email-worker-${process.pid}`;
const POLL_MS = Number(process.env.EMAIL_WORKER_POLL_MS || "500");
const BATCH_SIZE = Number(process.env.EMAIL_WORKER_BATCH_SIZE || "25");
const CONCURRENCY = Number(process.env.EMAIL_WORKER_CONCURRENCY || "5");
const STALE_LOCK_MS = Number(
  process.env.EMAIL_WORKER_STALE_LOCK_MS || "300000",
);
const STALE_CHECK_MS = Number(
  process.env.EMAIL_WORKER_STALE_CHECK_MS || "60000",
);
const RETRY_BASE_SECONDS = Number(
  process.env.EMAIL_RETRY_BASE_SECONDS || "30",
);
const RETRY_MAX_SECONDS = Number(
  process.env.EMAIL_RETRY_MAX_SECONDS || "1800",
);

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const buildRetryDelaySeconds = (attempt: number) => {
  const base = RETRY_BASE_SECONDS * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * 5);
  return Math.min(RETRY_MAX_SECONDS, base + jitter);
};

const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const isRetryable = (error: unknown) => {
  const statusCode =
    (error as { statusCode?: number }).statusCode ??
    (error as { status?: number }).status;

  if (!statusCode) {
    return true;
  }

  if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
    return false;
  }

  return true;
};

const requeueStaleJobs = async () => {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MS);
  const updated = await prisma.$executeRaw`
    UPDATE email_jobs
    SET status = 'QUEUED', locked_at = NULL, locked_by = NULL
    WHERE status = 'SENDING'
      AND locked_at IS NOT NULL
      AND locked_at < ${staleBefore}
  `;

  if (Number(updated) > 0) {
    logger.warn(`Re-queued ${updated} stale email jobs.`);
  }
};

const fetchJobs = async () =>
  prisma.$queryRaw<EmailJobRow[]>`
    WITH picked AS (
      SELECT id
      FROM email_jobs
      WHERE status = 'QUEUED' AND next_attempt_at <= NOW()
      ORDER BY next_attempt_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${BATCH_SIZE}
    )
    UPDATE email_jobs
    SET status = 'SENDING', locked_at = NOW(), locked_by = ${WORKER_ID}
    WHERE id IN (SELECT id FROM picked)
    RETURNING
      id,
      "to",
      subject,
      html,
      text,
      template,
      status,
      attempts,
      max_attempts AS "maxAttempts",
      next_attempt_at AS "nextAttemptAt",
      locked_at AS "lockedAt",
      locked_by AS "lockedBy",
      last_error AS "lastError",
      provider_message_id AS "providerMessageId",
      idempotency_key AS "idempotencyKey",
      created_at AS "createdAt",
      updated_at AS "updatedAt";
  `;

const handleJob = async (job: EmailJobRow) => {
  try {
    const providerMessageId = await emailService.sendQueuedEmail(job);

    await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: "SENT",
        providerMessageId: providerMessageId || null,
        lastError: null,
        lockedAt: null,
        lockedBy: null,
      },
    });
  } catch (error) {
    const attempts = job.attempts + 1;
    const retryable = isRetryable(error);
    const lastError = extractErrorMessage(error);

    if (!retryable || attempts >= job.maxAttempts) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          attempts,
          lastError,
          lockedAt: null,
          lockedBy: null,
        },
      });
      logger.error(
        `Email job ${job.id} failed after ${attempts} attempts (${job.template}). ${lastError}`,
      );
      return;
    }

    const delaySeconds = buildRetryDelaySeconds(attempts);
    const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000);

    await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: "QUEUED",
        attempts,
        nextAttemptAt,
        lastError,
        lockedAt: null,
        lockedBy: null,
      },
    });

    logger.warn(
      `Email job ${job.id} retry scheduled in ${delaySeconds}s (${job.template}). ${lastError}`,
    );
  }
};

const processBatch = async (jobs: EmailJobRow[]) => {
  const limit = Math.max(1, Math.min(CONCURRENCY, jobs.length));
  let index = 0;

  const workers = Array.from({ length: limit }, async () => {
    while (index < jobs.length) {
      const current = jobs[index];
      index += 1;
      if (!current) {
        break;
      }
      await handleJob(current);
    }
  });

  await Promise.all(workers);
};

export const startEmailWorker = async () => {
  logger.info(`Email worker starting (id: ${WORKER_ID}).`);

  let shuttingDown = false;
  const handleShutdown = (signal: NodeJS.Signals) => {
    logger.warn(`Email worker received ${signal}, shutting down...`);
    shuttingDown = true;
  };

  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);

  let lastStaleCheck = 0;

  while (!shuttingDown) {
    try {
      const now = Date.now();
      if (now - lastStaleCheck >= STALE_CHECK_MS) {
        await requeueStaleJobs();
        lastStaleCheck = now;
      }

      const jobs = await fetchJobs();

      if (jobs.length === 0) {
        await sleep(POLL_MS);
        continue;
      }

      await processBatch(jobs);
    } catch (error) {
      logger.error(`Email worker loop error: ${extractErrorMessage(error)}`);
      await sleep(POLL_MS);
    }
  }

  await prisma.$disconnect();
  logger.info("Email worker stopped.");
};
