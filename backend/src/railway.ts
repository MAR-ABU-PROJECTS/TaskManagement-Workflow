import logger from "./utils/logger";
import { startEmailWorker } from "./jobs/emailWorker";

const roleRaw =
  process.env.RAILWAY_SERVICE_ROLE || process.env.SERVICE_ROLE || "web";
const role = roleRaw.toLowerCase();

if (role === "worker") {
  startEmailWorker().catch((error) => {
    logger.error(
      `Email worker failed to start: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  });
} else {
  logger.info(`Starting web service (role: ${roleRaw}).`);
  // Importing index boots the HTTP server and cron enqueuers.
  void import("./index");
}
