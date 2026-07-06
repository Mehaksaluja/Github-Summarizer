import mongoose from "mongoose";

const dailySummarySchema = new mongoose.Schema(
  {
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    repo_id: { type: mongoose.Schema.Types.ObjectId, ref: "Repository", required: true },

    // The date this summary covers (YYYY-MM-DD)
    date: { type: String, required: true },

    // AI output
    summary_markdown: { type: String, required: true },
    summary_type: {
      type: String,
      enum: ["standup", "client_report", "executive_dashboard", "daily_digest", "weekly_digest", "custom_report"],
      required: true,
    },

    // Actual time window covered by this summary (ISO strings)
    period: {
      since: { type: Date },
      until: { type: Date },
    },

    // Categorized commit counts
    stats: {
      features: { type: Number, default: 0 },
      bug_fixes: { type: Number, default: 0 },
      chores: { type: Number, default: 0 },
      total_commits: { type: Number, default: 0 },
      prs_merged: { type: Number, default: 0 },
      contributors: { type: Number, default: 0 },
    },

    // Structured AI output — drives the rich UI rendering
    structured: { type: Object, default: null },

    // Vector embedding for future RAG ("Chat with Codebase")
    embedding: { type: [Number], default: [] },

    // User feedback on summary quality
    feedback: {
      rating: { type: String, enum: ["up", "down"], default: null },
      note: { type: String, default: null },
      rated_at: { type: Date, default: null },
    },

    // Soft archive — hidden from default list view but not deleted
    is_archived: { type: Boolean, default: false },
    archived_at: { type: Date, default: null },

    delivered_to: {
      slack: { type: Boolean, default: false },
      discord: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Index for fast lookups by org + repo + date
dailySummarySchema.index({ org_id: 1, repo_id: 1, date: 1 });

export default mongoose.model("DailySummary", dailySummarySchema);
