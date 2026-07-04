import "dotenv/config";
import connectDB from "./config/db.js";
import { startWorker } from "./workers/summaryWorker.js";

connectDB();
startWorker();
