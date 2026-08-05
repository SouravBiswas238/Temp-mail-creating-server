import { isOwnedAddress, normalizeAddress } from "@tempmail/shared/src/domainConfig.js";
import { config } from "../config.js";

export class InvalidAddressError extends Error {}

export function requireOwnedAddress(rawAddress) {
  const normalized = normalizeAddress(rawAddress);
  if (!normalized || !isOwnedAddress(normalized, config.ownedDomains)) {
    throw new InvalidAddressError("address is not a valid address for this domain");
  }
  return normalized;
}
