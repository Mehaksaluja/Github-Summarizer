const BASE = import.meta.env.VITE_API_URL || "";

export async function fetchSettings() {
  const res = await fetch(`${BASE}/api/settings`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateIntegrations({ slack_webhook_url, discord_webhook_url, email }) {
  const res = await fetch(`${BASE}/api/settings/integrations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ slack_webhook_url, discord_webhook_url, email }),
  });
  if (!res.ok) throw new Error("Failed to save integrations");
  return res.json();
}
