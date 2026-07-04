import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, MessageSquare, FileText, BarChart3, Check, ArrowRight } from "lucide-react";
import { registerRepo } from "../api/repos";

const USE_CASES = [
  {
    id: "standup",
    icon: <MessageSquare className="w-6 h-6" />,
    color: "text-gh-blue bg-gh-blue/10 border-gh-blue/30",
    title: "Async Standup Bot",
    desc: "Replace daily standups. Get a morning summary of what shipped, what's in progress, and what's blocked.",
  },
  {
    id: "client_report",
    icon: <FileText className="w-6 h-6" />,
    color: "text-gh-accent bg-gh-accent/10 border-gh-accent/30",
    title: "Client Report",
    desc: "Translate commits into plain-English updates for clients. Perfect for agencies and freelancers.",
  },
  {
    id: "executive_dashboard",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "text-gh-green bg-gh-green/10 border-gh-green/30",
    title: "Executive Dashboard",
    desc: "Give non-technical founders visibility. Features, bug fixes, and chores — categorized automatically.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1); // 1 = use case, 2 = add repo, 3 = done
  const [selectedUseCase, setSelectedUseCase] = useState(null);
  const [repoName, setRepoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleAddRepo() {
    if (!repoName.trim()) return;
    setError("");
    setLoading(true);
    try {
      await registerRepo(repoName.trim());
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gh-canvas flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-8 h-8 rounded-xl bg-gh-accent flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gh-fg">GitPulse</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? "w-8 bg-gh-accent" : s < step ? "w-4 bg-gh-accent/40" : "w-4 bg-gh-border"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Pick use case */}
        {step === 1 && (
          <div className="anim-fade-up">
            <h1 className="text-2xl font-bold text-gh-fg text-center mb-2">What are you building this for?</h1>
            <p className="text-sm text-gh-muted text-center mb-8">We'll tune your summaries to the right audience.</p>

            <div className="space-y-3">
              {USE_CASES.map((uc) => (
                <button
                  key={uc.id}
                  onClick={() => setSelectedUseCase(uc.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                    selectedUseCase === uc.id
                      ? "bg-gh-accent/5 border-gh-accent/50"
                      : "bg-gh-surface border-gh-border hover:border-gh-muted"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${uc.color}`}>
                    {uc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gh-fg mb-0.5">{uc.title}</p>
                    <p className="text-xs text-gh-muted leading-snug">{uc.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    selectedUseCase === uc.id ? "border-gh-accent bg-gh-accent" : "border-gh-border"
                  }`}>
                    {selectedUseCase === uc.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!selectedUseCase}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gh-accent hover:bg-gh-accent-em text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Add repo */}
        {step === 2 && (
          <div className="anim-fade-up">
            <h1 className="text-2xl font-bold text-gh-fg text-center mb-2">Add your first repository</h1>
            <p className="text-sm text-gh-muted text-center mb-8">
              We'll start watching it immediately. You can add more later.
            </p>

            <div className="bg-gh-surface border border-gh-border rounded-2xl p-6">
              <label className="block text-xs font-medium text-gh-muted mb-1.5">
                GitHub repository
              </label>
              <input
                type="text"
                placeholder="owner/repo-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRepo()}
                className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2.5 text-sm text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors font-mono mb-4"
                autoFocus
              />

              {error && (
                <div className="bg-gh-red/10 border border-gh-red/20 rounded-lg px-3 py-2 text-xs text-gh-red mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleAddRepo}
                disabled={loading || !repoName.trim()}
                className="w-full bg-gh-accent hover:bg-gh-accent-em text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {loading ? "Adding…" : "Add Repository"}
              </button>
            </div>

            <button
              onClick={() => navigate("/app/overview")}
              className="mt-4 w-full text-center text-sm text-gh-subtle hover:text-gh-muted transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="anim-fade-up text-center">
            <div className="w-16 h-16 rounded-2xl bg-gh-green/10 border border-gh-green/30 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-gh-green" />
            </div>
            <h1 className="text-2xl font-bold text-gh-fg mb-2">You're all set!</h1>
            <p className="text-sm text-gh-muted mb-8">
              GitPulse is now watching your repository. Push a commit to generate your first AI summary.
            </p>
            <button
              onClick={() => navigate("/app/overview")}
              className="bg-gh-accent hover:bg-gh-accent-em text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
