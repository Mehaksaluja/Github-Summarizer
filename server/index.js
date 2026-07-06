import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "./config/passport.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import slackRoutes from "./routes/slack.js";
import webhookRoutes from "./routes/webhook.js";
import repoRoutes from "./routes/repos.js";
import summaryRoutes from "./routes/summaries.js";
import settingsRoutes from "./routes/settings.js";
import analyticsRoutes from "./routes/analytics.js";
import webhookLogRoutes from "./routes/webhookLogs.js";
import reportRoutes from "./routes/reports.js";

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));

// Read raw body once from stream — needed for GitHub webhook signature verification
app.use((req, res, next) => {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    if (chunks.length > 0) {
      req.rawBody = Buffer.concat(chunks);
      try {
        req.body = JSON.parse(req.rawBody.toString());
      } catch {
        req.body = {};
      }
    }
    next();
  });
  req.on("error", next);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI + "github_summary" }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/auth/slack", slackRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/api/repos", repoRoutes);
app.use("/api/summaries", summaryRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/webhook-logs", webhookLogRoutes);
app.use("/api/reports", reportRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
