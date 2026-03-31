import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getArticle, type Article } from "@/lib/articles";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";
import NotFound from "./NotFound";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);

  useEffect(() => {
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
      <div className="container max-w-3xl py-16 px-4">
        <Link to="/blog" className="text-primary hover:underline text-sm">&larr; Back to blog</Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">{article.title}</h1>
        {article.date && (
          <p className="text-sm text-muted-foreground mb-8">
            {new Date(article.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {article.author && ` · ${article.author}`}
          </p>
        )}
        <article className="prose prose-neutral dark:prose-invert max-w-none">
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
