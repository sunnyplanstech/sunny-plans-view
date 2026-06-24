import * as duckdb from "@duckdb/duckdb-wasm";

// Lazy, single shared DuckDB-WASM instance. The WASM bundle is several MB,
// so it's only instantiated the first time a query runs (i.e. on the map
// route, never on the landing page). Bundles are pulled from jsDelivr so we
// don't have to wire the worker/wasm assets through Vite.

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

async function instantiate(): Promise<duckdb.AsyncDuckDB> {
  const bundles = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(bundles);

  // The worker has to be same-origin, so wrap the cross-origin bundle URL
  // in a Blob that importScripts() it — the standard duckdb-wasm pattern.
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: "text/javascript",
    }),
  );
  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  return db;
}

function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) dbPromise = instantiate();
  return dbPromise;
}

/**
 * Run a read-only SQL query and return the rows as plain JS objects.
 * BIGINT columns must be cast to INTEGER/DOUBLE in the SQL itself —
 * Arrow surfaces raw BIGINT as JS `bigint`, which React Query and JSON
 * can't serialize. JSON columns should be cast to VARCHAR and parsed by
 * the caller.
 */
export async function runQuery<T = Record<string, unknown>>(
  sql: string,
): Promise<T[]> {
  const db = await getDuckDB();
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    return result.toArray().map((row) => coerceBigInts(row.toJSON()) as T);
  } finally {
    await conn.close();
  }
}

// Arrow returns BIGINT (and HUGEINT) columns as JS `bigint`, which React
// Query state and JSON.stringify both choke on. Our id-rank/count values
// all fit in a double, so widen them at the boundary.
function coerceBigInts(row: Record<string, unknown>): Record<string, unknown> {
  for (const key in row) {
    if (typeof row[key] === "bigint") row[key] = Number(row[key]);
  }
  return row;
}

/** Escape a string for safe interpolation as a SQL single-quoted literal. */
export function sqlStr(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
