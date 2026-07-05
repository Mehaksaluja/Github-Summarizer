import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import TopBar from "../components/TopBar";
import { User, Building2, Bell, CreditCard, Save, Calendar, Check, Loader2, Cpu, MessageSquare, Zap } from "lucide-react";
import { fetchSettings, updateSchedule, updateIntegrations } from "../api/settings";
import { useToast } from "../hooks/useToast";

const BASE = import.meta.env.VITE_API_URL || "";

const CADENCE_OPTIONS = [
  {
    value: "per_push",
    label: "Per Push",
    desc: "Summary generated on every push. Best for small teams with low commit volume.",
  },
  {
    value: "daily",
    label: "Daily Digest",
    desc: "One rolled-up summary every morning at 9 AM UTC. Reduces noise for active repos.",
    badge: "Recommended",
  },
  {
    value: "weekly",
    label: "Weekly Digest",
    desc: "One summary every Monday morning. Best for managers who want a weekly overview.",
  },
];

const MODEL_OPTIONS = [
  {
    value: "gpt-4o-mini",
    label: "GPT-4o Mini",
    tagline: "Fast & affordable",
    desc: "Great for most teams. Processes quickly and costs less per summary.",
    cost: "$0.001 / summary",
  },
  {
    value: "gpt-4o",
    label: "GPT-4o",
    tagline: "Best quality",
    desc: "More detailed and accurate summaries. Best for client reports and executive dashboards.",
    cost: "$0.005 / summary",
    badge: "Pro",
  },
];

async function apiPut(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Save failed");
  return res.json();
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isPro = user?.org?.plan_tier !== "free";

  // Digest schedule
  const [cadence, setCadence] = useState("per_push");
  const [originalCadence, setOriginalCadence] = useState("per_push");
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // Integrations
  const [slack, setSlack] = useState("");
  const [discord, setDiscord] = useState("");
  const [integrationSaving, setIntegrationSaving] = useState(false);

  // AI model
  const [model, setModel] = useState("gpt-4o-mini");
  const [originalModel, setOriginalModel] = useState("gpt-4o-mini");
  const [modelSaving, setModelSaving] = useState(false);

  // Custom prompt
  const [summarizerPrompt, setSummarizerPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        const c = data.digest_schedule?.cadence ?? "per_push";
        setCadence(c);
        setOriginalCadence(c);
        setSlack(data.integrations?.slack_webhook_url ?? "");
        setDiscord(data.integrations?.discord_webhook_url ?? "");
        const m = data.preferred_ai_model ?? "gpt-4o-mini";
        setModel(m);
        setOriginalModel(m);
        const p = data.custom_prompts?.summarizer ?? "";
        setSummarizerPrompt(p);
        setOriginalPrompt(p);
      })
      .catch(() => {});
  }, []);

  async function saveSchedule() {
    setScheduleSaving(true);
    try {
      await updateSchedule({ cadence });
      setOriginalCadence(cadence);
      showToast("Digest schedule saved", "success");
    } catch { showToast("Save failed", "error"); }
    setScheduleSaving(false);
  }

  async function saveIntegrations() {
    setIntegrationSaving(true);
    try {
      await updateIntegrations({ slack_webhook_url: slack, discord_webhook_url: discord });
      showToast("Integrations saved", "success");
    } catch { showToast("Save failed", "error"); }
    setIntegrationSaving(false);
  }

  async function saveModel() {
    setModelSaving(true);
    try {
      await apiPut("/api/settings/model", { preferred_ai_model: model });
      setOriginalModel(model);
      showToast("AI model preference saved", "success");
    } catch { showToast("Save failed", "error"); }
    setModelSaving(false);
  }

  async function savePrompt() {
    setPromptSaving(true);
    try {
      await apiPut("/api/settings/prompts", { summarizer: summarizerPrompt || null });
      setOriginalPrompt(summarizerPrompt);
      showToast("Custom prompt saved", "success");
    } catch { showToast("Save failed", "error"); }
    setPromptSaving(false);
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

        {/* Digest Schedule */}
        <Section icon={<Calendar className="w-4 h-4" />} title="Digest Schedule">
          <p className="text-xs text-gh-subtle mb-4">
            Choose how often GitPulse generates summaries. Daily and weekly digests batch all commits into one clean summary.
          </p>
          <div className="space-y-2.5">
            {CADENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCadence(opt.value)}
                className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all ${
                  cadence === opt.value
                    ? "border-gh-accent bg-gh-accent/5 ring-1 ring-gh-accent/20"
                    : "border-gh-border bg-gh-surface hover:border-gh-muted/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${cadence === opt.value ? "border-gh-accent" : "border-gh-border"}`}>
                      {cadence === opt.value && <div className="w-2 h-2 rounded-full bg-gh-accent" />}
                    </div>
                    <span className="text-sm font-semibold text-gh-fg">{opt.label}</span>
                  </div>
                  {opt.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gh-green/10 border-gh-green/20 text-gh-green">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gh-subtle ml-6">{opt.desc}</p>
              </button>
            ))}
          </div>
          {cadence !== "per_push" && (
            <div className="mt-3 p-3 rounded-lg bg-gh-accent/5 border border-gh-accent/20 text-xs text-gh-accent">
              Digests run at <strong>9:00 AM UTC</strong>.
              {cadence === "daily" && " Yesterday's commits bundled each morning."}
              {cadence === "weekly" && " Last 7 days bundled every Monday."}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <SaveButton onClick={saveSchedule} saving={scheduleSaving} disabled={cadence === originalCadence} />
            {cadence !== originalCadence && <span className="text-xs text-gh-subtle">Unsaved changes</span>}
          </div>
        </Section>

        {/* AI Model */}
        <Section icon={<Cpu className="w-4 h-4" />} title="AI Model">
          <p className="text-xs text-gh-subtle mb-4">
            Choose which OpenAI model generates your summaries. Better models produce richer output at higher cost.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {MODEL_OPTIONS.map((opt) => {
              const locked = opt.badge === "Pro" && !isPro;
              return (
                <button
                  key={opt.value}
                  onClick={() => !locked && setModel(opt.value)}
                  disabled={locked}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    model === opt.value
                      ? "border-gh-accent bg-gh-accent/5 ring-1 ring-gh-accent/20"
                      : locked
                      ? "border-gh-border opacity-50 cursor-not-allowed"
                      : "border-gh-border bg-gh-surface hover:border-gh-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gh-fg">{opt.label}</p>
                      <p className="text-[10px] text-gh-subtle mt-0.5">{opt.tagline}</p>
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gh-yellow/10 border-gh-yellow/20 text-gh-yellow shrink-0">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gh-subtle mb-2">{opt.desc}</p>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-gh-muted" />
                    <span className="text-[10px] font-mono text-gh-muted">{opt.cost}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <SaveButton onClick={saveModel} saving={modelSaving} disabled={model === originalModel} />
            {model !== originalModel && <span className="text-xs text-gh-subtle">Unsaved changes</span>}
          </div>
        </Section>

        {/* Custom Prompts */}
        <Section icon={<MessageSquare className="w-4 h-4" />} title="Custom Prompt">
          <p className="text-xs text-gh-subtle mb-4">
            Override the default AI system prompt for summaries. Leave blank to use the default.
            Use this to change tone (technical, client-friendly) or focus area.
          </p>
          <label className="block text-xs font-medium text-gh-muted mb-1.5">Summarizer system prompt</label>
          <textarea
            value={summarizerPrompt}
            onChange={(e) => setSummarizerPrompt(e.target.value)}
            placeholder={`Default: "You are a developer communication expert. Translate raw GitHub activity into clear, human-friendly summaries..."`}
            rows={5}
            className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2.5 text-xs text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors resize-none font-mono"
          />
          <p className="text-[11px] text-gh-subtle mt-1.5">
            Variables you can reference: {"{repoName}"}, {"{eventType}"}, {"{branch}"}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <SaveButton onClick={savePrompt} saving={promptSaving} disabled={summarizerPrompt === originalPrompt} />
            {summarizerPrompt !== originalPrompt && <span className="text-xs text-gh-subtle">Unsaved changes</span>}
            {summarizerPrompt && (
              <button onClick={() => setSummarizerPrompt("")} className="text-xs text-gh-subtle hover:text-gh-red transition-colors">
                Reset to default
              </button>
            )}
          </div>
        </Section>

        {/* Integrations */}
        <Section icon={<Bell className="w-4 h-4" />} title="Integrations">
          <div className="space-y-4">
            <IntegrationInput label="Slack webhook URL" desc="Post summaries to a Slack channel automatically." placeholder="https://hooks.slack.com/services/..." value={slack} onChange={setSlack} disabled={!isPro} />
            <IntegrationInput label="Discord webhook URL" desc="Post summaries to a Discord channel automatically." placeholder="https://discord.com/api/webhooks/..." value={discord} onChange={setDiscord} disabled={!isPro} />
          </div>
          {!isPro ? (
            <p className="mt-3 text-xs text-gh-subtle">Slack and Discord delivery requires the Pro plan.</p>
          ) : (
            <div className="mt-4">
              <SaveButton onClick={saveIntegrations} saving={integrationSaving} />
            </div>
          )}
        </Section>

        {/* Billing */}
        <Section icon={<CreditCard className="w-4 h-4" />} title="Billing">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gh-fg capitalize">{user?.org?.plan_tier} plan</p>
              <p className="text-xs text-gh-subtle mt-0.5">
                {user?.org?.plan_tier === "free"
                  ? "Upgrade to unlock unlimited reports, Slack, GPT-4o, and weekly digests."
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

function IntegrationInput({ label, desc, placeholder, value, onChange, disabled }) {
  return (
    <div>
      <label className="text-xs font-medium text-gh-muted block mb-1">{label}</label>
      <p className="text-[11px] text-gh-subtle mb-1.5">{desc}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-xs text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
      />
    </div>
  );
}
