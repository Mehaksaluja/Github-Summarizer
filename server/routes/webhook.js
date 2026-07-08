import express from "express";
import crypto from "crypto";
import WebhookLog from "../models/WebhookLog.js";
import { summaryQueue } from "../queue/queues.js";
import stripe, { handleWebhookEvent } from "../services/stripeService.js";

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
    const log = await WebhookLog.create({
      event_id: deliveryId,
      source: "github",
      event_type: eventType,
      status: "received",
      payload,
    });

    await summaryQueue.add(
      eventType,
      {
        webhookLogId: log._id.toString(),
        deliveryId,
        eventType,
        repoFullName: payload.repository?.full_name ?? null,
        payload,
      },
      { jobId: deliveryId } // deduplicate by GitHub delivery ID
    );

    await WebhookLog.findByIdAndUpdate(log._id, { status: "queued" });
    console.log(`[Webhook] ${eventType} queued — delivery: ${deliveryId}`);
  } catch (error) {
    // Duplicate event_id means GitHub resent the same event — safe to ignore
    if (error.code === 11000) {
      console.log(`[Webhook] Duplicate event ignored: ${deliveryId}`);
      return;
    }
    console.error(`[Webhook] Error logging event: ${error.message}`);
  }
});

router.post("/stripe", async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[Webhook] Stripe signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  // Return 200 immediately — Stripe retries on non-2xx
  res.status(200).json({ received: true });

  try {
    await WebhookLog.create({
      event_id: event.id,
      source: "stripe",
      event_type: event.type,
      status: "received",
      payload: event.data.object,
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log(`[Webhook] Duplicate Stripe event ignored: ${event.id}`);
      return;
    }
    console.error(`[Webhook] Error logging Stripe event: ${error.message}`);
  }

  try {
    await handleWebhookEvent(event);
    await WebhookLog.findOneAndUpdate({ event_id: event.id }, { status: "completed" });
    console.log(`[Webhook] Stripe event processed: ${event.type} (${event.id})`);
  } catch (err) {
    console.error(`[Webhook] Error processing Stripe event: ${err.message}`);
    await WebhookLog.findOneAndUpdate(
      { event_id: event.id },
      { status: "failed", error_message: err.message }
    );
  }
});

export default router;
