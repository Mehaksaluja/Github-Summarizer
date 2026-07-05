import { useEffect, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Clock, RotateCcw, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { fetchWebhookLogs, fetchWebhookStats, retryWebhookLog } from "../api/webhookLogs";
import TopBar from "../components/TopBar";
import { useToast } from "../hooks/useToast";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "failed", label: "Failed" },
  { value: "completed", label: "Completed" },
  { value: "skipped_limit_reached", label: "Skipped" },
  { value: "processing", label: "Processing" },
];

const STATUS_META = {
  received:             { label: "Received",   color: "text-gh-blue bg-gh-blue/10 border-gh-blue/20" },
  queued:               { label: "Queued",     color: "text-gh-yellow bg-gh-yellow/10 border-gh-yellow/20" },
  processing:           { label: "Processing", color: "text-gh-accent bg-gh-accent/10 border-gh-accent/20" },
  completed:            { label: "Completed",  color: "text-gh-green bg-gh-green/10 border-gh-green/20" },
  failed:               { label: "Failed",     color: "text-gh-red bg-gh-red/10 border-gh-red/20" },
  skipped_limit_reached:{ label: "Skipped",    color: "text-gh-muted bg-gh-inset border-gh-border" },
};

const LIMIT = 20;

export default function WebhooksPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState({});
  const [expanded, setExpanded] = useState({});

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        fetchWebhookLogs({ status: status || undefined, page, limit: LIMIT }),
        fetchWebhookStats(),
      ]);
      setLogs(logsData.logs);
      setTotal(logsData.total);
      setStats(statsData);
    } catch {
      showToast("Failed to load webhook logs", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, page, showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleRetry(id) {
    setRetrying((r) => ({ ...r, [id]: true }));
    try {
      await retryWebhookLog(id);
      showToast("Event re-queued for processing", "success");
      setTimeout(() => load(true), 1500);
    } catch {
      showToast("Retry failed — check server logs", "error");
    } finally {
      setRetrying((r) => ({ ...r, [id]: false }));
    }
  }

  function handleTabChange(val) {
    setStatus(val);
    setPage(1);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title="Webhook Logs"
        subtitle="Monitor and retry GitHub webhook events"
        actions={
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-gh-surface border border-gh-border text-gh-muted hover:text-gh-fg text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-5">
        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="Total" value={stats.total} color="text-gh-fg" />
            <MiniStat label="Completed" value={stats.completed} color="text-gh-green" />
            <MiniStat label="Failed" value={stats.failed} color="text-gh-red" highlight={stats.failed > 0} />
            <MiniStat label="Skipped" value={stats.skipped} color="text-gh-muted" />
          </div>
        )}

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gh-surface border border-gh-border rounded-xl p-1 w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                status === tab.value
                  ? "bg-gh-accent text-white shadow-sm"
                  : "text-gh-muted hover:text-gh-fg hover:bg-gh-inset"
              }`}
            >
              {tab.label}
              {tab.value === "failed" && stats?.failed > 0 && (
                <span className="ml-1.5 bg-gh-red/20 text-gh-red text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                  {stats.failed}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Log list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gh-surface border border-gh-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gh-surface border border-gh-border rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gh-inset border border-gh-border flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-gh-subtle" />
            </div>
            <p className="text-sm font-semibold text-gh-fg mb-1">No events found</p>
            <p className="text-xs text-gh-muted">
              {status ? `No ${STATUS_META[status]?.label ?? status} events` : "No webhook events received yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const meta = STATUS_META[log.status] ?? { label: log.status, color: "text-gh-muted bg-gh-inset border-gh-border" };
              const isExpanded = expanded[log._id];
              return (
                <div key={log._id} className="bg-gh-surface border border-gh-border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Status icon */}
                    <div className="shrink-0">
                      {log.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 text-gh-green" />
                      ) : log.status === "failed" ? (
                        <AlertCircle className="w-4 h-4 text-gh-red" />
                      ) : (
                        <Clock className="w-4 h-4 text-gh-muted" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gh-fg font-mono">{log.event_type}</span>
                        {log.repo_full_name && (
                          <span className="text-[10px] text-gh-subtle bg-gh-inset border border-gh-line px-2 py-0.5 rounded-full font-mono truncate max-w-[200px]">
                            {log.repo_full_name}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-gh-subtle mt-0.5">
                        {new Date(log.createdAt).toLocaleString()} · ID: {log.event_id?.slice(0, 16)}...
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {log.status === "failed" && (
                        <button
                          onClick={() => handleRetry(log._id)}
                          disabled={retrying[log._id]}
                          className="flex items-center gap-1.5 bg-gh-accent/10 hover:bg-gh-accent/20 border border-gh-accent/30 text-gh-accent text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {retrying[log._id] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          Retry
                        </button>
                      )}
                      {log.error_message && (
                        <button
                          onClick={() => setExpanded((e) => ({ ...e, [log._id]: !e[log._id] }))}
                          className="text-gh-subtle hover:text-gh-muted transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error message */}
                  {isExpanded && log.error_message && (
                    <div className="px-4 pb-3 border-t border-gh-line">
                      <p className="text-xs text-gh-red font-mono mt-2 bg-gh-red/5 border border-gh-red/10 rounded-lg px-3 py-2 leading-relaxed">
                        {log.error_message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-gh-subtle px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs bg-gh-surface border border-gh-border rounded-lg text-gh-muted hover:text-gh-fg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, highlight }) {
  return (
    <div className={`bg-gh-surface border rounded-xl p-3 ${highlight ? "border-gh-red/30 bg-gh-red/5" : "border-gh-border"}`}>
      <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-gh-subtle mt-0.5">{label}</p>
    </div>
  );
}
