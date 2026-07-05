const BASE = import.meta.env.VITE_API_URL || "";

export async function fetchSummaries({ repoId, summaryType, includeArchived, since, limit = 20, page = 1 } = {}) {
  const params = new URLSearchParams({ limit, page });
  if (repoId) params.set("repo_id", repoId);
  if (summaryType) params.set("summary_type", summaryType);
  if (includeArchived) params.set("include_archived", "true");
  if (since) params.set("since", since);
  const r = await fetch(`${BASE}/api/summaries?${params}`, { credentials: "include" });
  if (!r.ok) throw new Error("Failed to load summaries");
  return r.json();
}

export async function fetchSummary(id) {
  const r = await fetch(`${BASE}/api/summaries/${id}`, { credentials: "include" });
  if (!r.ok) throw new Error("Summary not found");
  return r.json();
}

export async function submitFeedback(id, { rating, note }) {
  const r = await fetch(`${BASE}/api/summaries/${id}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ rating, note }),
  });
  if (!r.ok) throw new Error("Failed to submit feedback");
  return r.json();
}

export async function archiveSummary(id, archived) {
  const r = await fetch(`${BASE}/api/summaries/${id}/archive`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ archived }),
  });
  if (!r.ok) throw new Error("Failed to archive summary");
  return r.json();
}

export async function deleteSummary(id) {
  const r = await fetch(`${BASE}/api/summaries/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!r.ok) throw new Error("Failed to delete summary");
  return r.json();
}
