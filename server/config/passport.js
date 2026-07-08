import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import TeamInvite from "../models/TeamInvite.js";
import { canInviteSeat } from "../config/planLimits.js";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // Absolute URL in production so GitHub redirects to your EC2/API domain
      callbackURL: process.env.SERVER_URL
        ? `${process.env.SERVER_URL.replace(/\/$/, "")}/auth/github/callback`
        : "/auth/github/callback",
      scope: ["user:email", "repo", "read:org"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const pendingInviteToken = req.session?.pendingInviteToken ?? null;

        // Resolve a pending invite (if any) up front so it can steer both the
        // "existing user" and "brand new user" branches below.
        let invite = null;
        if (pendingInviteToken) {
          invite = await TeamInvite.findOne({ token: pendingInviteToken, status: "pending" });
          if (invite && invite.github_username !== profile.username.toLowerCase()) {
            return done(null, false, { message: "invite_mismatch" });
          }
        }

        let user = await User.findOne({ github_id: profile.id });

        if (user) {
          // Update access token on every login (tokens can rotate)
          user.access_token = accessToken;

          if (invite) {
            const org = await Organization.findById(invite.org_id);
            const currentSeatCount = await User.countDocuments({ org_id: invite.org_id });
            if (!org || !canInviteSeat(org, currentSeatCount)) {
              return done(null, false, { message: "invite_seats_full" });
            }
            // Accepting an invite moves this user into the inviting org — this app
            // models one-org-per-user, so their prior org's data is left behind.
            user.org_id = invite.org_id;
            user.role = invite.role;
            user.is_primary = false;
            await user.save();

            invite.status = "accepted";
            invite.accepted_user_id = user._id;
            invite.accepted_at = new Date();
            await invite.save();
          } else {
            await user.save();
          }

          if (req.session) delete req.session.pendingInviteToken;
          return done(null, user);
        }

        if (invite) {
          const org = await Organization.findById(invite.org_id);
          const currentSeatCount = await User.countDocuments({ org_id: invite.org_id });
          if (!org || !canInviteSeat(org, currentSeatCount)) {
            return done(null, false, { message: "invite_seats_full" });
          }

          user = await User.create({
            github_id: profile.id,
            username: profile.username,
            display_name: profile.displayName || profile.username,
            avatar_url: profile.photos?.[0]?.value || null,
            email: profile.emails?.[0]?.value || null,
            org_id: invite.org_id,
            role: invite.role,
            is_primary: false,
            access_token: accessToken,
          });

          invite.status = "accepted";
          invite.accepted_user_id = user._id;
          invite.accepted_at = new Date();
          await invite.save();

          if (req.session) delete req.session.pendingInviteToken;
          return done(null, user);
        }

        // First time login, no invite — create a brand new org and user
        const slug = profile.username.toLowerCase().replace(/[^a-z0-9]/g, "-");

        const org = await Organization.create({
          name: profile.displayName || profile.username,
          slug: `${slug}-${Date.now()}`,
        });

        user = await User.create({
          github_id: profile.id,
          username: profile.username,
          display_name: profile.displayName || profile.username,
          avatar_url: profile.photos?.[0]?.value || null,
          email: profile.emails?.[0]?.value || null,
          org_id: org._id,
          role: "admin",
          is_primary: true,
          access_token: accessToken,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate("org_id");
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
