import { useCallback, useEffect, useState } from "react";

function storageKey(address) {
  return `tempmail:token:${address}`;
}

function loadToken(address) {
  try {
    const raw = localStorage.getItem(storageKey(address));
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw);
    if (!token || !expiresAt || new Date(expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(storageKey(address));
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

// Tracks the PIN-unlock session token for the currently active address.
// Stored per-address in localStorage so switching addresses (or a fresh
// random one) doesn't accidentally reuse another mailbox's unlock state.
export function useMailboxToken(address) {
  const [token, setTokenState] = useState(() => loadToken(address));

  useEffect(() => {
    setTokenState(loadToken(address));
  }, [address]);

  const saveToken = useCallback(
    (newToken, expiresAt) => {
      try {
        localStorage.setItem(storageKey(address), JSON.stringify({ token: newToken, expiresAt }));
      } catch {
        // localStorage unavailable (e.g. private browsing) - token just won't persist
      }
      setTokenState(newToken);
    },
    [address]
  );

  const clearToken = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(address));
    } catch {
      // ignore
    }
    setTokenState(null);
  }, [address]);

  return { token, saveToken, clearToken };
}
