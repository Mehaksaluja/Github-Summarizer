import { Redis } from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // required by BullMQ
});

connection.on("connect", () => console.log("[Redis] Connected"));
connection.on("error", (err) => console.error("[Redis] Error:", err.message));

export default connection;
