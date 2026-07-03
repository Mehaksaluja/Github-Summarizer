import express from "express";
import crypto from "crypto";
import WebhookLog from "../models/WebhookLog.js";

const router = express.Router();

const verifyGitHubSignature = (req, res, next) => {
  const signature = req.headers["x-hub-signature-256"];

  if (!signature) {
    return res.status(401).json({ message: "No signature provided" });
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex")}`;

  // Timing-safe comparison prevents timing attacks
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  next();
};

router.post("/github", verifyGitHubSignature, async (req, res) => {
  // Return 200 immediately — never make GitHub wait
  res.status(200).json({ message: "Received" });

  const eventType = req.headers["x-github-event"];
  const deliveryId = req.headers["x-github-delivery"];
  const payload = req.body;

  // Only process events we care about
  const handledEvents = ["push", "pull_request", "pull_request_review"];
  if (!handledEvents.includes(eventType)) return;

  try {
    await WebhookLog.create({
      event_id: deliveryId,
      source: "github",
      event_type: eventType,
      status: "received",
      payload,
    });

    console.log(`[Webhook] ${eventType} received — delivery: ${deliveryId}`);
  } catch (error) {
    // Duplicate event_id means GitHub resent the same event — safe to ignore
    if (error.code === 11000) {
      console.log(`[Webhook] Duplicate event ignored: ${deliveryId}`);
      return;
    }
    console.error(`[Webhook] Error logging event: ${error.message}`);
  }
});

export default router;
