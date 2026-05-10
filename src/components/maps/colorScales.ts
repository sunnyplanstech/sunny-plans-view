// Pure color scales shared across the map's overlays. Kept free of
// React and Google Maps so they're trivially testable and stay
// consistent between the parcel markers, hex heatmap, and choropleth.

/**
 * SunnyScore probability → marker / hex tint.
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

/**
 * Hex-cell fill opacity scaled by point count.
 * Lighter when the cell is sparse, denser when it's near the global max.
 */
export function probSolarToOpacity(pointCount: number, maxCount: number): number {
  if (maxCount === 0) return 0.3;
  return 0.25 + 0.5 * (pointCount / maxCount);
}

/**
 * County / province choropleth tint by `max_sunnyscore` (0–1).
 * Brand olive ramp; null / NaN → muted slate ("no data").
 */
export function choroplethTint(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return "#9ca3af";
  }
  const clamped = Math.max(0, Math.min(1, score));
  // hsl(75 …) is the brand olive family; lighten at low scores so the
  // ramp reads from sand → olive → deep olive at high SunnyScore.
  const lightness = 80 - clamped * 40;
  return `hsl(75, 35%, ${lightness}%)`;
}
