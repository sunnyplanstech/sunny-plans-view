// Short uppercase tag for a layer id — used as the terminal-style chip
// prefix in the constraint bar, the listings cards, and the evaluate
// drawer's pass/fail strip. Kept separate from `ConstraintBar.tsx` so
// non-component consumers don't trip the react-refresh rule.
export function layerTag(id: string): string {
  if (id.startsWith("slope_lt_5")) return "SLOPE";
  if (id.startsWith("natura2000")) return "N2K";
  if (id.startsWith("nwi")) return "NWI";
  if (id.startsWith("pad")) return "PAD";
  return id.split("_")[0].slice(0, 5).toUpperCase();
}
