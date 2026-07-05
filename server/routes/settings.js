import express from "express";
import Organization from "../models/Organization.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

// GET /api/settings — full org settings
router.get("/", requireAuth, async (req, res) => {
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const org = await Organization.findById(orgId).lean();
  if (!org) return res.status(404).json({ message: "Organization not found" });

  res.json({
    preferred_ai_model: org.preferred_ai_model ?? "gpt-4o-mini",
    custom_prompts: org.custom_prompts ?? { summarizer: null },
    digest_schedule: org.digest_schedule ?? { cadence: "per_push", hour: 9 },
    integrations: org.integrations ?? {},
  });
});

// PUT /api/settings/schedule
router.put("/schedule", requireAuth, async (req, res) => {
  const { cadence, hour } = req.body;
  if (!["per_push", "daily", "weekly"].includes(cadence)) {
    return res.status(400).json({ message: "cadence must be per_push, daily, or weekly" });
  }
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const updated = await Organization.findByIdAndUpdate(
    orgId,
    { $set: { "digest_schedule.cadence": cadence, "digest_schedule.hour": hour ?? 9 } },
    { new: true }
  ).lean();
  res.json({ digest_schedule: updated.digest_schedule });
});

// PUT /api/settings/integrations
router.put("/integrations", requireAuth, async (req, res) => {
  const { slack_webhook_url, discord_webhook_url, email } = req.body;
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const updated = await Organization.findByIdAndUpdate(
    orgId,
    {
      $set: {
        "integrations.slack_webhook_url": slack_webhook_url || null,
        "integrations.discord_webhook_url": discord_webhook_url || null,
        "integrations.email": email || null,
      },
    },
    { new: true }
  ).lean();
  res.json({ integrations: updated.integrations });
});

// PUT /api/settings/model — AI model preference
router.put("/model", requireAuth, async (req, res) => {
  const { preferred_ai_model } = req.body;
  if (!["gpt-4o-mini", "gpt-4o"].includes(preferred_ai_model)) {
    return res.status(400).json({ message: "Invalid model" });
  }
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const updated = await Organization.findByIdAndUpdate(
    orgId,
    { $set: { preferred_ai_model } },
    { new: true }
  ).lean();
  res.json({ preferred_ai_model: updated.preferred_ai_model });
});

// POST /api/settings/test-notification — send a test message to verify webhook URLs
router.post("/test-notification", requireAuth, async (req, res) => {
  const { channel } = req.body; // "slack" | "discord"
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const org = await Organization.findById(orgId).lean();
  if (!org) return res.status(404).json({ message: "Organization not found" });

  const url =
    channel === "slack"
      ? org.integrations?.slack_webhook_url
      : org.integrations?.discord_webhook_url;

  if (!url) return res.status(400).json({ message: `No ${channel} webhook URL configured` });

  try {
    if (channel === "slack") {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "✅ *GitPulse test notification* — your Slack integration is working!",
          blocks: [
            {
              type: "section",
              text: { type: "mrkdwn", text: "✅ *GitPulse test notification*\nYour Slack integration is working. Summaries will appear here when generated." },
            },
          ],
        }),
      });
      if (!r.ok) throw new Error(`Slack returned ${r.status}`);
    } else {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "✅ GitPulse test notification",
            description: "Your Discord integration is working. Summaries will appear here when generated.",
            color: 0x238636,
            footer: { text: "GitPulse" },
          }],
        }),
      });
      if (!r.ok) throw new Error(`Discord returned ${r.status}`);
    }
    res.json({ message: "Test notification sent successfully" });
  } catch (err) {
    res.status(502).json({ message: `Delivery failed: ${err.message}` });
  }
});

// PUT /api/settings/prompts — custom system prompts
router.put("/prompts", requireAuth, async (req, res) => {
  const { summarizer } = req.body;
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const updated = await Organization.findByIdAndUpdate(
    orgId,
    { $set: { "custom_prompts.summarizer": summarizer || null } },
    { new: true }
  ).lean();
  res.json({ custom_prompts: updated.custom_prompts });
});

export default router;
