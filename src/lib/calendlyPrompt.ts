// Coordinates the founder-call CTAs across the app.
//
// Two suppression flags govern when prompts fire:
//   - sp_call_booked: set when Calendly emits `event_scheduled`.
//     Global suppressor — kills both the research popup and the inline
//     paywall CTA. Booked users should never see another founder-call
//     prompt.
//   - sp_call_research_dismissed: set when the user closes the research
//     popup without booking. Suppresses only the research popup; the
//     paywall CTA still appears, because declining a research chat
//     doesn't mean the user has decided against talking before paying.
//
// `sp_detail_view_count` tracks listing-detail mounts for the research
// popup's N-views trigger. The popup fires exactly once (at view N);
// closing it sets the research-dismissed flag so subsequent views
// don't re-trigger.

const KEYS = {
  booked: "sp_call_booked",
  researchDismissed: "sp_call_research_dismissed",
  detailViews: "sp_detail_view_count",
} as const;

const RESEARCH_TRIGGER_AT = 8;

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

export function isCallBooked(): boolean {
  return readFlag(KEYS.booked);
}

export function isResearchDismissed(): boolean {
  return readFlag(KEYS.researchDismissed);
}

export function markCallBooked(): void {
  setFlag(KEYS.booked);
}

export function markResearchDismissed(): void {
  setFlag(KEYS.researchDismissed);
}

/** Increment the detail-view counter and report whether this view
 *  should fire the research popup. Returns `false` early when the
 *  user has already booked or dismissed — callers don't need to
 *  pre-check those flags. */
export function recordDetailView(): { shouldPrompt: boolean } {
  if (isCallBooked() || isResearchDismissed()) return { shouldPrompt: false };

  let count = 0;
  try {
    const raw = localStorage.getItem(KEYS.detailViews);
    count = raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return { shouldPrompt: false };
  }

  count += 1;

  try {
    localStorage.setItem(KEYS.detailViews, String(count));
  } catch {
    // Counter persistence failed — fall through and fire the prompt
    // anyway if the threshold is met. We'd rather over-prompt once
    // than never prompt at all in this edge case.
  }

  return { shouldPrompt: count === RESEARCH_TRIGGER_AT };
}
