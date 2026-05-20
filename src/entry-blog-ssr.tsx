// SSR entry for the static blog build (scripts/build-blog.ts).
//
// Loaded via Vite's `ssrLoadModule` so the path alias `@/` and CSS-less
// component imports resolve the same way they do in the browser build.
// Wraps Blog/BlogPost in the providers their imports require:
//   - QueryClientProvider: AuthProvider calls useQueryClient at construction.
//   - AuthProvider: Navbar's useAuth throws if no provider exists.
//   - StaticRouter: replaces BrowserRouter; react-router hooks (useParams,
//     useLocation, useNavigate) all work transparently under it.
//
// Auth state under SSR is { user: null, isAuthenticated: false, isLoading: true }
// because the bootstrap useEffect doesn't fire during renderToString. That
// matches what a logged-out visitor sees, which is the right baseline for
// a static page that doesn't know who's looking at it.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StaticRouter } from "react-router-dom/server";
import { renderToString } from "react-dom/server";

import { AuthProvider } from "@/contexts/AuthContext";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import type { Article, ArticleMeta } from "@/lib/articles";

// One QueryClient per SSR module load — fine because the bundle is loaded
// once per build and rendered against by every page in the same process.
const queryClient = new QueryClient();

function withProviders(url: string, node: React.ReactNode): string {
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StaticRouter location={url}>{node}</StaticRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

export interface RenderListArgs {
  url: string;
  articles: ArticleMeta[];
  basePath: string;
  heading?: string;
  subheading?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
}

export function renderBlogList(args: RenderListArgs): string {
  const { url, ...props } = args;
  return withProviders(url, <Blog {...props} />);
}

export interface RenderPostArgs {
  url: string;
  article: Article;
  basePath: string;
}

export function renderBlogPost(args: RenderPostArgs): string {
  const { url, ...props } = args;
  return withProviders(url, <BlogPost {...props} />);
}
