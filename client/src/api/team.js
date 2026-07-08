const BASE = import.meta.env.VITE_API_URL || "";

export async function fetchTeam() {
  const res = await fetch(`${BASE}/api/team`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch team");
  return res.json();
}

export async function inviteMember({ github_username, role }) {
  const res = await fetch(`${BASE}/api/team/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ github_username, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send invite");
  return data;
}

export async function revokeInvite(id) {
  const res = await fetch(`${BASE}/api/team/invite/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to revoke invite");
  return data;
}

export async function updateMemberRole(userId, role) {
  const res = await fetch(`${BASE}/api/team/members/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update role");
  return data;
}

export async function removeMember(userId) {
  const res = await fetch(`${BASE}/api/team/members/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to remove member");
  return data;
}
