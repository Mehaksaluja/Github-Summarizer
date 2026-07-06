import { useEffect, useState } from "react";
import { BarChart2, GitCommit, GitMerge, Zap, Bug, TrendingUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { fetchAnalytics } from "../api/analytics";
import { fetchRepos } from "../api/repos";
import TopBar from "../components/TopBar";

const DAY_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [repos, setRepos] = useState([]);
  const [days, setDays] = useState(30);
  const [repoId, setRepoId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepos().then(setRepos).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics({ days, repoId: repoId || undefined })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days, repoId]);

  const totals = data?.totals ?? {};
  const commitsByDay = data?.commits_by_day ?? [];
  const byRepo = data?.by_repo ?? [];

  const maxCommits = Math.max(...commitsByDay.map((d) => d.commits), 1);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar title="Analytics" subtitle={`Last ${days} days`} />

      <div className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-gh-surface border border-gh-border rounded-lg overflow-hidden">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === opt.value
                    ? "bg-gh-accent text-white"
                    : "text-gh-muted hover:text-gh-fg hover:bg-gh-inset"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={repoId}
            onChange={(e) => setRepoId(e.target.value)}
            className="bg-gh-surface border border-gh-border text-gh-fg text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-gh-accent transition-colors cursor-pointer"
          >
            <option value="">All repositories</option>
            {repos.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gh-surface border border-gh-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<GitCommit className="w-4 h-4 text-gh-accent" />} bg="bg-gh-accent/10 border-gh-accent/20" label="Total Commits" value={totals.total_commits ?? 0} />
              <StatCard icon={<Zap className="w-4 h-4 text-gh-green" />} bg="bg-gh-green/10 border-gh-green/20" label="Features" value={totals.total_features ?? 0} />
              <StatCard icon={<Bug className="w-4 h-4 text-gh-red" />} bg="bg-gh-red/10 border-gh-red/20" label="Bug Fixes" value={totals.total_bug_fixes ?? 0} />
              <StatCard icon={<GitMerge className="w-4 h-4 text-gh-yellow" />} bg="bg-gh-yellow/10 border-gh-yellow/20" label="PRs Merged" value={totals.total_prs ?? 0} />
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              {/* Commits chart */}
              <div className="bg-gh-surface border border-gh-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-gh-muted" />
                  <h2 className="text-sm font-semibold text-gh-fg">Commit Activity</h2>
                </div>

                {commitsByDay.every((d) => d.commits === 0) ? (
                  <div className="flex items-center justify-center h-32 text-xs text-gh-subtle">
                    No commit data for this period
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Bar chart */}
                    <div className="flex items-end gap-px h-28">
                      {commitsByDay.map((d) => {
                        const pct = maxCommits > 0 ? (d.commits / maxCommits) * 100 : 0;
                        return (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="w-full relative">
                              <div
                                style={{ height: `${Math.max(pct, 2)}%`, minHeight: d.commits > 0 ? "4px" : "2px" }}
                                className={`w-full rounded-t transition-colors ${
                                  d.commits > 0 ? "bg-gh-accent/60 group-hover:bg-gh-accent" : "bg-gh-border"
                                }`}
                              />
                              {/* Tooltip */}
                              {d.commits > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  <div className="bg-gh-fg text-gh-canvas text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                    {d.commits} commits · {d.date.slice(5)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* X-axis labels — show every ~7th */}
                    <div className="flex justify-between text-[9px] text-gh-subtle mt-1 px-px">
                      {commitsByDay
                        .filter((_, i) => i === 0 || i === Math.floor(commitsByDay.length / 2) || i === commitsByDay.length - 1)
                        .map((d) => (
                          <span key={d.date}>{d.date.slice(5)}</span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Breakdown legend */}
                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gh-line flex-wrap">
                  <LegendItem color="bg-gh-green" label="Features" value={totals.total_features ?? 0} />
                  <LegendItem color="bg-gh-red" label="Bug Fixes" value={totals.total_bug_fixes ?? 0} />
                  <LegendItem color="bg-gh-muted" label="Chores" value={totals.total_chores ?? 0} />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-5">
                {/* Feedback quality */}
                <div className="bg-gh-surface border border-gh-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-gh-fg mb-4">Summary Quality</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gh-green/10 border border-gh-green/20 flex items-center justify-center">
                        <ThumbsUp className="w-3.5 h-3.5 text-gh-green" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gh-fg tabular-nums">{totals.up_votes ?? 0}</p>
                        <p className="text-[10px] text-gh-subtle">Helpful</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gh-red/10 border border-gh-red/20 flex items-center justify-center">
                        <ThumbsDown className="w-3.5 h-3.5 text-gh-red" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gh-fg tabular-nums">{totals.down_votes ?? 0}</p>
                        <p className="text-[10px] text-gh-subtle">Needs work</p>
                      </div>
                    </div>
                  </div>
                  {(totals.up_votes > 0 || totals.down_votes > 0) && (
                    <div className="mt-3 h-1.5 rounded-full bg-gh-border overflow-hidden">
                      <div
                        className="h-full bg-gh-green rounded-full transition-all"
                        style={{
                          width: `${((totals.up_votes ?? 0) / ((totals.up_votes ?? 0) + (totals.down_votes ?? 0))) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Top repos */}
                <div className="bg-gh-surface border border-gh-border rounded-2xl p-5">
                  <h2 className="text-sm font-semibold text-gh-fg mb-4">Top Repositories</h2>
                  {byRepo.length === 0 ? (
                    <p className="text-xs text-gh-subtle">No activity yet</p>
                  ) : (
                    <div className="space-y-3">
                      {byRepo.map((r) => {
                        const maxR = byRepo[0]?.commits ?? 1;
                        return (
                          <div key={r.full_name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gh-fg truncate max-w-[160px]">{r.name}</span>
                              <span className="text-xs text-gh-subtle tabular-nums">{r.commits} commits</span>
                            </div>
                            <div className="h-1 rounded-full bg-gh-border overflow-hidden">
                              <div
                                className="h-full bg-gh-accent rounded-full"
                                style={{ width: `${(r.commits / maxR) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Summaries count */}
                <div className="bg-gh-surface border border-gh-border rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gh-fg tabular-nums">{totals.total_summaries ?? 0}</p>
                      <p className="text-xs text-gh-subtle mt-0.5">AI summaries generated</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gh-accent/10 border border-gh-accent/20 flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-gh-accent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value }) {
  return (
    <div className="bg-gh-surface border border-gh-border rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${bg}`}>{icon}</div>
      <p className="text-2xl font-bold text-gh-fg tabular-nums">{value}</p>
      <p className="text-xs text-gh-subtle mt-0.5">{label}</p>
    </div>
  );
}

function LegendItem({ color, label, value }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-gh-subtle">{label}</span>
      <span className="text-xs font-semibold text-gh-muted tabular-nums">{value}</span>
    </div>
  );
}
