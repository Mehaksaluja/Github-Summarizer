/**
 * Sends AI-generated summaries to Slack and Discord via webhooks.
 * Called after every summary is saved — either from push pipeline or scheduled digest.
 */

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─── Slack ────────────────────────────────────────────────────────────────────

function buildSlackPayload({ summary, stats, blockers, repoName, date, summaryId, summaryType }) {
  const viewUrl = `${CLIENT_URL}/app/summaries/${summaryId}`;
  const typeLabel = {
    standup: "Standup",
    daily_digest: "Daily Digest",
    weekly_digest: "Weekly Digest",
    client_report: "Client Report",
    executive_dashboard: "Executive Dashboard",
  }[summaryType] ?? "Summary";

  const blocks = [];

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `GitPulse ${typeLabel} — ${repoName}`,
      emoji: true,
    },
  });

  // Date context
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `📅 ${date}` }],
  });

  blocks.push({ type: "divider" });

  // Headline + what changed
  if (summary?.headline) {
    const bullets = (summary.what_changed ?? [])
      .slice(0, 5)
      .map((b) => `• ${b}`)
      .join("\n");

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${summary.headline}*${bullets ? `\n\n${bullets}` : ""}`,
      },
    });
  }

  // Impact
  if (summary?.why_it_matters) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `💡 ${summary.why_it_matters}` },
    });
  }

  // Stats
  blocks.push({
    type: "section",
    fields: [
      { type: "mrkdwn", text: `*Commits*\n${stats.total_commits}` },
      { type: "mrkdwn", text: `*PRs Merged*\n${stats.prs_merged}` },
      { type: "mrkdwn", text: `*✨ Features*\n${stats.features}` },
      { type: "mrkdwn", text: `*🐛 Bug Fixes*\n${stats.bug_fixes}` },
    ],
  });

  // Blockers warning
  if (blockers?.has_blockers) {
    const riskEmoji = { low: "🟡", medium: "🟠", high: "🔴" }[blockers.risk_level] ?? "⚠️";
    const blockerLines = blockers.blockers.map((b) => `• ${b}`).join("\n");
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${riskEmoji} *Blocker Detected (${blockers.risk_level?.toUpperCase() ?? "UNKNOWN"} risk)*\n${blockerLines}\n\n_${blockers.recommendation}_`,
      },
    });
  }

  blocks.push({ type: "divider" });

  // View button
  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "View Full Summary →", emoji: true },
        url: viewUrl,
        style: "primary",
      },
    ],
  });

  return {
    text: `GitPulse ${typeLabel}: ${repoName} — ${summary?.headline ?? date}`,
    blocks,
  };
}

async function sendSlack(webhookUrl, payload) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Slack returned ${res.status}: ${text}`);
  }
}

// ─── Discord ──────────────────────────────────────────────────────────────────

function buildDiscordPayload({ summary, stats, blockers, repoName, date, summaryId, summaryType }) {
  const viewUrl = `${CLIENT_URL}/app/summaries/${summaryId}`;

  // Color: red for high-risk, orange for medium, green for clean
  let color = 0x238636; // gh-green
  if (blockers?.has_blockers) {
    color = blockers.risk_level === "high" ? 0xda3633 : 0xe3b341; // red / yellow
  }

  const fields = [
    { name: "Commits", value: String(stats.total_commits), inline: true },
    { name: "✨ Features", value: String(stats.features), inline: true },
    { name: "🐛 Bug Fixes", value: String(stats.bug_fixes), inline: true },
    { name: "PRs Merged", value: String(stats.prs_merged), inline: true },
  ];

  if (blockers?.has_blockers) {
    const riskLabel = { low: "🟡 Low", medium: "🟠 Medium", high: "🔴 High" }[blockers.risk_level] ?? "⚠️";
    fields.push({
      name: `Blocker — ${riskLabel} Risk`,
      value: blockers.blockers.slice(0, 3).join("\n") + `\n> ${blockers.recommendation}`,
      inline: false,
    });
  }

  const typeLabel = {
    standup: "Standup",
    daily_digest: "Daily Digest",
    weekly_digest: "Weekly Digest",
    client_report: "Client Report",
    executive_dashboard: "Executive Dashboard",
  }[summaryType] ?? "Summary";

  const description = [
    summary?.headline ? `**${summary.headline}**` : null,
    summary?.what_changed?.length
      ? summary.what_changed.slice(0, 4).map((b) => `• ${b}`).join("\n")
      : null,
    summary?.why_it_matters ? `\n💡 ${summary.why_it_matters}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    embeds: [
      {
        title: `GitPulse ${typeLabel} — ${repoName}`,
        description: description || "Summary generated.",
        color,
        fields,
        footer: { text: `GitPulse · ${date}` },
        timestamp: new Date().toISOString(),
        url: viewUrl,
      },
    ],
  };
}

async function sendDiscord(webhookUrl, payload) {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Discord returned ${res.status}: ${text}`);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Deliver a summary to all configured channels for the org.
 * Returns an object showing which channels succeeded.
 * Never throws — failures are logged but don't break the pipeline.
 */
export async function deliverNotifications({ org, savedSummary, summary, blockers }) {
  const { slack_webhook_url, discord_webhook_url } = org.integrations ?? {};
  const delivered = { slack: false, discord: false };

  if (!slack_webhook_url && !discord_webhook_url) return delivered;

  const payload = {
    summary,
    stats: savedSummary.stats,
    blockers,
    repoName: savedSummary.populated_repo_name ?? "unknown/repo",
    date: savedSummary.date,
    summaryId: savedSummary._id.toString(),
    summaryType: savedSummary.summary_type,
  };

  const tasks = [];

  if (slack_webhook_url) {
    tasks.push(
      sendSlack(slack_webhook_url, buildSlackPayload(payload))
        .then(() => { delivered.slack = true; })
        .catch((err) => console.error(`[Notify] Slack delivery failed for org ${org.slug}:`, err.message))
    );
  }

  if (discord_webhook_url) {
    tasks.push(
      sendDiscord(discord_webhook_url, buildDiscordPayload(payload))
        .then(() => { delivered.discord = true; })
        .catch((err) => console.error(`[Notify] Discord delivery failed for org ${org.slug}:`, err.message))
    );
  }

  await Promise.all(tasks);
  return delivered;
}
