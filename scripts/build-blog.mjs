/**
 * Static blog build — runs after `vite build` (the SPA build) in `npm run
 * build`. For each vertical under `articles/<vertical>/`, this script:
 *
 *   1. Parses markdown files with gray-matter for frontmatter.
 *   2. Loads the SSR entry (src/entry-blog-ssr.tsx) through Vite's
 *      ssrLoadModule so component imports resolve via the project's
 *      alias config — no separate SSR Vite build step.
 *   3. Renders Blog (list) and BlogPost (per article) to HTML strings.
 *   4. Stitches each render into scripts/blog-template.html with
 *      per-page <head> tags populated from frontmatter.
 *   5. Writes the result to dist/<vertical>/blog/{index,<slug>/index}.html.
 *   6. Emits dist/<vertical>/blog/sitemap.xml listing all article URLs +
 *      the vertical's blog index URL.
 *
 * The Tailwind CSS bundle the SPA emits is referenced from dist/.vite/
 * manifest.json (we enable manifest output in vite.config.ts). Without
 * that link, the blog renders unstyled.
 *
 * Verticals with no articles are skipped silently so a brand-new vertical
 * folder (just a .gitkeep) doesn't fail the build.
 *
 * Hydration: v1 ships static-only — the React Navbar renders in its
 * default state (logged out, scroll=false, mobile menu closed) and there
 * is no JS to make the mobile menu interactive on blog pages. Consistent
 * with the existing pSEO surface; matches the brand chrome visually.
 * Visitors reach other sections via Footer links or the logo home link.
 */

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { createServer } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ARTICLES_DIR = join(ROOT, "articles");
const DIST_DIR = join(ROOT, "dist");
const TEMPLATE_PATH = join(__dirname, "blog-template.html");
const SSR_ENTRY = "/src/entry-blog-ssr.tsx";
const MANIFEST_PATH = join(DIST_DIR, ".vite", "manifest.json");

const SITE_ORIGIN = "https://sunnyplans.com";
const VERTICALS = ["solar", "vanlife"];

// Vertical-specific copy for the blog index page. Keeping it here (rather
// than per-vertical config files) is fine while there are only a couple
// of verticals; promote to a config table once that grows.
const VERTICAL_META = {
  solar: {
    heading: "Insights on Renewable Energy Land",
    subheading:
      "Market analysis, site selection strategies, and SunnyScore deep dives for solar & BESS developers.",
    seoTitle: "Blog — Sunnyplans",
    seoDescription:
      "Insights on solar land, BESS projects, and renewable energy site selection.",
  },
  vanlife: {
    heading: "Van Life Land & Stopover Insights",
    subheading: "Land guides and trip planning notes for van travellers.",
    seoTitle: "Van Life Blog — Sunnyplans",
    seoDescription: "Land guides for van travellers and stopover planning.",
  },
};

// ── helpers ─────────────────────────────────────────────────────────────

function calcReadingTime(content) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function parseTags(raw) {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw.map(String);
  return String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function listArticleSlugs(vertical) {
  const dir = join(ARTICLES_DIR, vertical);
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  return entries
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

async function loadArticle(vertical, slug) {
  const raw = await readFile(join(ARTICLES_DIR, vertical, `${slug}.md`), "utf8");
  const parsed = matter(raw);
  const data = parsed.data;
  return {
    slug,
    title: data.title || slug,
    description: data.description || "",
    date: data.date || "",
    author: data.author || "",
    image: data.image,
    tags: parseTags(data.tags),
    readingTime: calcReadingTime(parsed.content),
    ctaLabel: data.cta_label,
    ctaUrl: data.cta_url,
    content: parsed.content,
  };
}

function metaOnly(article) {
  // Strip content for list-page shape. Keeping a single Article type +
  // narrowing here avoids parallel parsers for "meta" vs "full".
  const { content: _content, ...meta } = article;
  return meta;
}

function sortByDateDesc(articles) {
  return [...articles].sort((a, b) => (b.date > a.date ? 1 : -1));
}

async function loadManifestCssLinks() {
  // dist/.vite/manifest.json keys point at source files; the entry for
  // src/main.tsx carries the hashed CSS asset emitted for the SPA. We
  // pull every CSS file the entry references so any code-split CSS lands
  // on the blog page too.
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Vite manifest not found at ${MANIFEST_PATH}. Did 'vite build' run before this script, and is 'build.manifest' enabled in vite.config.ts?`,
    );
  }
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const entry =
    manifest["src/main.tsx"] ||
    Object.values(manifest).find((e) => e.isEntry);
  if (!entry) {
    throw new Error("No entry found in Vite manifest — cannot locate CSS bundle.");
  }
  const css = entry.css || [];
  return css.map((href) => `<link rel="stylesheet" href="/${href}" />`).join("\n    ");
}

function escapeHtmlAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) {
      throw new Error(`Missing template variable: ${key}`);
    }
    return vars[key];
  });
}

function renderSitemap(urls) {
  const items = urls
    .map(
      (loc) =>
        `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

async function writeOut(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

// ── render orchestration ────────────────────────────────────────────────

async function renderVertical(vertical, ssrModule, template, cssLinks) {
  const slugs = await listArticleSlugs(vertical);
  if (slugs.length === 0) {
    console.log(`[blog] ${vertical}: no articles, skipping`);
    return { count: 0, urls: [] };
  }

  const articles = sortByDateDesc(
    await Promise.all(slugs.map((slug) => loadArticle(vertical, slug))),
  );

  const basePath = `/${vertical}/blog`;
  const verticalDistDir = join(DIST_DIR, vertical, "blog");
  const meta = VERTICAL_META[vertical] || VERTICAL_META.solar;

  // List page.
  const listHtml = ssrModule.renderBlogList({
    url: basePath,
    articles: articles.map(metaOnly),
    basePath,
    heading: meta.heading,
    subheading: meta.subheading,
    seoTitle: meta.seoTitle,
    seoDescription: meta.seoDescription,
    canonicalUrl: `${SITE_ORIGIN}${basePath}`,
  });
  await writeOut(
    join(verticalDistDir, "index.html"),
    renderTemplate(template, {
      title: escapeHtmlAttr(meta.seoTitle),
      description: escapeHtmlAttr(meta.seoDescription),
      canonicalUrl: `${SITE_ORIGIN}${basePath}`,
      ogType: "website",
      cssLinks,
      ssrBody: listHtml,
    }),
  );

  // Article pages.
  for (const article of articles) {
    const articleUrl = `${basePath}/${article.slug}`;
    const postHtml = ssrModule.renderBlogPost({
      url: articleUrl,
      article,
      basePath,
    });
    await writeOut(
      join(verticalDistDir, article.slug, "index.html"),
      renderTemplate(template, {
        title: escapeHtmlAttr(`${article.title} — Sunnyplans Blog`),
        description: escapeHtmlAttr(article.description),
        canonicalUrl: `${SITE_ORIGIN}${articleUrl}`,
        ogType: "article",
        cssLinks,
        ssrBody: postHtml,
      }),
    );
  }

  // Per-vertical sitemap. The top-level pipeline-owned sitemap.xml index
  // references this file by URL (see pipelines/core/seo/static_seo_sitemap.py).
  const urls = [
    `${SITE_ORIGIN}${basePath}`,
    ...articles.map((a) => `${SITE_ORIGIN}${basePath}/${a.slug}`),
  ];
  await writeOut(join(verticalDistDir, "sitemap.xml"), renderSitemap(urls));

  console.log(`[blog] ${vertical}: rendered ${articles.length} articles + index + sitemap`);
  return { count: articles.length, urls };
}

// ── main ────────────────────────────────────────────────────────────────

async function main() {
  const template = await readFile(TEMPLATE_PATH, "utf8");
  const cssLinks = await loadManifestCssLinks();

  // Vite in middleware mode lets us ssrLoadModule the SSR entry without
  // a separate `vite build --ssr` step. Faster, simpler, no second bundle
  // on disk to invalidate.
  const vite = await createServer({
    root: ROOT,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "warn",
  });

  try {
    const ssrModule = await vite.ssrLoadModule(SSR_ENTRY);
    let total = 0;
    for (const vertical of VERTICALS) {
      const { count } = await renderVertical(vertical, ssrModule, template, cssLinks);
      total += count;
    }
    console.log(`[blog] done: ${total} articles across ${VERTICALS.length} verticals`);
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error("[blog] build failed:", err);
  process.exit(1);
});
