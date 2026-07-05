import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, GitCommit, GitMerge, Zap, Bug, Wrench,
  Copy, Check, ThumbsUp, ThumbsDown, Archive, ArchiveRestore, Trash2, Loader2,
} from "lucide-react";
import { fetchSummary, submitFeedback, archiveSummary, deleteSummary } from "../api/summaries";
import TopBar from "../components/TopBar";
import Markdown from "react-markdown";
import { useToast } from "../hooks/useToast";

const TYPE_META = {
  standup:              { label: "Standup",       color: "text-gh-blue   bg-gh-blue/10   border-gh-blue/30"   },
  client_report:        { label: "Client Report", color: "text-gh-accent bg-gh-accent/10 border-gh-accent/30" },
  executive_dashboard:  { label: "Executive",     color: "text-gh-green  bg-gh-green/10  border-gh-green/30"  },
  daily_digest:         { label: "Daily Digest",  color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  weekly_digest:        { label: "Weekly Digest", color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
};

export default function SummaryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [rating, setRating] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [feedbackSaving, setFeedbackSaving] = useState(false);

  const [archived, setArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchSummary(id)
      .then((s) => {
        setSummary(s);
        setRating(s.feedback?.rating ?? null);
        setArchived(s.is_archived ?? false);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCopy() {
    if (!summary) return;
    await navigator.clipboard.writeText(summary.summary_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFeedback(r) {
    if (feedbackSaving) return;
    const next = rating === r ? null : r;
    setRating(next);
    if (!next) return;

    setFeedbackSaving(true);
    try {
      await submitFeedback(id, { rating: next, note: feedbackNote || null });
      showToast(next === "up" ? "Thanks for the feedback!" : "Feedback noted — we'll improve", "success");
      setShowNoteInput(false);
    } catch {
      setRating(rating);
      showToast("Could not save feedback", "error");
    } finally {
      setFeedbackSaving(false);
    }
  }

  async function handleArchive() {
    setActionLoading("archive");
    const next = !archived;
    try {
      await archiveSummary(id, next);
      setArchived(next);
      showToast(next ? "Summary archived" : "Summary restored", "success");
    } catch {
      showToast("Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Permanently delete this summary? This cannot be undone.")) return;
    setActionLoading("delete");
    try {
      await deleteSummary(id);
      showToast("Summary deleted", "info");
      navigate("/app/summaries");
    } catch {
      showToast("Delete failed", "error");
      setActionLoading(null);
    }
  }

  const meta = summary ? (TYPE_META[summary.summary_type] ?? { label: summary.summary_type, color: "text-gh-muted bg-gh-inset border-gh-border" }) : null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title={summary ? `${summary.date} — ${meta?.label}` : "Summary"}
        subtitle={summary?.repo_id?.full_name}
        actions={
          summary && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 bg-gh-surface border border-gh-border hover:border-gh-muted text-gh-muted hover:text-gh-fg text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-gh-green" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleArchive}
                disabled={actionLoading === "archive"}
                title={archived ? "Restore" : "Archive"}
                className="flex items-center gap-1.5 bg-gh-surface border border-gh-border hover:border-gh-muted text-gh-muted hover:text-gh-fg text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === "archive" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : archived ? (
                  <ArchiveRestore className="w-3.5 h-3.5" />
                ) : (
                  <Archive className="w-3.5 h-3.5" />
                )}
                {archived ? "Restore" : "Archive"}
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === "delete"}
                title="Delete"
                className="flex items-center gap-1.5 bg-gh-surface border border-gh-red/30 hover:border-gh-red text-gh-red text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === "delete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            </div>
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
          <div className="bg-gh-red/10 border border-gh-red/20 rounded-xl px-4 py-3 text-sm text-gh-red">{error}</div>
        )}

        {summary && (
          <div className="space-y-5">
            {/* Archived banner */}
            {archived && (
              <div className="flex items-center gap-3 bg-gh-inset border border-gh-border rounded-xl px-4 py-3">
                <Archive className="w-4 h-4 text-gh-muted shrink-0" />
                <span className="text-xs text-gh-muted">This summary is archived and hidden from the main list.</span>
              </div>
            )}

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

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatBox icon={<GitCommit className="w-4 h-4 text-gh-muted" />}  label="Commits"  val={summary.stats.total_commits} />
                <StatBox icon={<GitMerge className="w-4 h-4 text-gh-muted" />}   label="PRs"      val={summary.stats.prs_merged} />
                <StatBox icon={<Zap className="w-4 h-4 text-gh-green" />}        label="Features" val={summary.stats.features}   valCls="text-gh-green" />
                <StatBox icon={<Bug className="w-4 h-4 text-gh-red" />}          label="Fixes"    val={summary.stats.bug_fixes}  valCls="text-gh-red" />
                <StatBox icon={<Wrench className="w-4 h-4 text-gh-yellow" />}    label="Chores"   val={summary.stats.chores}     valCls="text-gh-yellow" />
              </div>
            </div>

            {/* Markdown content */}
            <div className="bg-gh-surface border border-gh-border rounded-2xl p-6">
              <div className="dark-prose">
                <Markdown>{summary.summary_markdown}</Markdown>
              </div>
            </div>

            {/* Feedback panel */}
            <div className="bg-gh-surface border border-gh-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gh-fg mb-3">Was this summary helpful?</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { handleFeedback("up"); setShowNoteInput(false); }}
                  disabled={feedbackSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    rating === "up"
                      ? "bg-gh-green/10 border-gh-green/30 text-gh-green"
                      : "bg-gh-surface border-gh-border text-gh-muted hover:border-gh-green/30 hover:text-gh-green"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful
                </button>
                <button
                  onClick={() => { setShowNoteInput(true); setRating("down"); }}
                  disabled={feedbackSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    rating === "down"
                      ? "bg-gh-red/10 border-gh-red/30 text-gh-red"
                      : "bg-gh-surface border-gh-border text-gh-muted hover:border-gh-red/30 hover:text-gh-red"
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Needs work
                </button>
                {rating && !showNoteInput && (
                  <span className="text-xs text-gh-subtle">
                    {rating === "up" ? "Thanks! Feedback saved." : "Noted. Help us improve."}
                  </span>
                )}
              </div>

              {showNoteInput && (
                <div className="mt-3">
                  <textarea
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="What could be better? (optional)"
                    rows={3}
                    className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-xs text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleFeedback("down")}
                      disabled={feedbackSaving}
                      className="flex items-center gap-1.5 bg-gh-accent hover:bg-gh-accent-em text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {feedbackSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Submit feedback
                    </button>
                    <button
                      onClick={() => { setShowNoteInput(false); setRating(null); }}
                      className="text-xs text-gh-subtle hover:text-gh-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
