import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { eventsUrl } from "../api/client.js";

const POLL_FALLBACK_MS = 5000;

// Subscribes to the SSE stream for `address` and invalidates the react-query
// cache whenever new mail arrives, triggering a refetch. Falls back to plain
// polling if EventSource errors out (e.g. blocked by a proxy) - the browser's
// native EventSource already retries on transient drops, so this fallback is
// only for the case where SSE itself can't be established at all.
export function useInboxUpdates(address, token) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!address) return undefined;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["messages", address] });

    let pollTimer = null;
    const source = new EventSource(eventsUrl(address, token));

    source.addEventListener("new-message", invalidate);
    source.onerror = () => {
      source.close();
      if (!pollTimer) {
        pollTimer = setInterval(invalidate, POLL_FALLBACK_MS);
      }
    };

    return () => {
      source.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [address, token, queryClient]);
}
