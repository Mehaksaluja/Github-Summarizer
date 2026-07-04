import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderGit2, Plus, Lock, Globe, ArrowRight, GitBranch, Trash2 } from "lucide-react";
import { fetchRepos } from "../api/repos";
import TopBar from "../components/TopBar";
import AddRepoModal from "../components/AddRepoModal";

export default function RepositoriesPage() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRepos().then(setRepos).finally(() => setLoading(false));
  }, []);

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
            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_100px_80px] gap-4 px-4 pb-2 mb-1">
              <span className="text-xs text-gh-subtle font-medium">Repository</span>
              <span className="text-xs text-gh-subtle font-medium">Visibility</span>
              <span className="text-xs text-gh-subtle font-medium">Branch</span>
              <span className="text-xs text-gh-subtle font-medium text-right">Actions</span>
            </div>

            <div className="space-y-2">
              {repos.map(repo => (
                <div
                  key={repo._id}
                  className="bg-gh-surface border border-gh-border rounded-xl px-4 py-3.5 grid grid-cols-[1fr_100px_100px_80px] gap-4 items-center hover:border-gh-muted transition-all group"
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

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/app/repos/${repo._id}`}
                      className="p-1.5 rounded-md text-gh-subtle hover:text-gh-fg hover:bg-gh-inset transition-all"
                      title="View summaries"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
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
        Add a GitHub repository to start receiving AI-generated summaries.
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
