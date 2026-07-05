import express from "express";
import mongoose from "mongoose";
import DailySummary from "../models/DailySummary.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

// GET /api/summaries?repo_id=xxx&summary_type=daily_digest&include_archived=true&since=ISO&limit=20&page=1
router.get("/", requireAuth, async (req, res) => {
  const { repo_id, summary_type, include_archived, since, limit = 20, page = 1 } = req.query;
  const orgId = req.user.org_id._id ?? req.user.org_id;

  const query = { org_id: orgId };
  if (repo_id) query.repo_id = repo_id;
  if (summary_type) query.summary_type = summary_type;
  if (since) query.createdAt = { $gt: new Date(since) };
  if (include_archived !== "true") query.is_archived = { $ne: true };

  const skip = (Number(page) - 1) * Number(limit);

  const [summaries, total] = await Promise.all([
    DailySummary.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("repo_id", "name full_name")
      .lean(),
    DailySummary.countDocuments(query),
  ]);

  res.json({ summaries, total, page: Number(page), limit: Number(limit) });
});

// GET /api/summaries/:id
router.get("/:id", requireAuth, async (req, res) => {
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const summary = await DailySummary.findOne({ _id: req.params.id, org_id: orgId })
    .populate("repo_id", "name full_name")
    .lean();

  if (!summary) return res.status(404).json({ message: "Summary not found" });
  res.json(summary);
});

// POST /api/summaries/:id/feedback — thumbs up/down
router.post("/:id/feedback", requireAuth, async (req, res) => {
  const { rating, note } = req.body;
  if (!["up", "down"].includes(rating)) {
    return res.status(400).json({ message: "rating must be 'up' or 'down'" });
  }

  const orgId = req.user.org_id._id ?? req.user.org_id;
  const updated = await DailySummary.findOneAndUpdate(
    { _id: req.params.id, org_id: orgId },
    { $set: { "feedback.rating": rating, "feedback.note": note ?? null, "feedback.rated_at": new Date() } },
    { new: true }
  ).lean();

  if (!updated) return res.status(404).json({ message: "Summary not found" });
  res.json({ feedback: updated.feedback });
});

// PATCH /api/summaries/:id/archive — toggle archive
router.patch("/:id/archive", requireAuth, async (req, res) => {
  const { archived } = req.body;
  const orgId = req.user.org_id._id ?? req.user.org_id;

  const update = archived
    ? { is_archived: true, archived_at: new Date() }
    : { is_archived: false, archived_at: null };

  const updated = await DailySummary.findOneAndUpdate(
    { _id: req.params.id, org_id: orgId },
    { $set: update },
    { new: true }
  ).lean();

  if (!updated) return res.status(404).json({ message: "Summary not found" });
  res.json({ is_archived: updated.is_archived, archived_at: updated.archived_at });
});

// DELETE /api/summaries/:id — permanent delete
router.delete("/:id", requireAuth, async (req, res) => {
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const deleted = await DailySummary.findOneAndDelete({ _id: req.params.id, org_id: orgId });
  if (!deleted) return res.status(404).json({ message: "Summary not found" });
  res.json({ message: "Deleted" });
});

export default router;
