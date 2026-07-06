import { Octokit } from "@octokit/rest";
import DailySummary from "../models/DailySummary.js";
import { runOrchestrator } from "../workers/agents/orchestrator.js";
import { deliverNotifications } from "./notificationService.js";

const MAX_COMMITS = 50;
const MAX_FILES_PER_COMMIT = 12;
const MAX_PATCH_CHARS = 500;

// ─── GitHub fetching ────────────────────────────────────────────────────────

export async function fetchCommitsByDateRange(accessToken, owner, repo, since, until) {
  const octokit = new Octokit({ auth: accessToken });
  try {
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner, repo,
      since: since.toISOString(),
      until: until.toISOString(),
      per_page: MAX_COMMITS,
    });

    const enriched = await Promise.all(
      commits.slice(0, MAX_COMMITS).map(async (c) => {
        try {
          const { data } = await octokit.rest.repos.getCommit({ owner, repo, ref: c.sha });
          return {
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split("\n")[0],
            author: c.commit.author?.name ?? "Unknown",
            author_email: c.commit.author?.email ?? null,
            timestamp: c.commit.author?.date ?? null,
            files: (data.files ?? []).slice(0, MAX_FILES_PER_COMMIT).map(f => ({
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
            author_email: c.commit.author?.email ?? null,
            timestamp: c.commit.author?.date ?? null,
            files: [],
          };
        }
      })
    );

    return enriched;
  } catch (err) {
    console.error(`[Report] Failed to fetch commits for ${owner}/${repo}:`, err.message);
    return [];
  }
}

// ─── Group commits by author ────────────────────────────────────────────────

export function groupCommitsByAuthor(commits) {
  const byAuthor = {};
  for (const c of commits) {
    const name = c.author || "Unknown";
    if (!byAuthor[name]) byAuthor[name] = [];
    byAuthor[name].push(c);
  }
  return Object.fromEntries(
    Object.entries(byAuthor).sort(([, a], [, b]) => b.length - a.length)
  );
}

// ─── Markdown for Slack/Discord export ──────────────────────────────────────

function buildDigestMarkdown({ repoName, periodLabel, since, until, structured }) {
  const fmt = d => d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const lines = [];

  lines.push(`## ${periodLabel} · ${repoName}`);
  lines.push(`*${fmt(since)} → ${fmt(until)} · ${structured.total_commits} commits · ${structured.contributor_count} contributor${structured.contributor_count !== 1 ? "s" : ""}*`);
  lines.push("");

  if (structured.headline) {
    lines.push(`**${structured.headline}**`);
    lines.push("");
  }

  if (structured.what_changed?.length) {
    lines.push("### What Changed");
    structured.what_changed.forEach(b => lines.push(`- ${b}`));
    lines.push("");
  }

  if (structured.why_it_matters) {
    lines.push("### Impact");
    lines.push(structured.why_it_matters);
    lines.push("");
  }

  lines.push("---");
  lines.push("### Contributors");
  lines.push("");

  for (const [author, commits] of Object.entries(structured.by_author ?? {})) {
    lines.push(`#### ${author} — ${commits.length} commit${commits.length !== 1 ? "s" : ""}`);
    commits.forEach(c => lines.push(`- ${c.message} \`${c.sha}\``));
    lines.push("");
  }

  if (structured.features?.length || structured.bug_fixes?.length || structured.chores?.length) {
    lines.push("---");
    lines.push("### Effort Breakdown");
    structured.features?.forEach(f => lines.push(`- ✨ ${f}`));
    structured.bug_fixes?.forEach(f => lines.push(`- 🐛 ${f}`));
    structured.chores?.forEach(f => lines.push(`- 🔧 ${f}`));
    lines.push("");
  }

  if (structured.has_blockers) {
    lines.push("### ⚠️ Blockers");
    structured.blockers?.forEach(b => lines.push(`- ${b}`));
    if (structured.blocker_recommendation) {
      lines.push(`> **Recommendation:** ${structured.blocker_recommendation}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Main pipeline ───────────────────────────────────────────────────────────

export async function generateReportForRepo({
  accessToken, org, repo, since, until, periodLabel, summaryType, dateKey, authorFilter = null,
}) {
  const [owner, repoSlug] = repo.full_name.split("/");

  let commits = await fetchCommitsByDateRange(accessToken, owner, repoSlug, since, until);
  if (commits.length === 0) {
    console.log(`[Report] No commits for ${repo.full_name} in period — skipping`);
    return null;
  }

  if (authorFilter) {
    const lower = authorFilter.toLowerCase();
    commits = commits.filter(
      c => c.author.toLowerCase().includes(lower) || (c.author_email ?? "").toLowerCase().includes(lower)
    );
    if (commits.length === 0) {
      console.log(`[Report] No commits from author "${authorFilter}" in period — skipping`);
      return null;
    }
  }

  const byAuthor = groupCommitsByAuthor(commits);

  const { summary, blockers, framework } = await runOrchestrator({
    eventType: "push",
    repoName: repo.full_name,
    branch: repo.default_branch ?? "main",
    commits,
    pr: null,
  });

  const structured = {
    headline: summary?.headline ?? null,
    what_changed: summary?.what_changed ?? [],
    why_it_matters: summary?.why_it_matters ?? null,
    in_progress: summary?.in_progress ?? [],
    features: framework?.features ?? [],
    bug_fixes: framework?.bug_fixes ?? [],
    chores: framework?.chores ?? [],
    has_blockers: blockers?.has_blockers ?? false,
    blockers: blockers?.blockers ?? [],
    blocker_recommendation: blockers?.recommendation ?? null,
    risk_level: blockers?.risk_level ?? "low",
    period_label: periodLabel,
    since: since.toISOString(),
    until: until.toISOString(),
    total_commits: commits.length,
    contributor_count: Object.keys(byAuthor).length,
    by_author: Object.fromEntries(
      Object.entries(byAuthor).map(([name, cs]) => [
        name,
        cs.map(c => ({ sha: c.sha, message: c.message })),
      ])
    ),
  };

  const markdown = buildDigestMarkdown({ repoName: repo.full_name, periodLabel, since, until, structured });

  const stats = {
    total_commits: commits.length,
    contributors: Object.keys(byAuthor).length,
    features: structured.features.length,
    bug_fixes: structured.bug_fixes.length,
    chores: structured.chores.length,
    prs_merged: 0,
  };

  const saved = await DailySummary.findOneAndUpdate(
    { org_id: org._id, repo_id: repo._id, date: dateKey, summary_type: summaryType },
    { $set: { summary_markdown: markdown, structured, stats, period: { since, until } } },
    { upsert: true, new: true }
  );

  console.log(`[Report] Saved ${periodLabel} report for ${repo.full_name}`);

  if (org.integrations?.slack_webhook_url || org.integrations?.discord_webhook_url) {
    saved.populated_repo_name = repo.full_name;
    const delivered = await deliverNotifications({ org, savedSummary: saved, summary, blockers });
    if (delivered.slack || delivered.discord) {
      await DailySummary.findByIdAndUpdate(saved._id, {
        $set: { "delivered_to.slack": delivered.slack, "delivered_to.discord": delivered.discord },
      });
    }
  }

  return saved;
}
