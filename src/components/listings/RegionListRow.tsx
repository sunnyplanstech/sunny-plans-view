// Per-scope list rows for the zoom-driven hierarchical navigation
// (roadmap p1-e3-scope-driven-rail).
//
// At country / state-or-region zoom the right rail isn't showing
// listings — it's showing the named regions that intersect the current
// viewport, ranked by max_sunnyscore. Each row is a compact summary:
//   - region name
//   - parcel count (under the default constraint stack)
//   - top SunnyScore (or em-dash for no-data regions)
//   - chevron affordance hinting at "click to dive in"
// Clicking a row tells the page to pan/zoom the map to that region's
// bbox; the URL update then follows from the normal viewport path.

import { ChevronRight } from "lucide-react";

interface RegionListRowProps {
  name: string;
  parcelCount: number;
  maxSunnyscore: number | null;
  onClick: () => void;
}

export function RegionListRow({
  name,
  parcelCount,
  maxSunnyscore,
  onClick,
}: RegionListRowProps) {
  const noData = parcelCount === 0 || maxSunnyscore === null;
  // SunnyScore is rendered 0–100 across the app; the API ships
  // `max_sunnyscore` as `prob_solar` (0–1) so multiply on the way in.
  const score =
    maxSunnyscore === null ? null : Math.round(maxSunnyscore * 100);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/30"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {parcelCount.toLocaleString()}{" "}
          {parcelCount === 1 ? "parcel" : "parcels"}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Top
          </p>
          <p
            className={
              "text-sm font-semibold tabular-nums " +
              (noData ? "text-muted-foreground/60" : "text-primary")
            }
          >
            {score ?? "—"}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
