import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import Sitemap from 'vite-plugin-sitemap';

import { generateDynamicSeoPaths } from './src/data/seoPaths';

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
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  optimizeDeps: {
    // Force re-optimization to avoid stale cache issues
    force: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && cssPreloadPlugin(),
    Sitemap({
      hostname: 'https://sunnyplans.com',

      dynamicRoutes: generateDynamicSeoPaths(),

      generateRobotsTxt: true,
      changefreq: 'weekly',
      priority: 0.7,
      exclude: ['/404', '/admin/*'],
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
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
}));