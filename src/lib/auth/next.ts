/**
 * Read a `?next=` query param and validate it as a same-origin path.
 * Rejects absolute URLs, protocol-relative URLs, and empty values.
 */
export function readNextParam(search: string, fallback = "/"): string {
  const params = new URLSearchParams(search);
  const next = params.get("next");
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

/** Build `?next=<encoded>` for a target path. */
export function buildNextQuery(currentPath: string): string {
  return `?next=${encodeURIComponent(currentPath)}`;
}
