import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import TopBar from "../components/TopBar";
import { User, Building2, Bell, CreditCard, Save, Loader2 } from "lucide-react";
import { fetchSettings, updateIntegrations } from "../api/settings";
import { useToast } from "../hooks/useToast";

const BASE = import.meta.env.VITE_API_URL || "";

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  // Integrations
  const [slack, setSlack] = useState("");
  const [discord, setDiscord] = useState("");
  const [integrationSaving, setIntegrationSaving] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setSlack(data.integrations?.slack_webhook_url ?? "");
        setDiscord(data.integrations?.discord_webhook_url ?? "");
      })
      .catch(() => {});
  }, []);

  async function saveIntegrations() {
    setIntegrationSaving(true);
    try {
      await updateIntegrations({ slack_webhook_url: slack, discord_webhook_url: discord });
      showToast("Integrations saved", "success");
    } catch { showToast("Save failed", "error"); }
    setIntegrationSaving(false);
  }

  async function testNotification(channel) {
    try {
      // Save first so the test hits the current URL
      await updateIntegrations({ slack_webhook_url: slack, discord_webhook_url: discord });
      const res = await fetch(`${BASE}/api/settings/test-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(`Test sent to ${channel === "slack" ? "Slack" : "Discord"} successfully!`, "success");
    } catch (err) {
      showToast(err.message || `${channel} test failed`, "error");
    }
  }

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
          <div>
            <label className="block text-xs font-medium text-gh-muted mb-1.5">Organization name</label>
            <input
              value={user?.org?.name ?? ""}
              readOnly
              className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2.5 text-sm text-gh-fg opacity-60 cursor-not-allowed"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              user?.org?.plan_tier === "free"
                ? "bg-gh-accent/10 border-gh-accent/20 text-gh-accent"
                : "bg-gh-green/10 border-gh-green/20 text-gh-green"
            }`}>
              {user?.org?.plan_tier === "free" ? "Free plan" : "Pro plan"}
            </div>
            {user?.org?.plan_tier === "free" && (
              <span className="text-xs text-gh-subtle">{user?.org?.reports_generated ?? 0} / 1 reports used</span>
            )}
          </div>
        </Section>

        {/* Integrations */}
        <Section icon={<Bell className="w-4 h-4" />} title="Integrations">
          <p className="text-xs text-gh-subtle mb-4">
            GitPulse will automatically post summaries to these channels whenever a new one is generated.
          </p>
          <div className="space-y-5">
            <IntegrationInput
              label="Slack webhook URL"
              desc='Create an Incoming Webhook in your Slack app settings, then paste the URL here.'
              placeholder="https://hooks.slack.com/services/T.../B.../..."
              value={slack}
              onChange={setSlack}
              onTest={() => testNotification("slack")}
              canTest={!!slack}
            />
            <IntegrationInput
              label="Discord webhook URL"
              desc='In your Discord server, go to Channel Settings → Integrations → Webhooks to create one.'
              placeholder="https://discord.com/api/webhooks/..."
              value={discord}
              onChange={setDiscord}
              onTest={() => testNotification("discord")}
              canTest={!!discord}
            />
          </div>
          <div className="mt-4">
            <SaveButton onClick={saveIntegrations} saving={integrationSaving} />
          </div>
        </Section>

        {/* Billing */}
        <Section icon={<CreditCard className="w-4 h-4" />} title="Billing">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gh-fg capitalize">{user?.org?.plan_tier} plan</p>
              <p className="text-xs text-gh-subtle mt-0.5">
                {user?.org?.plan_tier === "free"
                  ? "Upgrade to unlock unlimited reports, more repos, and Slack/Discord notifications."
                  : `Subscription status: ${user?.org?.subscription_status}`}
              </p>
            </div>
            {user?.org?.plan_tier === "free" && (
              <button className="text-xs font-semibold bg-gh-accent hover:bg-gh-accent-em text-white px-4 py-2 rounded-lg transition-colors shrink-0">
                Upgrade — $19/mo
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

function SaveButton({ onClick, saving, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="flex items-center gap-2 bg-gh-accent hover:bg-gh-accent-em disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
    >
      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      {saving ? "Saving..." : "Save"}
    </button>
  );
}

function IntegrationInput({ label, desc, placeholder, value, onChange, onTest, canTest }) {
  return (
    <div>
      <label className="text-xs font-medium text-gh-muted block mb-1">{label}</label>
      <p className="text-[11px] text-gh-subtle mb-1.5">{desc}</p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-xs text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors font-mono"
        />
        <button
          onClick={onTest}
          disabled={!canTest}
          title="Send a test message"
          className="shrink-0 px-3 py-2 text-xs font-medium bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg hover:border-gh-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Test
        </button>
      </div>
    </div>
  );
}
