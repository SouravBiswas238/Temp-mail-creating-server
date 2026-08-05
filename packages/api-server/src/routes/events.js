import { Router } from "express";
import { config } from "../config.js";
import { InvalidAddressError } from "../services/addressValidation.js";
import { checkAccess, resolveCanonicalAddress } from "../services/mailboxService.js";
import { countMessagesSince } from "../services/messageService.js";

export const eventsRouter = Router();

// Server-Sent Events endpoint: pushes a "new-message" event whenever mail
// arrives for the requested address. Implemented as a lightweight per-connection
// poll of Mongo rather than a change stream, so it works against a standalone
// (non-replica-set) MongoDB instance - simplest thing that works for this scale.
eventsRouter.get("/", async (req, res) => {
  let address;
  let since;
  try {
    // EventSource can't set custom headers, so the PIN token travels as a
    // query param here instead of X-Mailbox-Token like the other routes.
    address = await resolveCanonicalAddress(req.query.address);
    const allowed = await checkAccess(address, req.query.token);
    if (!allowed) return res.status(401).json({ error: "pin_required" });
    since = new Date();
    await countMessagesSince(address, since);
  } catch (err) {
    if (err instanceof InvalidAddressError) {
      return res.status(400).json({ error: "invalid or unsupported address" });
    }
    throw err;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 3000\n\n");

  const interval = setInterval(async () => {
    try {
      const newCount = await countMessagesSince(address, since);
      if (newCount > 0) {
        since = new Date();
        res.write(`event: new-message\ndata: ${JSON.stringify({ count: newCount })}\n\n`);
      } else {
        res.write(": keep-alive\n\n");
      }
    } catch {
      clearInterval(interval);
      res.end();
    }
  }, config.sseIntervalMs);

  req.on("close", () => {
    clearInterval(interval);
  });
});
