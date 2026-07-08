import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    github_id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    display_name: { type: String },
    avatar_url: { type: String },
    email: { type: String, default: null },

    // Which org this user belongs to
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    role: { type: String, enum: ["admin", "developer"], default: "admin" },

    // The user whose GitHub token the pipeline/digest scheduler use for this org's
    // API calls. Set only for the user who created the org — invited members (even
    // admins) never become the token source, to keep pipeline behavior deterministic.
    is_primary: { type: Boolean, default: false },

    // GitHub OAuth tokens
    access_token: { type: String, required: true },
  },
  { timestamps: true }
);

// The pipeline/digest scheduler need exactly one GitHub-token source per org.
// Prefer the org's primary (creator) user; fall back to any legacy admin record
// for orgs that predate the is_primary migration.
userSchema.statics.findPrimary = async function (orgId) {
  return (
    (await this.findOne({ org_id: orgId, is_primary: true })) ??
    (await this.findOne({ org_id: orgId, role: "admin" }))
  );
};

export default mongoose.model("User", userSchema);
