import cron from "node-cron";
import Organization from "../models/Organization.js";
import Repository from "../models/Repository.js";
import User from "../models/User.js";
import { generateReportForRepo } from "./reportGenerator.js";

// Build the time window [since, until] anchored to the org's configured hour
function buildWindow(cadence, hour = 9) {
  const now = new Date();

  // Most recent occurrence of hour:00:00 UTC
  const until = new Date(now);
  until.setUTCHours(hour, 0, 0, 0);
  if (until > now) {
    // Today's scheduled time hasn't arrived yet — use yesterday's
    until.setUTCDate(until.getUTCDate() - 1);
  }

  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - (cadence === "weekly" ? 7 : 1));

  const dateKey = since.toISOString().split("T")[0];
  return { since, until, dateKey };
}

async function runDigestForCadence(cadence) {
  const orgs = await Organization.find({ "digest_schedule.cadence": cadence });
  console.log(`[Digest] ${cadence}: found ${orgs.length} org(s)`);

  for (const org of orgs) {
    const adminUser = await User.findOne({ org_id: org._id, role: "admin" });
    if (!adminUser) {
      console.warn(`[Digest] No admin user for org ${org.slug} — skipping`);
      continue;
    }

    const repos = await Repository.find({ org_id: org._id, is_active: true });
    const { since, until, dateKey } = buildWindow(cadence, org.digest_schedule?.hour ?? 9);
    const periodLabel = cadence === "weekly" ? "Weekly" : "Daily";
    const summaryType = cadence === "weekly" ? "weekly_digest" : "daily_digest";

    console.log(`[Digest] ${org.slug} | ${cadence} | ${since.toISOString()} → ${until.toISOString()}`);

    for (const repo of repos) {
      try {
        await generateReportForRepo({
          accessToken: adminUser.access_token,
          org,
          repo,
          since,
          until,
          periodLabel,
          summaryType,
          dateKey,
        });
      } catch (err) {
        console.error(`[Digest] Error for ${repo.full_name}:`, err.message);
      }
    }
  }
}

export function startDigestScheduler() {
  // Daily — every 5 minutes for testing; change back to "0 9 * * *" for production
  cron.schedule("*/5 * * * *", async () => {
    console.log("[Digest] Running daily digest job...");
    try {
      await runDigestForCadence("daily");
    } catch (err) {
      console.error("[Digest] Daily job error:", err.message);
    }
  });

  // Weekly — every Monday at 9 AM UTC
  cron.schedule("0 9 * * 1", async () => {
    console.log("[Digest] Running weekly digest job...");
    try {
      await runDigestForCadence("weekly");
    } catch (err) {
      console.error("[Digest] Weekly job error:", err.message);
    }
  });

  console.log("[Digest] Scheduler started — daily */5 min (testing), weekly Mon 09:00 UTC");
}
