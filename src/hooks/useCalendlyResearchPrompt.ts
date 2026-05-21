import { useEffect, useRef, useState } from "react";

import {
  isCallBooked,
  isResearchDismissed,
  markResearchDismissed,
  recordDetailView,
} from "@/lib/calendlyPrompt";

interface Options {
  /** Pass `false` for anonymous visitors and paying subscribers — both
   *  are out-of-audience for the founder-research call. The hook still
   *  mounts cleanly; it just won't touch the counter or open the popup. */
  enabled: boolean;
}

/** Drives the "engaged browsing" Calendly popup (Trigger A).
 *
 *  Increments the listing-detail view counter once per mount and opens
 *  the popup on the Nth view. Closing the popup persists a dismissal so
 *  it never re-triggers for this browser. */
export function useCalendlyResearchPrompt({ enabled }: Options) {
  const [open, setOpen] = useState(false);
  // React StrictMode runs effects twice in dev; the ref keeps the
  // counter increment idempotent per real mount.
  const hasCounted = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (hasCounted.current) return;
    hasCounted.current = true;

    if (isCallBooked() || isResearchDismissed()) return;
    if (recordDetailView().shouldPrompt) setOpen(true);
  }, [enabled]);

  const close = () => {
    markResearchDismissed();
    setOpen(false);
  };

  return { open, close };
}
