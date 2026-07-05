import { useEffect, useState, useCallback } from "react";
import { ScrollText, Filter, List, Calendar, Archive, ArchiveRestore, BarChart2 } from "lucide-react";
import { fetchSummaries } from "../api/summaries";
import { fetchRepos } from "../api/repos";
import TopBar from "../components/TopBar";
import SummaryCard from "../components/SummaryCard";
import GenerateReportModal from "../components/GenerateReportModal";

const TYPES = [
  { value: "", label: "All types" },
  { value: "standup", label: "Standup" },
  { value: "client_report", label: "Client Report" },
  { value: "executive_dashboard", label: "Executive" },
  { value: "daily_digest", label: "Daily Digest" },
  { value: "weekly_digest", label: "Weekly Digest" },
  { value: "custom_report", label: "Custom Report" },
];

const LIMIT = 10;

function groupByDate(summaries) {
  const groups = {};
  for (const s of summaries) {
    if (!groups[s.date]) groups[s.date] = [];
    groups[s.date].push(s);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [repoFilter, setRepoFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" | "timeline"
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => { fetchRepos().then(setRepos); }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchSummaries({
      repoId: repoFilter || undefined,
      summaryType: typeFilter || undefined,
      includeArchived: showArchived,
      limit: LIMIT,
      page,
    })
      .then((d) => { setSummaries(d.summaries); setTotal(d.total); })
      .finally(() => setLoading(false));
  }, [repoFilter, typeFilter, showArchived, page]);

  useEffect(() => { load(); }, [load]);

  function handleRepoChange(e) { setRepoFilter(e.target.value); setPage(1); }
  function handleTypeChange(e) { setTypeFilter(e.target.value); setPage(1); }

  function handleArchived(id, isNowArchived) {
    if (!showArchived && isNowArchived) {
      setSummaries((prev) => prev.filter((s) => s._id !== id));
      setTotal((t) => t - 1);
    } else {
      setSummaries((prev) =>
        prev.map((s) => (s._id === id ? { ...s, is_archived: isNowArchived } : s))
      );
    }
  }

  function handleDeleted(id) {
    setSummaries((prev) => prev.filter((s) => s._id !== id));
    setTotal((t) => t - 1);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const grouped = groupByDate(summaries);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title="Summaries"
        subtitle={`${total} total`}
        actions={
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 bg-gh-accent hover:bg-gh-accent-em text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Generate Report
          </button>
        }
      />

      <div className="flex-1 p-6 max-w-4xl w-full mx-auto">
        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-gh-subtle">
            <Filter className="w-3.5 h-3.5" />
          </div>

          <select
            value={repoFilter}
            onChange={handleRepoChange}
            className="bg-gh-surface border border-gh-border text-gh-fg text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-gh-accent transition-colors cursor-pointer"
          >
            <option value="">All repositories</option>
            {repos.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={handleTypeChange}
            className="bg-gh-surface border border-gh-border text-gh-fg text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-gh-accent transition-colors cursor-pointer"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Archive toggle */}
          <button
            onClick={() => { setShowArchived((v) => !v); setPage(1); }}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
              showArchived
                ? "bg-gh-accent/10 border-gh-accent/30 text-gh-accent"
                : "bg-gh-surface border-gh-border text-gh-muted hover:text-gh-fg"
            }`}
          >
            {showArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            {showArchived ? "Hide archived" : "Show archived"}
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-gh-surface border border-gh-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-gh-accent/10 text-gh-accent" : "text-gh-muted hover:text-gh-fg"}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`p-1.5 transition-colors ${viewMode === "timeline" ? "bg-gh-accent/10 text-gh-accent" : "text-gh-muted hover:text-gh-fg"}`}
              title="Timeline view"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-gh-surface border border-gh-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-gh-inset border border-gh-border flex items-center justify-center mb-4">
              <ScrollText className="w-6 h-6 text-gh-subtle" />
            </div>
            <p className="text-sm font-semibold text-gh-fg mb-1">No summaries found</p>
            <p className="text-xs text-gh-muted">
              {repoFilter || typeFilter
                ? "Try clearing the filters."
                : showArchived
                ? "No archived summaries."
                : "Push a commit to a registered repo to generate one."}
            </p>
          </div>
        ) : viewMode === "timeline" ? (
          /* Timeline view — grouped by date */
          <div className="space-y-6 mb-6">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-gh-border" />
                  <div className="flex items-center gap-1.5 bg-gh-surface border border-gh-border px-3 py-1 rounded-full">
                    <Calendar className="w-3 h-3 text-gh-subtle" />
                    <span className="text-xs font-medium text-gh-muted">{date}</span>
                  </div>
                  <div className="h-px flex-1 bg-gh-border" />
                </div>
                <div className="space-y-3">
                  {items.map((s) => (
                    <SummaryCard
                      key={s._id}
                      summary={s}
                      onArchived={handleArchived}
                      onDeleted={handleDeleted}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-3 mb-6">
            {summaries.map((s) => (
              <SummaryCard
                key={s._id}
                summary={s}
                onArchived={handleArchived}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg hover:border-gh-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-gh-subtle px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg hover:border-gh-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showGenerateModal && (
        <GenerateReportModal
          onClose={() => setShowGenerateModal(false)}
          onGenerated={() => { setPage(1); load(); }}
        />
      )}
    </div>
  );
}
