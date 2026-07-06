import { useState } from "react";
import { Link } from "react-router-dom";
import { GitCommit, GitMerge, Calendar, ArrowRight, Zap, Bug, Wrench, ThumbsUp, ThumbsDown, Archive, ArchiveRestore, Trash2, Users, AlertTriangle } from "lucide-react";
import { submitFeedback, archiveSummary, deleteSummary } from "../api/summaries";

const TYPE_META = {
  standup:              { label: "Push Summary",   color: "text-gh-blue   bg-gh-blue/10   border-gh-blue/20"      },
  client_report:        { label: "Client Report",  color: "text-gh-accent bg-gh-accent/10 border-gh-accent/20"    },
  executive_dashboard:  { label: "Executive",      color: "text-gh-green  bg-gh-green/10  border-gh-green/20"     },
  daily_digest:         { label: "Daily Digest",   color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  weekly_digest:        { label: "Weekly Digest",  color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  custom_report:        { label: "Custom Report",  color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
};

export default function SummaryCard({ summary, onArchived, onDeleted }) {
  const { _id, date, summary_type, stats, structured, repo_id } = summary;
  const meta = TYPE_META[summary_type] ?? { label: summary_type, color: "text-gh-muted bg-gh-inset border-gh-border" };

  const [rating, setRating] = useState(summary.feedback?.rating ?? null);
  const [archived, setArchived] = useState(summary.is_archived ?? false);
  const [actionLoading, setActionLoading] = useState(null);

  async function handleFeedback(r) {
    if (actionLoading) return;
    const next = rating === r ? null : r;
    setRating(next);
    if (next) {
      try { await submitFeedback(_id, { rating: next }); } catch { setRating(rating); }
    }
  }

  async function handleArchive() {
    if (actionLoading) return;
    setActionLoading("archive");
    const next = !archived;
    try {
      await archiveSummary(_id, next);
      setArchived(next);
      if (onArchived) onArchived(_id, next);
    } catch { /* no-op */ }
    setActionLoading(null);
  }

  async function handleDelete() {
    if (actionLoading) return;
    if (!confirm("Permanently delete this summary?")) return;
    setActionLoading("delete");
    try {
      await deleteSummary(_id);
      if (onDeleted) onDeleted(_id);
    } catch { setActionLoading(null); }
  }

  const bullets = structured?.what_changed?.slice(0, 3) ?? [];
  const hasBlockers = structured?.has_blockers;

  return (
    <div className={`bg-gh-surface border border-gh-border rounded-xl overflow-hidden hover:border-gh-muted hover:shadow-lg hover:shadow-black/20 transition-all duration-200 ${archived ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {archived && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-gh-muted bg-gh-inset border-gh-border">
              Archived
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
            {meta.label}
          </span>
          {repo_id?.full_name && (
            <span className="text-xs text-gh-subtle font-mono bg-gh-inset border border-gh-line px-2 py-0.5 rounded-full">
              {repo_id.full_name}
            </span>
          )}
          {hasBlockers && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gh-red/10 border-gh-red/20 text-gh-red">
              <AlertTriangle className="w-2.5 h-2.5" />
              Blockers
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gh-subtle shrink-0">
          <Calendar className="w-3.5 h-3.5" />
          {date}
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 pb-3 flex items-center gap-4 flex-wrap">
        <Chip icon={<GitCommit className="w-3 h-3" />} val={stats.total_commits} label="commits" />
        {stats.contributors > 0 && (
          <Chip icon={<Users className="w-3 h-3 text-gh-blue" />} val={stats.contributors} label="contributors" valCls="text-gh-blue" />
        )}
        <Chip icon={<GitMerge className="w-3 h-3" />} val={stats.prs_merged} label="PRs" />
        <div className="w-px h-3.5 bg-gh-border" />
        <Chip icon={<Zap className="w-3 h-3 text-gh-green" />}    val={stats.features}  label="features" valCls="text-gh-green" />
        <Chip icon={<Bug className="w-3 h-3 text-gh-red" />}      val={stats.bug_fixes} label="fixes"    valCls="text-gh-red" />
        <Chip icon={<Wrench className="w-3 h-3 text-gh-muted" />} val={stats.chores}    label="chores"   valCls="text-gh-muted" />
      </div>

      <div className="h-px bg-gh-line mx-5" />

      {/* Summary preview */}
      <div className="px-5 py-3.5 space-y-2.5">
        {structured?.headline && (
          <p className="text-sm font-semibold text-gh-fg leading-snug">{structured.headline}</p>
        )}
        {bullets.length > 0 && (
          <ul className="space-y-1">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gh-muted">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gh-border shrink-0" />
                <span className="leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>
        )}
        {!structured?.headline && (
          <Link
            to={`/app/summaries/${_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gh-accent hover:text-gh-accent-em font-medium transition-colors"
          >
            Read full summary
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
        {structured?.headline && (
          <Link
            to={`/app/summaries/${_id}`}
            className="inline-flex items-center gap-1 text-xs text-gh-accent hover:text-gh-accent-em font-medium transition-colors pt-0.5"
          >
            View full summary
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Action bar */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleFeedback("up")}
            title="Helpful"
            className={`p-1.5 rounded-lg transition-all ${
              rating === "up"
                ? "text-gh-green bg-gh-green/10"
                : "text-gh-subtle hover:text-gh-green hover:bg-gh-green/5"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFeedback("down")}
            title="Needs improvement"
            className={`p-1.5 rounded-lg transition-all ${
              rating === "down"
                ? "text-gh-red bg-gh-red/10"
                : "text-gh-subtle hover:text-gh-red hover:bg-gh-red/5"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          {rating && (
            <span className="text-[10px] text-gh-subtle ml-1">
              {rating === "up" ? "Marked helpful" : "Feedback noted"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleArchive}
            disabled={actionLoading === "archive"}
            title={archived ? "Restore" : "Archive"}
            className="p-1.5 rounded-lg text-gh-subtle hover:text-gh-muted hover:bg-gh-inset transition-all disabled:opacity-50"
          >
            {archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDelete}
            disabled={actionLoading === "delete"}
            title="Delete permanently"
            className="p-1.5 rounded-lg text-gh-subtle hover:text-gh-red hover:bg-gh-red/5 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, val, label, valCls = "text-gh-fg" }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gh-subtle">{icon}</span>
      <span className={`font-semibold tabular-nums ${valCls}`}>{val}</span>
      <span className="text-gh-subtle">{label}</span>
    </div>
  );
}
