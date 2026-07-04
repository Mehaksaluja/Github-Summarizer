import express from "express";
import DailySummary from "../models/DailySummary.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

// GET /api/summaries?repo_id=xxx&limit=20&page=1
router.get("/", requireAuth, async (req, res) => {
  const { repo_id, limit = 20, page = 1 } = req.query;
  const query = { org_id: req.user.org_id._id ?? req.user.org_id };
  if (repo_id) query.repo_id = repo_id;

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
  const summary = await DailySummary.findOne({
    _id: req.params.id,
    org_id: req.user.org_id._id ?? req.user.org_id,
  })
    .populate("repo_id", "name full_name")
    .lean();

  if (!summary) return res.status(404).json({ message: "Summary not found" });
  res.json(summary);
});

export default router;
