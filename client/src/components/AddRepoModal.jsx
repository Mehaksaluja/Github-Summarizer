import { useState } from "react";
import { X, GitFork } from "lucide-react";
import { registerRepo } from "../api/repos";

export default function AddRepoModal({ onClose, onAdded }) {
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { repo } = await registerRepo(fullName.trim());
      onAdded(repo);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gh-surface border border-gh-border rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gh-line">
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gh-muted mb-1.5">
              GitHub repository
            </label>
            <input
              type="text"
              placeholder="owner/repo-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2.5 text-sm text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors font-mono"
              required
              autoFocus
            />
            <p className="mt-1.5 text-[11px] text-gh-subtle">
              Enter the full repository path, e.g. <code className="text-gh-accent font-mono">octocat/hello-world</code>
            </p>
          </div>

          {error && (
            <div className="bg-gh-red/10 border border-gh-red/20 rounded-lg px-3 py-2 text-sm text-gh-red">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gh-muted hover:text-gh-fg bg-gh-inset hover:bg-gh-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="px-4 py-2 text-sm font-semibold bg-gh-accent hover:bg-gh-accent-em text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Adding…" : "Add Repository"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
