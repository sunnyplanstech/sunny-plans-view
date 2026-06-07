import { useEffect, useRef, useState } from "react";

import {
  dismissResultsCta,
  isCallBooked,
  isResultsCtaDismissed,
  markCallBooked,
  recordResultsAction,
} from "@/lib/calendlyPrompt";

interface Options {
  /** Pass `false` for paying subscribers — they're out of audience for
   *  the founder-call CTA. The hook still runs cleanly; it just stays
   *  invisible and doesn't touch the counters. */
  enabled: boolean;
  /** A string that changes whenever the user takes a meaningful results-
   *  page browsing action (scope change, constraint toggle). Each change
   *  counts as one action toward re-surfacing a dismissed CTA. */
  actionKey: string;
}

/** Drives the results-page founder-call CTA (the non-blocking banner).
 *
 *  The banner shows by default, hides when dismissed, and re-surfaces
 *  after a few more browsing actions — so a dismissal is respected
 *  without permanently silencing the offer (booking is the only
 *  permanent kill-switch). All persistence lives in `calendlyPrompt`;
 *  this hook just maps it to render state. */
export function useResultsCallPrompt({ enabled, actionKey }: Options) {
  const [booked, setBooked] = useState(() => isCallBooked());
  const [dismissed, setDismissed] = useState(() => isResultsCtaDismissed());
  const [open, setOpen] = useState(false);

  // The first effect run is the initial mount, not a user action — only
  // subsequent actionKey changes count toward the re-prompt cooldown.
  const seenInitial = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!seenInitial.current) {
      seenInitial.current = true;
      return;
    }
    if (recordResultsAction().reprompt) setDismissed(false);
  }, [enabled, actionKey]);

  const visible = enabled && !booked && !dismissed;

  const dismiss = () => {
    dismissResultsCta();
    setDismissed(true);
  };

  const onScheduled = () => {
    markCallBooked();
    setBooked(true);
  };

  return {
    visible,
    open,
    openPopup: () => setOpen(true),
    close: () => setOpen(false),
    dismiss,
    onScheduled,
  };
}
