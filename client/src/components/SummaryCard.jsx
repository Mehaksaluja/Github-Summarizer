import { Link } from "react-router-dom";
import { GitCommit, GitMerge, Calendar, ArrowRight, Zap, Bug, Wrench } from "lucide-react";
import Markdown from "react-markdown";

const TYPE_META = {
  standup:              { label: "Standup",        color: "text-gh-blue  bg-gh-blue/10  border-gh-blue/20"  },
  client_report:        { label: "Client Report",  color: "text-gh-accent bg-gh-accent/10 border-gh-accent/20" },
  executive_dashboard:  { label: "Executive",      color: "text-gh-green bg-gh-green/10 border-gh-green/20" },
};

export default function SummaryCard({ summary, expanded = false }) {
  const { _id, date, summary_type, stats, summary_markdown, repo_id } = summary;
  const meta = TYPE_META[summary_type] ?? { label: summary_type, color: "text-gh-muted bg-gh-inset border-gh-border" };

  return (
    <div className="bg-gh-surface border border-gh-border rounded-xl overflow-hidden hover:border-gh-muted hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
            {meta.label}
          </span>
          {repo_id?.full_name && (
            <span className="text-xs text-gh-subtle font-mono bg-gh-inset border border-gh-line px-2 py-0.5 rounded-full">
              {repo_id.full_name}
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
        <Chip icon={<GitMerge className="w-3 h-3" />} val={stats.prs_merged} label="PRs" />
        <div className="w-px h-3.5 bg-gh-border" />
        <Chip icon={<Zap className="w-3 h-3 text-gh-green" />}   val={stats.features}  label="features" valCls="text-gh-green" />
        <Chip icon={<Bug className="w-3 h-3 text-gh-red" />}     val={stats.bug_fixes} label="fixes"    valCls="text-gh-red" />
        <Chip icon={<Wrench className="w-3 h-3 text-gh-muted" />} val={stats.chores}   label="chores"   valCls="text-gh-muted" />
      </div>

      {/* Divider */}
      <div className="h-px bg-gh-line mx-5" />

      {/* Body */}
      <div className="px-5 py-3">
        {expanded ? (
          <div className="dark-prose">
            <Markdown>{summary_markdown}</Markdown>
          </div>
        ) : (
          <Link
            to={`/app/summaries/${_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gh-accent hover:text-gh-accent-em font-medium transition-colors"
          >
            Read full summary
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
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
