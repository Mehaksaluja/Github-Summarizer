import express from "express";
import Organization from "../models/Organization.js";
import { hasFeature } from "../config/planLimits.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.redirect("/login");
  next();
};

// GET /auth/slack — kick off Slack OAuth
router.get("/", requireAuth, async (req, res) => {
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const org = await Organization.findById(orgId).lean();
  if (!org || !hasFeature(org, "slackDiscord")) {
    return res.redirect(`${process.env.CLIENT_URL}/app/settings?slack=upgrade_required`);
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return res.redirect(`${process.env.CLIENT_URL}/app/settings?slack=no_config`);
  }
  const redirectUri = encodeURIComponent(`${process.env.SERVER_URL}/auth/slack/callback`);
  res.redirect(
    `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=incoming-webhook&redirect_uri=${redirectUri}`
  );
});

// GET /auth/slack/callback — Slack redirects here after user authorizes
router.get("/callback", requireAuth, async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    console.warn("[Slack OAuth] Denied or error:", error);
    return res.redirect(`${process.env.CLIENT_URL}/app/settings?slack=error`);
  }

  try {
    const redirectUri = `${process.env.SERVER_URL}/auth/slack/callback`;
    const resp = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await resp.json();

    if (!data.ok) {
      console.error("[Slack OAuth] API error:", data.error);
      return res.redirect(`${process.env.CLIENT_URL}/app/settings?slack=error`);
    }

    const webhookUrl = data.incoming_webhook?.url;
    const channelName = data.incoming_webhook?.channel;

    if (!webhookUrl) {
      return res.redirect(`${process.env.CLIENT_URL}/app/settings?slack=error`);
    }

    const orgId = req.user.org_id._id ?? req.user.org_id;
    const org = await Organization.findById(orgId).lean();
    if (!org || !hasFeature(org, "slackDiscord")) {
      return res.redirect(`${process.env.CLIENT_URL}/app/settings?slack=upgrade_required`);
    }

    await Organization.findByIdAndUpdate(orgId, {
      $set: {
        "integrations.slack_webhook_url": webhookUrl,
        "integrations.slack_channel_name": channelName ?? "",
      },
    });

    console.log(`[Slack OAuth] Connected ${channelName} for org ${orgId}`);
    res.redirect(`${process.env.CLIENT_URL}/app/settings?slack=connected`);
  } catch (err) {
    console.error("[Slack OAuth] Exception:", err.message);
    res.redirect(`${process.env.CLIENT_URL}/app/settings?slack=error`);
  }
});

export default router;
