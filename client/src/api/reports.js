export async function generateReport({ repoId, type, since, until, author }) {
  const res = await fetch("/api/reports/generate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repo_id: repoId,
      type,
      since: since || undefined,
      until: until || undefined,
      author: author || undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to generate report");
  return data.summary;
}
