import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import Sitemap from 'vite-plugin-sitemap';

import { generateDynamicSeoPaths } from '@/data/seoPaths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
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
}));