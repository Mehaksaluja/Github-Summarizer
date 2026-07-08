import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, GitCommit, GitMerge, Zap, Bug, Wrench,
  Copy, Check, ThumbsUp, ThumbsDown, Archive, ArchiveRestore, Trash2, Loader2,
  AlertTriangle, Users, Clock, TrendingUp, GitBranch, Download, Lock,
} from "lucide-react";
import { fetchSummary, submitFeedback, archiveSummary, deleteSummary, downloadSummaryPdf } from "../api/summaries";
import TopBar from "../components/TopBar";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";

const TYPE_META = {
  standup:              { label: "Push Summary",   color: "text-gh-blue   bg-gh-blue/10   border-gh-blue/30"      },
  client_report:        { label: "Client Report",  color: "text-gh-accent bg-gh-accent/10 border-gh-accent/30"    },
  executive_dashboard:  { label: "Executive",      color: "text-gh-green  bg-gh-green/10  border-gh-green/30"     },
  daily_digest:         { label: "Daily Digest",   color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  weekly_digest:        { label: "Weekly Digest",  color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  custom_report:        { label: "Custom Report",  color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
};

function fmt(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
}

export default function SummaryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [archived, setArchived] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const canExportPdf = ["pro", "agency"].includes(user?.org?.effective_plan_tier ?? user?.org?.plan_tier);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      const filename = `${summary.repo_id?.name ?? "summary"}-${summary.date}.pdf`;
      await downloadSummaryPdf(id, filename);
    } catch (err) {
      showToast(err.message || "Failed to download PDF", "error");
    } finally {
      setPdfLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary(id)
      .then(s => { setSummary(s); setRating(s.feedback?.rating ?? null); setArchived(s.is_archived ?? false); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCopy() {
    await navigator.clipboard.writeText(summary.summary_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFeedback(r) {
    if (feedbackSaving) return;
    const next = rating === r ? null : r;
    setRating(next);
    if (!next) return;
    setFeedbackSaving(true);
    try {
      await submitFeedback(id, { rating: next, note: feedbackNote || null });
      showToast(next === "up" ? "Thanks for the feedback!" : "Feedback noted", "success");
      setShowNoteInput(false);
    } catch {
      setRating(rating);
      showToast("Could not save feedback", "error");
    } finally {
      setFeedbackSaving(false);
    }
  }

  async function handleArchive() {
    setActionLoading("archive");
    const next = !archived;
    try {
      await archiveSummary(id, next);
      setArchived(next);
      showToast(next ? "Summary archived" : "Summary restored", "success");
    } catch { showToast("Action failed", "error"); }
    finally { setActionLoading(null); }
  }

  async function handleDelete() {
    if (!confirm("Permanently delete this summary? This cannot be undone.")) return;
    setActionLoading("delete");
    try {
      await deleteSummary(id);
      showToast("Summary deleted", "info");
      navigate("/app/summaries");
    } catch {
      showToast("Delete failed", "error");
      setActionLoading(null);
    }
  }

  const meta = summary ? (TYPE_META[summary.summary_type] ?? { label: summary.summary_type, color: "text-gh-muted bg-gh-inset border-gh-border" }) : null;
  const s = summary?.structured;
  const isDigest = ["daily_digest", "weekly_digest", "custom_report", "client_report", "executive_dashboard"].includes(summary?.summary_type);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar
        title={summary ? `${summary.date} — ${meta?.label}` : "Summary"}
        subtitle={summary?.repo_id?.full_name}
        actions={summary && (
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="flex items-center gap-1.5 bg-gh-surface border border-gh-border hover:border-gh-muted text-gh-muted hover:text-gh-fg text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-gh-green" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            {canExportPdf ? (
              <button
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 bg-gh-surface border border-gh-border hover:border-gh-muted text-gh-muted hover:text-gh-fg text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                PDF
              </button>
            ) : (
              <Link
                to="/app/billing"
                title="Upgrade to Pro to unlock PDF export"
                className="flex items-center gap-1.5 bg-gh-surface border border-gh-border text-gh-subtle text-xs font-medium px-3 py-1.5 rounded-lg transition-colors opacity-70 hover:opacity-100"
              >
                <Lock className="w-3.5 h-3.5" />
                PDF
              </Link>
            )}
            <button onClick={handleArchive} disabled={actionLoading === "archive"} className="flex items-center gap-1.5 bg-gh-surface border border-gh-border hover:border-gh-muted text-gh-muted hover:text-gh-fg text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {actionLoading === "archive" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
              {archived ? "Restore" : "Archive"}
            </button>
            <button onClick={handleDelete} disabled={actionLoading === "delete"} className="flex items-center gap-1.5 bg-gh-surface border border-gh-red/30 hover:border-gh-red text-gh-red text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {actionLoading === "delete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete
            </button>
          </div>
        )}
      />

      <div className="flex-1 p-6 max-w-3xl w-full mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-gh-subtle hover:text-gh-muted mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {loading && (
          <div className="space-y-4">
            <div className="h-8 w-48 bg-gh-surface rounded-lg animate-pulse" />
            <div className="h-64 bg-gh-surface rounded-xl animate-pulse" />
          </div>
        )}

        {error && (
          <div className="bg-gh-red/10 border border-gh-red/20 rounded-xl px-4 py-3 text-sm text-gh-red">{error}</div>
        )}

        {summary && (
          <div className="space-y-4">
            {archived && (
              <div className="flex items-center gap-3 bg-gh-inset border border-gh-border rounded-xl px-4 py-3">
                <Archive className="w-4 h-4 text-gh-muted shrink-0" />
                <span className="text-xs text-gh-muted">This summary is archived and hidden from the main list.</span>
              </div>
            )}

            {/* Header card — meta + stats */}
            <div className="bg-gh-surface border border-gh-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>{meta.label}</span>
                  {summary.repo_id?.full_name && (
                    <span className="text-xs text-gh-subtle font-mono bg-gh-inset border border-gh-line px-2 py-0.5 rounded-full">
                      {summary.repo_id.full_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gh-subtle shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  {summary.date}
                </div>
              </div>

              {/* Period range for digests */}
              {isDigest && s?.since && s?.until && (
                <div className="flex items-center gap-1.5 text-xs text-gh-muted mb-4">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {fmt(s.since)} → {fmt(s.until)}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <StatBox icon={<GitCommit className="w-4 h-4 text-gh-muted" />}  label="Commits"  val={summary.stats.total_commits} />
                <StatBox icon={<GitMerge className="w-4 h-4 text-gh-muted" />}   label="PRs"      val={summary.stats.prs_merged} />
                <StatBox icon={<Zap className="w-4 h-4 text-gh-green" />}        label="Features" val={summary.stats.features}   valCls="text-gh-green" />
                <StatBox icon={<Bug className="w-4 h-4 text-gh-red" />}          label="Fixes"    val={summary.stats.bug_fixes}  valCls="text-gh-red" />
                <StatBox icon={<Wrench className="w-4 h-4 text-gh-yellow" />}    label="Chores"   val={summary.stats.chores}     valCls="text-gh-yellow" />
              </div>
            </div>

            {s ? (
              <>
                {/* Headline */}
                {s.headline && (
                  <div className="bg-gh-surface border border-gh-border rounded-2xl px-5 py-4">
                    <p className="text-base font-semibold text-gh-fg leading-snug">{s.headline}</p>
                  </div>
                )}

                {/* What Changed */}
                {s.what_changed?.length > 0 && (
                  <SectionCard title="What Changed" icon={<TrendingUp className="w-4 h-4" />}>
                    <ul className="space-y-2.5">
                      {s.what_changed.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gh-accent shrink-0" />
                          <span className="text-sm text-gh-fg leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}

                {/* Impact */}
                {s.why_it_matters && (
                  <div className="bg-gh-accent/5 border border-gh-accent/20 rounded-2xl px-5 py-4">
                    <p className="text-xs font-semibold text-gh-accent uppercase tracking-wider mb-2">Impact</p>
                    <p className="text-sm text-gh-fg leading-relaxed">{s.why_it_matters}</p>
                  </div>
                )}

                {/* Effort Breakdown */}
                {(s.features?.length > 0 || s.bug_fixes?.length > 0 || s.chores?.length > 0) && (
                  <SectionCard title="Effort Breakdown" icon={<GitBranch className="w-4 h-4" />}>
                    <div className="space-y-3">
                      {s.features?.length > 0 && (
                        <EffortGroup label="Features" color="text-gh-green bg-gh-green/10 border-gh-green/20" icon="✨" items={s.features} />
                      )}
                      {s.bug_fixes?.length > 0 && (
                        <EffortGroup label="Bug Fixes" color="text-gh-red bg-gh-red/10 border-gh-red/20" icon="🐛" items={s.bug_fixes} />
                      )}
                      {s.chores?.length > 0 && (
                        <EffortGroup label="Chores" color="text-gh-muted bg-gh-inset border-gh-border" icon="🔧" items={s.chores} />
                      )}
                    </div>
                  </SectionCard>
                )}

                {/* In Progress */}
                {s.in_progress?.length > 0 && (
                  <div className="bg-gh-yellow/5 border border-gh-yellow/20 rounded-2xl px-5 py-4">
                    <p className="text-xs font-semibold text-gh-yellow uppercase tracking-wider mb-2">In Progress</p>
                    <ul className="space-y-1.5">
                      {s.in_progress.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gh-fg">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gh-yellow shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Blockers */}
                {s.has_blockers && s.blockers?.length > 0 && (
                  <div className="bg-gh-red/5 border border-gh-red/20 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-gh-red" />
                      <p className="text-xs font-semibold text-gh-red uppercase tracking-wider">
                        Blockers
                        {s.risk_level && s.risk_level !== "low" && (
                          <span className="ml-2 normal-case font-medium opacity-70">· {s.risk_level} risk</span>
                        )}
                      </p>
                    </div>
                    <ul className="space-y-2 mb-3">
                      {s.blockers.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gh-fg">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gh-red shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    {s.blocker_recommendation && (
                      <div className="border-t border-gh-red/20 pt-3">
                        <p className="text-xs text-gh-muted">
                          <span className="font-semibold text-gh-red">Recommendation:</span>{" "}
                          {s.blocker_recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contributors (digest only) */}
                {isDigest && s.by_author && Object.keys(s.by_author).length > 0 && (
                  <SectionCard title="Contributors" icon={<Users className="w-4 h-4" />}>
                    <div className="space-y-4">
                      {Object.entries(s.by_author).map(([author, commits]) => (
                        <div key={author}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gh-accent/20 flex items-center justify-center text-[10px] font-bold text-gh-accent shrink-0">
                              {author.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gh-fg">{author}</span>
                            <span className="text-xs text-gh-subtle">{commits.length} commit{commits.length !== 1 ? "s" : ""}</span>
                          </div>
                          <ul className="space-y-1 pl-8">
                            {commits.map((c, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gh-muted">
                                <code className="text-gh-subtle font-mono shrink-0">{c.sha}</code>
                                <span className="leading-relaxed">{c.message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Commits list (push summary only) */}
                {!isDigest && s.commits?.length > 0 && (
                  <SectionCard title="Commits" icon={<GitCommit className="w-4 h-4" />}>
                    <ul className="space-y-2">
                      {s.commits.map((c, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <code className="text-[11px] font-mono text-gh-subtle bg-gh-inset border border-gh-line px-1.5 py-0.5 rounded shrink-0 mt-0.5">{c.sha}</code>
                          <div>
                            <p className="text-sm text-gh-fg leading-snug">{c.message}</p>
                            <p className="text-xs text-gh-subtle mt-0.5">{c.author}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}
              </>
            ) : (
              /* Fallback: raw markdown for old summaries without structured data */
              <div className="bg-gh-surface border border-gh-border rounded-2xl p-6">
                <pre className="text-xs text-gh-fg whitespace-pre-wrap font-mono leading-relaxed">{summary.summary_markdown}</pre>
              </div>
            )}

            {/* Feedback panel */}
            <div className="bg-gh-surface border border-gh-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gh-fg mb-3">Was this summary helpful?</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { handleFeedback("up"); setShowNoteInput(false); }}
                  disabled={feedbackSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    rating === "up"
                      ? "bg-gh-green/10 border-gh-green/30 text-gh-green"
                      : "bg-gh-surface border-gh-border text-gh-muted hover:border-gh-green/30 hover:text-gh-green"
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Helpful
                </button>
                <button
                  onClick={() => { setShowNoteInput(true); setRating("down"); }}
                  disabled={feedbackSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    rating === "down"
                      ? "bg-gh-red/10 border-gh-red/30 text-gh-red"
                      : "bg-gh-surface border-gh-border text-gh-muted hover:border-gh-red/30 hover:text-gh-red"
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Needs work
                </button>
                {rating && !showNoteInput && (
                  <span className="text-xs text-gh-subtle">
                    {rating === "up" ? "Thanks! Feedback saved." : "Noted. Help us improve."}
                  </span>
                )}
              </div>

              {showNoteInput && (
                <div className="mt-3">
                  <textarea
                    value={feedbackNote}
                    onChange={e => setFeedbackNote(e.target.value)}
                    placeholder="What could be better? (optional)"
                    rows={3}
                    className="w-full bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-xs text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleFeedback("down")}
                      disabled={feedbackSaving}
                      className="flex items-center gap-1.5 bg-gh-accent hover:bg-gh-accent-em text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {feedbackSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Submit feedback
                    </button>
                    <button onClick={() => { setShowNoteInput(false); setRating(null); }} className="text-xs text-gh-subtle hover:text-gh-muted transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery status */}
            {(summary.delivered_to?.slack || summary.delivered_to?.discord) && (
              <div className="bg-gh-surface border border-gh-border rounded-xl px-4 py-3 flex items-center gap-3">
                <Check className="w-4 h-4 text-gh-green shrink-0" />
                <span className="text-xs text-gh-muted">
                  Delivered to{" "}
                  {[summary.delivered_to.slack && "Slack", summary.delivered_to.discord && "Discord"].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-gh-surface border border-gh-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gh-line">
        <span className="text-gh-muted">{icon}</span>
        <h3 className="text-sm font-semibold text-gh-fg">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function EffortGroup({ label, color, icon, items }) {
  return (
    <div>
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border mb-2 ${color}`}>
        {icon} {label}
      </span>
      <ul className="space-y-1 pl-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gh-fg flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gh-border shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatBox({ icon, label, val, valCls = "text-gh-fg" }) {
  return (
    <div className="bg-gh-inset border border-gh-line rounded-lg px-3 py-2.5 flex flex-col items-center gap-1">
      {icon}
      <span className={`text-xl font-bold tabular-nums ${valCls}`}>{val}</span>
      <span className="text-[10px] text-gh-subtle">{label}</span>
    </div>
  );
}
