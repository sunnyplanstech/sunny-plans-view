import { useEffect, useRef, useState } from "react";
import type { PMTilesLayerConfig } from "./pmtilesLayers";
import {
  HATCH_PATTERN_MAPPING,
  HATCH_PATTERN_SCALE,
  getHatchAtlasUrl,
} from "./hatchPatternAtlas";

// Per-layer toggle state owned by the parent (LayerPanel writes, this
// hook reads). Kept separate from PMTilesLayerConfig so the immutable
// catalog stays decoupled from the live UI state.
export interface PMTilesLayerState {
  visible: boolean;
}

// Zoom range read from a layer's PMTiles header at runtime — the bake
// config (`min_zoom`/`max_zoom` on each `tiles_*` Dagster asset) is the
// single source of truth, so the frontend stores no zoom literals and
// can't drift from the actual tile data.
export interface LayerHeader {
  minZoom: number;
  maxZoom: number;
}

// Module-level header cache keyed by URL — survives across hook re-mounts
// (route changes, panel re-opens). Partitioned layers (e.g. NWI per state)
// share zoom range, so we only fetch one URL per layer; the cache
// dedupes if the same URL ever appears in multiple layers.
const headerCache = new Map<string, LayerHeader>();
const headerInflight = new Map<string, Promise<LayerHeader | null>>();

async function fetchHeader(
  PMTilesCtor: typeof import("pmtiles").PMTiles,
  url: string,
): Promise<LayerHeader | null> {
  const cached = headerCache.get(url);
  if (cached) return cached;
  const inflight = headerInflight.get(url);
  if (inflight) return inflight;
  const promise = (async () => {
    try {
      const pmt = getPMTiles(PMTilesCtor, url);
      const h = await pmt.getHeader();
      const out: LayerHeader = { minZoom: h.minZoom, maxZoom: h.maxZoom };
      headerCache.set(url, out);
      return out;
    } catch {
      return null;
    } finally {
      headerInflight.delete(url);
    }
  })();
  headerInflight.set(url, promise);
  return promise;
}

// Lazily code-split the deck.gl + pmtiles + loaders.gl chunks: a user
// who never opens the layer panel never pays the bundle cost. Cached as
// a module-level promise so we only import each chunk once per page
// load no matter how many maps mount.
let modulesPromise: Promise<{
  GoogleMapsOverlay: typeof import("@deck.gl/google-maps").GoogleMapsOverlay;
  TileLayer: typeof import("@deck.gl/geo-layers").TileLayer;
  GeoJsonLayer: typeof import("@deck.gl/layers").GeoJsonLayer;
  FillStyleExtension: typeof import("@deck.gl/extensions").FillStyleExtension;
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
        { FillStyleExtension },
        { PMTiles },
        { MVTLoader },
        { parse },
      ] = await Promise.all([
        import("@deck.gl/google-maps"),
        import("@deck.gl/geo-layers"),
        import("@deck.gl/layers"),
        import("@deck.gl/extensions"),
        import("pmtiles"),
        import("@loaders.gl/mvt"),
        import("@loaders.gl/core"),
      ]);
      return {
        GoogleMapsOverlay,
        TileLayer,
        GeoJsonLayer,
        FillStyleExtension,
        PMTiles,
        MVTLoader,
        parse,
      };
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
 *
 * Returns each layer's PMTiles header zoom range so callers (e.g.
 * LayerPanel) can gate UX on the actual baked range without storing
 * zoom literals on the frontend.
 */
export function usePMTilesOverlays(
  map: google.maps.Map | null,
  layers: PMTilesLayerConfig[],
  state: Record<string, PMTilesLayerState>,
): { headers: Record<string, LayerHeader> } {
  // Hold the overlay + module bag in refs so re-renders don't tear it
  // down. The cleanup in the mount effect is the only path that calls
  // setMap(null).
  const overlayRef = useRef<InstanceType<
    typeof import("@deck.gl/google-maps").GoogleMapsOverlay
  > | null>(null);
  const modsRef = useRef<Awaited<ReturnType<typeof loadDeckModules>> | null>(null);
  const [modsReady, setModsReady] = useState(false);
  const [headers, setHeaders] = useState<Record<string, LayerHeader>>({});

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
      setModsReady(true);
    });

    return () => {
      cancelled = true;
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
      setModsReady(false);
    };
  }, [map, hasLayers]);

  // Prefetch one PMTiles header per layer (partitioned layers share the
  // same zoom range across their URL set, so the first URL is enough).
  // Result drives the TileLayer's minZoom/maxZoom and LayerPanel's
  // "Zoom in" hint — bake config is the single source of truth.
  useEffect(() => {
    if (!modsReady) return;
    const mods = modsRef.current;
    if (!mods) return;
    let cancelled = false;
    for (const layer of layers) {
      const urls = layerUrls(layer);
      const url = urls[0];
      if (!url) continue;
      const cached = headerCache.get(url);
      if (cached) {
        setHeaders((prev) => (prev[layer.id] ? prev : { ...prev, [layer.id]: cached }));
        continue;
      }
      fetchHeader(mods.PMTiles, url).then((h) => {
        if (cancelled || !h) return;
        setHeaders((prev) => (prev[layer.id] ? prev : { ...prev, [layer.id]: h }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [layers, modsReady]);

  // Sync: rebuild the deck.gl layer array whenever config or state
  // changes. setProps is idempotent — deck.gl diffs by layer id.
  useEffect(() => {
    const overlay = overlayRef.current;
    const mods = modsRef.current;
    if (!overlay || !mods) return;

    // Hatch atlas is shared across every pattern-using layer — one PNG
    // data URL, one mapping, instantiated once on the client. Falls
    // back to null in non-DOM environments; the extension wiring is
    // skipped in that case and the layer renders as a plain solid fill.
    const hatchAtlasUrl = getHatchAtlasUrl();

    const visibleLayers = layers.flatMap((layer) => {
      const s = state[layer.id];
      if (!s || !s.visible) return [];
      // Skip until the header has resolved — minZoom/maxZoom on the
      // TileLayer must come from the .pmtiles file, not a guess. This
      // is a brief window on first toggle, then cached forever.
      const header = headers[layer.id];
      if (!header) return [];
      const fill = layer.fillColor;
      const line = layer.lineColor;
      const pattern = layer.pattern;
      const usePattern = pattern != null && hatchAtlasUrl != null;
      const urls = layerUrls(layer);
      return urls.map((url, i) => {
        const pmt = getPMTiles(mods.PMTiles, url);
        return new mods.TileLayer({
          // deck.gl needs unique ids; the index suffix disambiguates
          // multi-URL layers while keeping the visibility key (layer.id)
          // shared so one toggle controls the whole group.
          id: urls.length > 1 ? `pmtiles-${layer.id}-${i}` : `pmtiles-${layer.id}`,
          minZoom: header.minZoom,
          maxZoom: header.maxZoom,
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
            // Pattern fills are opt-in per layer; layers without a
            // `pattern` key get a plain solid GeoJsonLayer (slope, and
            // the no-DOM fallback path).
            const patternProps = usePattern
              ? {
                  extensions: [new mods.FillStyleExtension({ pattern: true })],
                  fillPatternAtlas: hatchAtlasUrl!,
                  fillPatternMapping: HATCH_PATTERN_MAPPING,
                  getFillPattern: () => pattern!,
                  getFillPatternScale: HATCH_PATTERN_SCALE,
                  getFillPatternOffset: [0, 0] as [number, number],
                }
              : {};
            return new mods.GeoJsonLayer({
              id: `${props.id}-geojson`,
              data: props.data as GeoJSON.Feature[],
              stroked: !!line,
              filled: true,
              getFillColor: fill,
              getLineColor: line ?? [0, 0, 0, 0],
              lineWidthUnits: "pixels",
              getLineWidth: 1,
              ...patternProps,
            });
          },
        });
      });
    });

    overlay.setProps({ layers: visibleLayers });
  }, [layers, state, headers]);

  return { headers };
}
