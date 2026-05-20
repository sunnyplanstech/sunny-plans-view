import { Link } from "react-router-dom";
import type { ArticleMeta } from "@/lib/articles";
import SEOHead from "@/components/listings/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Clock } from "lucide-react";

export interface BlogProps {
  articles: ArticleMeta[];
  // Vertical-namespaced base path, e.g. "/solar/blog" or "/vanlife/blog".
  // Article cards build their hrefs as `${basePath}/${slug}`.
  basePath: string;
  // Optional override for the page <h1> + meta. Defaults to the solar copy.
  heading?: string;
  subheading?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
}

const Blog = ({
  articles,
  basePath,
  heading = "Insights on Renewable Energy Land",
  subheading = "Market analysis, site selection strategies, and SunnyScore deep dives for solar & BESS developers.",
  seoTitle = "Blog - Sunnyplans",
  seoDescription = "Insights on solar land, BESS projects, and renewable energy site selection.",
  canonicalUrl = "https://sunnyplans.com/solar/blog",
}: BlogProps) => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title={seoTitle}
      description={seoDescription}
      canonicalUrl={canonicalUrl}
    />
    <Navbar />

    {/* Header */}
    <div className="bg-gradient-subtle border-b border-border pt-32 pb-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
          Sunnyplans Blog
        </p>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
          {heading}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">{subheading}</p>
      </div>
    </div>

    {/* Articles */}
    <div className="container max-w-6xl py-16 px-4 mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {articles.map((article) => (
          <Link
            key={article.slug}
            to={`${basePath}/${article.slug}`}
            className="block group"
          >
            <article className="h-full flex flex-col p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200">
              <div className="flex-1">
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
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
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {article.title}
                </h2>
                {article.description && (
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed line-clamp-3">
                    {article.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {article.date && (
                    <span>
                      {new Date(article.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <span className="text-muted-foreground/40">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readingTime} min
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </article>
          </Link>
        ))}
        {articles.length === 0 && (
          <div className="py-24 text-center text-muted-foreground">
            <p className="text-lg">No articles yet — check back soon.</p>
          </div>
        )}
      </div>
    </div>

    <Footer />
  </div>
);

export default Blog;
