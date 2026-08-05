import { parseOwnedDomains } from "@tempmail/shared/src/domainConfig.js";

export const config = {
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tempmail",
  ownedDomains: parseOwnedDomains(process.env.MAIL_DOMAIN || "localhost"),
  port: Number(process.env.API_PORT || 3001),
  rateLimitWindowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000),
  rateLimitMax: Number(process.env.API_RATE_LIMIT_MAX || 120),
  sseIntervalMs: Number(process.env.SSE_POLL_INTERVAL_MS || 2000),
  mailboxTokenSecret: process.env.MAILBOX_TOKEN_SECRET || "dev-only-insecure-secret-change-me",
  pinRateLimitWindowMs: Number(process.env.PIN_RATE_LIMIT_WINDOW_MS || 10 * 60_000),
  pinRateLimitMax: Number(process.env.PIN_RATE_LIMIT_MAX || 10),
};
