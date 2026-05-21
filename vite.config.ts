import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Required public env vars. Empty values, or values starting with `*`
// (Netlify's masked placeholder, emitted when a var is mistakenly
// flagged is_secret=true), fail the production build instead of
// shipping a broken bundle to users.
const REQUIRED_PUBLIC_ENV = [
  "VITE_GOOGLE_MAPS_API_KEY",
  "VITE_GOOGLE_MAP_ID",
  "VITE_TURNSTILE_SITE_KEY",
] as const;

function assertPublicEnv(mode: string) {
  if (mode !== "production") return;
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const problems: string[] = [];
  for (const key of REQUIRED_PUBLIC_ENV) {
    const value = env[key] ?? "";
    if (!value) {
      problems.push(`${key} is empty`);
    } else if (value.startsWith("*")) {
      problems.push(
        `${key} starts with "*" — Netlify mask detected. Flip is_secret=false on the env var (VITE_* is public by definition).`,
      );
    }
  }
  if (problems.length) {
    throw new Error(
      `Frontend env misconfigured — production build aborted:\n  - ${problems.join("\n  - ")}`,
    );
  }
}

// Plugin to convert CSS links to non-render-blocking preload pattern
function cssPreloadPlugin(): Plugin {
  return {
    name: 'css-preload',
    enforce: 'post',
    transformIndexHtml(html) {
      // Convert CSS link tags to preload pattern for non-blocking load
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        `<link rel="preload" href="$1" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="$1"></noscript>`
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  assertPublicEnv(mode);
  return {
  server: {
    host: "::",
    port: 8080,
    // Dev-only API proxy — mirrors the prod `[[redirects]]` block in
    // netlify.toml that forwards `/api/*` to api.sunnyplans.com. Lets
    // local dev hit the prod (or any) API without browser CORS in the
    // way: requests stay same-origin from the browser's POV. With
    // `VITE_API_BASE_URL` left empty, the apiClient emits relative
    // `/api/...` paths that this proxy intercepts. Has zero effect on
    // the production bundle (Vite dev server only).
    proxy: {
      "/api": {
        target:
          process.env.VITE_DEV_API_PROXY_TARGET ?? "https://api.sunnyplans.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  optimizeDeps: {
    // Force re-optimization to avoid stale cache issues
    force: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && cssPreloadPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Emit dist/.vite/manifest.json so the static blog build
    // (scripts/build-blog.mjs) can locate the hashed Tailwind CSS bundle
    // and link it from each blog page's <head>.
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
    // Enable minification and tree shaking
    minify: 'esbuild',
    target: 'es2020',
  },
  };
});