import { runSummarizerAgent } from "./summarizerAgent.js";
import { runBlockerAgent } from "./blockerAgent.js";
import { runFrameworkAgent } from "./frameworkAgent.js";

export async function runOrchestrator({ eventType, repoName, branch, commits, pr }) {
  const result = { summary: null, blockers: null, framework: null };

  if (eventType === "push") {
    [result.summary, result.framework] = await Promise.all([
      runSummarizerAgent({ eventType, repoName, branch, commits }),
      runFrameworkAgent({ commits }),
    ]);
  } else if (eventType === "pull_request") {
    const action = pr?.action;

    if (action === "closed" && pr?.is_merged) {
      // Merged PR — full pipeline
      [result.summary, result.blockers, result.framework] = await Promise.all([
        runSummarizerAgent({ eventType, repoName, pr }),
        runBlockerAgent({ pr }),
        runFrameworkAgent({ pr }),
      ]);
    } else if (action === "opened" || action === "ready_for_review" || action === "synchronize") {
      // New or updated PR — check for blockers
      result.blockers = await runBlockerAgent({ pr });
    }
  }

  return result;
}
