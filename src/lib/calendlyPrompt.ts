// Coordinates the founder-call CTAs across the app.
//
// Suppression:
//   - sp_call_booked: set when Calendly emits `event_scheduled`.
//     Permanent kill-switch — booked users never see another prompt.
//
// Cadence:
//   - sp_detail_view_count tracks listing-detail mounts since the last
//     fire. Every RESEARCH_TRIGGER_EVERY views the popup fires and the
//     counter resets. Closing without booking is not a dismiss — the
//     user pays the tax of seeing it again on the next cycle.

const KEYS = {
  booked: "sp_call_booked",
  detailViews: "sp_detail_view_count",
} as const;

const RESEARCH_TRIGGER_EVERY = 4;

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

export function isCallBooked(): boolean {
  return readFlag(KEYS.booked);
}

export function markCallBooked(): void {
  setFlag(KEYS.booked);
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
