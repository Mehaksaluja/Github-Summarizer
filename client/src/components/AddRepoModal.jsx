import { useState, useEffect, useRef } from "react";
import { X, Search, Lock, Globe, Check, GitFork, AlertCircle, Loader2 } from "lucide-react";
import { fetchGitHubRepos, fetchRepos, registerRepo } from "../api/repos";

export default function AddRepoModal({ onClose, onAdded }) {
  const [githubRepos, setGithubRepos] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const searchRef = useRef(null);

  // Fetch both GitHub repos and already-registered repos in parallel
  useEffect(() => {
    Promise.all([fetchGitHubRepos(), fetchRepos()])
      .then(([ghRepos, existing]) => {
        setGithubRepos(ghRepos);
        setRegisteredIds(new Set(existing.map((r) => r.github_repo_id)));
      })
      .catch(() => setError("Could not load your GitHub repositories. Check your connection."))
      .finally(() => setLoading(false));

    // Auto-focus search after repos load
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  const filtered = githubRepos.filter((r) =>
    r.full_name.toLowerCase().includes(query.toLowerCase()) ||
    (r.description || "").toLowerCase().includes(query.toLowerCase())
  );

  async function handleAdd() {
    if (!selected) return;
    setAdding(true);
    setError("");
    try {
      const { repo } = await registerRepo(selected.full_name);
      onAdded(repo);
      onClose();
    } catch (err) {
      setError(err.message);
      setAdding(false);
    }
  }

  // Group by owner
  const owners = [...new Set(filtered.map((r) => r.owner))];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gh-surface border border-gh-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: "80vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gh-line shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gh-accent/10 border border-gh-accent/20 flex items-center justify-center">
              <GitFork className="w-3.5 h-3.5 text-gh-accent" />
            </div>
            <h2 className="text-sm font-semibold text-gh-fg">Add Repository</h2>
          </div>
          <button onClick={onClose} className="text-gh-subtle hover:text-gh-fg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gh-line shrink-0">
          <div className="flex items-center gap-2.5 bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 focus-within:border-gh-accent focus-within:ring-1 focus-within:ring-gh-accent/20 transition-all">
            <Search className="w-3.5 h-3.5 text-gh-subtle shrink-0" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search your repositories…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gh-fg placeholder-gh-subtle focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-gh-subtle hover:text-gh-fg transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Repo list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-gh-accent animate-spin" />
              <p className="text-xs text-gh-muted">Loading your GitHub repositories…</p>
            </div>
          ) : error && githubRepos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 px-6 text-center">
              <AlertCircle className="w-6 h-6 text-gh-red" />
              <p className="text-sm text-gh-fg">Failed to load repositories</p>
              <p className="text-xs text-gh-muted">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Search className="w-5 h-5 text-gh-subtle" />
              <p className="text-sm text-gh-muted">No repositories match "{query}"</p>
            </div>
          ) : (
            owners.map((owner) => {
              const ownerRepos = filtered.filter((r) => r.owner === owner);
              const ownerAvatar = ownerRepos[0]?.owner_avatar;
              return (
                <div key={owner}>
                  {/* Owner header */}
                  <div className="flex items-center gap-2 px-4 py-1.5 sticky top-0 bg-gh-surface/95 backdrop-blur-sm">
                    {ownerAvatar && (
                      <img src={ownerAvatar} alt="" className="w-4 h-4 rounded-full" />
                    )}
                    <span className="text-xs font-semibold text-gh-muted">{owner}</span>
                  </div>

                  {ownerRepos.map((repo) => {
                    const alreadyAdded = registeredIds.has(repo.id);
                    const isSelected = selected?.id === repo.id;

                    return (
                      <button
                        key={repo.id}
                        onClick={() => !alreadyAdded && setSelected(isSelected ? null : repo)}
                        disabled={alreadyAdded}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          alreadyAdded
                            ? "opacity-40 cursor-not-allowed"
                            : isSelected
                            ? "bg-gh-accent/8"
                            : "hover:bg-gh-inset"
                        }`}
                      >
                        {/* Selection indicator */}
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          alreadyAdded
                            ? "border-gh-green bg-gh-green"
                            : isSelected
                            ? "border-gh-accent bg-gh-accent"
                            : "border-gh-border"
                        }`}>
                          {(alreadyAdded || isSelected) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>

                        {/* Repo info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gh-fg truncate">{repo.name}</span>
                            {repo.private ? (
                              <Lock className="w-3 h-3 text-gh-yellow shrink-0" />
                            ) : (
                              <Globe className="w-3 h-3 text-gh-green shrink-0" />
                            )}
                            {alreadyAdded && (
                              <span className="text-[10px] text-gh-green bg-gh-green/10 border border-gh-green/20 px-1.5 py-0.5 rounded-full shrink-0">
                                Added
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-gh-subtle truncate mt-0.5">{repo.description}</p>
                          )}
                        </div>

                        {/* Default branch */}
                        <span className="text-[10px] text-gh-subtle font-mono shrink-0">{repo.default_branch}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gh-line shrink-0">
          {error && githubRepos.length > 0 && (
            <p className="text-xs text-gh-red mb-3">{error}</p>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gh-subtle truncate">
              {selected
                ? <span>Selected: <span className="text-gh-fg font-mono font-medium">{selected.full_name}</span></span>
                : `${filtered.length} repositories available`
              }
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gh-muted hover:text-gh-fg bg-gh-inset hover:bg-gh-border border border-gh-border rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!selected || adding}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gh-accent hover:bg-gh-accent-em text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {adding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {adding ? "Adding…" : "Add Repository"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
