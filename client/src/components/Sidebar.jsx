import { NavLink, Link } from "react-router-dom";
import { GitBranch, LayoutDashboard, FolderGit2, ScrollText, Settings, LogOut, Zap, BarChart2, Webhook } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { to: "/app/overview",   icon: LayoutDashboard, label: "Overview" },
  { to: "/app/repos",      icon: FolderGit2,      label: "Repositories" },
  { to: "/app/summaries",  icon: ScrollText,       label: "Summaries" },
  { to: "/app/analytics",  icon: BarChart2,        label: "Analytics" },
  { to: "/app/webhooks",   icon: Webhook,          label: "Webhooks" },
  { to: "/app/settings",   icon: Settings,         label: "Settings" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 min-h-screen bg-gh-surface border-r border-gh-border flex flex-col shrink-0 fixed top-0 left-0 z-20">
      {/* Logo */}
      <Link
        to="/app/overview"
        className="px-4 h-14 flex items-center gap-2.5 border-b border-gh-line hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 rounded-lg bg-gh-accent flex items-center justify-center shrink-0">
          <GitBranch className="w-3.5 h-3.5 text-gh-canvas" />
        </div>
        <span className="text-gh-fg font-semibold text-sm tracking-tight">GitPulse</span>
      </Link>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-gh-accent/10 text-gh-accent border-l-2 border-gh-accent"
                  : "text-gh-muted hover:text-gh-fg hover:bg-gh-inset border-l-2 border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-gh-accent" : ""}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade nudge — free plan only */}
      {user?.org?.plan_tier === "free" && (
        <div className="px-3 pb-3">
          <div className="bg-gh-accent-bg border border-gh-accent/20 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-gh-accent" />
              <span className="text-xs font-semibold text-gh-accent">Free plan</span>
            </div>
            <p className="text-[11px] text-gh-subtle leading-snug mb-2">
              Upgrade for unlimited reports, Slack, GPT-4o, and PDF export.
            </p>
            <button className="w-full text-xs font-semibold bg-gh-accent hover:bg-gh-accent-em text-white py-1.5 rounded-md transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </div>
      )}

      {/* User row */}
      {user && (
        <div className="px-3 pb-3 pt-2 border-t border-gh-line">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md group">
            <img
              src={user.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full shrink-0 ring-1 ring-gh-border"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gh-fg truncate">{user.display_name || user.username}</p>
              <p className="text-[10px] text-gh-subtle truncate">{user.org?.name}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gh-subtle hover:text-gh-red"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
