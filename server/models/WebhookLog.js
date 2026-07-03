import mongoose from "mongoose";

const webhookLogSchema = new mongoose.Schema(
  {
    // Unique event ID from GitHub or Stripe — used for idempotency
    event_id: { type: String, required: true, unique: true },
    source: { type: String, enum: ["github", "stripe"], required: true },
    event_type: { type: String, required: true },

    status: {
      type: String,
      enum: ["received", "queued", "processing", "completed", "failed", "skipped_limit_reached"],
      default: "received",
    },

    // Raw payload stored for debugging
    payload: { type: mongoose.Schema.Types.Mixed },
    error_message: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("WebhookLog", webhookLogSchema);
