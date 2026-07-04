import "dotenv/config";
import connectDB from "../config/db.js";
import Organization from "../models/Organization.js";
import Repository from "../models/Repository.js";

await connectDB();

const org = await Organization.findOne();
if (!org) {
  console.log("No organization found. Log in via GitHub OAuth first.");
  process.exit(1);
}

const repo = await Repository.findOneAndUpdate(
  { full_name: "Mehaksaluja/Agentic-AI" },
  {
    org_id: org._id,
    github_repo_id: "agentic-ai-local",
    name: "Agentic-AI",
    full_name: "Mehaksaluja/Agentic-AI",
    private: false,
    default_branch: "main",
    webhook_secret: process.env.GITHUB_WEBHOOK_SECRET,
    is_active: true,
  },
  { upsert: true, new: true }
);

console.log("Repo registered under org:", org.name);
console.log("Repo ID:", repo._id.toString());
process.exit(0);
