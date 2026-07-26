import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, Check, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { fetchBilling, startCheckout, openBillingPortal } from "../api/billing";
import TopBar from "../components/TopBar";

const PLANS = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    features: ["1 report total", "1 repository", "No Slack/Discord", "No PDF export"],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$19/mo",
    features: ["Unlimited reports", "Up to 10 repositories", "Slack & Discord notifications", "PDF export"],
  },
  {
    tier: "agency",
    name: "Agency",
    price: "$49/mo",
    features: ["Everything in Pro", "Unlimited repositories", "Up to 10 team members", "White-label reports"],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const load = useCallback(() => {
    fetchBilling()
      .then(setBilling)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      showToast("Payment successful — syncing your plan...", "success");
      setSearchParams({}, { replace: true });
      // The Dodo webhook may land a moment after this redirect — refetch shortly after.
      const t = setTimeout(load, 2000);
      return () => clearTimeout(t);
    } else if (checkout === "cancelled") {
      showToast("Checkout cancelled", "info");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast, load]);

  async function handleUpgrade(tier) {
    setCheckoutLoading(tier);
    try {
      const url = await startCheckout(tier);
      window.location.href = url;
    } catch (err) {
      showToast(err.message || "Failed to start checkout", "error");
      setCheckoutLoading(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      showToast(err.message || "Failed to open billing portal", "error");
      setPortalLoading(false);
    }
  }

  const currentTier = billing?.plan_tier ?? user?.org?.plan_tier ?? "free";
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar title="Billing" subtitle="Manage your plan and subscription" />

      <div className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6">
        {billing?.subscription_status === "past_due" && (
          <div className="bg-gh-red/10 border border-gh-red/30 rounded-xl px-4 py-3 text-xs text-gh-red">
            Your last payment failed. Paid features are paused until you update your payment method in the billing portal.
          </div>
        )}

        {billing?.has_billing_account && (
          <div className="bg-gh-surface border border-gh-border rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gh-fg capitalize">{currentTier} plan</p>
              <p className="text-xs text-gh-subtle mt-0.5">
                Status: <span className="capitalize">{billing?.subscription_status}</span>
                {billing?.current_period_end &&
                  ` · Renews ${new Date(billing.current_period_end).toLocaleDateString()}`}
                {billing?.cancel_at_period_end && " · Cancels at period end"}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex items-center gap-1.5 text-xs font-semibold border border-gh-border hover:border-gh-muted text-gh-fg px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                Manage subscription
              </button>
            )}
          </div>
        )}

        {!isAdmin && (
          <p className="text-xs text-gh-subtle bg-gh-inset border border-gh-border rounded-lg px-4 py-2.5">
            Only your organization's admin can change plans or manage billing.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.tier === currentTier;
            return (
              <div
                key={plan.tier}
                className={`bg-gh-surface border rounded-2xl p-5 flex flex-col ${
                  isCurrent ? "border-gh-accent ring-1 ring-gh-accent/30" : "border-gh-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-gh-muted" />
                  <h3 className="text-sm font-semibold text-gh-fg">{plan.name}</h3>
                </div>
                <p className="text-2xl font-bold text-gh-fg mb-4">{plan.price}</p>
                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gh-subtle">
                      <Check className="w-3.5 h-3.5 text-gh-green shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="text-center text-xs font-semibold text-gh-accent bg-gh-accent/10 py-2 rounded-lg">
                    Current plan
                  </div>
                ) : plan.tier === "free" ? null : (
                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={!isAdmin || checkoutLoading !== null || loading}
                    className="flex items-center justify-center gap-2 bg-gh-accent hover:bg-gh-accent-em disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                  >
                    {checkoutLoading === plan.tier && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Upgrade to {plan.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
