import express from "express";
import Organization from "../models/Organization.js";
import Repository from "../models/Repository.js";
import User from "../models/User.js";
import { generateReportForRepo } from "../services/reportGenerator.js";
import { canGenerateReport } from "../config/planLimits.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

// POST /api/reports/generate
// Body: { repo_id, type: "daily"|"weekly"|"custom", since?, until?, author? }
router.post("/generate", requireAuth, async (req, res) => {
  const { repo_id, type, since: sinceStr, until: untilStr, author } = req.body;

  if (!repo_id) return res.status(400).json({ message: "repo_id is required" });
  if (!["daily", "weekly", "custom"].includes(type)) {
    return res.status(400).json({ message: "type must be daily, weekly, or custom" });
  }

  const orgId = req.user.org_id._id ?? req.user.org_id;
  const [org, repo] = await Promise.all([
    Organization.findById(orgId),
    Repository.findOne({ _id: repo_id, org_id: orgId }),
  ]);

  if (!org) return res.status(404).json({ message: "Organization not found" });
  if (!repo) return res.status(404).json({ message: "Repository not found" });

  if (!canGenerateReport(org)) {
    return res.status(403).json({
      message: "Report limit reached for your plan. Upgrade to generate more reports.",
    });
  }

  const adminUser = await User.findPrimary(orgId);
  if (!adminUser) return res.status(500).json({ message: "No admin user found" });

  const now = new Date();
  const hour = org.digest_schedule?.hour ?? 9;
  let since, until, periodLabel, summaryType, dateKey;

  if (type === "daily") {
    until = new Date(now);
    until.setUTCHours(hour, 0, 0, 0);
    if (until > now) until.setUTCDate(until.getUTCDate() - 1);
    since = new Date(until);
    since.setUTCDate(since.getUTCDate() - 1);
    periodLabel = "Daily";
    summaryType = "daily_digest";
    dateKey = since.toISOString().split("T")[0];
  } else if (type === "weekly") {
    until = new Date(now);
    until.setUTCHours(hour, 0, 0, 0);
    if (until > now) until.setUTCDate(until.getUTCDate() - 1);
    since = new Date(until);
    since.setUTCDate(since.getUTCDate() - 7);
    periodLabel = "Weekly";
    summaryType = "weekly_digest";
    dateKey = since.toISOString().split("T")[0];
  } else {
    if (!sinceStr || !untilStr) {
      return res.status(400).json({ message: "since and until are required for custom range" });
    }
    since = new Date(sinceStr);
    until = new Date(untilStr);
    if (isNaN(since) || isNaN(until)) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    if (since >= until) {
      return res.status(400).json({ message: "since must be before until" });
    }
    const diffDays = (until - since) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      return res.status(400).json({ message: "Custom range cannot exceed 90 days" });
    }
    periodLabel = "Custom";
    summaryType = "custom_report";
    // Minute-precision key so same-start-date custom reports don't collide
    dateKey = since.toISOString().slice(0, 16);
  }

  try {
    const saved = await generateReportForRepo({
      accessToken: adminUser.access_token,
      org,
      repo,
      since,
      until,
      periodLabel,
      summaryType,
      dateKey,
      authorFilter: author?.trim() || null,
    });

    if (!saved) {
      return res.status(404).json({ message: "No commits found in the selected period" });
    }

    await Organization.findByIdAndUpdate(org._id, { $inc: { reports_generated: 1 } });

    res.json({ summary: saved });
  } catch (err) {
    console.error("[Reports] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;
