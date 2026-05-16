// useUrlSpecState — bidirectional binding between the listings page's
// "project spec" (selected constraints + sort key) and the browser
// URL's search params.
//
// Why URL state? Selections are the user's spec, not page-local
// chrome. Persisting them in the URL makes specs reload-safe,
// shareable (sales demos, internal QA, pSEO targeting), and survives
// scope navigation (`/united-states` → `/united-states/alabama` keeps
// the spec attached). Free win — no backend, no auth.
//
// Encoding:
//   - `c=slope_lt_5_us,nwi_us`  selected constraint ids (csv)
//   - `s=price_per_acre`        sort key (omitted when default)
//
// History strategy:
//   - Hydrate once from the URL on mount. If `c=` is absent the
//     factory seeds defaults from `Layer.defaultSelected` (overlay-
//     only layers that should be visible on first paint); if `c=` is
//     present, even as an empty string, that's the user's spec and
//     we respect it verbatim.
//   - On change, write back via `replace: true` so toggles don't
//     pile entries into the browser back-button stack. Once the user
//     interacts (toggle or clear) we always emit `c=`, including the
//     empty value, so a deliberate Clear survives a reload.
//
// Validation:
//   - Unknown constraint ids in the URL are silently dropped (the
//     registry filters by country, so a spec from one country may
//     reference layers that don't exist on another — that's not an
//     error, just a no-op for the missing ones).
//   - Unknown sort keys fall back to the default.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_SORT_KEY,
  SORT_OPTIONS,
  type SortKey,
} from "@/components/listings/sortListings";
import type { Layer } from "./registry";

const PARAM_CONSTRAINTS = "c";
const PARAM_SORT = "s";

interface UrlSpecState {
  selectedIds: Set<string>;
  sortKey: SortKey;
  toggleConstraint: (id: string) => void;
  clearConstraints: () => void;
  setSortKey: (key: SortKey) => void;
}

function parseConstraintIds(
  raw: string | null,
  available: Layer[],
): Set<string> {
  if (!raw) return new Set();
  const valid = new Set(available.map((l) => l.id));
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && valid.has(s));
  return new Set(ids);
}

function defaultSelectedIds(available: Layer[]): Set<string> {
  return new Set(available.filter((l) => l.defaultSelected).map((l) => l.id));
}

function parseSortKey(raw: string | null): SortKey {
  if (!raw) return DEFAULT_SORT_KEY;
  const known = SORT_OPTIONS.some((o) => o.key === raw);
  return known ? (raw as SortKey) : DEFAULT_SORT_KEY;
}

// Stable string for diffing a Set of constraint ids — selection order
// follows the registry order so the URL is deterministic across users.
function encodeConstraintIds(ids: Set<string>, available: Layer[]): string {
  return available
    .filter((l) => ids.has(l.id))
    .map((l) => l.id)
    .join(",");
}

export function useUrlSpecState(availableLayers: Layer[]): UrlSpecState {
  const [searchParams, setSearchParams] = useSearchParams();

  // Hydrate once from URL. Subsequent URL changes from outside the page
  // (e.g. user pasting a spec link in the address bar) are not picked
  // up — that would require the page to surrender authority over its
  // own state, which is more complexity than this v1 needs.
  const hydrated = useRef(false);
  // `c=` absent on first mount → seed defaults. `c=` present (even
  // empty) → user has prior state, respect it verbatim.
  const hadInitialConstraints = useRef(
    searchParams.has(PARAM_CONSTRAINTS),
  );
  // Flips on the first toggle/clear; once true the write-back always
  // emits `c=` (even when empty) so a deliberate clear is sticky.
  const userInteracted = useRef(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const raw = searchParams.get(PARAM_CONSTRAINTS);
    if (raw === null) return defaultSelectedIds(availableLayers);
    return parseConstraintIds(raw, availableLayers);
  });
  const [sortKey, setSortKeyState] = useState<SortKey>(() =>
    parseSortKey(searchParams.get(PARAM_SORT)),
  );

  // If the available-layers set changes after mount (e.g. country
  // switch via navigation), drop any selection that no longer exists.
  // We don't reset back to URL here — the page state is authoritative
  // post-hydration.
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    setSelectedIds((prev) => {
      const valid = new Set(availableLayers.map((l) => l.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (valid.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [availableLayers]);

  // Push state → URL. Replace history so toggling doesn't bloat the
  // back-button stack. Before the user has touched the bar, suppress
  // writes that would only re-emit the default seed — keeps the
  // landing URL clean. After the user interacts, always emit `c=`
  // (including the empty string) so a Clear is preserved on reload.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const csv = encodeConstraintIds(selectedIds, availableLayers);
    const shouldEmit =
      userInteracted.current ||
      hadInitialConstraints.current ||
      csv !== encodeConstraintIds(defaultSelectedIds(availableLayers), availableLayers);
    if (shouldEmit) next.set(PARAM_CONSTRAINTS, csv);
    else next.delete(PARAM_CONSTRAINTS);
    if (sortKey !== DEFAULT_SORT_KEY) next.set(PARAM_SORT, sortKey);
    else next.delete(PARAM_SORT);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // searchParams intentionally omitted from deps: we read from it but
    // diff via toString() to decide whether to write. Including it
    // would loop on every URL update we ourselves trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, sortKey, availableLayers, setSearchParams]);

  const toggleConstraint = useCallback((id: string) => {
    userInteracted.current = true;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearConstraints = useCallback(() => {
    userInteracted.current = true;
    setSelectedIds(new Set());
  }, []);

  const setSortKey = useCallback((key: SortKey) => setSortKeyState(key), []);

  return useMemo(
    () => ({
      selectedIds,
      sortKey,
      toggleConstraint,
      clearConstraints,
      setSortKey,
    }),
    [selectedIds, sortKey, toggleConstraint, clearConstraints, setSortKey],
  );
}
