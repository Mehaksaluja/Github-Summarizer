import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, GitCommit, GitMerge, Zap, Bug, Wrench, Copy, Check } from "lucide-react";
import { fetchSummary } from "../api/summaries";
import TopBar from "../components/TopBar";
import Markdown from "react-markdown";

const TYPE_META = {
  standup:             { label: "Standup",       color: "text-gh-blue  bg-gh-blue/10  border-gh-blue/30"  },
  client_report:       { label: "Client Report", color: "text-gh-accent bg-gh-accent/10 border-gh-accent/30" },
  executive_dashboard: { label: "Executive",     color: "text-gh-green bg-gh-green/10 border-gh-green/30" },
};

export default function SummaryDetailPage() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSummary(id)
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCopy() {
    if (!summary) return;
    await navigator.clipboard.writeText(summary.summary_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const meta = summary ? (TYPE_META[summary.summary_type] ?? { label: summary.summary_type, color: "text-gh-muted bg-gh-inset border-gh-border" }) : null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title={summary ? `${summary.date} — ${meta?.label}` : "Summary"}
        subtitle={summary?.repo_id?.full_name}
        actions={
          summary && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-gh-surface border border-gh-border hover:border-gh-muted text-gh-muted hover:text-gh-fg text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-gh-green" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy markdown"}
            </button>
          )
        }
      />

      <div className="flex-1 p-6 max-w-3xl w-full mx-auto">
        <Link
          to="/app/summaries"
          className="inline-flex items-center gap-1.5 text-xs text-gh-subtle hover:text-gh-muted mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to summaries
        </Link>

        {loading && (
          <div className="space-y-4">
            <div className="h-8 w-48 bg-gh-surface rounded-lg animate-pulse" />
            <div className="h-64 bg-gh-surface rounded-xl animate-pulse" />
          </div>
        )}

        {error && (
          <div className="bg-gh-red/10 border border-gh-red/20 rounded-xl px-4 py-3 text-sm text-gh-red">
            {error}
          </div>
        )}

        {summary && (
          <div className="space-y-5">
            {/* Header card */}
            <div className="bg-gh-surface border border-gh-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
                    {meta.label}
                  </span>
                  {summary.repo_id?.full_name && (
                    <span className="text-xs text-gh-subtle font-mono bg-gh-inset border border-gh-line px-2 py-0.5 rounded-full">
                      {summary.repo_id.full_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gh-subtle shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  {summary.date}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatBox icon={<GitCommit className="w-4 h-4 text-gh-muted" />}  label="Commits"  val={summary.stats.total_commits} />
                <StatBox icon={<GitMerge className="w-4 h-4 text-gh-muted" />}   label="PRs"      val={summary.stats.prs_merged} />
                <StatBox icon={<Zap className="w-4 h-4 text-gh-green" />}        label="Features" val={summary.stats.features}  valCls="text-gh-green" />
                <StatBox icon={<Bug className="w-4 h-4 text-gh-red" />}          label="Fixes"    val={summary.stats.bug_fixes} valCls="text-gh-red" />
                <StatBox icon={<Wrench className="w-4 h-4 text-gh-yellow" />}    label="Chores"   val={summary.stats.chores}    valCls="text-gh-yellow" />
              </div>
            </div>

            {/* Markdown content */}
            <div className="bg-gh-surface border border-gh-border rounded-2xl p-6">
              <div className="dark-prose">
                <Markdown>{summary.summary_markdown}</Markdown>
              </div>
            </div>

            {/* Delivery status */}
            {(summary.delivered_to?.slack || summary.delivered_to?.discord || summary.delivered_to?.email) && (
              <div className="bg-gh-surface border border-gh-border rounded-xl px-4 py-3 flex items-center gap-3">
                <Check className="w-4 h-4 text-gh-green shrink-0" />
                <span className="text-xs text-gh-muted">
                  Delivered to{" "}
                  {[
                    summary.delivered_to.slack && "Slack",
                    summary.delivered_to.discord && "Discord",
                    summary.delivered_to.email && "Email",
                  ].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon, label, val, valCls = "text-gh-fg" }) {
  return (
    <div className="bg-gh-inset border border-gh-line rounded-lg px-3 py-2.5 flex flex-col items-center gap-1">
      {icon}
      <span className={`text-xl font-bold tabular-nums ${valCls}`}>{val}</span>
      <span className="text-[10px] text-gh-subtle">{label}</span>
    </div>
  );
}
