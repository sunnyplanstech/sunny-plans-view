/**
 * Single source of truth for client-side env config.
 *
 * Every value here ships in the browser bundle — Vite inlines
 * `import.meta.env.VITE_*` at build time as string literals. Anything
 * truly secret (DB credentials, Stripe secret key, API server keys)
 * MUST live behind the Django API, never behind a `VITE_` prefix.
 *
 * The corollary: `VITE_*` env vars must NEVER be marked `is_secret=true`
 * on Netlify. The is_secret flag strips the `post_processing` scope,
 * which causes Netlify to substitute the value with its masked
 * placeholder (e.g. `****************VW9E`) in the bundled JS — silent
 * breakage at user runtime. This module catches that case explicitly.
 */
import { z } from "zod";

const notMasked = (label: string) =>
  z
    .string()
    .refine(
      (v) => !v.startsWith("*"),
      `${label} starts with "*" — this is the Netlify mask. Flip is_secret=false on the env var.`,
    );

const schema = z.object({
  VITE_GOOGLE_MAPS_API_KEY: notMasked("VITE_GOOGLE_MAPS_API_KEY").min(20),
  VITE_GOOGLE_MAP_ID: notMasked("VITE_GOOGLE_MAP_ID").min(8),
  VITE_GOOGLE_CLIENT_ID: z.string().default(""),
  VITE_TURNSTILE_SITE_KEY: z.string().default(""),
  VITE_API_BASE_URL: z.string().default(""),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid frontend env:\n${issues}`);
}

export const env = parsed.data;
