import express from "express";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import TeamInvite from "../models/TeamInvite.js";
import { canInviteSeat } from "../config/planLimits.js";

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only an org admin can manage team members" });
  }
  next();
};

function orgId(user) {
  return user.org_id._id ?? user.org_id;
}

// GET /api/team — members + pending invites
router.get("/", requireAuth, async (req, res) => {
  const oid = orgId(req.user);
  const [members, invites] = await Promise.all([
    User.find({ org_id: oid }).select("username display_name avatar_url role is_primary createdAt").lean(),
    TeamInvite.find({ org_id: oid, status: "pending" }).select("github_username role token createdAt").lean(),
  ]);
  res.json({ members, invites });
});

// POST /api/team/invite — { github_username, role }
router.post("/invite", requireAuth, requireAdmin, async (req, res) => {
  const { github_username, role } = req.body;
  if (!github_username?.trim()) {
    return res.status(400).json({ message: "github_username is required" });
  }
  if (role && !["admin", "developer"].includes(role)) {
    return res.status(400).json({ message: "role must be admin or developer" });
  }

  const oid = orgId(req.user);
  const org = await Organization.findById(oid);
  if (!org) return res.status(404).json({ message: "Organization not found" });

  const [memberCount, pendingCount] = await Promise.all([
    User.countDocuments({ org_id: oid }),
    TeamInvite.countDocuments({ org_id: oid, status: "pending" }),
  ]);
  if (!canInviteSeat(org, memberCount + pendingCount)) {
    return res.status(403).json({ message: "Seat limit reached for your plan. Upgrade to invite more members." });
  }

  const username = github_username.trim().toLowerCase();

  const alreadyMember = await User.findOne({ org_id: oid, username });
  if (alreadyMember) {
    return res.status(409).json({ message: `@${username} is already a member of this team` });
  }

  const existingInvite = await TeamInvite.findOne({ org_id: oid, github_username: username, status: "pending" });
  if (existingInvite) {
    return res.status(409).json({ message: `@${username} already has a pending invite` });
  }

  const invite = await TeamInvite.create({
    org_id: oid,
    github_username: username,
    role: role || "developer",
    invited_by: req.user._id,
  });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  res.json({ invite, invite_url: `${clientUrl}/invite/${invite.token}` }); // client redirects to OAuth
});

// DELETE /api/team/invite/:id — revoke a pending invite
router.delete("/invite/:id", requireAuth, requireAdmin, async (req, res) => {
  const oid = orgId(req.user);
  const invite = await TeamInvite.findOneAndUpdate(
    { _id: req.params.id, org_id: oid, status: "pending" },
    { $set: { status: "revoked" } },
    { new: true }
  );
  if (!invite) return res.status(404).json({ message: "Invite not found" });
  res.json({ message: "Invite revoked" });
});

// PATCH /api/team/members/:userId — { role }
router.patch("/members/:userId", requireAuth, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!["admin", "developer"].includes(role)) {
    return res.status(400).json({ message: "role must be admin or developer" });
  }

  const oid = orgId(req.user);
  const member = await User.findOne({ _id: req.params.userId, org_id: oid });
  if (!member) return res.status(404).json({ message: "Member not found" });

  if (member.is_primary && role !== "admin") {
    return res.status(400).json({ message: "Cannot demote the organization's primary admin" });
  }

  member.role = role;
  await member.save();
  res.json({ message: "Role updated", member: { _id: member._id, role: member.role } });
});

// DELETE /api/team/members/:userId — remove a member
router.delete("/members/:userId", requireAuth, requireAdmin, async (req, res) => {
  const oid = orgId(req.user);
  const member = await User.findOne({ _id: req.params.userId, org_id: oid });
  if (!member) return res.status(404).json({ message: "Member not found" });

  if (String(member._id) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot remove yourself" });
  }
  if (member.is_primary) {
    return res.status(400).json({ message: "Cannot remove the organization's primary admin" });
  }

  await User.findByIdAndDelete(member._id);
  res.json({ message: "Member removed" });
});

export default router;
