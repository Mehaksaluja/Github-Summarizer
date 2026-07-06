import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FolderGit2, BarChart2 } from "lucide-react";
import { fetchSummaries } from "../api/summaries";
import { fetchRepos } from "../api/repos";
import TopBar from "../components/TopBar";
import SummaryCard from "../components/SummaryCard";
import GenerateReportModal from "../components/GenerateReportModal";

const LIMIT = 10;

export default function RepoDetailPage() {
  const { repoId } = useParams();
  const [summaries, setSummaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [repoName, setRepoName] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchSummaries({ repoId, limit: LIMIT, page })
      .then((d) => {
        setSummaries(d.summaries);
        setTotal(d.total);
        if (d.summaries[0]?.repo_id?.full_name) {
          setRepoName(d.summaries[0].repo_id.full_name);
        }
      })
      .finally(() => setLoading(false));
  }, [repoId, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (repoName) return;
    fetchRepos().then((repos) => {
      const found = repos.find((r) => r._id === repoId);
      if (found) setRepoName(found.full_name || found.name);
    }).catch(() => {});
  }, [repoId, repoName]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title={repoName || "Repository"}
        subtitle={`${total} summaries`}
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
        <Link
          to="/app/repos"
          className="inline-flex items-center gap-1.5 text-xs text-gh-subtle hover:text-gh-muted mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to repositories
        </Link>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-gh-surface border border-gh-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-gh-inset border border-gh-border flex items-center justify-center mb-4">
              <FolderGit2 className="w-6 h-6 text-gh-subtle" />
            </div>
            <p className="text-sm font-semibold text-gh-fg mb-1">No summaries yet</p>
            <p className="text-xs text-gh-muted mb-5">Push a commit or generate a report to get started.</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-1.5 bg-gh-accent hover:bg-gh-accent-em text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Generate First Report
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {summaries.map(s => (
                <SummaryCard
                  key={s._id}
                  summary={s}
                  onArchived={(id, archived) =>
                    setSummaries((prev) => prev.map((x) => x._id === id ? { ...x, is_archived: archived } : x))
                  }
                  onDeleted={(id) => {
                    setSummaries((prev) => prev.filter((x) => x._id !== id));
                    setTotal((t) => t - 1);
                  }}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg hover:border-gh-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Previous
                </button>
                <span className="text-xs text-gh-subtle px-2">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg hover:border-gh-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showGenerateModal && (
        <GenerateReportModal
          preSelectedRepoId={repoId}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={() => { setPage(1); load(); }}
        />
      )}
    </div>
  );
}
