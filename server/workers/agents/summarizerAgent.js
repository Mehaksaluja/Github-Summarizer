import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_SYSTEM =
  "You are a developer communication expert. Translate raw GitHub activity into clear, human-friendly summaries for a daily standup. Be concise and specific. Never say 'the code' — name what actually changed.";

export async function runSummarizerAgent({
  eventType,
  repoName,
  branch,
  commits,
  pr,
  model = "gpt-4o-mini",
  customSystemPrompt = null,
}) {
  const context =
    eventType === "push"
      ? `Branch: ${branch}\n\nCommits:\n${JSON.stringify(commits, null, 2)}`
      : `Pull Request: "${pr.title}"\n\nFiles changed:\n${JSON.stringify(pr.files, null, 2)}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: customSystemPrompt || DEFAULT_SYSTEM },
      {
        role: "user",
        content: `Summarize this GitHub ${eventType} on repo "${repoName}".\n\n${context}\n\nRespond with JSON only:\n{\n  "headline": "one sentence summary",\n  "what_changed": ["up to 5 specific bullet points"],\n  "why_it_matters": "one sentence on impact",\n  "in_progress_signals": ["any signals suggesting work is ongoing, or empty array"]\n}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content);
}
