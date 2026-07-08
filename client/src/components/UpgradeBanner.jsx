import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export default function UpgradeBanner({ planTier = "free", reportsGenerated = 0 }) {
  if (planTier !== "free" || reportsGenerated < 1) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
      <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-gh-fg">Free report used</p>
        <p className="text-sm text-gh-muted mt-0.5">
          You&apos;ve used your 1 free AI report. Upgrade to Pro for unlimited reports, Slack/Discord, and PDF export.
        </p>
      </div>
      <Link
        to="/app/billing"
        className="shrink-0 bg-gh-accent hover:bg-gh-accent-em text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        Upgrade
      </Link>
    </div>
  );
}
