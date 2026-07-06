import User from "../models/User.js";
import DailySummary from "../models/DailySummary.js";
import { fetchPushDetails, fetchPRDetails } from "./githubFetcher.js";
import { runOrchestrator } from "./agents/orchestrator.js";
import { deliverNotifications } from "../services/notificationService.js";

function buildMarkdown({ eventType, repoName, branch, structured }) {
  const date = new Date().toISOString().split("T")[0];
  const lines = [];

  lines.push(`## ${date} · ${repoName}`);
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

  if (structured.in_progress?.length) {
    lines.push("### In Progress");
    structured.in_progress.forEach(s => lines.push(`- ${s}`));
    lines.push("");
  }

  const hasEffort = structured.features?.length || structured.bug_fixes?.length || structured.chores?.length;
  if (hasEffort) {
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

export async function runPipeline({ eventType, repoName, payload, org, repo }) {
  const adminUser = await User.findOne({ org_id: org._id, role: "admin" });
  if (!adminUser) throw new Error("No admin user found for org");

  const [owner, repoSlug] = repoName.split("/");
  let commits = [];
  let prData = null;

  if (eventType === "push") {
    commits = await fetchPushDetails(adminUser.access_token, owner, repoSlug, payload.commits ?? []);
  } else if (eventType === "pull_request") {
    const rawPR = await fetchPRDetails(adminUser.access_token, owner, repoSlug, payload.pull_request.number);
    prData = { ...rawPR, action: payload.action };
  }

  const branch = payload.ref?.replace("refs/heads/", "") ?? null;

  const { summary, blockers, framework } = await runOrchestrator({
    eventType, repoName, branch, commits, pr: prData,
  });

  if (!summary && !blockers && !framework) return null;

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
    commits: commits.map(c => ({ sha: c.sha, message: c.message, author: c.author })),
  };

  const markdown = buildMarkdown({ eventType, repoName, branch, structured });
  const date = new Date().toISOString().split("T")[0];

  const stats = {
    total_commits: commits.length,
    features: structured.features.length,
    bug_fixes: structured.bug_fixes.length,
    chores: structured.chores.length,
    prs_merged: eventType === "pull_request" && prData?.is_merged ? 1 : 0,
  };

  const saved = await DailySummary.create({
    org_id: org._id,
    repo_id: repo._id,
    date,
    summary_type: "standup",
    summary_markdown: markdown,
    structured,
    stats,
  });

  console.log(`[Pipeline] Summary saved — id: ${saved._id}`);

  if (org.integrations?.slack_webhook_url || org.integrations?.discord_webhook_url) {
    saved.populated_repo_name = repoName;
    const delivered = await deliverNotifications({ org, savedSummary: saved, summary, blockers });
    if (delivered.slack || delivered.discord) {
      await DailySummary.findByIdAndUpdate(saved._id, {
        $set: { "delivered_to.slack": delivered.slack, "delivered_to.discord": delivered.discord },
      });
      console.log(`[Pipeline] Delivered — slack:${delivered.slack} discord:${delivered.discord}`);
    }
  }

  return saved;
}
