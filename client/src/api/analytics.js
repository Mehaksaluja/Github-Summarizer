const BASE = import.meta.env.VITE_API_URL || "";

export async function fetchAnalytics({ days = 30, repoId } = {}) {
  const params = new URLSearchParams({ days });
  if (repoId) params.set("repo_id", repoId);
  const res = await fetch(`${BASE}/api/analytics?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load analytics");
  return res.json();
}
