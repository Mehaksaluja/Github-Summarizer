import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FolderGit2 } from "lucide-react";
import { fetchSummaries } from "../api/summaries";
import TopBar from "../components/TopBar";
import SummaryCard from "../components/SummaryCard";

const LIMIT = 10;

export default function RepoDetailPage() {
  const { repoId } = useParams();
  const [summaries, setSummaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchSummaries({ repoId, limit: LIMIT, page })
      .then((d) => { setSummaries(d.summaries); setTotal(d.total); })
      .finally(() => setLoading(false));
  }, [repoId, page]);

  const repoName = summaries[0]?.repo_id?.full_name;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title={repoName || "Repository"}
        subtitle={`${total} summaries`}
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
            <p className="text-xs text-gh-muted">Push a commit to this repository to generate a summary.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {summaries.map(s => <SummaryCard key={s._id} summary={s} />)}
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
    </div>
  );
}
