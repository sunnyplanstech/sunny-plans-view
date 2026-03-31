import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArticles, type ArticleMeta } from "@/lib/articles";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";

const Blog = () => {
  const [articles, setArticles] = useState<ArticleMeta[]>([]);

  useEffect(() => {
    getArticles().then(setArticles);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog - Sunnyplans"
        description="Insights on solar land, BESS projects, and renewable energy site selection."
        canonicalUrl="https://sunnyplans.com/blog"
      />
      <div className="container max-w-4xl py-16 px-4">
        <Link to="/" className="text-primary hover:underline text-sm">&larr; Back to home</Link>
        <h1 className="text-4xl font-bold mt-4 mb-8">Blog</h1>
        <div className="space-y-8">
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/blog/${article.slug}`}
              className="block group"
            >
              <article className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors">
                <h2 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                  {article.title}
                </h2>
                {article.date && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(article.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {article.author && ` · ${article.author}`}
                  </p>
                )}
                {article.description && (
                  <p className="text-muted-foreground mt-2">{article.description}</p>
                )}
                {article.tags && (
                  <div className="flex gap-2 mt-3">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </Link>
          ))}
          {articles.length === 0 && (
            <p className="text-muted-foreground">No articles yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
