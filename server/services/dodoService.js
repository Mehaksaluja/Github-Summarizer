import DodoPayments from "dodopayments";
import Organization from "../models/Organization.js";
import { DODO_PRODUCT_IDS, planTierForProductId } from "../config/planLimits.js";

let _client = null;

function getClient() {
  if (!process.env.DODO_PAYMENTS_API_KEY) {
    throw new Error("Dodo Payments is not configured — set DODO_PAYMENTS_API_KEY in server/.env");
  }
  if (!_client) {
    _client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || undefined,
      environment: process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode",
    });
  }
  return _client;
}

export function unwrapWebhook(rawBody, headers) {
  return getClient().webhooks.unwrap(
    typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"),
    {
      headers: {
        "webhook-id": headers["webhook-id"],
        "webhook-signature": headers["webhook-signature"],
        "webhook-timestamp": headers["webhook-timestamp"],
      },
    }
  );
}

export async function createCheckoutSession({ org, planTier, user, successUrl, cancelUrl }) {
  const productId = DODO_PRODUCT_IDS[planTier];
  if (!productId) throw new Error(`No Dodo product configured for plan "${planTier}"`);

  const client = getClient();
  const metadata = {
    org_id: String(org._id),
    plan_tier: planTier,
  };

  const customerPayload = org.dodo_customer_id
    ? { customer_id: org.dodo_customer_id }
    : {
        email: user?.email || `${user?.username || "user"}@users.noreply.github.com`,
        name: user?.display_name || org.name || user?.username || "Customer",
      };

  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: customerPayload,
    return_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });

  return session.checkout_url;
}

export async function createPortalSession({ org, returnUrl }) {
  if (!org.dodo_customer_id) {
    throw new Error("No billing account yet — upgrade first to create one");
  }

  const client = getClient();
  const session = await client.customers.customerPortal.create(org.dodo_customer_id, {
    return_url: returnUrl,
  });

  return session.link;
}

function mapSubscriptionStatus(status) {
  const statusMap = {
    active: "active",
    trialing: "trialing",
    on_hold: "past_due",
    cancelled: "cancelled",
    canceled: "cancelled",
    expired: "cancelled",
    failed: "cancelled",
    pending: "none",
  };
  return statusMap[status] ?? "none";
}

function extractCustomerId(subscription) {
  const customer = subscription.customer;
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  return customer.customer_id ?? customer.id ?? null;
}

function extractProductId(subscription) {
  return (
    subscription.product_id ??
    subscription.product?.product_id ??
    subscription.product?.id ??
    null
  );
}

function extractPeriodEnd(subscription) {
  const raw =
    subscription.next_billing_date ??
    subscription.current_period_end ??
    subscription.expires_at ??
    null;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function syncOrgFromSubscription(subscription) {
  const orgId = subscription.metadata?.org_id;
  if (!orgId) {
    console.warn(
      "[Dodo] Subscription has no org_id metadata — skipping sync:",
      subscription.subscription_id ?? subscription.id
    );
    return;
  }

  const productId = extractProductId(subscription);
  const planTier =
    planTierForProductId(productId) ?? subscription.metadata?.plan_tier ?? "free";
  const customerId = extractCustomerId(subscription);
  const subscriptionId = subscription.subscription_id ?? subscription.id ?? null;

  const update = {
    plan_tier: planTier,
    subscription_status: mapSubscriptionStatus(subscription.status),
    dodo_subscription_id: subscriptionId,
    dodo_product_id: productId,
    current_period_end: extractPeriodEnd(subscription),
    cancel_at_period_end: Boolean(
      subscription.cancel_at_next_billing_date ?? subscription.cancel_at_period_end
    ),
  };

  if (customerId) update.dodo_customer_id = customerId;

  await Organization.findByIdAndUpdate(orgId, update);
}

export async function handleWebhookEvent(event) {
  const data = event.data ?? event;

  switch (event.type) {
    case "subscription.active":
    case "subscription.updated":
    case "subscription.renewed":
    case "subscription.plan_changed": {
      await syncOrgFromSubscription(data);
      break;
    }

    case "subscription.on_hold": {
      const orgId = data.metadata?.org_id;
      const subscriptionId = data.subscription_id ?? data.id;
      if (orgId) {
        await Organization.findByIdAndUpdate(orgId, { subscription_status: "past_due" });
      } else if (subscriptionId) {
        await Organization.findOneAndUpdate(
          { dodo_subscription_id: subscriptionId },
          { subscription_status: "past_due" }
        );
      }
      break;
    }

    case "subscription.cancelled":
    case "subscription.expired":
    case "subscription.failed": {
      const orgId = data.metadata?.org_id;
      const subscriptionId = data.subscription_id ?? data.id;
      const downgrade = {
        plan_tier: "free",
        subscription_status: "cancelled",
        cancel_at_period_end: false,
      };
      if (orgId) {
        await Organization.findByIdAndUpdate(orgId, downgrade);
      } else if (subscriptionId) {
        await Organization.findOneAndUpdate({ dodo_subscription_id: subscriptionId }, downgrade);
      }
      break;
    }

    default:
      break;
  }
}
