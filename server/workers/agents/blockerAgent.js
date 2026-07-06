import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runBlockerAgent({ pr }) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a tech lead reviewing PRs for concrete delivery risks. Flag real blockers only — not style nits. Check for:
- Draft PR being merged or no description on a complex change
- Changes to auth, payments, env config, or secrets without review notes
- Missing tests for new endpoints or business logic
- Breaking API changes without migration notes
- Stale branch with likely conflicts`,
      },
      {
        role: "user",
        content: `Review this PR:\n\n${JSON.stringify(pr, null, 2)}\n\nJSON only:\n{\n  "has_blockers": true or false,\n  "blockers": ["specific issue, or empty array"],\n  "risk_level": "low" | "medium" | "high",\n  "recommendation": "one concrete next-step action"\n}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(res.choices[0].message.content);
}
