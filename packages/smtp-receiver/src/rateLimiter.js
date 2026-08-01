/**
 * Simple in-memory sliding-window token bucket, keyed by remote IP.
 * Bounds how many SMTP connections a single IP can open per minute so a
 * single abusive sender can't hammer the receiver. Not a spam-content filter -
 * just protects the process from being overwhelmed.
 */
export function createConnectionRateLimiter({ maxPerWindow, windowMs = 60_000 }) {
  const hits = new Map(); // ip -> array of timestamps

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, timestamps] of hits) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(ip);
      else hits.set(ip, fresh);
    }
  }, windowMs).unref();

  return {
    allow(ip) {
      const now = Date.now();
      const cutoff = now - windowMs;
      const timestamps = (hits.get(ip) || []).filter((t) => t > cutoff);
      if (timestamps.length >= maxPerWindow) {
        hits.set(ip, timestamps);
        return false;
      }
      timestamps.push(now);
      hits.set(ip, timestamps);
      return true;
    },
  };
}
