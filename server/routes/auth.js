import express from "express";
import passport from "passport";
import { effectivePlanTier } from "../config/planLimits.js";

const router = express.Router();

// Redirect user to GitHub for authorization
router.get("/github", passport.authenticate("github"));

// Entry point for accepting a team invite — stash the token in the session,
// then hand off to the normal GitHub OAuth flow.
router.get("/github/invite/:token", (req, res) => {
  req.session.pendingInviteToken = req.params.token;
  res.redirect("/auth/github");
});

// GitHub redirects back here after user authorizes
router.get("/github/callback", (req, res, next) => {
  passport.authenticate("github", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      const reason = info?.message || "auth_failed";
      return res.redirect(`${process.env.CLIENT_URL}/login?error=${reason}`);
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.redirect(`${process.env.CLIENT_URL}/app/overview`);
    });
  })(req, res, next);
});

// Get currently logged in user
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  res.json({
    id: req.user._id,
    username: req.user.username,
    display_name: req.user.display_name,
    avatar_url: req.user.avatar_url,
    email: req.user.email,
    role: req.user.role,
    org: {
      id: req.user.org_id._id,
      name: req.user.org_id.name,
      plan_tier: req.user.org_id.plan_tier,
      effective_plan_tier: effectivePlanTier(req.user.org_id),
      subscription_status: req.user.org_id.subscription_status,
      reports_generated: req.user.org_id.reports_generated,
    },
  });
});

// Logout
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    req.session.destroy();
    res.json({ message: "Logged out successfully" });
  });
});

export default router;
