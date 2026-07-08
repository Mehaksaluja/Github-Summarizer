import Stripe from "stripe";
import Organization from "../models/Organization.js";
import { STRIPE_PRICE_IDS, planTierForPriceId } from "../config/planLimits.js";

let _stripe = null;
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured — set STRIPE_SECRET_KEY in server/.env");
  }
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

const stripe = new Proxy(
  {},
  {
    get(_target, prop) {
      return getStripe()[prop];
    },
  }
);

export async function createCheckoutSession({ org, planTier, successUrl, cancelUrl }) {
  const priceId = STRIPE_PRICE_IDS[planTier];
  if (!priceId) throw new Error(`No Stripe price configured for plan "${planTier}"`);

  let customerId = org.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { org_id: String(org._id) },
    });
    customerId = customer.id;
    await Organization.findByIdAndUpdate(org._id, { stripe_customer_id: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: String(org._id),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { org_id: String(org._id), plan_tier: planTier },
    subscription_data: {
      metadata: { org_id: String(org._id), plan_tier: planTier },
    },
  });

  return session.url;
}

export async function createPortalSession({ org, returnUrl }) {
  if (!org.stripe_customer_id) {
    throw new Error("No billing account yet — upgrade first to create one");
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: returnUrl,
  });
  return session.url;
}

async function syncOrgFromSubscription(subscription) {
  const orgId = subscription.metadata?.org_id;
  if (!orgId) {
    console.warn("[Stripe] Subscription has no org_id metadata — skipping sync:", subscription.id);
    return;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const planTier = planTierForPriceId(priceId) ?? subscription.metadata?.plan_tier ?? "free";

  const statusMap = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "cancelled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "cancelled",
  };

  await Organization.findByIdAndUpdate(orgId, {
    plan_tier: planTier,
    subscription_status: statusMap[subscription.status] ?? "none",
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
  });
}

export async function handleWebhookEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) break;
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await syncOrgFromSubscription(subscription);
      break;
    }

    case "customer.subscription.updated": {
      await syncOrgFromSubscription(event.data.object);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const orgId = subscription.metadata?.org_id;
      if (!orgId) break;
      await Organization.findByIdAndUpdate(orgId, {
        plan_tier: "free",
        subscription_status: "cancelled",
        cancel_at_period_end: false,
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      if (!invoice.subscription) break;
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const orgId = subscription.metadata?.org_id;
      if (!orgId) break;
      await Organization.findByIdAndUpdate(orgId, { subscription_status: "past_due" });
      break;
    }

    default:
      break;
  }
}

export default stripe;
