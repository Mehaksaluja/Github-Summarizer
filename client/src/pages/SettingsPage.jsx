import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import TopBar from "../components/TopBar";
import { User, Building2, Bell, CreditCard, Save } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar title="Settings" />

      <div className="flex-1 p-6 max-w-3xl w-full mx-auto space-y-5">
        {/* Profile */}
        <Section icon={<User className="w-4 h-4" />} title="Profile">
          <div className="flex items-center gap-4 mb-5">
            <img src={user?.avatar_url} alt="" className="w-12 h-12 rounded-full ring-2 ring-gh-border" />
            <div>
              <p className="text-sm font-semibold text-gh-fg">{user?.display_name || user?.username}</p>
              <p className="text-xs text-gh-subtle">{user?.email || "No email set"}</p>
              <p className="text-xs text-gh-subtle font-mono mt-0.5">@{user?.username}</p>
            </div>
          </div>
          <p className="text-xs text-gh-subtle">Profile info is synced from GitHub and cannot be edited here.</p>
        </Section>

        {/* Organization */}
        <Section icon={<Building2 className="w-4 h-4" />} title="Organization">
          <Field label="Organization name" value={user?.org?.name} placeholder="Your org name" />
          <div className="mt-3 flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              user?.org?.plan_tier === "free"
                ? "bg-gh-accent/10 border-gh-accent/20 text-gh-accent"
                : "bg-gh-green/10 border-gh-green/20 text-gh-green"
            }`}>
              {user?.org?.plan_tier === "free" ? "Free plan" : "Pro plan"}
            </div>
            {user?.org?.plan_tier === "free" && (
              <span className="text-xs text-gh-subtle">
                {user?.org?.reports_generated ?? 0} / 1 reports used
              </span>
            )}
          </div>
        </Section>

        {/* Notifications (placeholder) */}
        <Section icon={<Bell className="w-4 h-4" />} title="Integrations">
          <div className="space-y-4">
            <IntegrationRow
              label="Slack webhook URL"
              desc="Post summaries to a Slack channel automatically."
              placeholder="https://hooks.slack.com/services/..."
            />
            <IntegrationRow
              label="Discord webhook URL"
              desc="Post summaries to a Discord channel automatically."
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
          <p className="mt-3 text-xs text-gh-subtle">Slack and Discord delivery is available on the Pro plan.</p>
        </Section>

        {/* Billing */}
        <Section icon={<CreditCard className="w-4 h-4" />} title="Billing">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gh-fg capitalize">{user?.org?.plan_tier} plan</p>
              <p className="text-xs text-gh-subtle mt-0.5">
                {user?.org?.plan_tier === "free"
                  ? "Upgrade to unlock unlimited reports, Slack, and PDF export."
                  : `Subscription status: ${user?.org?.subscription_status}`}
              </p>
            </div>
            {user?.org?.plan_tier === "free" && (
              <button className="text-xs font-semibold bg-gh-accent hover:bg-gh-accent-em text-white px-4 py-2 rounded-lg transition-colors shrink-0">
                Upgrade to Pro — $19/mo
              </button>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="bg-gh-surface border border-gh-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gh-line">
        <span className="text-gh-muted">{icon}</span>
        <h2 className="text-sm font-semibold text-gh-fg">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, placeholder }) {
  const [val, setVal] = useState(value || "");
  return (
    <div>
      <label className="block text-xs font-medium text-gh-muted mb-1.5">{label}</label>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2.5 text-sm text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors"
      />
    </div>
  );
}

function IntegrationRow({ label, desc, placeholder }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gh-muted">{label}</label>
      </div>
      <p className="text-[11px] text-gh-subtle mb-1.5">{desc}</p>
      <div className="flex gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder}
          disabled
          className="flex-1 bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-xs text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
        />
        <button disabled className="flex items-center gap-1.5 bg-gh-inset border border-gh-border text-gh-muted text-xs px-3 py-2 rounded-lg opacity-50 cursor-not-allowed">
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </div>
  );
}
