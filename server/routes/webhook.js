import express from "express";
import crypto from "crypto";
import WebhookLog from "../models/WebhookLog.js";
import { summaryQueue } from "../queue/queues.js";
import { unwrapWebhook, handleWebhookEvent } from "../services/dodoService.js";

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

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  next();
};

router.post("/github", verifyGitHubSignature, async (req, res) => {
  res.status(200).json({ message: "Received" });

  const eventType = req.headers["x-github-event"];
  const deliveryId = req.headers["x-github-delivery"];
  const payload = req.body;

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
      { jobId: deliveryId }
    );

    await WebhookLog.findByIdAndUpdate(log._id, { status: "queued" });
    console.log(`[Webhook] ${eventType} queued — delivery: ${deliveryId}`);
  } catch (error) {
    if (error.code === 11000) {
      console.log(`[Webhook] Duplicate event ignored: ${deliveryId}`);
      return;
    }
    console.error(`[Webhook] Error logging event: ${error.message}`);
  }
});

router.post("/dodo", async (req, res) => {
  let event;
  try {
    event = unwrapWebhook(req.rawBody, req.headers);
  } catch (err) {
    console.error("[Webhook] Dodo signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  res.status(200).json({ received: true });

  const eventId =
    req.headers["webhook-id"] ||
    `${event?.business_id || "dodo"}:${event?.timestamp || Date.now()}:${event?.type}`;

  try {
    await WebhookLog.create({
      event_id: String(eventId),
      source: "dodo",
      event_type: event.type,
      status: "received",
      payload: event.data ?? event,
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log(`[Webhook] Duplicate Dodo event ignored: ${eventId}`);
      return;
    }
    console.error(`[Webhook] Error logging Dodo event: ${error.message}`);
  }

  try {
    await handleWebhookEvent(event);
    await WebhookLog.findOneAndUpdate({ event_id: String(eventId) }, { status: "completed" });
    console.log(`[Webhook] Dodo event processed: ${event.type} (${eventId})`);
  } catch (err) {
    console.error(`[Webhook] Error processing Dodo event: ${err.message}`);
    await WebhookLog.findOneAndUpdate(
      { event_id: String(eventId) },
      { status: "failed", error_message: err.message }
    );
  }
});

export default router;
