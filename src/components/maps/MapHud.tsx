interface MapHudProps {
  country?: string;
  regionSlug?: string;
  zoom: number | undefined;
  choroplethVisible: boolean;
  choroplethCount: number;
  listingCount: number;
  overlayCount: number;
}

/**
 * Floating top-left HUD shown only in the layer-first preview. Surfaces
 * scope, current zoom, the number of features being rendered (areas vs
 * parcels), and the count of active overlays.
 */
export function MapHud({
  country,
  regionSlug,
  zoom,
  choroplethVisible,
  choroplethCount,
  listingCount,
  overlayCount,
}: MapHudProps) {
  const scopeLabel = country === "italy" ? "IT" : "US";
  const regionLabel = regionSlug ? ` · ${regionSlug.toUpperCase()}` : "";
  const featureLabel = choroplethVisible ? "Areas" : "N";
  const featureCount = choroplethVisible ? choroplethCount : listingCount;

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
        <span>{featureLabel}</span>
        <b className="tabular-nums">{featureCount}</b>
        <span className="opacity-50">·</span>
        <span>Ovl</span>
        <b className="tabular-nums">{overlayCount}</b>
      </div>
    </div>
  );
}
