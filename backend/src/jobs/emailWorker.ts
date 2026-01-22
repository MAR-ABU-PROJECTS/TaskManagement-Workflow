import http from "http";
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
const POLL_MS = Number(process.env.EMAIL_WORKER_POLL_MS || "100");
const BATCH_SIZE = Number(process.env.EMAIL_WORKER_BATCH_SIZE || "25");
const CONCURRENCY = Number(process.env.EMAIL_WORKER_CONCURRENCY || "2");
const STALE_LOCK_MS = Number(
  process.env.EMAIL_WORKER_STALE_LOCK_MS || "300000",
);
const STALE_CHECK_MS = Number(
  process.env.EMAIL_WORKER_STALE_CHECK_MS || "60000",
);
const RETRY_BASE_SECONDS = Number(process.env.EMAIL_RETRY_BASE_SECONDS || "30");
const RETRY_MAX_SECONDS = Number(process.env.EMAIL_RETRY_MAX_SECONDS || "1800");
const RETRY_BASE_MS_RAW = Number(process.env.EMAIL_RETRY_BASE_MS || "");
const RETRY_MAX_MS_RAW = Number(process.env.EMAIL_RETRY_MAX_MS || "");
const RETRY_BASE_MS = Number.isFinite(RETRY_BASE_MS_RAW) && RETRY_BASE_MS_RAW > 0
  ? RETRY_BASE_MS_RAW
  : RETRY_BASE_SECONDS * 1000;
const RETRY_MAX_MS = Number.isFinite(RETRY_MAX_MS_RAW) && RETRY_MAX_MS_RAW > 0
  ? RETRY_MAX_MS_RAW
  : RETRY_MAX_SECONDS * 1000;
const SEND_RPS = Number(process.env.EMAIL_SEND_RPS || "2");
const MIN_SEND_INTERVAL_MS = SEND_RPS > 0 ? Math.floor(1000 / SEND_RPS) : 500;
const getHealthcheckEnabled = (override?: boolean) => {
  if (typeof override === "boolean") {
    return override;
  }
  return process.env.WORKER_HEALTHCHECK_ENABLED !== "false";
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const buildRetryDelayMs = (attempt: number) => {
  const base = RETRY_BASE_MS * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * 50);
  return Math.min(RETRY_MAX_MS, base + jitter);
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
  const errorName = (error as { name?: string }).name;

  if (!statusCode) {
    return true;
  }

  if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
    return false;
  }

  if (
    errorName === "validation_error" ||
    errorName === "invalid_from_address" ||
    errorName === "missing_required_field" ||
    errorName === "invalid_parameter"
  ) {
    return false;
  }

  return true;
};

let nextSendAt = 0;
let rateGate: Promise<void> = Promise.resolve();

const waitForSendSlot = async () => {
  let release: () => void;
  const waitForTurn = rateGate;
  rateGate = new Promise<void>((resolve) => {
    release = resolve;
  });

  await waitForTurn;

  try {
    const now = Date.now();
    const waitMs = Math.max(0, nextSendAt - now);
    nextSendAt = Math.max(nextSendAt, now) + MIN_SEND_INTERVAL_MS;
    if (waitMs > 0) {
      await sleep(waitMs);
    }
  } finally {
    release!();
  }
};

const startHealthServer = (enabled: boolean) => {
  if (!enabled) {
    return null;
  }

  const port = Number(process.env.PORT || "");
  if (!Number.isFinite(port) || port <= 0) {
    return null;
  }

  const server = http.createServer((req, res) => {
    const url = req.url || "/";
    if (url === "/" || url === "/health") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("ok");
      return;
    }

    res.statusCode = 404;
    res.end("not found");
  });

  server.listen(port, () => {
    logger.info(`Email worker healthcheck listening on port ${port}.`);
  });

  return server;
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
    await waitForSendSlot();
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

    const delayMs = buildRetryDelayMs(attempts);
    const nextAttemptAt = new Date(Date.now() + delayMs);
    const delaySeconds = Math.max(1, Math.round(delayMs / 1000));

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

export const startEmailWorker = async (options?: {
  enableHealthcheck?: boolean;
}) => {
  logger.info(`Email worker starting (id: ${WORKER_ID}).`);
  const healthServer = startHealthServer(
    getHealthcheckEnabled(options?.enableHealthcheck),
  );

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

  if (healthServer) {
    await new Promise<void>((resolve) => {
      healthServer.close(() => resolve());
    });
  }

  await prisma.$disconnect();
  logger.info("Email worker stopped.");
};
