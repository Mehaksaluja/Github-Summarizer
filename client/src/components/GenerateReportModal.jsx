import { useState, useEffect } from "react";
import { X, Loader2, BarChart2, Calendar, Clock, User, ChevronRight } from "lucide-react";
import { fetchRepos } from "../api/repos";
import { generateReport } from "../api/reports";

const TYPES = [
  {
    id: "daily",
    label: "Daily Report",
    desc: "Last 24 hours of commits",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    id: "weekly",
    label: "Weekly Report",
    desc: "Last 7 days of commits",
    icon: <Calendar className="w-4 h-4" />,
  },
  {
    id: "custom",
    label: "Custom Range",
    desc: "Pick any date range up to 90 days",
    icon: <BarChart2 className="w-4 h-4" />,
  },
];

// Default custom range: last 3 days
function defaultSince() {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}
function defaultUntil() {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export default function GenerateReportModal({ onClose, onGenerated, preSelectedRepoId = null }) {
  const [repos, setRepos] = useState([]);
  const [repoId, setRepoId] = useState(preSelectedRepoId ?? "");
  const [type, setType] = useState("daily");
  const [since, setSince] = useState(defaultSince);
  const [until, setUntil] = useState(defaultUntil);
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRepos().then((r) => {
      setRepos(r);
      if (!preSelectedRepoId && r.length > 0) setRepoId(r[0]._id);
    });
  }, [preSelectedRepoId]);

  async function handleGenerate() {
    if (!repoId) { setError("Select a repository first."); return; }
    if (type === "custom" && !since) { setError("Start date is required."); return; }
    if (type === "custom" && !until) { setError("End date is required."); return; }
    if (type === "custom" && new Date(since) >= new Date(until)) {
      setError("Start must be before end date.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const summary = await generateReport({
        repoId,
        type,
        since: type === "custom" ? new Date(since).toISOString() : undefined,
        until: type === "custom" ? new Date(until).toISOString() : undefined,
        author: author.trim() || undefined,
      });
      onGenerated?.(summary);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gh-surface border border-gh-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gh-border">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gh-accent" />
            <h2 className="text-sm font-semibold text-gh-fg">Generate Report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gh-subtle hover:text-gh-fg hover:bg-gh-inset transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Repo selector */}
          {!preSelectedRepoId && repos.length === 0 && (
            <div className="px-3 py-3 bg-gh-yellow/5 border border-gh-yellow/20 rounded-lg text-xs text-gh-yellow">
              No repositories added yet.{" "}
              <a href="/app/repos" className="underline font-semibold hover:text-gh-fg transition-colors">
                Add one first
              </a>{" "}
              to generate a report.
            </div>
          )}

          {!preSelectedRepoId && repos.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gh-muted mb-1.5">Repository</label>
              <select
                value={repoId}
                onChange={(e) => setRepoId(e.target.value)}
                className="w-full bg-gh-inset border border-gh-border text-gh-fg text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gh-accent transition-colors"
              >
                {repos.map((r) => (
                  <option key={r._id} value={r._id}>{r.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {preSelectedRepoId && repos.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gh-inset border border-gh-border rounded-lg">
              <span className="text-xs text-gh-muted">Repo:</span>
              <span className="text-xs font-mono text-gh-fg">
                {repos.find((r) => r._id === preSelectedRepoId)?.full_name ?? preSelectedRepoId}
              </span>
            </div>
          )}

          {/* Report type */}
          <div>
            <label className="block text-xs font-medium text-gh-muted mb-2">Report Type</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                    type === t.id
                      ? "border-gh-accent bg-gh-accent/10 text-gh-accent"
                      : "border-gh-border bg-gh-inset text-gh-muted hover:border-gh-muted hover:text-gh-fg"
                  }`}
                >
                  {t.icon}
                  <span className="text-xs font-semibold leading-none">{t.label}</span>
                  <span className="text-[10px] leading-tight opacity-70">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          {type === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gh-muted mb-1.5">From</label>
                <input
                  type="datetime-local"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  className="w-full bg-gh-inset border border-gh-border text-gh-fg text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gh-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gh-muted mb-1.5">To</label>
                <input
                  type="datetime-local"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className="w-full bg-gh-inset border border-gh-border text-gh-fg text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gh-accent transition-colors"
                />
              </div>
            </div>
          )}

          {/* Author filter */}
          <div>
            <label className="block text-xs font-medium text-gh-muted mb-1.5">
              Filter by Author <span className="text-gh-subtle font-normal">(optional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gh-subtle" />
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. John Smith or john@company.com"
                className="w-full bg-gh-inset border border-gh-border text-gh-fg text-sm rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-gh-accent transition-colors placeholder:text-gh-subtle"
              />
            </div>
            <p className="text-[10px] text-gh-subtle mt-1">Leave blank to include all contributors</p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 bg-gh-red/10 border border-gh-red/20 rounded-lg text-xs text-gh-red">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gh-border flex items-center justify-between">
          <p className="text-[10px] text-gh-subtle">
            AI-generated · up to 50 commits analyzed
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-gh-muted hover:text-gh-fg border border-gh-border rounded-lg hover:border-gh-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !repoId}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gh-accent hover:bg-gh-accent-em text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
