import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import Sitemap from 'vite-plugin-sitemap';   // ← added this line

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

      // Placeholder — replace this with your dynamic routes array when ready
      // Example: dynamicRoutes: ['/plans/abc', '/plans/xyz', ...],
      dynamicRoutes: ['/listings/'],

      // Optional minimal settings (you can delete or customize later)
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