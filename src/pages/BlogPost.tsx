import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getArticle, type Article } from "@/lib/articles";
import SEOHead from "@/components/listings/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotFound from "./NotFound";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) {
      getArticle(slug).then(setArticle);
    }
  }, [slug]);

  if (article === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (article === null) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${article.title} - Sunnyplans Blog`}
        description={article.description}
        canonicalUrl={`https://sunnyplans.com/blog/${article.slug}`}
      />
      <Navbar />

      <div className="container max-w-3xl py-32 px-4 mx-auto">
        {/* Back link */}
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-10">
          ← Back to blog
        </Link>

        {/* Post header */}
        <header className="mb-10">
          {article.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-3">
            {article.title}
          </h1>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-3">
            {article.date && (
              <span>{new Date(article.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</span>
            )}
            {article.author && <><span className="text-muted-foreground/40">·</span><span>{article.author}</span></>}
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {article.readingTime} min read
            </span>
          </p>
        </header>

        <div className="border-t border-border mb-10" />

        {/* Article body — brand-matched prose */}
        <article className="
          prose max-w-none
          prose-headings:text-foreground prose-headings:font-bold
          prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-lg md:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-5
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground
          prose-li:text-foreground/80
          prose-ul:my-4 prose-ol:my-4
          prose-code:text-primary prose-code:bg-primary/8 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
          prose-pre:bg-muted prose-pre:border prose-pre:border-border
          prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
          prose-hr:border-border
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </article>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPost;
