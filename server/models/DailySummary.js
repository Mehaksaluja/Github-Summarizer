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
      enum: ["standup", "client_report", "executive_dashboard", "daily_digest", "weekly_digest"],
      required: true,
    },

    // Categorized commit counts
    stats: {
      features: { type: Number, default: 0 },
      bug_fixes: { type: Number, default: 0 },
      chores: { type: Number, default: 0 },
      total_commits: { type: Number, default: 0 },
      prs_merged: { type: Number, default: 0 },
    },

    // Vector embedding for future RAG ("Chat with Codebase")
    embedding: { type: [Number], default: [] },

    delivered_to: {
      slack: { type: Boolean, default: false },
      discord: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Prevent duplicate summaries for same org + repo + date + type
dailySummarySchema.index({ org_id: 1, repo_id: 1, date: 1, summary_type: 1 }, { unique: true });

export default mongoose.model("DailySummary", dailySummarySchema);
