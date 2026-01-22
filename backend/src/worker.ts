import logger from "./utils/logger";
import { startEmailWorker } from "./jobs/emailWorker";

startEmailWorker().catch((error) => {
  logger.error(`Email worker failed to start: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
