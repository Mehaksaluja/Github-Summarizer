import express from "express";
import Organization from "../models/Organization.js";
import { PLAN_LIMITS } from "../config/planLimits.js";
import { createCheckoutSession, createPortalSession } from "../services/stripeService.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only an org admin can manage billing" });
  }
  next();
};

// GET /api/billing
router.get("/", requireAuth, async (req, res) => {
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const org = await Organization.findById(orgId).lean();
  if (!org) return res.status(404).json({ message: "Organization not found" });

  res.json({
    plan_tier: org.plan_tier,
    subscription_status: org.subscription_status,
    current_period_end: org.current_period_end,
    cancel_at_period_end: org.cancel_at_period_end,
    has_billing_account: Boolean(org.stripe_customer_id),
    limits: PLAN_LIMITS,
  });
});

// POST /api/billing/checkout — { plan_tier: "pro" | "agency" }
router.post("/checkout", requireAuth, requireAdmin, async (req, res) => {
  const { plan_tier } = req.body;
  if (!["pro", "agency"].includes(plan_tier)) {
    return res.status(400).json({ message: "plan_tier must be pro or agency" });
  }

  const orgId = req.user.org_id._id ?? req.user.org_id;
  const org = await Organization.findById(orgId);
  if (!org) return res.status(404).json({ message: "Organization not found" });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  try {
    const url = await createCheckoutSession({
      org,
      planTier: plan_tier,
      successUrl: `${clientUrl}/app/billing?checkout=success`,
      cancelUrl: `${clientUrl}/app/billing?checkout=cancelled`,
    });
    res.json({ url });
  } catch (err) {
    console.error("[Billing] Checkout error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/billing/portal
router.post("/portal", requireAuth, requireAdmin, async (req, res) => {
  const orgId = req.user.org_id._id ?? req.user.org_id;
  const org = await Organization.findById(orgId);
  if (!org) return res.status(404).json({ message: "Organization not found" });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  try {
    const url = await createPortalSession({ org, returnUrl: `${clientUrl}/app/billing` });
    res.json({ url });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
