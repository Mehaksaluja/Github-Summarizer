import { GitBranch, Zap, Users, BarChart3 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { apiUrl } from "../api/base";

const ERROR_MESSAGES = {
  invite_mismatch: "This invite was created for a different GitHub account. Sign in with the account that was invited.",
  invite_seats_full: "This team's seat limit has been reached. Ask the admin to upgrade the plan or free up a seat.",
};

export default function LoginPage() {
  const [params] = useSearchParams();
  const error = params.get("error");
  const errorMessage = error ? (ERROR_MESSAGES[error] || "Authentication failed. Please try again.") : null;

  return (
    <div className="min-h-screen bg-gh-canvas flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gh-surface border-r border-gh-border flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-80 h-80 bg-gh-accent/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gh-accent/4 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-xl bg-gh-accent flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <span className="text-gh-fg font-semibold">GitPulse</span>
          </div>

          <h1 className="text-4xl font-extrabold text-gh-fg leading-tight mb-4">
            Your GitHub activity,<br />
            <span className="gradient-text">explained.</span>
          </h1>
          <p className="text-gh-muted leading-relaxed max-w-sm">
            AI-generated daily reports from your commits and PRs.
            Built for dev teams, agencies, and founders.
          </p>
        </div>

        {/* Feature pills */}
        <div className="relative space-y-3">
          {[
            { icon: <Zap className="w-4 h-4 text-gh-accent" />, bg: "bg-gh-accent/10 border-gh-accent/20", text: "AI standup summaries in seconds" },
            { icon: <Users className="w-4 h-4 text-gh-blue" />, bg: "bg-gh-blue/10 border-gh-blue/20", text: "Client-ready progress reports" },
            { icon: <BarChart3 className="w-4 h-4 text-gh-green" />, bg: "bg-gh-green/10 border-gh-green/20", text: "Executive dashboards for founders" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 bg-gh-inset border border-gh-border rounded-xl px-4 py-3">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${f.bg}`}>
                {f.icon}
              </div>
              <span className="text-sm text-gh-fg">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gh-accent flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
            <span className="text-gh-fg font-semibold">GitPulse</span>
          </div>

          <h2 className="text-2xl font-bold text-gh-fg mb-1">Welcome back</h2>
          <p className="text-sm text-gh-muted mb-8">Sign in with your GitHub account to continue.</p>

          {error && (
            <div className="bg-gh-red/10 border border-gh-red/25 rounded-xl px-4 py-3 text-sm text-gh-red mb-6">
              {errorMessage}
            </div>
          )}

          <a
            href={apiUrl("/auth/github")}
            className="flex items-center justify-center gap-3 w-full bg-[#24292f] hover:bg-[#32383f] border border-[#3d444d] text-white font-semibold px-5 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-black/30 text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </a>

          <p className="text-xs text-gh-subtle text-center mt-5 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-gh-muted hover:text-gh-fg underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-gh-muted hover:text-gh-fg underline">Privacy Policy</a>.
            <br />We only request read access to your repositories.
          </p>
        </div>
      </div>
    </div>
  );
}
