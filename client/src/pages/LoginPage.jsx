import { GitBranch } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function LoginPage() {
  const [params] = useSearchParams();
  const error = params.get("error");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GitBranch className="w-6 h-6 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">GitPulse</h1>
        <p className="text-gray-500 text-sm mb-8">
          AI-generated summaries of your GitHub activity — delivered daily.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            Authentication failed. Please try again.
          </p>
        )}

        <a
          href="/auth/github"
          className="flex items-center justify-center gap-3 w-full bg-gray-900 hover:bg-gray-700 text-white font-medium px-4 py-3 rounded-xl transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Continue with GitHub
        </a>

        <p className="text-xs text-gray-400 mt-6">
          We only request read access to your repositories.
        </p>
      </div>
    </div>
  );
}
