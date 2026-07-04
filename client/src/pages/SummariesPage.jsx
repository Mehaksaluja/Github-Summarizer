import { useEffect, useState } from "react";
import { ScrollText, Filter } from "lucide-react";
import { fetchSummaries } from "../api/summaries";
import { fetchRepos } from "../api/repos";
import TopBar from "../components/TopBar";
import SummaryCard from "../components/SummaryCard";

const TYPES = [
  { value: "", label: "All types" },
  { value: "standup", label: "Standup" },
  { value: "client_report", label: "Client Report" },
  { value: "executive_dashboard", label: "Executive" },
];

const LIMIT = 10;

export default function SummariesPage() {
  const [summaries, setSummaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [repoFilter, setRepoFilter] = useState("");

  useEffect(() => {
    fetchRepos().then(setRepos);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSummaries({ repoId: repoFilter || undefined, limit: LIMIT, page })
      .then((d) => { setSummaries(d.summaries); setTotal(d.total); })
      .finally(() => setLoading(false));
  }, [repoFilter, page]);

  const totalPages = Math.ceil(total / LIMIT);

  function handleRepoChange(e) {
    setRepoFilter(e.target.value);
    setPage(1);
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title="Summaries"
        subtitle={`${total} total`}
      />

      <div className="flex-1 p-6 max-w-4xl w-full mx-auto">
        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-2 text-xs text-gh-subtle">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </div>
          <select
            value={repoFilter}
            onChange={handleRepoChange}
            className="bg-gh-surface border border-gh-border text-gh-fg text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-gh-accent transition-colors cursor-pointer"
          >
            <option value="">All repositories</option>
            {repos.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gh-surface border border-gh-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-gh-inset border border-gh-border flex items-center justify-center mb-4">
              <ScrollText className="w-6 h-6 text-gh-subtle" />
            </div>
            <p className="text-sm font-semibold text-gh-fg mb-1">No summaries found</p>
            <p className="text-xs text-gh-muted">
              {repoFilter ? "Try clearing the filter." : "Push a commit to a registered repo to generate one."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {summaries.map(s => <SummaryCard key={s._id} summary={s} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg hover:border-gh-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-gh-subtle px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg hover:border-gh-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
