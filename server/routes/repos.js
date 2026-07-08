import express from "express";
import { Octokit } from "@octokit/rest";
import Repository from "../models/Repository.js";
import Organization from "../models/Organization.js";
import { canAddRepo } from "../config/planLimits.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

function orgId(user) {
  return user.org_id._id ?? user.org_id;
}

// Register a GitHub repo and auto-create the webhook on GitHub
router.post("/register", requireAuth, async (req, res) => {
  const { full_name } = req.body;
  if (!full_name || !full_name.includes("/")) {
    return res.status(400).json({ message: "Provide full_name in format owner/repo" });
  }

  const oidForLimitCheck = orgId(req.user);
  const [org, currentRepoCount] = await Promise.all([
    Organization.findById(oidForLimitCheck),
    Repository.countDocuments({ org_id: oidForLimitCheck }),
  ]);
  if (!org) return res.status(404).json({ message: "Organization not found" });
  if (!canAddRepo(org, currentRepoCount)) {
    return res.status(403).json({
      message: "Repository limit reached for your plan. Upgrade to add more repositories.",
    });
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

  const existing = await Repository.findOne({ github_repo_id: ghId, org_id: oid });
  if (existing) {
    return res.status(409).json({ message: "This repository is already added to your workspace." });
  }

  let webhookId = null;
  const serverUrl = process.env.SERVER_URL;
  if (serverUrl) {
    try {
      const { data: hook } = await octokit.rest.repos.createWebhook({
        owner,
        repo: repoSlug,
        config: {
          url: `${serverUrl}/webhooks/github`,
          content_type: "json",
          secret: process.env.GITHUB_WEBHOOK_SECRET,
          insecure_ssl: "0",
        },
        events: ["push", "pull_request"],
        active: true,
      });
      webhookId = String(hook.id);
      console.log(`[Repos] Webhook created for ${full_name} — hook id: ${webhookId}`);
    } catch (hookErr) {
      console.warn(`[Repos] Could not auto-create webhook for ${full_name}:`, hookErr.message);
    }
  } else {
    console.warn("[Repos] SERVER_URL not set — skipping auto webhook creation");
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
      webhook_id:     webhookId,
      is_active:      true,
    });

    res.json({ message: "Repo registered", repo, webhook_created: !!webhookId });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This repository is already registered." });
    }
    res.status(500).json({ message: error.message });
  }
});

// List all repos for this org
router.get("/", requireAuth, async (req, res) => {
  const repos = await Repository.find({ org_id: orgId(req.user) });
  res.json(repos);
});

// List GitHub repos accessible to the user (for the picker)
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

// Remove a repo from this org and delete its GitHub webhook
router.delete("/:id", requireAuth, async (req, res) => {
  const oid = orgId(req.user);
  const repo = await Repository.findOne({ _id: req.params.id, org_id: oid });
  if (!repo) return res.status(404).json({ message: "Repository not found" });

  // Delete the webhook from GitHub if we created one
  if (repo.webhook_id) {
    const [owner, repoSlug] = repo.full_name.split("/");
    const octokit = new Octokit({ auth: req.user.access_token });
    try {
      await octokit.rest.repos.deleteWebhook({ owner, repo: repoSlug, hook_id: Number(repo.webhook_id) });
      console.log(`[Repos] Deleted GitHub webhook ${repo.webhook_id} for ${repo.full_name}`);
    } catch (err) {
      // Webhook may already be gone — not a fatal error
      console.warn(`[Repos] Could not delete webhook for ${repo.full_name}:`, err.message);
    }
  }

  await Repository.findByIdAndDelete(repo._id);
  res.json({ message: "Repository removed" });
});

export default router;
