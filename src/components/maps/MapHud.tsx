interface MapHudProps {
  country?: string;
  regionSlug?: string;
  zoom: number | undefined;
  listingCount: number;
  overlayCount: number;
}

/**
 * Floating top-left HUD shown only in the layer-first preview. Surfaces
 * scope, current zoom, the number of parcel pins on the map, and the
 * count of active overlays.
 */
export function MapHud({
  country,
  regionSlug,
  zoom,
  listingCount,
  overlayCount,
}: MapHudProps) {
  const scopeLabel = country === "italy" ? "IT" : "US";
  const regionLabel = regionSlug ? ` · ${regionSlug.toUpperCase()}` : "";

  return (
    <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
      <div className="tp-hud">
        <span>Scope</span>
        <b>
          {scopeLabel}
          {regionLabel}
        </b>
      </div>
      <div className="tp-hud">
        <span>Z</span>
        <b className="tabular-nums">{zoom !== undefined ? zoom : "—"}</b>
        <span className="opacity-50">·</span>
        <span>N</span>
        <b className="tabular-nums">{listingCount}</b>
        <span className="opacity-50">·</span>
        <span>Ovl</span>
        <b className="tabular-nums">{overlayCount}</b>
      </div>
    </div>
  );
}
