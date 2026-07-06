export default function TopBar({ title, subtitle, actions }) {
  return (
    <header className="h-14 border-b border-gh-border bg-gh-surface/60 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-gh-fg leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-gh-subtle mt-0.5">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
