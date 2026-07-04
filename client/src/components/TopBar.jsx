import { Search, Bell } from "lucide-react";

export default function TopBar({ title, subtitle, actions }) {
  return (
    <header className="h-14 border-b border-gh-border bg-gh-surface/60 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-gh-fg leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-gh-subtle mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actions}

        <button className="hidden md:flex items-center gap-2 bg-gh-inset border border-gh-border rounded-md px-3 py-1.5 text-xs text-gh-subtle hover:text-gh-fg hover:border-gh-muted transition-colors w-44">
          <Search className="w-3 h-3" />
          <span>Search…</span>
          <kbd className="ml-auto text-[10px] bg-gh-surface border border-gh-border rounded px-1 py-px font-mono">
            ⌘K
          </kbd>
        </button>

        <button className="w-8 h-8 rounded-md bg-gh-inset border border-gh-border flex items-center justify-center text-gh-muted hover:text-gh-fg hover:border-gh-muted transition-colors">
          <Bell className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
