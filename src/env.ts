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

// .refine() must come LAST in the chain — it returns ZodEffects, which
// drops the string-builder methods (.min(), etc.).
const publicString = (label: string, minLen: number) =>
  z
    .string()
    .min(minLen)
    .refine(
      (v) => !v.startsWith("*"),
      `${label} starts with "*" — this is the Netlify mask. Flip is_secret=false on the env var.`,
    );

// SunnyPlans is switched off — the app is a single static notice. None of
// the former runtime keys (Maps, Map ID, Turnstile, API base) are used, so
// they're all optional and never throw. `publicString` is kept for whenever
// the product is restored from git history.
void publicString;
const schema = z.object({
  VITE_GOOGLE_MAPS_API_KEY: z.string().default(""),
  VITE_GOOGLE_MAP_ID: z.string().default(""),
  VITE_TURNSTILE_SITE_KEY: z.string().default(""),
  VITE_GOOGLE_CLIENT_ID: z.string().default(""),
  VITE_SENTRY_DSN: z.string().default(""),
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
