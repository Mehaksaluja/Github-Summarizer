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

    // GitHub OAuth tokens
    access_token: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
