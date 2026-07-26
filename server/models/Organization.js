import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    // Billing
    plan_tier: { type: String, enum: ["free", "pro", "agency"], default: "free" },
    subscription_status: {
      type: String,
      enum: ["active", "past_due", "cancelled", "trialing", "none"],
      default: "none",
    },
    dodo_customer_id: { type: String, default: null },
    dodo_subscription_id: { type: String, default: null },
    dodo_product_id: { type: String, default: null },
    current_period_end: { type: Date, default: null },
    cancel_at_period_end: { type: Boolean, default: false },

    // Free tier gate — incremented every time a report is generated
    reports_generated: { type: Number, default: 0 },

    // AI model preference for generating summaries
    preferred_ai_model: {
      type: String,
      enum: ["gpt-4o-mini", "gpt-4o"],
      default: "gpt-4o-mini",
    },

    // Custom system prompts per agent (null = use default)
    custom_prompts: {
      summarizer: { type: String, default: null },
    },

    // Digest delivery schedule
    digest_schedule: {
      cadence: { type: String, enum: ["per_push", "daily", "weekly"], default: "per_push" },
      hour: { type: Number, default: 9 }, // UTC hour to deliver digest (0-23)
    },

    // Agency white-label branding for PDF exports and client reports
    branding: {
      report_title: { type: String, default: null },
      footer_text: { type: String, default: null },
    },

    // Outbound integration webhooks
    integrations: {
      slack_webhook_url: { type: String, default: null },
      slack_channel_name: { type: String, default: null },
      discord_webhook_url: { type: String, default: null },
      email: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Organization", organizationSchema);
