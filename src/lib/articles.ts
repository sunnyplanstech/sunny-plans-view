// Blog article type definitions.
//
// Articles are parsed at build time by scripts/build-blog.ts (Node) and
// passed as props into the SSR-rendered Blog/BlogPost components. There is
// no runtime loader — the SPA does not own the blog at runtime.

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  image?: string;
  tags?: string[];
  readingTime: number;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface Article extends ArticleMeta {
  content: string;
}
