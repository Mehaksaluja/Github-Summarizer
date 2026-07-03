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
    stripe_customer_id: { type: String, default: null },
    stripe_subscription_id: { type: String, default: null },

    // Free tier gate — incremented every time a report is generated
    reports_generated: { type: Number, default: 0 },

    // Outbound integration webhooks
    integrations: {
      slack_webhook_url: { type: String, default: null },
      discord_webhook_url: { type: String, default: null },
      email: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Organization", organizationSchema);
