import { useEffect, useState } from "react";
import { Plus, Folder, GitCommit, Sparkles, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { fetchRepos } from "../api/repos";
import { fetchSummaries } from "../api/summaries";
import AddRepoModal from "../components/AddRepoModal";
import SummaryCard from "../components/SummaryCard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [repos, setRepos] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [totalSummaries, setTotalSummaries] = useState(0);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .finally(() => setLoadingRepos(false));

    fetchSummaries({ limit: 10 })
      .then((data) => {
        setSummaries(data.summaries);
        setTotalSummaries(data.total);
      })
      .finally(() => setLoadingSummaries(false));
  }, []);

  const totalCommits = summaries.reduce((acc, s) => acc + (s.stats?.total_commits ?? 0), 0);
  const greeting = getGreeting();
  const firstName = user?.display_name?.split(" ")[0] || user?.username || "there";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.org?.name && <span className="font-medium text-gray-700">{user.org.name}</span>}
            {user?.org?.name && " · "}
            Here's your GitHub activity at a glance.
          </p>
        </div>

        {/* Stats strip */}
        <div className="max-w-6xl mx-auto px-6 pb-5 grid grid-cols-3 gap-4 sm:flex sm:gap-8">
          <StatPill
            icon={<Folder className="w-4 h-4 text-indigo-500" />}
            label="Repos"
            value={loadingRepos ? "—" : repos.length}
          />
          <StatPill
            icon={<Sparkles className="w-4 h-4 text-purple-500" />}
            label="Summaries"
            value={loadingSummaries ? "—" : totalSummaries}
          />
          <StatPill
            icon={<GitCommit className="w-4 h-4 text-emerald-500" />}
            label="Commits tracked"
            value={loadingSummaries ? "—" : totalCommits}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left — Repos */}
        <aside className="lg:w-72 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Repositories
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {loadingRepos ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : repos.length === 0 ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
            >
              <Plus className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 mx-auto mb-1 transition-colors" />
              <p className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors font-medium">
                Add your first repo
              </p>
            </button>
          ) : (
            <div className="space-y-2">
              {repos.map((repo) => (
                <Link
                  key={repo._id}
                  to={`/repos/${repo._id}`}
                  className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-indigo-200 hover:shadow-sm transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Folder className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{repo.name}</p>
                    <p className="text-xs text-gray-400 truncate">{repo.full_name}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </aside>

        {/* Right — Summaries feed */}
        <main className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Recent Summaries
            </h2>
            {totalSummaries > 10 && (
              <span className="text-xs text-gray-400">{totalSummaries} total</span>
            )}
          </div>

          {loadingSummaries ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-white rounded-xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : summaries.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No summaries yet</p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Push a commit to a registered repository and your first AI summary will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {summaries.map((s) => (
                <SummaryCard key={s._id} summary={s} />
              ))}
            </div>
          )}
        </main>
      </div>

      {showAddModal && (
        <AddRepoModal
          onClose={() => setShowAddModal(false)}
          onAdded={(repo) => setRepos((prev) => [...prev, repo])}
        />
      )}
    </div>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-base font-semibold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
