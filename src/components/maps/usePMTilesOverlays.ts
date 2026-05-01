import { useEffect, useRef } from "react";
import type { PMTilesLayerConfig } from "./pmtilesLayers";

// Per-layer toggle state owned by the parent (LayerPanel writes, this
// hook reads). Kept separate from PMTilesLayerConfig so the immutable
// catalog stays decoupled from the live UI state.
export interface PMTilesLayerState {
  visible: boolean;
}

// Lazily code-split the deck.gl + pmtiles + loaders.gl chunks: a user
// who never opens the layer panel never pays the bundle cost. Cached as
// a module-level promise so we only import each chunk once per page
// load no matter how many maps mount.
let modulesPromise: Promise<{
  GoogleMapsOverlay: typeof import("@deck.gl/google-maps").GoogleMapsOverlay;
  TileLayer: typeof import("@deck.gl/geo-layers").TileLayer;
  GeoJsonLayer: typeof import("@deck.gl/layers").GeoJsonLayer;
  PMTiles: typeof import("pmtiles").PMTiles;
  MVTLoader: typeof import("@loaders.gl/mvt").MVTLoader;
  parse: typeof import("@loaders.gl/core").parse;
}> | null = null;

function loadDeckModules() {
  if (!modulesPromise) {
    modulesPromise = (async () => {
      const [
        { GoogleMapsOverlay },
        { TileLayer },
        { GeoJsonLayer },
        { PMTiles },
        { MVTLoader },
        { parse },
      ] = await Promise.all([
        import("@deck.gl/google-maps"),
        import("@deck.gl/geo-layers"),
        import("@deck.gl/layers"),
        import("pmtiles"),
        import("@loaders.gl/mvt"),
        import("@loaders.gl/core"),
      ]);
      return { GoogleMapsOverlay, TileLayer, GeoJsonLayer, PMTiles, MVTLoader, parse };
    })();
  }
  return modulesPromise;
}

// One PMTiles client per source URL, cached across re-renders so
// toggling visibility doesn't tear down the underlying HTTP
// range-request session (PMTiles caches the directory section).
// Multi-URL layers (e.g. the per-state NWI bake) share this cache —
// one client per .pmtiles file regardless of which logical layer
// references it.
const pmtilesCache = new Map<string, unknown>();

function getPMTiles(
  PMTilesCtor: typeof import("pmtiles").PMTiles,
  url: string,
) {
  let pmt = pmtilesCache.get(url) as InstanceType<typeof PMTilesCtor> | undefined;
  if (!pmt) {
    pmt = new PMTilesCtor(url);
    pmtilesCache.set(url, pmt);
  }
  return pmt;
}

function layerUrls(layer: PMTilesLayerConfig): string[] {
  if (layer.partition) return Object.values(layer.partition.urlByCode);
  return layer.url ? [layer.url] : [];
}

/**
 * Attach a deck.gl GoogleMapsOverlay to `map` and keep its layer list
 * in sync with `layers` × `state`. No-op until the map and the deck.gl
 * chunks are both ready.
 *
 * The overlay is created exactly once per mounted map; subsequent
 * state changes call `overlay.setProps({ layers })` rather than
 * recreating the WebGL canvas.
 */
export function usePMTilesOverlays(
  map: google.maps.Map | null,
  layers: PMTilesLayerConfig[],
  state: Record<string, PMTilesLayerState>,
) {
  // Hold the overlay + module bag in refs so re-renders don't tear it
  // down. The cleanup in the mount effect is the only path that calls
  // setMap(null).
  const overlayRef = useRef<InstanceType<
    typeof import("@deck.gl/google-maps").GoogleMapsOverlay
  > | null>(null);
  const modsRef = useRef<Awaited<ReturnType<typeof loadDeckModules>> | null>(null);

  // Mount: load chunks, create the overlay, attach to map. Skip the
  // whole dance if the layer catalog is empty so we don't pay bundle
  // cost on countries with no tiles configured.
  const hasLayers = layers.length > 0;
  useEffect(() => {
    if (!map || !hasLayers) return;
    let cancelled = false;

    loadDeckModules().then((mods) => {
      if (cancelled) return;
      modsRef.current = mods;
      const overlay = new mods.GoogleMapsOverlay({ layers: [] });
      overlayRef.current = overlay;
      overlay.setMap(map);
    });

    return () => {
      cancelled = true;
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
    };
  }, [map, hasLayers]);

  // Sync: rebuild the deck.gl layer array whenever config or state
  // changes. setProps is idempotent — deck.gl diffs by layer id.
  useEffect(() => {
    const overlay = overlayRef.current;
    const mods = modsRef.current;
    if (!overlay || !mods) return;

    const visibleLayers = layers.flatMap((layer) => {
      const s = state[layer.id];
      if (!s || !s.visible) return [];
      const fill = layer.fillColor;
      const line = layer.lineColor;
      const urls = layerUrls(layer);
      return urls.map((url, i) => {
        const pmt = getPMTiles(mods.PMTiles, url);
        return new mods.TileLayer({
          // deck.gl needs unique ids; the index suffix disambiguates
          // multi-URL layers while keeping the visibility key (layer.id)
          // shared so one toggle controls the whole group.
          id: urls.length > 1 ? `pmtiles-${layer.id}-${i}` : `pmtiles-${layer.id}`,
          minZoom: layer.minZoom ?? 0,
          maxZoom: layer.maxZoom ?? 14,
          getTileData: async ({ index }: { index: { x: number; y: number; z: number } }) => {
            // PMTiles range-fetch the requested tile; null means the
            // tile is empty at this z/x/y, which the renderer handles.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tile = await (pmt as any).getZxy(index.z, index.x, index.y);
            if (!tile) return null;
            return mods.parse(tile.data, mods.MVTLoader, {
              mvt: {
                coordinates: "wgs84",
                tileIndex: { x: index.x, y: index.y, z: index.z },
              },
            });
          },
          renderSubLayers: (props: { id: string; data: unknown }) => {
            if (!props.data) return null;
            return new mods.GeoJsonLayer({
              id: `${props.id}-geojson`,
              data: props.data as GeoJSON.Feature[],
              stroked: !!line,
              filled: true,
              getFillColor: fill,
              getLineColor: line ?? [0, 0, 0, 0],
              lineWidthUnits: "pixels",
              getLineWidth: 1,
            });
          },
        });
      });
    });

    overlay.setProps({ layers: visibleLayers });
  }, [layers, state]);
}
