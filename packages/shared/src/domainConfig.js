const MAX_LOCAL_PART_LENGTH = 64;
const CONTROL_CHAR_PATTERN = /[\x00-\x1f\x7f]/;

/**
 * Splits an email address into { localPart, domain }, both lowercased.
 * Returns null if the address isn't syntactically parseable.
 */
export function parseAddress(address) {
  if (typeof address !== "string") return null;
  const trimmed = address.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === trimmed.length - 1) return null;
  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!domain.includes(".")) return null;
  return { localPart, domain };
}

/**
 * True if `address` belongs to one of the domains this server is authoritative for.
 * This is the catch-all boundary: any local-part is accepted as long as the domain matches.
 * It is also the anti-relay boundary: anything that doesn't match must be rejected.
 */
export function isOwnedAddress(address, ownedDomains) {
  const parsed = parseAddress(address);
  if (!parsed) return false;
  if (parsed.localPart.length === 0 || parsed.localPart.length > MAX_LOCAL_PART_LENGTH) return false;
  if (CONTROL_CHAR_PATTERN.test(parsed.localPart)) return false;
  const domains = Array.isArray(ownedDomains) ? ownedDomains : [ownedDomains];
  return domains.some((d) => d.toLowerCase() === parsed.domain);
}

/** Normalizes an address to the canonical lowercase form used as the Mongo lookup key. */
export function normalizeAddress(address) {
  const parsed = parseAddress(address);
  return parsed ? `${parsed.localPart}@${parsed.domain}` : null;
}

export function parseOwnedDomains(envValue) {
  return String(envValue || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}
