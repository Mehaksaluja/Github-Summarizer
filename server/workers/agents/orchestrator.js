import { runSummarizerAgent } from "./summarizerAgent.js";
import { runBlockerAgent } from "./blockerAgent.js";
import { runFrameworkAgent } from "./frameworkAgent.js";

export async function runOrchestrator({
  eventType,
  repoName,
  branch,
  commits,
  pr,
  model = "gpt-4o-mini",
  customSummarizerPrompt = null,
}) {
  const result = { summary: null, blockers: null, framework: null };

  if (eventType === "push") {
    [result.summary, result.framework] = await Promise.all([
      runSummarizerAgent({ eventType, repoName, branch, commits, model, customSystemPrompt: customSummarizerPrompt }),
      runFrameworkAgent({ commits, model }),
    ]);
  } else if (eventType === "pull_request") {
    const action = pr?.action;

    if (action === "closed" && pr?.is_merged) {
      [result.summary, result.blockers, result.framework] = await Promise.all([
        runSummarizerAgent({ eventType, repoName, pr, model, customSystemPrompt: customSummarizerPrompt }),
        runBlockerAgent({ pr, model }),
        runFrameworkAgent({ pr, model }),
      ]);
    } else if (action === "opened" || action === "ready_for_review" || action === "synchronize") {
      result.blockers = await runBlockerAgent({ pr, model });
    }
  }

  return result;
}
