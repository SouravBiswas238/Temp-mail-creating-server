import { useCallback, useEffect, useState } from "react";
import { generateAddress, sanitizeLocalPart } from "../utils/randomAddress.js";

const STORAGE_KEY = "tempmail:address";
const MAIL_DOMAIN = import.meta.env.VITE_MAIL_DOMAIN || "localhost";

function loadStoredAddress() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeAddress(address) {
  try {
    localStorage.setItem(STORAGE_KEY, address);
  } catch {
    // localStorage unavailable (e.g. private browsing) - address just won't persist
  }
}

function domainOf(address) {
  return address?.split("@")[1];
}

export function useAddress() {
  const [address, setAddress] = useState(() => {
    const stored = loadStoredAddress();
    // Discard a stored address left over from a different MAIL_DOMAIN (e.g.
    // switching between local/test/production configs) instead of silently
    // reusing an address the current server doesn't actually own.
    if (stored && domainOf(stored) === MAIL_DOMAIN) return stored;
    return generateAddress(MAIL_DOMAIN);
  });

  const regenerate = useCallback(() => {
    const next = generateAddress(MAIL_DOMAIN);
    storeAddress(next);
    setAddress(next);
  }, []);

  // Lets the user pick their own local-part instead of a random one. Falls
  // back to a fresh random address if the sanitized input is empty (e.g.
  // the user cleared the field or typed only invalid characters).
  const setLocalPart = useCallback((rawLocalPart) => {
    const localPart = sanitizeLocalPart(rawLocalPart);
    const next = localPart ? `${localPart}@${MAIL_DOMAIN}` : generateAddress(MAIL_DOMAIN);
    storeAddress(next);
    setAddress(next);
  }, []);

  useEffect(() => {
    storeAddress(address);
  }, [address]);

  return { address, domain: MAIL_DOMAIN, regenerate, setLocalPart };
}
