import express from "express";
import { Octokit } from "@octokit/rest";
import Repository from "../models/Repository.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

// Extract the raw ObjectId whether org_id is populated or not
function orgId(user) {
  return user.org_id._id ?? user.org_id;
}

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

  const oid = orgId(req.user);
  const ghId = String(githubRepo.id);

  // Check if already registered for this org
  const existing = await Repository.findOne({ github_repo_id: ghId, org_id: oid });
  if (existing) {
    return res.status(409).json({ message: "This repository is already added to your workspace." });
  }

  try {
    const repo = await Repository.create({
      org_id:         oid,
      github_repo_id: ghId,
      name:           githubRepo.name,
      full_name:      githubRepo.full_name,
      private:        githubRepo.private,
      default_branch: githubRepo.default_branch,
      webhook_secret: process.env.GITHUB_WEBHOOK_SECRET,
      is_active:      true,
    });

    res.json({ message: "Repo registered", repo });
  } catch (error) {
    // Duplicate key — another org already claimed this repo ID (unique index)
    if (error.code === 11000) {
      return res.status(409).json({ message: "This repository is already registered." });
    }
    res.status(500).json({ message: error.message });
  }
});

// List all repos for the logged-in user's org
router.get("/", requireAuth, async (req, res) => {
  const repos = await Repository.find({ org_id: orgId(req.user) });
  res.json(repos);
});

// List all GitHub repos accessible to the logged-in user (for the picker)
router.get("/github", requireAuth, async (req, res) => {
  const octokit = new Octokit({ auth: req.user.access_token });
  try {
    const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
      per_page: 100,
      sort: "updated",
      affiliation: "owner,collaborator,organization_member",
    });
    res.json(
      repos.map((r) => ({
        id:             String(r.id),
        name:           r.name,
        full_name:      r.full_name,
        private:        r.private,
        owner:          r.owner.login,
        owner_avatar:   r.owner.avatar_url,
        description:    r.description,
        default_branch: r.default_branch,
        updated_at:     r.updated_at,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
