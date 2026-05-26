import { useEffect, useRef, useState } from "react";

import { isCallBooked, recordDetailView } from "@/lib/calendlyPrompt";

interface Options {
  /** Pass `false` for paying subscribers — they're out of audience for
   *  the founder-research call. Anonymous and signed-in free users are
   *  both in-audience. The hook still mounts cleanly; it just won't
   *  touch the counter or open the popup. */
  enabled: boolean;
}

/** Drives the "engaged browsing" Calendly popup (Trigger A).
 *
 *  Increments the listing-detail view counter once per mount and opens
 *  the popup when the rolling threshold is reached. Closing without
 *  booking does *not* suppress future prompts — the user will see it
 *  again after another N views. */
export function useCalendlyResearchPrompt({ enabled }: Options) {
  const [open, setOpen] = useState(false);
  // React StrictMode runs effects twice in dev; the ref keeps the
  // counter increment idempotent per real mount.
  const hasCounted = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (hasCounted.current) return;
    hasCounted.current = true;

    if (isCallBooked()) return;
    if (recordDetailView().shouldPrompt) setOpen(true);
  }, [enabled]);

  const close = () => setOpen(false);

  return { open, close };
}
