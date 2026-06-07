// Coordinates the founder-call CTAs across the app.
//
// Suppression:
//   - sp_call_booked (localStorage): set when Calendly emits
//     `event_scheduled`. Permanent kill-switch — booked users never see
//     another prompt on this browser.
//   - sp_results_cta_dismissed (sessionStorage): set when the user waves
//     away the results-page CTA banner. Not a permanent kill-switch — it
//     re-surfaces after RESULTS_REPROMPT_AFTER further browsing actions
//     (scope/constraint changes), tracked in sp_results_actions. Session-
//     scoped, so a fresh visit always starts undismissed.
//
// Cadence:
//   - sp_detail_view_count tracks listing-detail mounts since the last
//     fire. Every RESEARCH_TRIGGER_EVERY views the auto-modal fires and
//     the counter resets. Closing without booking is not a dismiss — the
//     user pays the tax of seeing it again on the next cycle.
//   - sp_results_actions counts browsing actions since the results CTA
//     was dismissed; at RESULTS_REPROMPT_AFTER the dismissal clears and
//     the banner returns.

const KEYS = {
  booked: "sp_call_booked",
  detailViews: "sp_detail_view_count",
} as const;

// Session-scoped keys live in sessionStorage so they reset per visit.
const SESSION_KEYS = {
  resultsDismissed: "sp_results_cta_dismissed",
  resultsActions: "sp_results_actions",
} as const;

const RESEARCH_TRIGGER_EVERY = 4;
const RESULTS_REPROMPT_AFTER = 3;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    // Private-mode browsers throw on localStorage access. Treat as
    // "no flag set" — the worst case is showing a CTA we'd otherwise
    // have suppressed, which is preferable to crashing.
    return false;
  }
}

function setFlag(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Same rationale as readFlag: silently swallow private-mode errors.
  }
}

function readInt(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeInt(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Same rationale as readFlag.
  }
}

function readSessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    // Same private-mode rationale as readFlag.
    return false;
  }
}

function setSessionFlag(key: string): void {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // Same private-mode rationale as readFlag.
  }
}

function clearSessionKey(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Same private-mode rationale as readFlag.
  }
}

function readSessionInt(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeSessionInt(key: string, value: number): void {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    // Same private-mode rationale as readFlag.
  }
}

export function isCallBooked(): boolean {
  return readFlag(KEYS.booked);
}

export function markCallBooked(): void {
  setFlag(KEYS.booked);
}

/** Whether the results-page CTA is currently dismissed (within its
 *  re-prompt cooldown). */
export function isResultsCtaDismissed(): boolean {
  return readSessionFlag(SESSION_KEYS.resultsDismissed);
}

/** Dismiss the results-page CTA and start the re-prompt cooldown. The
 *  banner stays hidden until RESULTS_REPROMPT_AFTER browsing actions
 *  have been recorded via `recordResultsAction`. */
export function dismissResultsCta(): void {
  setSessionFlag(SESSION_KEYS.resultsDismissed);
  writeSessionInt(SESSION_KEYS.resultsActions, 0);
}

/** Record one results-page browsing action (a scope or constraint
 *  change). No-op unless the CTA is currently dismissed. Once
 *  RESULTS_REPROMPT_AFTER actions accumulate, the dismissal clears and
 *  the caller is told to re-show the banner. Returns whether the CTA
 *  should now become visible again. */
export function recordResultsAction(): { reprompt: boolean } {
  if (!isResultsCtaDismissed()) return { reprompt: false };

  const count = (readSessionInt(SESSION_KEYS.resultsActions) ?? 0) + 1;

  if (count >= RESULTS_REPROMPT_AFTER) {
    clearSessionKey(SESSION_KEYS.resultsDismissed);
    clearSessionKey(SESSION_KEYS.resultsActions);
    return { reprompt: true };
  }

  writeSessionInt(SESSION_KEYS.resultsActions, count);
  return { reprompt: false };
}

/** Increment the detail-view counter and report whether this view
 *  should fire the research popup. Returns `false` early when the
 *  user has already booked — callers don't need to pre-check. */
export function recordDetailView(): { shouldPrompt: boolean } {
  if (isCallBooked()) return { shouldPrompt: false };

  const count = (readInt(KEYS.detailViews) ?? 0) + 1;

  if (count >= RESEARCH_TRIGGER_EVERY) {
    writeInt(KEYS.detailViews, 0);
    return { shouldPrompt: true };
  }

  writeInt(KEYS.detailViews, count);
  return { shouldPrompt: false };
}
