import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { ALLOWED_LIFETIME_SECONDS, DEFAULT_LIFETIME_SECONDS } from "@tempmail/shared/src/mailboxSchema.js";
import { signToken, verifyToken } from "@tempmail/shared/src/mailboxToken.js";
import { config } from "../config.js";
import { MailboxSettings } from "../mongoClient.js";
import { requireOwnedAddress } from "./addressValidation.js";

const BCRYPT_ROUNDS = 10;
const PIN_PATTERN = /^\d{4,10}$/;

export class ValidationError extends Error {}
export class PinMismatchError extends Error {}

function generateSecretAlias() {
  const token = crypto.randomBytes(9).toString("base64url").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `sec-${token}@${config.ownedDomains[0]}`;
}

/**
 * A recipient may be either a mailbox's canonical address or its secret
 * alias - both must resolve to the same inbox. This is the single place
 * that resolution happens for the API (mirrors the SMTP receiver's own
 * resolveRecipient in packages/smtp-receiver/src/server.js).
 */
export async function resolveCanonicalAddress(rawAddress) {
  const normalized = requireOwnedAddress(rawAddress);
  const settings = await MailboxSettings.findOne({ secretAlias: normalized }).lean();
  return settings ? settings.address : normalized;
}

export async function getPinStatus(rawAddress) {
  const address = await resolveCanonicalAddress(rawAddress);
  const settings = await MailboxSettings.findOne({ address }, "pinHash").lean();
  return { hasPin: Boolean(settings?.pinHash) };
}

export async function getOrCreateSettings(rawAddress) {
  const address = await resolveCanonicalAddress(rawAddress);
  let settings = await MailboxSettings.findOne({ address });
  if (!settings) {
    try {
      settings = await MailboxSettings.create({
        address,
        secretAlias: generateSecretAlias(),
        lifetimeSeconds: DEFAULT_LIFETIME_SECONDS,
      });
    } catch (err) {
      if (err.code === 11000) {
        settings = await MailboxSettings.findOne({ address });
      } else {
        throw err;
      }
    }
  }
  return {
    hasPin: Boolean(settings.pinHash),
    lifetimeSeconds: settings.lifetimeSeconds,
    secretAddress: settings.secretAlias,
  };
}

export async function setLifetime(rawAddress, lifetimeSeconds) {
  const address = await resolveCanonicalAddress(rawAddress);
  const seconds = Number(lifetimeSeconds);
  if (!ALLOWED_LIFETIME_SECONDS.includes(seconds)) {
    throw new ValidationError(`lifetimeSeconds must be one of ${ALLOWED_LIFETIME_SECONDS.join(", ")}`);
  }
  const settings = await MailboxSettings.findOneAndUpdate(
    { address },
    {
      $set: { lifetimeSeconds: seconds, updatedAt: new Date() },
      $setOnInsert: { secretAlias: generateSecretAlias() },
    },
    { upsert: true, new: true }
  );
  return { lifetimeSeconds: settings.lifetimeSeconds };
}

// Setting a PIN requires the current one if the mailbox is already
// protected - there are no accounts in this system, so this is the only
// practical guard against a third party who later discovers/guesses the
// address silently taking over or locking out whoever secured it first.
export async function setPin(rawAddress, { pin, currentPin }) {
  const address = await resolveCanonicalAddress(rawAddress);
  const settings = await MailboxSettings.findOne({ address });

  if (settings?.pinHash) {
    const matches = await bcrypt.compare(currentPin || "", settings.pinHash);
    if (!matches) throw new PinMismatchError("current PIN is incorrect");
  }

  const trimmedPin = (pin || "").trim();
  if (trimmedPin && !PIN_PATTERN.test(trimmedPin)) {
    throw new ValidationError("PIN must be 4-10 digits");
  }

  const pinHash = trimmedPin ? await bcrypt.hash(trimmedPin, BCRYPT_ROUNDS) : null;

  await MailboxSettings.findOneAndUpdate(
    { address },
    {
      $set: { pinHash, updatedAt: new Date() },
      $setOnInsert: { secretAlias: generateSecretAlias(), lifetimeSeconds: DEFAULT_LIFETIME_SECONDS },
    },
    { upsert: true }
  );

  return { hasPin: Boolean(pinHash) };
}

/** Returns { token, expiresAt } on a correct PIN, or null on an incorrect one. */
export async function verifyPin(rawAddress, pin) {
  const address = await resolveCanonicalAddress(rawAddress);
  const settings = await MailboxSettings.findOne({ address }, "pinHash lifetimeSeconds").lean();
  if (!settings?.pinHash) {
    throw new ValidationError("no PIN set for this address");
  }

  const matches = await bcrypt.compare(pin || "", settings.pinHash);
  if (!matches) return null;

  const exp = Date.now() + settings.lifetimeSeconds * 1000;
  const token = signToken({ address, exp }, config.mailboxTokenSecret);
  return { token, expiresAt: new Date(exp) };
}

/** True if `address` has no PIN set, or `token` validly unlocks it. */
export async function checkAccess(address, token) {
  const settings = await MailboxSettings.findOne({ address }, "pinHash").lean();
  if (!settings?.pinHash) return true;
  if (!token) return false;
  const payload = verifyToken(token, config.mailboxTokenSecret);
  return Boolean(payload && payload.address === address);
}
