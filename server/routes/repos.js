import express from "express";
import { Octokit } from "@octokit/rest";
import Repository from "../models/Repository.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

// Register a GitHub repo for the logged-in user's org
router.post("/register", requireAuth, async (req, res) => {
  const { full_name } = req.body;
  if (!full_name || !full_name.includes("/")) {
    return res.status(400).json({ message: "Provide full_name in format owner/repo" });
  }

  const [owner, repoSlug] = full_name.split("/");
  const octokit = new Octokit({ auth: req.user.access_token });

  let githubRepo;
  try {
    const { data } = await octokit.rest.repos.get({ owner, repo: repoSlug });
    githubRepo = data;
  } catch {
    return res.status(404).json({ message: `Repo ${full_name} not found on GitHub` });
  }

  try {
    const repo = await Repository.findOneAndUpdate(
      { github_repo_id: String(githubRepo.id) },
      {
        org_id: req.user.org_id,
        github_repo_id: String(githubRepo.id),
        name: githubRepo.name,
        full_name: githubRepo.full_name,
        private: githubRepo.private,
        default_branch: githubRepo.default_branch,
        webhook_secret: process.env.GITHUB_WEBHOOK_SECRET,
        is_active: true,
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Repo registered", repo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// List all repos for the logged-in user's org
router.get("/", requireAuth, async (req, res) => {
  const repos = await Repository.find({ org_id: req.user.org_id });
  res.json(repos);
});

export default router;
