import { useCallback, useEffect, useState } from "react";
import { generateAddress } from "../utils/randomAddress.js";

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

export function useAddress() {
  const [address, setAddress] = useState(() => loadStoredAddress() || generateAddress(MAIL_DOMAIN));

  const regenerate = useCallback(() => {
    const next = generateAddress(MAIL_DOMAIN);
    storeAddress(next);
    setAddress(next);
  }, []);

  useEffect(() => {
    storeAddress(address);
  }, [address]);

  return { address, regenerate };
}
