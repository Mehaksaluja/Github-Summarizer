import { Zap } from "lucide-react";

export default function UpgradeBanner({ reportsGenerated = 0 }) {
  const used = reportsGenerated >= 1;

  if (!used) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
      <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">Free report used</p>
        <p className="text-sm text-amber-700 mt-0.5">
          You've used your 1 free AI report. Upgrade to Pro to generate unlimited reports.
        </p>
      </div>
      <button className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors">
        Upgrade
      </button>
    </div>
  );
}
