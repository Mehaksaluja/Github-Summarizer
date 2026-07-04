import { Queue } from "bullmq";
import connection from "./connection.js";

export const summaryQueue = new Queue("github-summary", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});
