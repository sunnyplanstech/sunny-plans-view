import { useCallback, useEffect, useMemo, useState } from "react";
import {
  pmtilesLayersFor,
  type PMTilesLayerConfig,
} from "./pmtilesLayers";
import type { PMTilesLayerState } from "./usePMTilesOverlays";

interface UsePMTilesLayerStateArgs {
  country?: string;
  regionSlug?: string;
  /**
   * When provided, the parent owns layer selection (layer-first
   * preview). Local toggles still update `panelState` for symmetry,
   * but `effectiveState` is derived from this set so the live overlays
   * follow the parent's intent.
   */
  pageControlledIds?: ReadonlySet<string>;
}

interface UsePMTilesLayerStateResult {
  layers: PMTilesLayerConfig[];
  /** Visibility map fed to `usePMTilesOverlays`. */
  effectiveState: Record<string, PMTilesLayerState>;
  /** Backing store for the in-map LayerPanel rows. */
  panelState: Record<string, PMTilesLayerState>;
  toggle: (id: string) => void;
}

function seedState(
  layers: PMTilesLayerConfig[],
): Record<string, PMTilesLayerState> {
  return Object.fromEntries(
    layers.map((l) => [l.id, { visible: l.defaultVisible ?? false }]),
  );
}

/**
 * Owns the PMTiles overlay catalog + visibility state for a map.
 *
 * Two operating modes:
 *   - in-map control (default): `panelState` is the source of truth,
 *     toggled by the LayerPanel rows.
 *   - page control (`pageControlledIds` set): the parent's selection
 *     drives `effectiveState`; the in-map rows are usually hidden.
 *
 * The catalog re-seeds when `country`/`regionSlug` change, so the
 * default-visible layers reset on country switch.
 */
export function usePMTilesLayerState({
  country,
  regionSlug,
  pageControlledIds,
}: UsePMTilesLayerStateArgs): UsePMTilesLayerStateResult {
  const layers = useMemo(
    () => pmtilesLayersFor(country, regionSlug),
    [country, regionSlug],
  );

  const [panelState, setPanelState] = useState<Record<string, PMTilesLayerState>>(
    () => seedState(layers),
  );
  useEffect(() => {
    setPanelState(seedState(layers));
  }, [layers]);

  const toggle = useCallback((id: string) => {
    setPanelState((prev) => ({
      ...prev,
      [id]: { visible: !prev[id]?.visible },
    }));
  }, []);

  const effectiveState = useMemo(() => {
    if (pageControlledIds === undefined) return panelState;
    return Object.fromEntries(
      layers.map((l) => [l.id, { visible: pageControlledIds.has(l.id) }]),
    );
  }, [pageControlledIds, panelState, layers]);

  return { layers, effectiveState, panelState, toggle };
}
