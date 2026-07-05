import express from "express";
import WebhookLog from "../models/WebhookLog.js";
import Repository from "../models/Repository.js";
import { summaryQueue } from "../queue/queues.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

// GET /api/webhook-logs?status=failed&limit=20&page=1
router.get("/", requireAuth, async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;
  const orgId = req.user.org_id._id ?? req.user.org_id;

  // Find all repos belonging to this org to scope the webhook logs
  const repos = await Repository.find({ org_id: orgId }).select("full_name").lean();
  const repoNames = repos.map((r) => r.full_name);

  const query = { source: "github" };
  if (status) query.status = status;
  // Filter to only this org's repos via payload
  if (repoNames.length > 0) {
    query["payload.repository.full_name"] = { $in: repoNames };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    WebhookLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    WebhookLog.countDocuments(query),
  ]);

  // Attach repo name cleanly
  const enriched = logs.map((log) => ({
    ...log,
    repo_full_name: log.payload?.repository?.full_name ?? null,
    payload: undefined, // don't send raw payload to client
  }));

  res.json({ logs: enriched, total, page: Number(page), limit: Number(limit) });
});

// POST /api/webhook-logs/:id/retry — re-enqueue a failed event
router.post("/:id/retry", requireAuth, async (req, res) => {
  const log = await WebhookLog.findById(req.params.id);
  if (!log) return res.status(404).json({ message: "Log not found" });

  const repoFullName = log.payload?.repository?.full_name;
  if (!repoFullName) return res.status(400).json({ message: "Cannot determine repository from log" });

  // Verify this org owns the repo
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const repo = await Repository.findOne({ full_name: repoFullName, org_id: orgId });
  if (!repo) return res.status(403).json({ message: "Repository not owned by your organization" });

  // Reset log status and re-queue with a unique job ID to bypass deduplication
  await WebhookLog.findByIdAndUpdate(log._id, {
    status: "queued",
    error_message: null,
  });

  await summaryQueue.add(
    log.event_type,
    {
      webhookLogId: log._id.toString(),
      deliveryId: log.event_id,
      eventType: log.event_type,
      repoFullName,
      payload: log.payload,
    },
    { jobId: `${log.event_id}-retry-${Date.now()}` }
  );

  res.json({ message: "Retrying", log_id: log._id });
});

// GET /api/webhook-logs/stats — count by status for the org's repos
router.get("/stats", requireAuth, async (req, res) => {
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const repos = await Repository.find({ org_id: orgId }).select("full_name").lean();
  const repoNames = repos.map((r) => r.full_name);

  const baseQuery = {
    source: "github",
    ...(repoNames.length > 0 && { "payload.repository.full_name": { $in: repoNames } }),
  };

  const stats = await WebhookLog.aggregate([
    { $match: baseQuery },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts = { total: 0, failed: 0, completed: 0, skipped: 0, processing: 0 };
  stats.forEach(({ _id, count }) => {
    counts.total += count;
    if (_id === "failed") counts.failed = count;
    else if (_id === "completed") counts.completed = count;
    else if (_id === "skipped_limit_reached") counts.skipped += count;
    else if (_id === "processing") counts.processing = count;
  });

  res.json(counts);
});

export default router;
