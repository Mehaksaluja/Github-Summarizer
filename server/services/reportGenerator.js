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
      owner,
      repo,
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

// ─── Group commits by author name ───────────────────────────────────────────

export function groupCommitsByAuthor(commits) {
  const byAuthor = {};
  for (const c of commits) {
    const name = c.author || "Unknown";
    if (!byAuthor[name]) byAuthor[name] = [];
    byAuthor[name].push(c);
  }
  // Sort authors by commit count desc
  return Object.fromEntries(
    Object.entries(byAuthor).sort(([, a], [, b]) => b.length - a.length)
  );
}

// ─── Rich digest markdown builder ───────────────────────────────────────────

export function buildRichDigestMarkdown({
  repoName, periodLabel, since, until, summary, framework, blockers, byAuthor, totalCommits, authorFilter,
}) {
  const lines = [];
  const fmt = (d) => d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const authorCount = Object.keys(byAuthor).length;
  const filterNote = authorFilter ? ` · filtered to: ${authorFilter}` : "";

  lines.push(`## ${periodLabel} Digest · ${repoName}`);
  lines.push(`*${fmt(since)} → ${fmt(until)} · ${totalCommits} commits · ${authorCount} contributor${authorCount !== 1 ? "s" : ""}${filterNote}*`);
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

  // Per-contributor section
  lines.push("---");
  lines.push("");
  lines.push("### Contributors");
  lines.push("");

  for (const [author, commits] of Object.entries(byAuthor)) {
    lines.push(`#### ${author} — ${commits.length} commit${commits.length !== 1 ? "s" : ""}`);
    commits.forEach((c) => {
      lines.push(`- ${c.message} \`${c.sha}\``);
    });
    const allFiles = [...new Set(commits.flatMap((c) => c.files?.map((f) => f.filename) ?? []))];
    if (allFiles.length > 0) {
      const shown = allFiles.slice(0, 10).join(", ");
      const more = allFiles.length > 10 ? ` +${allFiles.length - 10} more` : "";
      lines.push(`**Files touched:** ${shown}${more}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");

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

// ─── Main pipeline ───────────────────────────────────────────────────────────

export async function generateReportForRepo({
  accessToken,
  org,
  repo,
  since,
  until,
  periodLabel,
  summaryType,
  dateKey,
  authorFilter = null,
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
      (c) => c.author.toLowerCase().includes(lower) || (c.author_email ?? "").toLowerCase().includes(lower)
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
    model: org.preferred_ai_model || "gpt-4o-mini",
    customSummarizerPrompt: org.custom_prompts?.summarizer || null,
  });

  const markdown = buildRichDigestMarkdown({
    repoName: repo.full_name,
    periodLabel,
    since,
    until,
    summary,
    framework,
    blockers,
    byAuthor,
    totalCommits: commits.length,
    authorFilter,
  });

  const stats = {
    total_commits: commits.length,
    contributors: Object.keys(byAuthor).length,
    features: framework?.features?.length ?? 0,
    bug_fixes: framework?.bug_fixes?.length ?? 0,
    chores: framework?.chores?.length ?? 0,
    prs_merged: 0,
  };

  const saved = await DailySummary.findOneAndUpdate(
    { org_id: org._id, repo_id: repo._id, date: dateKey, summary_type: summaryType },
    { $set: { summary_markdown: markdown, stats, period: { since, until } } },
    { upsert: true, new: true }
  );

  console.log(`[Report] Saved ${periodLabel} report for ${repo.full_name}`);

  if (org.integrations?.slack_webhook_url || org.integrations?.discord_webhook_url) {
    saved.populated_repo_name = repo.full_name;
    const delivered = await deliverNotifications({ org, savedSummary: saved, summary, blockers });
    if (delivered.slack || delivered.discord) {
      await DailySummary.findByIdAndUpdate(saved._id, {
        $set: {
          "delivered_to.slack": delivered.slack,
          "delivered_to.discord": delivered.discord,
        },
      });
    }
  }

  return saved;
}
