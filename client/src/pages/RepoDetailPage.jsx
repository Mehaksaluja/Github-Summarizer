import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Folder } from "lucide-react";
import { fetchSummaries } from "../api/summaries";
import SummaryCard from "../components/SummaryCard";

export default function RepoDetailPage() {
  const { repoId } = useParams();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const LIMIT = 10;

  useEffect(() => {
    setLoading(true);
    fetchSummaries({ repoId, limit: LIMIT, page })
      .then((data) => {
        setSummaries(data.summaries);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [repoId, page]);

  const repoName = summaries[0]?.repo_id?.full_name;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-indigo-500" />
          <h1 className="text-lg font-semibold text-gray-900">
            {repoName ?? "Repository"}
          </h1>
        </div>
        <span className="text-xs text-gray-400">{total} summaries</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : summaries.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No summaries for this repo yet.</p>
          <p className="text-gray-400 text-xs mt-1">Push a commit to generate the first summary.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {summaries.map((s) => (
              <SummaryCard key={s._id} summary={s} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
