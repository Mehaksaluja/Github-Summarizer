import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, AlertCircle, Info, X, Sparkles } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-gh-green shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-gh-red shrink-0" />,
  info: <Info className="w-4 h-4 text-gh-accent shrink-0" />,
  summary: <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />,
};

const COLORS = {
  success: "border-gh-green/30 bg-gh-green/5",
  error: "border-gh-red/30 bg-gh-red/5",
  info: "border-gh-accent/30 bg-gh-accent/5",
  summary: "border-purple-400/30 bg-purple-400/5",
};

function ToastItem({ toast, onDismiss }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg bg-gh-surface backdrop-blur-sm min-w-[280px] max-w-[360px] animate-in slide-in-from-right-4 duration-300 ${COLORS[toast.type] ?? COLORS.info}`}
    >
      {ICONS[toast.type] ?? ICONS.info}
      <p className="text-xs text-gh-fg flex-1 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gh-subtle hover:text-gh-muted transition-colors shrink-0 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — top-right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
