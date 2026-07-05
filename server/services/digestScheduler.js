import cron from "node-cron";
import { Octokit } from "@octokit/rest";
import Organization from "../models/Organization.js";
import Repository from "../models/Repository.js";
import User from "../models/User.js";
import DailySummary from "../models/DailySummary.js";
import { runOrchestrator } from "../workers/agents/orchestrator.js";

const MAX_DIGEST_COMMITS = 20;
const MAX_FILES_PER_COMMIT = 10;
const MAX_PATCH_CHARS = 400;

async function fetchCommitsByDateRange(accessToken, owner, repo, since, until) {
  const octokit = new Octokit({ auth: accessToken });
  try {
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      since: since.toISOString(),
      until: until.toISOString(),
      per_page: MAX_DIGEST_COMMITS,
    });

    const enriched = await Promise.all(
      commits.slice(0, MAX_DIGEST_COMMITS).map(async (c) => {
        try {
          const { data } = await octokit.rest.repos.getCommit({ owner, repo, ref: c.sha });
          return {
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split("\n")[0],
            author: c.commit.author?.name ?? "Unknown",
            files: (data.files ?? []).slice(0, MAX_FILES_PER_COMMIT).map((f) => ({
              filename: f.filename,
              status: f.status,
              additions: f.additions,
              deletions: f.deletions,
              patch: f.patch ? f.patch.slice(0, MAX_PATCH_CHARS) : null,
            })),
          };
        } catch {
          return {
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split("\n")[0],
            author: c.commit.author?.name ?? "Unknown",
            files: [],
          };
        }
      })
    );

    return enriched;
  } catch (err) {
    console.error(`[Digest] Failed to fetch commits for ${owner}/${repo}:`, err.message);
    return [];
  }
}

function buildDigestMarkdown({ repoName, periodLabel, since, until, summary, framework, blockers, commitCount }) {
  const lines = [];
  const sinceStr = since.toISOString().split("T")[0];
  const untilStr = until.toISOString().split("T")[0];

  lines.push(`## ${periodLabel} Digest · ${repoName}`);
  lines.push(`*Period: ${sinceStr} → ${untilStr} · ${commitCount} commits*`);
  lines.push("");

  if (summary?.headline) {
    lines.push(`**${summary.headline}**`);
    lines.push("");
  }

  if (summary?.what_changed?.length) {
    lines.push("### What Changed");
    summary.what_changed.forEach((b) => lines.push(`- ${b}`));
    lines.push("");
  }

  if (summary?.why_it_matters) {
    lines.push("### Impact");
    lines.push(summary.why_it_matters);
    lines.push("");
  }

  if (summary?.in_progress_signals?.length) {
    lines.push("### In Progress");
    summary.in_progress_signals.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
  }

  if (framework) {
    lines.push("### Effort Breakdown");
    if (framework.features?.length) framework.features.forEach((f) => lines.push(`- ✨ ${f}`));
    if (framework.bug_fixes?.length) framework.bug_fixes.forEach((f) => lines.push(`- 🐛 ${f}`));
    if (framework.chores?.length) framework.chores.forEach((f) => lines.push(`- 🔧 ${f}`));
    lines.push("");
  }

  if (blockers?.has_blockers) {
    lines.push("### ⚠️ Blockers");
    blockers.blockers.forEach((b) => lines.push(`- ${b}`));
    lines.push(`> **Recommendation:** ${blockers.recommendation}`);
    lines.push("");
  }

  return lines.join("\n");
}

async function generateDigestForOrg(org, cadence) {
  const now = new Date();
  let since, until, periodLabel, summaryType, dateKey;

  if (cadence === "daily") {
    since = new Date(now);
    since.setUTCDate(since.getUTCDate() - 1);
    since.setUTCHours(0, 0, 0, 0);
    until = new Date(since);
    until.setUTCHours(23, 59, 59, 999);
    periodLabel = "Daily";
    summaryType = "daily_digest";
    dateKey = since.toISOString().split("T")[0];
  } else {
    // weekly: last 7 days
    until = new Date(now);
    since = new Date(now);
    since.setUTCDate(since.getUTCDate() - 7);
    since.setUTCHours(0, 0, 0, 0);
    periodLabel = "Weekly";
    summaryType = "weekly_digest";
    dateKey = since.toISOString().split("T")[0];
  }

  const adminUser = await User.findOne({ org_id: org._id, role: "admin" });
  if (!adminUser) {
    console.warn(`[Digest] No admin user for org ${org.slug} — skipping`);
    return;
  }

  const repos = await Repository.find({ org_id: org._id, is_active: true });

  for (const repo of repos) {
    try {
      const [owner, repoSlug] = repo.full_name.split("/");
      const commits = await fetchCommitsByDateRange(adminUser.access_token, owner, repoSlug, since, until);

      if (commits.length === 0) {
        console.log(`[Digest] No commits for ${repo.full_name} in period — skipping`);
        continue;
      }

      const { summary, blockers, framework } = await runOrchestrator({
        eventType: "push",
        repoName: repo.full_name,
        branch: repo.default_branch ?? "main",
        commits,
        pr: null,
      });

      if (!summary && !framework) continue;

      const markdown = buildDigestMarkdown({
        repoName: repo.full_name,
        periodLabel,
        since,
        until,
        summary,
        framework,
        blockers,
        commitCount: commits.length,
      });

      const stats = {
        total_commits: commits.length,
        features: framework?.features?.length ?? 0,
        bug_fixes: framework?.bug_fixes?.length ?? 0,
        chores: framework?.chores?.length ?? 0,
        prs_merged: 0,
      };

      await DailySummary.findOneAndUpdate(
        { org_id: org._id, repo_id: repo._id, date: dateKey, summary_type: summaryType },
        { $set: { summary_markdown: markdown, stats } },
        { upsert: true, new: true }
      );

      console.log(`[Digest] Saved ${cadence} digest for ${repo.full_name}`);
    } catch (err) {
      console.error(`[Digest] Error generating digest for ${repo.full_name}:`, err.message);
    }
  }
}

export function startDigestScheduler() {
  // Daily digest — every day at 9 AM UTC
  cron.schedule("0 9 * * *", async () => {
    console.log("[Digest] Running daily digest job...");
    try {
      const orgs = await Organization.find({ "digest_schedule.cadence": "daily" });
      console.log(`[Digest] Found ${orgs.length} orgs with daily cadence`);
      for (const org of orgs) {
        await generateDigestForOrg(org, "daily");
      }
    } catch (err) {
      console.error("[Digest] Daily job error:", err.message);
    }
  });

  // Weekly digest — every Monday at 9 AM UTC
  cron.schedule("0 9 * * 1", async () => {
    console.log("[Digest] Running weekly digest job...");
    try {
      const orgs = await Organization.find({ "digest_schedule.cadence": "weekly" });
      console.log(`[Digest] Found ${orgs.length} orgs with weekly cadence`);
      for (const org of orgs) {
        await generateDigestForOrg(org, "weekly");
      }
    } catch (err) {
      console.error("[Digest] Weekly job error:", err.message);
    }
  });

  console.log("[Digest] Scheduler started — daily 09:00 UTC, weekly Mondays 09:00 UTC");
}
