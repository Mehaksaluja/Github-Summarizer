import express from "express";
import mongoose from "mongoose";
import DailySummary from "../models/DailySummary.js";
import Repository from "../models/Repository.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

// GET /api/analytics?days=30&repo_id=xxx
router.get("/", requireAuth, async (req, res) => {
  const { days = 30, repo_id } = req.query;
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const dayCount = Math.min(Math.max(Number(days) || 30, 7), 90);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - dayCount);
  since.setUTCHours(0, 0, 0, 0);
  const sinceStr = since.toISOString().split("T")[0];

  const matchStage = {
    org_id: new mongoose.Types.ObjectId(orgId),
    date: { $gte: sinceStr },
    is_archived: { $ne: true },
  };
  if (repo_id) matchStage.repo_id = new mongoose.Types.ObjectId(repo_id);

  // Build a date series for the last N days (so days with no commits still appear)
  const dateSeries = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    dateSeries.push(d.toISOString().split("T")[0]);
  }

  const [aggregated, byRepo, totals] = await Promise.all([
    // Commits per day
    DailySummary.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$date",
          commits: { $sum: "$stats.total_commits" },
          features: { $sum: "$stats.features" },
          bug_fixes: { $sum: "$stats.bug_fixes" },
          chores: { $sum: "$stats.chores" },
          prs_merged: { $sum: "$stats.prs_merged" },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // By repository
    DailySummary.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$repo_id",
          commits: { $sum: "$stats.total_commits" },
          summaries: { $sum: 1 },
          features: { $sum: "$stats.features" },
          bug_fixes: { $sum: "$stats.bug_fixes" },
        },
      },
      { $sort: { commits: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "repositories",
          localField: "_id",
          foreignField: "_id",
          as: "repo",
        },
      },
      { $unwind: "$repo" },
      {
        $project: {
          name: "$repo.name",
          full_name: "$repo.full_name",
          commits: 1,
          summaries: 1,
          features: 1,
          bug_fixes: 1,
        },
      },
    ]),

    // Overall totals
    DailySummary.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total_commits: { $sum: "$stats.total_commits" },
          total_features: { $sum: "$stats.features" },
          total_bug_fixes: { $sum: "$stats.bug_fixes" },
          total_chores: { $sum: "$stats.chores" },
          total_prs: { $sum: "$stats.prs_merged" },
          total_summaries: { $sum: 1 },
          up_votes: { $sum: { $cond: [{ $eq: ["$feedback.rating", "up"] }, 1, 0] } },
          down_votes: { $sum: { $cond: [{ $eq: ["$feedback.rating", "down"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  // Merge aggregated into date series so every day is present
  const byDateMap = Object.fromEntries(aggregated.map((d) => [d._id, d]));
  const commits_by_day = dateSeries.map((date) => ({
    date,
    commits: byDateMap[date]?.commits ?? 0,
    features: byDateMap[date]?.features ?? 0,
    bug_fixes: byDateMap[date]?.bug_fixes ?? 0,
    chores: byDateMap[date]?.chores ?? 0,
    prs_merged: byDateMap[date]?.prs_merged ?? 0,
  }));

  res.json({
    commits_by_day,
    by_repo: byRepo,
    totals: totals[0] ?? {
      total_commits: 0,
      total_features: 0,
      total_bug_fixes: 0,
      total_chores: 0,
      total_prs: 0,
      total_summaries: 0,
      up_votes: 0,
      down_votes: 0,
    },
    days: dayCount,
  });
});

export default router;
