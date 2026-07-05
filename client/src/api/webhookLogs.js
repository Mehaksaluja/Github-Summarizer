const BASE = import.meta.env.VITE_API_URL || "";

export async function fetchWebhookLogs({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set("status", status);
  const res = await fetch(`${BASE}/api/webhook-logs?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load webhook logs");
  return res.json();
}

export async function fetchWebhookStats() {
  const res = await fetch(`${BASE}/api/webhook-logs/stats`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load webhook stats");
  return res.json();
}

export async function retryWebhookLog(id) {
  const res = await fetch(`${BASE}/api/webhook-logs/${id}/retry`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Retry failed");
  return res.json();
}
