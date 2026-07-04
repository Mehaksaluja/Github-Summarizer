import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runBlockerAgent({ pr }) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a team lead who identifies delivery risks and blockers in pull requests. Look for: stale PRs, unresolved review requests, draft status, missing descriptions, risky file changes, or signs of scope creep.",
      },
      {
        role: "user",
        content: `Analyze this pull request for blockers and risks:\n\n${JSON.stringify(pr, null, 2)}\n\nRespond with JSON only:\n{\n  "has_blockers": true or false,\n  "blockers": ["specific blocker descriptions, or empty array"],\n  "risk_level": "low" or "medium" or "high",\n  "recommendation": "one actionable sentence"\n}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content);
}
