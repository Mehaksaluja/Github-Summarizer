const BASE = import.meta.env.VITE_API_URL || "";

export async function fetchBilling() {
  const res = await fetch(`${BASE}/api/billing`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch billing info");
  return res.json();
}

export async function startCheckout(planTier) {
  const res = await fetch(`${BASE}/api/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ plan_tier: planTier }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to start checkout");
  return data.url;
}

export async function openBillingPortal() {
  const res = await fetch(`${BASE}/api/billing/portal`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to open billing portal");
  return data.url;
}
