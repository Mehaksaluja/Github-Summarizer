import { Worker } from "bullmq";
import connection from "../queue/connection.js";
import WebhookLog from "../models/WebhookLog.js";
import Organization from "../models/Organization.js";
import Repository from "../models/Repository.js";
import { runPipeline } from "./pipeline.js";

const FREE_TIER_REPORT_LIMIT = 1;

async function processJob(job) {
  const { webhookLogId, eventType, repoFullName, payload } = job.data;

  await WebhookLog.findByIdAndUpdate(webhookLogId, { status: "processing" });

  // Resolve which org this repo belongs to
  const repo = repoFullName
    ? await Repository.findOne({ full_name: repoFullName })
    : null;

  if (!repo) {
    console.log(`[Worker] Repo not registered in system: ${repoFullName} — skipping`);
    await WebhookLog.findByIdAndUpdate(webhookLogId, {
      status: "skipped_limit_reached",
      error_message: "Repository not registered",
    });
    return;
  }

  const org = await Organization.findById(repo.org_id);
  if (!org) {
    await WebhookLog.findByIdAndUpdate(webhookLogId, {
      status: "failed",
      error_message: "Organization not found",
    });
    return;
  }

  // Free tier gate — enforced here in the worker, not just at the API layer
  if (org.plan_tier === "free" && org.reports_generated >= FREE_TIER_REPORT_LIMIT) {
    console.log(`[Worker] Free tier limit reached for org: ${org.slug}`);
    await WebhookLog.findByIdAndUpdate(webhookLogId, { status: "skipped_limit_reached" });
    return;
  }

  console.log(`[Worker] Running AI pipeline for ${eventType} on ${repoFullName}`);

  await runPipeline({ eventType, repoName: repoFullName, payload, org, repo });

  await Organization.findByIdAndUpdate(org._id, { $inc: { reports_generated: 1 } });
  await WebhookLog.findByIdAndUpdate(webhookLogId, { status: "completed" });

  console.log(`[Worker] Job ${job.id} completed — org: ${org.slug}`);
}

export function startWorker() {
  const worker = new Worker("github-summary", processJob, {
    connection,
    concurrency: 5,
  });

  worker.on("completed", (job) => {
    console.log(`[Worker] ✓ Job ${job.id} (${job.name}) completed`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message);
    if (job?.data?.webhookLogId) {
      await WebhookLog.findByIdAndUpdate(job.data.webhookLogId, {
        status: "failed",
        error_message: err.message,
      });
    }
  });

  console.log("[Worker] Summary worker started — listening for jobs");
  return worker;
}
