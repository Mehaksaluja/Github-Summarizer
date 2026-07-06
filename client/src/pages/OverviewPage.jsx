import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FolderGit2, ScrollText, GitCommit, GitMerge, ArrowRight, Plus, Sparkles, BarChart2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { fetchRepos } from "../api/repos";
import { fetchSummaries } from "../api/summaries";
import TopBar from "../components/TopBar";
import SummaryCard from "../components/SummaryCard";
import AddRepoModal from "../components/AddRepoModal";
import GenerateReportModal from "../components/GenerateReportModal";

export default function OverviewPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [repos, setRepos] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const lastChecked = useRef(new Date().toISOString());

  useEffect(() => {
    fetchRepos().then(setRepos).finally(() => setLoadingRepos(false));
    fetchSummaries({ limit: 5 })
      .then((d) => { setSummaries(d.summaries); setTotal(d.total); })
      .finally(() => setLoadingSummaries(false));

    // Poll for new summaries every 30s — show toast when one arrives
    const poll = setInterval(async () => {
      try {
        const since = lastChecked.current;
        lastChecked.current = new Date().toISOString();
        const { summaries: fresh } = await fetchSummaries({ limit: 5, since });
        if (fresh.length > 0) {
          fresh.forEach((s) => {
            showToast(`New summary ready: ${s.repo_id?.name ?? "repo"} — ${s.date}`, "summary");
          });
          // Refresh the visible list
          fetchSummaries({ limit: 5 }).then((d) => {
            setSummaries(d.summaries);
            setTotal(d.total);
          });
        }
      } catch { /* ignore poll errors */ }
    }, 30000);

    return () => clearInterval(poll);
  }, [showToast]);

  const totalCommits = summaries.reduce((a, s) => a + (s.stats?.total_commits ?? 0), 0);
  const totalPRs     = summaries.reduce((a, s) => a + (s.stats?.prs_merged ?? 0), 0);
  const greeting     = getGreeting();
  const firstName    = user?.display_name?.split(" ")[0] || user?.username || "there";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title={`${greeting}, ${firstName} 👋`}
        subtitle={user?.org?.name}
        actions={
          <>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 bg-gh-surface border border-gh-border hover:border-gh-muted text-gh-fg text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Generate Report
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-gh-accent hover:bg-gh-accent-em text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Repo
            </button>
          </>
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<FolderGit2 className="w-4 h-4 text-gh-accent" />} bg="bg-gh-accent/10 border-gh-accent/20" label="Repositories" value={loadingRepos ? "—" : repos.length} to="/app/repos" />
          <StatCard icon={<ScrollText className="w-4 h-4 text-gh-blue" />}  bg="bg-gh-blue/10 border-gh-blue/20"   label="Summaries"    value={loadingSummaries ? "—" : total} to="/app/summaries" />
          <StatCard icon={<GitCommit className="w-4 h-4 text-gh-green" />}  bg="bg-gh-green/10 border-gh-green/20" label="Commits"      value={loadingSummaries ? "—" : totalCommits} to="/app/analytics" />
          <StatCard icon={<GitMerge className="w-4 h-4 text-gh-yellow" />}  bg="bg-gh-yellow/10 border-gh-yellow/20" label="PRs tracked" value={loadingSummaries ? "—" : totalPRs} to="/app/analytics" />
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Recent summaries */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gh-muted uppercase tracking-wider">Recent Summaries</h2>
              <Link to="/app/summaries" className="flex items-center gap-1 text-xs text-gh-accent hover:text-gh-accent-em transition-colors font-medium">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingSummaries ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : summaries.length === 0 ? (
              <EmptySummaries onAddRepo={() => setShowModal(true)} />
            ) : (
              <div className="space-y-3">
                {summaries.map(s => (
                  <SummaryCard
                    key={s._id}
                    summary={s}
                    onArchived={(id) => setSummaries((prev) => prev.filter((x) => x._id !== id))}
                    onDeleted={(id) => setSummaries((prev) => prev.filter((x) => x._id !== id))}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Repositories */}
          <aside>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gh-muted uppercase tracking-wider">Repositories</h2>
              <Link to="/app/repos" className="flex items-center gap-1 text-xs text-gh-accent hover:text-gh-accent-em transition-colors font-medium">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingRepos ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-gh-surface rounded-xl animate-pulse" />)}
              </div>
            ) : repos.length === 0 ? (
              <button
                onClick={() => setShowModal(true)}
                className="w-full border-2 border-dashed border-gh-border rounded-xl p-6 text-center hover:border-gh-accent/40 transition-colors group"
              >
                <Plus className="w-5 h-5 text-gh-subtle group-hover:text-gh-accent mx-auto mb-1.5 transition-colors" />
                <p className="text-xs text-gh-subtle group-hover:text-gh-muted transition-colors font-medium">Add first repo</p>
              </button>
            ) : (
              <div className="space-y-2">
                {repos.slice(0, 6).map(repo => (
                  <Link
                    key={repo._id}
                    to={`/app/repos/${repo._id}`}
                    className="flex items-center gap-3 bg-gh-surface border border-gh-border rounded-xl px-4 py-3 hover:border-gh-muted hover:bg-gh-inset transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gh-inset border border-gh-border flex items-center justify-center shrink-0">
                      <FolderGit2 className="w-3.5 h-3.5 text-gh-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gh-fg truncate">{repo.name}</p>
                      <p className="text-[10px] text-gh-subtle truncate font-mono">{repo.full_name}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gh-border group-hover:text-gh-accent transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>

      {showModal && (
        <AddRepoModal
          onClose={() => setShowModal(false)}
          onAdded={(r) => setRepos(p => [...p, r])}
        />
      )}

      {showReportModal && (
        <GenerateReportModal
          onClose={() => setShowReportModal(false)}
          onGenerated={(s) => setSummaries(prev => [s, ...prev.slice(0, 4)])}
        />
      )}
    </div>
  );
}

function StatCard({ icon, bg, label, value, to }) {
  return (
    <Link
      to={to}
      className="block bg-gh-surface border border-gh-border rounded-xl p-4 hover:border-gh-muted hover:bg-gh-inset transition-all group"
    >
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${bg}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gh-fg tabular-nums group-hover:text-gh-accent transition-colors">{value}</p>
      <p className="text-xs text-gh-subtle mt-0.5">{label}</p>
    </Link>
  );
}

function SkeletonCard() {
  return <div className="h-28 bg-gh-surface border border-gh-border rounded-xl animate-pulse" />;
}

function EmptySummaries({ onAddRepo }) {
  return (
    <div className="bg-gh-surface border border-gh-border rounded-xl p-10 text-center">
      <div className="w-10 h-10 rounded-xl bg-gh-accent/10 border border-gh-accent/20 flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-5 h-5 text-gh-accent" />
      </div>
      <p className="text-sm font-semibold text-gh-fg mb-1">No summaries yet</p>
      <p className="text-xs text-gh-muted max-w-xs mx-auto mb-4">
        Push a commit to a registered repository and your first AI summary will appear here.
      </p>
      <button
        onClick={onAddRepo}
        className="text-xs text-gh-accent hover:text-gh-accent-em font-semibold underline transition-colors"
      >
        Add a repository to get started
      </button>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
