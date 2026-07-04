import { Link } from "react-router-dom";
import { GitCommit, GitMerge, Calendar, ArrowRight, Zap, Bug, Wrench } from "lucide-react";
import Markdown from "react-markdown";

const TYPE_LABELS = {
  standup: "Standup",
  client_report: "Client Report",
  executive_dashboard: "Executive",
};

const TYPE_STYLES = {
  standup: "bg-blue-50 text-blue-600 border-blue-100",
  client_report: "bg-purple-50 text-purple-600 border-purple-100",
  executive_dashboard: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export default function SummaryCard({ summary, expanded = false }) {
  const { _id, date, summary_type, stats, summary_markdown, repo_id } = summary;

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
      {/* Card header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TYPE_STYLES[summary_type]}`}>
            {TYPE_LABELS[summary_type]}
          </span>
          {repo_id?.full_name && (
            <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded-full">
              {repo_id.full_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
          <Calendar className="w-3.5 h-3.5" />
          {date}
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 pb-3 flex items-center gap-5 border-b border-gray-50">
        <StatChip icon={<GitCommit className="w-3 h-3" />} value={stats.total_commits} label="commits" />
        <StatChip icon={<GitMerge className="w-3 h-3" />} value={stats.prs_merged} label="PRs" />
        <div className="w-px h-4 bg-gray-100" />
        <StatChip icon={<Zap className="w-3 h-3 text-emerald-500" />} value={stats.features} label="features" valueColor="text-emerald-600" />
        <StatChip icon={<Bug className="w-3 h-3 text-red-400" />} value={stats.bug_fixes} label="fixes" valueColor="text-red-500" />
        <StatChip icon={<Wrench className="w-3 h-3 text-gray-400" />} value={stats.chores} label="chores" valueColor="text-gray-500" />
      </div>

      {/* Body */}
      <div className="px-5 py-3">
        {expanded ? (
          <div className="prose prose-sm max-w-none text-gray-700 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_ul]:mt-1 [&_li]:my-0.5">
            <Markdown>{summary_markdown}</Markdown>
          </div>
        ) : (
          <Link
            to={`/summaries/${_id}`}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors w-fit"
          >
            Read full summary
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

function StatChip({ icon, value, label, valueColor = "text-gray-700" }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-400">{icon}</span>
      <span className={`font-semibold tabular-nums ${valueColor}`}>{value}</span>
      <span className="text-gray-400">{label}</span>
    </div>
  );
}
