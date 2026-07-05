import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runFrameworkAgent({ commits, pr, model = "gpt-4o-mini" }) {
  const items = pr
    ? [{ message: pr.title, files: pr.files.map((f) => f.filename) }]
    : commits.map((c) => ({ message: c.message, files: c.files.map((f) => f.filename) }));

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a product manager. Categorize developer work into Features (new user-facing functionality), Bug Fixes (fixing broken behavior), and Chores (refactors, dependency updates, tests, CI, docs). Use commit messages and file paths as signals.",
      },
      {
        role: "user",
        content: `Categorize this work:\n\n${JSON.stringify(items, null, 2)}\n\nRespond with JSON only:\n{\n  "features": ["short descriptions, or empty array"],\n  "bug_fixes": ["short descriptions, or empty array"],\n  "chores": ["short descriptions, or empty array"],\n  "effort_score": 1 to 5 integer based on scope of changes\n}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content);
}
