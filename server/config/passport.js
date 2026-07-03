import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";
import Organization from "../models/Organization.js";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
      scope: ["user:email", "repo", "read:org"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ github_id: profile.id });

        if (user) {
          // Update access token on every login (tokens can rotate)
          user.access_token = accessToken;
          await user.save();
          return done(null, user);
        }

        // First time login — create an org and user
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
