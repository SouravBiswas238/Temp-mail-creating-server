import { Router } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";
import { InvalidAddressError } from "../services/addressValidation.js";
import {
  PinMismatchError,
  ValidationError,
  getOrCreateSettings,
  getPinStatus,
  setLifetime,
  setPin,
  verifyPin,
} from "../services/mailboxService.js";

export const mailboxRouter = Router();

function handleMailboxError(err, res, next) {
  if (err instanceof InvalidAddressError) {
    return res.status(400).json({ error: "invalid or unsupported address" });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof PinMismatchError) {
    return res.status(403).json({ error: err.message });
  }
  next(err);
}

// PINs are short (4-10 digits) so brute force must be slowed down harder
// than the general API rate limit.
const verifyPinLimiter = rateLimit({
  windowMs: config.pinRateLimitWindowMs,
  max: config.pinRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many attempts, try again later" },
});

mailboxRouter.get("/pin-status", async (req, res, next) => {
  try {
    res.json(await getPinStatus(req.query.address));
  } catch (err) {
    handleMailboxError(err, res, next);
  }
});

mailboxRouter.get("/settings", async (req, res, next) => {
  try {
    res.json(await getOrCreateSettings(req.query.address));
  } catch (err) {
    handleMailboxError(err, res, next);
  }
});

mailboxRouter.post("/lifetime", async (req, res, next) => {
  try {
    const { address, lifetimeSeconds } = req.body;
    res.json(await setLifetime(address, lifetimeSeconds));
  } catch (err) {
    handleMailboxError(err, res, next);
  }
});

mailboxRouter.post("/pin", async (req, res, next) => {
  try {
    const { address, pin, currentPin } = req.body;
    res.json(await setPin(address, { pin, currentPin }));
  } catch (err) {
    handleMailboxError(err, res, next);
  }
});

mailboxRouter.post("/verify-pin", verifyPinLimiter, async (req, res, next) => {
  try {
    const { address, pin } = req.body;
    const result = await verifyPin(address, pin);
    if (!result) return res.status(401).json({ error: "incorrect PIN" });
    res.json(result);
  } catch (err) {
    handleMailboxError(err, res, next);
  }
});
