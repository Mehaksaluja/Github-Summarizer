import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Users, UserPlus, Trash2, Loader2, Copy, Check, Shield, X, Zap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { fetchTeam, inviteMember, revokeInvite, updateMemberRole, removeMember } from "../api/team";
import TopBar from "../components/TopBar";

export default function TeamPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("developer");
  const [inviting, setInviting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const isAgency = (user?.org?.effective_plan_tier ?? user?.org?.plan_tier) === "agency";
  const isAdmin = user?.role === "admin";

  function load() {
    fetchTeam()
      .then((data) => { setMembers(data.members); setInvites(data.invites); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isAgency) load();
    else setLoading(false);
  }, [isAgency]);

  async function handleInvite(e) {
    e.preventDefault();
    if (!username.trim()) return;
    setInviting(true);
    setInviteUrl(null);
    try {
      const data = await inviteMember({ github_username: username.trim(), role });
      setInviteUrl(data.invite_url);
      setUsername("");
      showToast("Invite created", "success");
      load();
    } catch (err) {
      showToast(err.message || "Failed to send invite", "error");
    } finally {
      setInviting(false);
    }
  }

  async function handleCopy(url) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke(id) {
    setBusyId(id);
    try {
      await revokeInvite(id);
      setInvites((prev) => prev.filter((i) => i._id !== id));
      showToast("Invite revoked", "success");
    } catch (err) {
      showToast(err.message || "Failed to revoke invite", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRoleChange(memberId, newRole) {
    setBusyId(memberId);
    try {
      await updateMemberRole(memberId, newRole);
      setMembers((prev) => prev.map((m) => (m._id === memberId ? { ...m, role: newRole } : m)));
      showToast("Role updated", "success");
    } catch (err) {
      showToast(err.message || "Failed to update role", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(member) {
    if (!confirm(`Remove ${member.username} from the team?`)) return;
    setBusyId(member._id);
    try {
      await removeMember(member._id);
      setMembers((prev) => prev.filter((m) => m._id !== member._id));
      showToast("Member removed", "success");
    } catch (err) {
      showToast(err.message || "Failed to remove member", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (!isAgency) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
        <TopBar title="Team" subtitle="Invite teammates to collaborate" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm text-center bg-gh-surface border border-gh-border rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-gh-accent/10 border border-gh-accent/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-gh-accent" />
            </div>
            <h3 className="text-base font-semibold text-gh-fg mb-1.5">Agency plan required</h3>
            <p className="text-sm text-gh-muted mb-5">
              Invite up to 10 team members to collaborate on GitPulse with the Agency plan.
            </p>
            <Link
              to="/app/billing"
              className="inline-block bg-gh-accent hover:bg-gh-accent-em text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Upgrade to Agency
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gh-canvas">
      <TopBar title="Team" subtitle={`${members.length} member${members.length !== 1 ? "s" : ""}`} />

      <div className="flex-1 p-6 max-w-3xl w-full mx-auto space-y-5">
        {isAdmin && (
          <div className="bg-gh-surface border border-gh-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-gh-muted" />
              <h2 className="text-sm font-semibold text-gh-fg">Invite a team member</h2>
            </div>
            <form onSubmit={handleInvite} className="flex items-center gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="GitHub username"
                className="flex-1 bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg placeholder-gh-subtle focus:outline-none focus:border-gh-accent focus:ring-1 focus:ring-gh-accent/30 transition-colors"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-gh-canvas border border-gh-border rounded-lg px-3 py-2 text-sm text-gh-fg focus:outline-none focus:border-gh-accent"
              >
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviting || !username.trim()}
                className="flex items-center gap-1.5 bg-gh-accent hover:bg-gh-accent-em disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
              >
                {inviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Invite
              </button>
            </form>

            {inviteUrl && (
              <div className="mt-3 flex items-center gap-2 bg-gh-inset border border-gh-line rounded-lg px-3 py-2.5">
                <code className="flex-1 text-xs text-gh-muted font-mono truncate">{inviteUrl}</code>
                <button
                  onClick={() => handleCopy(inviteUrl)}
                  className="shrink-0 text-gh-subtle hover:text-gh-fg transition-colors"
                  title="Copy invite link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-gh-green" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
            <p className="text-[11px] text-gh-subtle mt-2">
              Share the invite link with your teammate — they'll join this team when they sign in with that GitHub account.
            </p>
          </div>
        )}

        <div className="bg-gh-surface border border-gh-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gh-line">
            <Users className="w-4 h-4 text-gh-muted" />
            <h2 className="text-sm font-semibold text-gh-fg">Members</h2>
          </div>
          <div className="divide-y divide-gh-line">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-10 bg-gh-inset rounded-lg animate-pulse" />)}
              </div>
            ) : (
              members.map((m) => (
                <div key={m._id} className="flex items-center gap-3 px-5 py-3.5">
                  <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0 ring-1 ring-gh-border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gh-fg truncate">{m.display_name || m.username}</span>
                      {m.is_primary && <Shield className="w-3.5 h-3.5 text-gh-accent" title="Primary admin" />}
                      {m._id === user?.id && <span className="text-[10px] text-gh-subtle">(you)</span>}
                    </div>
                    <p className="text-xs text-gh-subtle truncate">@{m.username}</p>
                  </div>
                  {isAdmin && !m.is_primary ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m._id, e.target.value)}
                      disabled={busyId === m._id}
                      className="bg-gh-canvas border border-gh-border rounded-lg px-2.5 py-1.5 text-xs text-gh-fg focus:outline-none focus:border-gh-accent disabled:opacity-50"
                    >
                      <option value="developer">Developer</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className="text-xs font-medium text-gh-muted capitalize px-2.5 py-1 rounded-full bg-gh-inset border border-gh-border">
                      {m.is_primary ? "Owner" : m.role}
                    </span>
                  )}
                  {isAdmin && !m.is_primary && (
                    <button
                      onClick={() => handleRemove(m)}
                      disabled={busyId === m._id}
                      className="p-1.5 rounded-md text-gh-subtle hover:text-gh-red hover:bg-gh-red/5 transition-all disabled:opacity-40"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {invites.length > 0 && (
          <div className="bg-gh-surface border border-gh-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gh-line">
              <UserPlus className="w-4 h-4 text-gh-muted" />
              <h2 className="text-sm font-semibold text-gh-fg">Pending invites</h2>
            </div>
            <div className="divide-y divide-gh-line">
              {invites.map((inv) => (
                <div key={inv._id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gh-fg">@{inv.github_username}</span>
                    <p className="text-xs text-gh-subtle capitalize">{inv.role} · invited {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRevoke(inv._id)}
                      disabled={busyId === inv._id}
                      className="p-1.5 rounded-md text-gh-subtle hover:text-gh-red hover:bg-gh-red/5 transition-all disabled:opacity-40"
                      title="Revoke invite"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
