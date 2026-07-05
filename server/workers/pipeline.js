import User from "../models/User.js";
import DailySummary from "../models/DailySummary.js";
import { fetchPushDetails, fetchPRDetails } from "./githubFetcher.js";
import { runOrchestrator } from "./agents/orchestrator.js";

function buildMarkdown({ eventType, repoName, branch, summary, blockers, framework, pr }) {
  const date = new Date().toISOString().split("T")[0];
  const lines = [];

  lines.push(`## ${date} · ${repoName}`);
  lines.push("");

  if (summary) {
    lines.push(`**${summary.headline}**`);
    lines.push("");

    if (summary.what_changed?.length) {
      lines.push("### What Changed");
      summary.what_changed.forEach((b) => lines.push(`- ${b}`));
      lines.push("");
    }

    if (summary.why_it_matters) {
      lines.push("### Impact");
      lines.push(summary.why_it_matters);
      lines.push("");
    }

    if (summary.in_progress_signals?.length) {
      lines.push("### In Progress");
      summary.in_progress_signals.forEach((s) => lines.push(`- ${s}`));
      lines.push("");
    }
  }

  if (framework) {
    lines.push("### Effort Breakdown");
    if (framework.features?.length)
      framework.features.forEach((f) => lines.push(`- ✨ ${f}`));
    if (framework.bug_fixes?.length)
      framework.bug_fixes.forEach((f) => lines.push(`- 🐛 ${f}`));
    if (framework.chores?.length)
      framework.chores.forEach((f) => lines.push(`- 🔧 ${f}`));
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

export async function runPipeline({ eventType, repoName, payload, org, repo }) {
  // Find org admin to get their GitHub access token for Octokit calls
  const adminUser = await User.findOne({ org_id: org._id, role: "admin" });
  if (!adminUser) throw new Error("No admin user found for org");

  const [owner, repoSlug] = repoName.split("/");
  let commits = [];
  let prData = null;

  // Fetch rich GitHub data
  if (eventType === "push") {
    commits = await fetchPushDetails(adminUser.access_token, owner, repoSlug, payload.commits ?? []);
  } else if (eventType === "pull_request") {
    const rawPR = await fetchPRDetails(
      adminUser.access_token,
      owner,
      repoSlug,
      payload.pull_request.number
    );
    prData = { ...rawPR, action: payload.action };
  }

  const branch = payload.ref?.replace("refs/heads/", "") ?? null;

  // Run the multi-agent pipeline with org's preferred model + custom prompts
  const { summary, blockers, framework } = await runOrchestrator({
    eventType,
    repoName,
    branch,
    commits,
    pr: prData,
    model: org.preferred_ai_model || "gpt-4o-mini",
    customSummarizerPrompt: org.custom_prompts?.summarizer || null,
  });

  // Nothing to save if all agents were skipped (e.g. PR review event)
  if (!summary && !blockers && !framework) return null;

  const markdown = buildMarkdown({ eventType, repoName, branch, summary, blockers, framework, pr: prData });
  const date = new Date().toISOString().split("T")[0];

  const stats = {
    total_commits: commits.length,
    features: framework?.features?.length ?? 0,
    bug_fixes: framework?.bug_fixes?.length ?? 0,
    chores: framework?.chores?.length ?? 0,
    prs_merged: eventType === "pull_request" && prData?.is_merged ? 1 : 0,
  };

  // Upsert — if a summary already exists for this org+repo+date+type, update it
  const saved = await DailySummary.findOneAndUpdate(
    { org_id: org._id, repo_id: repo._id, date, summary_type: "standup" },
    { $set: { summary_markdown: markdown, stats } },
    { upsert: true, new: true }
  );

  console.log(`[Pipeline] Summary saved — id: ${saved._id}`);
  return saved;
}
