export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  image?: string;
  tags?: string[];
  readingTime: number; // minutes
  ctaLabel?: string;
  ctaUrl?: string;
}

function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export interface Article extends ArticleMeta {
  content: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    meta[key] = val;
  }
  return { meta, content: match[2] };
}

const modules = import.meta.glob("/articles/*.md", { query: "?raw", import: "default" });

export async function getArticles(): Promise<ArticleMeta[]> {
  const articles: ArticleMeta[] = [];

  for (const [path, loader] of Object.entries(modules)) {
    const raw = (await loader()) as string;
    const { meta, content } = parseFrontmatter(raw);
    const slug = path.replace("/articles/", "").replace(".md", "");
    articles.push({
      slug,
      title: meta.title || slug,
      description: meta.description || "",
      date: meta.date || "",
      author: meta.author || "",
      image: meta.image,
      tags: meta.tags ? meta.tags.split(",").map((t: string) => t.trim()) : undefined,
      readingTime: calcReadingTime(content),
      ctaLabel: meta.cta_label,
      ctaUrl: meta.cta_url,
    });
  }

  return articles.sort((a, b) => (b.date > a.date ? 1 : -1));
}

export async function getArticle(slug: string): Promise<Article | null> {
  const path = `/articles/${slug}.md`;
  const loader = modules[path];
  if (!loader) return null;

  const raw = (await loader()) as string;
  const { meta, content } = parseFrontmatter(raw);

  return {
    slug,
    title: meta.title || slug,
    description: meta.description || "",
    date: meta.date || "",
    author: meta.author || "",
    image: meta.image,
    tags: meta.tags ? meta.tags.split(",").map((t: string) => t.trim()) : undefined,
    readingTime: calcReadingTime(content),
    content,
  };
}
