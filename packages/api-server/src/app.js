import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config.js";
import { eventsRouter } from "./routes/events.js";
import { mailboxRouter } from "./routes/mailbox.js";
import { messagesRouter } from "./routes/messages.js";

export function createApp() {
  const app = express();

  // Sits behind exactly one reverse proxy (nginx) in production, which sets
  // X-Forwarded-For. Without this, express-rate-limit either keys every
  // request off nginx's own IP (one shared bucket for all users) or throws
  // ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Knowledge of the address is the only access control in this system, so
  // rate limiting is what makes brute-force address enumeration impractical.
  app.use(
    rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/messages", messagesRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/mailbox", mailboxRouter);

  app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
