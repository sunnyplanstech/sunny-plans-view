// Pure color scales shared across the map's overlays. Kept free of
// React and Google Maps so they're trivially testable.

/**
 * SunnyScore probability → marker tint.
 * Yellow at low scores → orange at mid → red at high.
 * `prob` is clamped to [0, 1] so callers can pass raw values.
 */
export function probSolarToColor(prob: number): string {
  const clamped = Math.max(0, Math.min(1, prob));
  if (clamped <= 0.5) {
    const hue = 60 - clamped * 60;
    return `hsl(${hue}, 100%, 50%)`;
  }
  const hue = 30 - (clamped - 0.5) * 60;
  return `hsl(${hue}, 100%, 50%)`;
}
