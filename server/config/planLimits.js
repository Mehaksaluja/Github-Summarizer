export const PLAN_LIMITS = {
  free: {
    maxReports: 1,
    maxRepos: 1,
    maxSeats: 1,
    slackDiscord: false,
    pdfExport: false,
  },
  pro: {
    maxReports: Infinity,
    maxRepos: 10,
    maxSeats: 1,
    slackDiscord: true,
    pdfExport: true,
  },
  agency: {
    maxReports: Infinity,
    maxRepos: Infinity,
    maxSeats: 10,
    slackDiscord: true,
    pdfExport: true,
  },
};

export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

/** Paid features are revoked when subscription is past_due or cancelled. */
export function effectivePlanTier(org) {
  if (!org) return "free";
  const tier = org.plan_tier ?? "free";
  if (tier === "free") return "free";
  const status = org.subscription_status ?? "none";
  if (status === "past_due" || status === "cancelled") return "free";
  // active, trialing, or "none" (manual MongoDB override during local dev)
  return tier;
}

export function limitsFor(org) {
  return PLAN_LIMITS[effectivePlanTier(org)] ?? PLAN_LIMITS.free;
}

export function isPaidPlan(org) {
  return effectivePlanTier(org) !== "free";
}

export function canGenerateReport(org) {
  return (org.reports_generated ?? 0) < limitsFor(org).maxReports;
}

export function canAddRepo(org, currentRepoCount) {
  return currentRepoCount < limitsFor(org).maxRepos;
}

export function canInviteSeat(org, currentSeatCount) {
  return currentSeatCount < limitsFor(org).maxSeats;
}

export function hasFeature(org, key) {
  return Boolean(limitsFor(org)[key]);
}

export function planTierForPriceId(priceId) {
  return Object.entries(STRIPE_PRICE_IDS).find(([, id]) => id === priceId)?.[0] ?? null;
}
