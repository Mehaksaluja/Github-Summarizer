import "dotenv/config";
import connectDB from "./config/db.js";
import { startWorker } from "./workers/summaryWorker.js";
import { startDigestScheduler } from "./services/digestScheduler.js";

connectDB();
startWorker();
startDigestScheduler();
