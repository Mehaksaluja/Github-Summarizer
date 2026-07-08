import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import TopBar from "../components/TopBar";
import { User, Building2, Bell, CreditCard, Save, Loader2, CheckCircle2, Unlink, ArrowRight, Lock, Palette } from "lucide-react";
import { fetchSettings, updateIntegrations, disconnectSlack, updateBranding } from "../api/settings";
import { useToast } from "../hooks/useToast";

const BASE = import.meta.env.VITE_API_URL || "";

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [slackConnected, setSlackConnected] = useState(false);
  const [slackChannel, setSlackChannel] = useState("");
  const [discord, setDiscord] = useState("");
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [slackDisconnecting, setSlackDisconnecting] = useState(false);
  const [slackDiscordEnabled, setSlackDiscordEnabled] = useState(false);
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [footerText, setFooterText] = useState("");
  const [brandingSaving, setBrandingSaving] = useState(false);

  const effectiveTier = user?.org?.effective_plan_tier ?? user?.org?.plan_tier ?? "free";
  const planLabel = { free: "Free", pro: "Pro", agency: "Agency" }[user?.org?.plan_tier] ?? "Free";

  // Handle redirect back from Slack OAuth
  useEffect(() => {
    const slackParam = searchParams.get("slack");
    if (slackParam === "connected") {
      showToast("Slack connected successfully!", "success");
      setSearchParams({}, { replace: true });
    } else if (slackParam === "error") {
      showToast("Slack connection failed. Try again.", "error");
      setSearchParams({}, { replace: true });
    } else if (slackParam === "no_config") {
      showToast("Slack app not configured on server yet.", "error");
      setSearchParams({}, { replace: true });
    } else if (slackParam === "upgrade_required") {
      showToast("Upgrade to Pro or Agency to connect Slack.", "error");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast]);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setSlackConnected(!!data.integrations?.slack_webhook_url);
        setSlackChannel(data.integrations?.slack_channel_name ?? "");
        setDiscord(data.integrations?.discord_webhook_url ?? "");
        setSlackDiscordEnabled(!!data.features?.slack_discord);
        setWhiteLabelEnabled(!!data.features?.white_label);
        setReportTitle(data.branding?.report_title ?? "");
        setFooterText(data.branding?.footer_text ?? "");
      })
      .catch(() => {});
  }, []);

  async function handleSlackConnect() {
    window.location.href = `${BASE}/auth/slack`;
  }

  async function handleSlackDisconnect() {
    setSlackDisconnecting(true);
    try {
      await disconnectSlack();
      setSlackConnected(false);
      setSlackChannel("");
      showToast("Slack disconnected", "success");
    } catch {
      showToast("Failed to disconnect Slack", "error");
    }
    setSlackDisconnecting(false);
  }

  async function testNotification(channel) {
    try {
      if (channel === "discord") {
        await updateIntegrations({ discord_webhook_url: discord });
      }
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

  async function saveDiscord() {
    setIntegrationSaving(true);
    try {
      await updateIntegrations({ discord_webhook_url: discord });
      showToast("Discord saved", "success");
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    }
    setIntegrationSaving(false);
  }

  async function saveBranding() {
    setBrandingSaving(true);
    try {
      await updateBranding({ report_title: reportTitle, footer_text: footerText });
      showToast("Branding saved", "success");
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    }
    setBrandingSaving(false);
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
              effectiveTier === "free"
                ? "bg-gh-accent/10 border-gh-accent/20 text-gh-accent"
                : "bg-gh-green/10 border-gh-green/20 text-gh-green"
            }`}>
              {planLabel} plan
              {user?.org?.subscription_status === "past_due" && (
                <span className="ml-1 text-gh-red">(payment issue)</span>
              )}
            </div>
            {effectiveTier === "free" && (
              <span className="text-xs text-gh-subtle">{user?.org?.reports_generated ?? 0} / 1 reports used</span>
            )}
          </div>
        </Section>

        {/* Integrations */}
        <Section icon={<Bell className="w-4 h-4" />} title="Integrations">
          <p className="text-xs text-gh-subtle mb-5">
            GitPulse posts summaries to these channels automatically on every push.
          </p>

          {!slackDiscordEnabled && (
            <div className="mb-5 flex items-start gap-3 bg-gh-inset border border-gh-border rounded-xl p-4">
              <Lock className="w-4 h-4 text-gh-muted mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gh-fg">Pro or Agency required</p>
                <p className="text-[11px] text-gh-subtle mt-0.5">
                  Slack and Discord delivery are paid features. Upgrade to connect your channels.
                </p>
              </div>
              <Link to="/app/billing" className="text-xs font-semibold text-gh-accent hover:text-gh-accent-em shrink-0">
                Upgrade
              </Link>
            </div>
          )}

          {/* Slack */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <SlackIcon />
                <span className="text-xs font-semibold text-gh-fg">Slack</span>
                {slackConnected && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gh-green/10 border border-gh-green/20 text-gh-green">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Connected
                  </span>
                )}
              </div>
              {slackConnected && (
                <button
                  onClick={() => testNotification("slack")}
                  className="text-xs text-gh-muted hover:text-gh-fg border border-gh-border hover:border-gh-muted px-2.5 py-1 rounded-lg transition-colors"
                >
                  Test
                </button>
              )}
            </div>

            {slackConnected ? (
              <div className="flex items-center justify-between bg-gh-green/5 border border-gh-green/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-gh-fg">
                    Posting to <span className="font-mono text-gh-green">{slackChannel || "your channel"}</span>
                  </p>
                  <p className="text-[10px] text-gh-subtle mt-0.5">Summaries will be delivered here on every push.</p>
                </div>
                <button
                  onClick={handleSlackDisconnect}
                  disabled={slackDisconnecting}
                  className="flex items-center gap-1.5 text-xs text-gh-subtle hover:text-gh-red border border-gh-border hover:border-gh-red/30 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {slackDisconnecting
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Unlink className="w-3 h-3" />
                  }
                  Disconnect
                </button>
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-gh-subtle mb-2">
                  One click — pick a channel in Slack and you&apos;re done.
                </p>
                <button
                  onClick={handleSlackConnect}
                  disabled={!slackDiscordEnabled}
                  className="flex items-center gap-2 bg-[#4A154B] hover:bg-[#3e1140] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <SlackIcon white />
                  Add to Slack
                </button>
              </div>
            )}
          </div>

          <div className="h-px bg-gh-line mb-5" />

          {/* Discord */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DiscordIcon />
              <span className="text-xs font-semibold text-gh-fg">Discord</span>
            </div>
            <p className="text-[11px] text-gh-subtle mb-1.5">
              In Discord: right-click channel → Edit Channel → Integrations → Webhooks → New Webhook → Copy URL.
            </p>
            <div className="flex gap-2">
              <input
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                disabled={!slackDiscordEnabled}
                placeholder="https://discord.com/api/webhooks/..."
                className="flex-1 bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-xs text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors font-mono disabled:opacity-50"
              />
              <button
                onClick={() => testNotification("discord")}
                disabled={!discord || !slackDiscordEnabled}
                className="shrink-0 px-3 py-2 text-xs font-medium bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg hover:border-gh-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Test
              </button>
            </div>
            <div className="mt-3">
              <button
                onClick={saveDiscord}
                disabled={integrationSaving || !slackDiscordEnabled}
                className="flex items-center gap-2 bg-gh-accent hover:bg-gh-accent-em disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {integrationSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {integrationSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </Section>

        {/* White-label branding (Agency) */}
        {whiteLabelEnabled && (
          <Section icon={<Palette className="w-4 h-4" />} title="White-label branding">
            <p className="text-xs text-gh-subtle mb-4">
              Customize how PDF reports appear to your clients. Leave blank to use your organization name.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gh-fg block mb-1">Report header title</label>
                <input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder={user?.org?.name ?? "Your agency name"}
                  className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gh-fg block mb-1">PDF footer text</label>
                <input
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder={`${user?.org?.name ?? "Agency"} · Confidential`}
                  className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent"
                />
              </div>
              <button
                onClick={saveBranding}
                disabled={brandingSaving}
                className="flex items-center gap-2 bg-gh-accent hover:bg-gh-accent-em disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {brandingSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save branding
              </button>
            </div>
          </Section>
        )}

        {/* Billing */}
        <Section icon={<CreditCard className="w-4 h-4" />} title="Billing">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gh-fg capitalize">{planLabel} plan</p>
              <p className="text-xs text-gh-subtle mt-0.5">
                {effectiveTier === "free"
                  ? "Upgrade to unlock unlimited reports, more repos, and Slack/Discord notifications."
                  : `Subscription status: ${user?.org?.subscription_status}`}
              </p>
            </div>
            <Link
              to="/app/billing"
              className="flex items-center gap-1.5 text-xs font-semibold bg-gh-accent hover:bg-gh-accent-em text-white px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              Manage Billing
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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

function SlackIcon({ white = false }) {
  return (
    <svg width="14" height="14" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
      {white ? (
        <path fill="white" d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386H34.048a5.381 5.381 0 0 0-5.376 5.386 5.381 5.381 0 0 0 5.376 5.387M0 34.248a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387v-5.386H5.376A5.381 5.381 0 0 0 0 34.248m14.336 0v14.365A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.248a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386" />
      ) : (
        <>
          <path fill="#E01E5A" d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" />
          <path fill="#36C5F0" d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" />
          <path fill="#2EB67D" d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386H34.048a5.381 5.381 0 0 0-5.376 5.386 5.381 5.381 0 0 0 5.376 5.387" />
          <path fill="#ECB22E" d="M0 34.248a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387v-5.386H5.376A5.381 5.381 0 0 0 0 34.248m14.336 0v14.365A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.248a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386" />
        </>
      )}
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="#5865F2" d="M60.105 4.898A58.55 58.55 0 0 0 45.653.415a.22.22 0 0 0-.233.11 40.784 40.784 0 0 0-1.8 3.697c-5.456-.817-10.886-.817-16.23 0-.485-1.164-1.201-2.587-1.828-3.697a.228.228 0 0 0-.233-.11 58.386 58.386 0 0 0-14.452 4.483.207.207 0 0 0-.095.082C1.578 18.73-.944 32.144.293 45.39a.244.244 0 0 0 .093.167c6.073 4.46 11.955 7.167 17.729 8.962a.23.23 0 0 0 .249-.082 42.08 42.08 0 0 0 3.627-5.9.225.225 0 0 0-.123-.312 38.772 38.772 0 0 1-5.539-2.638.228.228 0 0 1-.022-.378 31.17 31.17 0 0 0 1.1-.862.22.22 0 0 1 .23-.031c11.62 5.304 24.198 5.304 35.68 0a.219.219 0 0 1 .232.028c.356.293.728.586 1.103.865a.228.228 0 0 1-.02.378 36.384 36.384 0 0 1-5.54 2.635.227.227 0 0 0-.121.315 47.249 47.249 0 0 0 3.624 5.897.225.225 0 0 0 .249.084c5.801-1.795 11.684-4.502 17.757-8.961a.228.228 0 0 0 .092-.164c1.48-15.315-2.48-28.618-10.497-40.412a.18.18 0 0 0-.093-.084zM23.725 37.332c-3.497 0-6.38-3.211-6.38-7.156 0-3.944 2.827-7.156 6.38-7.156 3.583 0 6.437 3.24 6.382 7.156 0 3.945-2.827 7.156-6.382 7.156zm23.593 0c-3.498 0-6.38-3.211-6.38-7.156 0-3.944 2.826-7.156 6.38-7.156 3.582 0 6.437 3.24 6.38 7.156 0 3.945-2.798 7.156-6.38 7.156z" />
    </svg>
  );
}
