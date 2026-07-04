import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchSummary } from "../api/summaries";
import SummaryCard from "../components/SummaryCard";

export default function SummaryDetailPage() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSummary(id)
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/dashboard"
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {loading && (
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      )}

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {summary && <SummaryCard summary={summary} expanded />}
    </div>
  );
}
