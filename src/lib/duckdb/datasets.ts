import { env } from "@/env";

// The browser DuckDB-WASM client reads these mart parquet files directly
// from a public GCS bucket over HTTP range requests — replacing the Django
// serving layer. Each file is a SINGLE parquet (not hive-partitioned):
// duckdb-wasm cannot glob a remote directory (no HTTP listing), and every
// serving mart is small enough to ship as one file (the public_top slices
// are ~20–50k rows / <5 MB; the polygon marts are ≤3k rows). The pipeline
// publishes them here — see DUCKDB_MIGRATION.md.
//
// Only the *obfuscated* public marts are published: jittered coordinates,
// perturbed prices/areas, no source URL or cadastral id. The full-precision
// marts stay in the private pipeline bucket and are never exposed.

/** Base URL of the public data bucket, no trailing slash. */
export const DATA_BASE_URL = env.VITE_DATA_BASE_URL.replace(/\/$/, "");

/** True when the DuckDB-WASM data path is configured (vs. the Django API). */
export const DATA_BACKEND_ENABLED = DATA_BASE_URL.length > 0;

/** Logical dataset name → published parquet filename. */
const DATASETS = {
  usListings: "us_listings_public_top.parquet",
  itListings: "it_parcels_public_top.parquet",
  usStates: "us_states.parquet",
  usCounties: "us_counties.parquet",
  itRegions: "it_regions.parquet",
  itProvinces: "it_provinces.parquet",
} as const;

export type DatasetName = keyof typeof DATASETS;

/** Full HTTPS URL of a dataset's parquet file, usable in read_parquet(). */
export function datasetUrl(name: DatasetName): string {
  return `${DATA_BASE_URL}/${DATASETS[name]}`;
}
