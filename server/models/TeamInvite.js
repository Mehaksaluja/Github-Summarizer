import mongoose from "mongoose";
import crypto from "crypto";

const teamInviteSchema = new mongoose.Schema(
  {
    org_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    github_username: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["admin", "developer"], default: "developer" },
    invited_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(24).toString("hex"),
    },
    status: { type: String, enum: ["pending", "accepted", "revoked"], default: "pending" },
    accepted_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    accepted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("TeamInvite", teamInviteSchema);
