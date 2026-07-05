export async function fetchSummaries({ repoId, summaryType, limit = 20, page = 1 } = {}) {
  const params = new URLSearchParams({ limit, page });
  if (repoId) params.set("repo_id", repoId);
  if (summaryType) params.set("summary_type", summaryType);
  const r = await fetch(`/api/summaries?${params}`, { credentials: "include" });
  if (!r.ok) throw new Error("Failed to load summaries");
  return r.json();
}

export async function fetchSummary(id) {
  const r = await fetch(`/api/summaries/${id}`, { credentials: "include" });
  if (!r.ok) throw new Error("Summary not found");
  return r.json();
}
