export async function fetchGitHubRepos() {
  const r = await fetch("/api/repos/github", { credentials: "include" });
  if (!r.ok) throw new Error("Failed to load GitHub repos");
  return r.json();
}

export async function fetchRepos() {
  const r = await fetch("/api/repos", { credentials: "include" });
  if (!r.ok) throw new Error("Failed to load repos");
  return r.json();
}

export async function registerRepo(full_name) {
  const r = await fetch("/api/repos/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || "Failed to register repo");
  return data;
}

export async function removeRepo(id) {
  const r = await fetch(`/api/repos/${id}`, { method: "DELETE", credentials: "include" });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || "Failed to remove repo");
  return data;
}
