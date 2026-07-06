import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM = `You are a senior engineering lead writing a concise team update from GitHub activity.

Rules — follow every one:
- Be specific: name the actual feature, endpoint, component, or file changed. Never write "the code", "some changes", or "various updates".
- Bullets must start with an action verb and name the thing: "Added POST /api/users/avatar endpoint", "Fixed null pointer crash in queue worker on empty payload"
- Reference file paths only when they clarify the context (e.g. "Refactored auth middleware in server/routes/auth.js")
- Headline: one tight sentence capturing the single most important change in this push
- why_it_matters: explain real user or system impact — not a restatement of what changed
- in_progress: only include if commit messages contain WIP, TODO, partial, draft, or files suggest an incomplete feature`;

function buildPushContext(branch, commits) {
  return commits.map(c => {
    const fileLines = (c.files ?? [])
      .map(f => `    ${f.status} ${f.filename} (+${f.additions ?? 0}/-${f.deletions ?? 0})`)
      .join("\n");
    return `[${c.sha}] ${c.author}: ${c.message}${fileLines ? "\n" + fileLines : ""}`;
  }).join("\n\n");
}

export async function runSummarizerAgent({ eventType, repoName, branch, commits, pr }) {
  const context = eventType === "push"
    ? `Branch: ${branch}\n\n${buildPushContext(branch, commits)}`
    : `PR: "${pr.title}"\n${pr.body ? `Description: ${pr.body.slice(0, 400)}\n` : ""}Files:\n${(pr.files ?? []).map(f => `  ${f.status} ${f.filename}`).join("\n")}`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Summarize this GitHub ${eventType} on "${repoName}":\n\n${context}\n\nJSON only:\n{\n  "headline": "one tight sentence — the biggest change",\n  "what_changed": ["up to 5 specific bullets, action verb + what + where"],\n  "why_it_matters": "one sentence of real user/system impact",\n  "in_progress": ["signals of unfinished work only, or empty array"]\n}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.25,
  });

  return JSON.parse(res.choices[0].message.content);
}
