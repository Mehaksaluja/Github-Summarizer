import { Octokit } from "@octokit/rest";

const MAX_COMMITS = 10;
const MAX_FILES_PER_COMMIT = 15;
const MAX_PATCH_CHARS = 600;

export async function fetchPushDetails(accessToken, owner, repo, webhookCommits) {
  const octokit = new Octokit({ auth: accessToken });

  const commits = await Promise.all(
    webhookCommits.slice(0, MAX_COMMITS).map(async (commit) => {
      try {
        const { data } = await octokit.rest.repos.getCommit({ owner, repo, ref: commit.id });
        return {
          sha: commit.id.slice(0, 7),
          message: commit.message,
          author: commit.author?.name ?? "Unknown",
          files: (data.files ?? []).slice(0, MAX_FILES_PER_COMMIT).map((f) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            patch: f.patch ? f.patch.slice(0, MAX_PATCH_CHARS) : null,
          })),
        };
      } catch {
        return {
          sha: commit.id.slice(0, 7),
          message: commit.message,
          author: commit.author?.name ?? "Unknown",
          files: [
            ...commit.added.map((f) => ({ filename: f, status: "added" })),
            ...commit.modified.map((f) => ({ filename: f, status: "modified" })),
            ...commit.removed.map((f) => ({ filename: f, status: "removed" })),
          ],
        };
      }
    })
  );

  return commits;
}

export async function fetchPRDetails(accessToken, owner, repo, prNumber) {
  const octokit = new Octokit({ auth: accessToken });

  const [{ data: pr }, { data: files }] = await Promise.all([
    octokit.rest.pulls.get({ owner, repo, pull_number: prNumber }),
    octokit.rest.pulls.listFiles({ owner, repo, pull_number: prNumber }),
  ]);

  return {
    title: pr.title,
    body: pr.body ?? "",
    state: pr.state,
    is_draft: pr.draft,
    is_merged: pr.merged ?? false,
    days_open: Math.floor((Date.now() - new Date(pr.created_at).getTime()) / 86400000),
    base_branch: pr.base.ref,
    head_branch: pr.head.ref,
    labels: pr.labels.map((l) => l.name),
    commits_count: pr.commits,
    review_comments: pr.review_comments,
    files: files.slice(0, MAX_FILES_PER_COMMIT).map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch ? f.patch.slice(0, MAX_PATCH_CHARS) : null,
    })),
  };
}
