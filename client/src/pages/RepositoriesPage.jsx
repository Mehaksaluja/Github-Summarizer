import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderGit2, Plus, Lock, Globe, ArrowRight, GitBranch, Trash2, Webhook, AlertTriangle } from "lucide-react";
import { fetchRepos, removeRepo } from "../api/repos";
import TopBar from "../components/TopBar";
import AddRepoModal from "../components/AddRepoModal";
import { useToast } from "../hooks/useToast";

export default function RepositoriesPage() {
  const { showToast } = useToast();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRepos().then(setRepos).finally(() => setLoading(false));
  }, []);

  async function handleRemove(repo) {
    if (!confirm(`Remove "${repo.name}" from GitPulse? This will also delete the GitHub webhook for this repo.`)) return;
    setRemoving(repo._id);
    try {
      await removeRepo(repo._id);
      setRepos(prev => prev.filter(r => r._id !== repo._id));
      showToast(`${repo.name} removed`, "success");
    } catch (err) {
      showToast(err.message || "Failed to remove repo", "error");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title="Repositories"
        subtitle={`${repos.length} repo${repos.length !== 1 ? "s" : ""} connected`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-gh-accent hover:bg-gh-accent-em text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Repository
          </button>
        }
      />

      <div className="flex-1 p-6 max-w-5xl w-full mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-gh-surface border border-gh-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : repos.length === 0 ? (
          <EmptyRepos onAdd={() => setShowModal(true)} />
        ) : (
          <>
            <div className="grid grid-cols-[1fr_100px_100px_120px_80px] gap-4 px-4 pb-2 mb-1">
              <span className="text-xs text-gh-subtle font-medium">Repository</span>
              <span className="text-xs text-gh-subtle font-medium">Visibility</span>
              <span className="text-xs text-gh-subtle font-medium">Branch</span>
              <span className="text-xs text-gh-subtle font-medium">Webhook</span>
              <span className="text-xs text-gh-subtle font-medium text-right">Actions</span>
            </div>

            <div className="space-y-2">
              {repos.map(repo => (
                <div
                  key={repo._id}
                  className="bg-gh-surface border border-gh-border rounded-xl px-4 py-3.5 grid grid-cols-[1fr_100px_100px_120px_80px] gap-4 items-center hover:border-gh-muted transition-all group"
                >
                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gh-inset border border-gh-border flex items-center justify-center shrink-0">
                      <FolderGit2 className="w-4 h-4 text-gh-muted" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/app/repos/${repo._id}`}
                        className="text-sm font-semibold text-gh-fg hover:text-gh-accent transition-colors truncate block"
                      >
                        {repo.name}
                      </Link>
                      <p className="text-xs text-gh-subtle font-mono truncate">{repo.full_name}</p>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center gap-1.5">
                    {repo.private ? (
                      <>
                        <Lock className="w-3 h-3 text-gh-yellow" />
                        <span className="text-xs text-gh-muted">Private</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 text-gh-green" />
                        <span className="text-xs text-gh-muted">Public</span>
                      </>
                    )}
                  </div>

                  {/* Branch */}
                  <div className="flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3 text-gh-subtle" />
                    <span className="text-xs text-gh-muted font-mono truncate">{repo.default_branch || "main"}</span>
                  </div>

                  {/* Webhook status */}
                  <div className="flex items-center gap-1.5">
                    {repo.webhook_id ? (
                      <>
                        <Webhook className="w-3 h-3 text-gh-green" />
                        <span className="text-xs text-gh-green">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-gh-yellow" />
                        <span className="text-xs text-gh-yellow">Manual setup</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/app/repos/${repo._id}`}
                      className="p-1.5 rounded-md text-gh-subtle hover:text-gh-fg hover:bg-gh-inset transition-all"
                      title="View summaries"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleRemove(repo)}
                      disabled={removing === repo._id}
                      title="Remove repository"
                      className="p-1.5 rounded-md text-gh-subtle hover:text-gh-red hover:bg-gh-red/5 transition-all disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {repos.some(r => !r.webhook_id) && (
              <div className="mt-4 flex items-start gap-3 bg-gh-yellow/5 border border-gh-yellow/20 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-gh-yellow shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gh-yellow mb-0.5">Webhook not auto-configured</p>
                  <p className="text-xs text-gh-muted">
                    Set <code className="font-mono bg-gh-inset px-1 rounded">SERVER_URL</code> in your <code className="font-mono bg-gh-inset px-1 rounded">.env</code> to your public server URL (e.g. ngrok URL) so GitPulse can auto-register webhooks when you add a repo. For now, go to your repo's GitHub Settings → Webhooks and add <code className="font-mono bg-gh-inset px-1 rounded">SERVER_URL/webhooks/github</code> manually.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <AddRepoModal
          onClose={() => setShowModal(false)}
          onAdded={(r) => setRepos(p => [...p, r])}
        />
      )}
    </div>
  );
}

function EmptyRepos({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-gh-inset border border-gh-border flex items-center justify-center mb-4">
        <FolderGit2 className="w-7 h-7 text-gh-subtle" />
      </div>
      <h3 className="text-base font-semibold text-gh-fg mb-1">No repositories yet</h3>
      <p className="text-sm text-gh-muted mb-6 text-center max-w-sm">
        Add a GitHub repository to start receiving AI-generated summaries on every push.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-gh-accent hover:bg-gh-accent-em text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Add your first repository
      </button>
    </div>
  );
}
