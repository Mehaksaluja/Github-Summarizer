import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runFrameworkAgent({ commits, pr }) {
  const items = pr
    ? [{ message: pr.title, files: (pr.files ?? []).map(f => `${f.status} ${f.filename}`) }]
    : commits.map(c => ({ sha: c.sha, message: c.message, files: (c.files ?? []).map(f => `${f.status} ${f.filename}`) }));

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Classify developer work into three categories using commit messages and file paths as evidence:
- Features: new user-facing functionality, new API endpoints, new UI components
- Bug Fixes: fixing broken, incorrect, or crashing behavior
- Chores: refactors, dependency updates, tests, CI/CD, docs, config, linting

Write specific short descriptions based on the actual commit — e.g. "Add paginated user list endpoint" not "Added endpoint". Skip empty messages and merge commits.`,
      },
      {
        role: "user",
        content: `Classify:\n\n${JSON.stringify(items, null, 2)}\n\nJSON only:\n{\n  "features": ["specific descriptions or empty array"],\n  "bug_fixes": ["specific descriptions or empty array"],\n  "chores": ["specific descriptions or empty array"],\n  "effort_score": 1 to 5\n}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  return JSON.parse(res.choices[0].message.content);
}
