import mongoose from "mongoose";

const repositorySchema = new mongoose.Schema(
  {
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },

    // GitHub repo details
    github_repo_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    full_name: { type: String, required: true },
    private: { type: Boolean, default: false },
    default_branch: { type: String, default: "main" },

    // Webhook registered on this repo
    webhook_id: { type: String, default: null },
    webhook_secret: { type: String, required: true },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Repository", repositorySchema);
