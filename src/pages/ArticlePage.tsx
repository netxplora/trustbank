import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, ArrowLeft, Clock, Tag, Share2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FadeIn, SlideUp } from "@/components/public/Motion";

interface Article {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  category: string;
  status: string;
  published_at: string;
  created_at: string;
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<Article[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) fetchArticle(slug);
  }, [slug]);

  const fetchArticle = async (articleSlug: string) => {
    setLoading(true);
    try {
      // Try fetching by slug first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as unknown as any)
        .from("cms_posts")
        .select("*")
        .eq("slug", articleSlug)
        .eq("status", "published")
        .single();

      // If no slug match, try by ID
      let finalData = data;
      if (!finalData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (supabase as unknown as any)
          .from("cms_posts")
          .select("*")
          .eq("id", articleSlug)
          .eq("status", "published")
          .single();
        finalData = result.data;
      }

      if (finalData) {
        setArticle(finalData as Article);
        // Fetch related posts from same category
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: related } = await (supabase as unknown as any)
          .from("cms_posts")
          .select("id, title, slug, summary, image_url, category, published_at")
          .eq("status", "published")
          .eq("category", finalData.category)
          .neq("id", finalData.id)
          .order("published_at", { ascending: false })
          .limit(3);
        if (related) setRelatedPosts(related as Article[]);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      console.error("Error fetching article:", e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const estimateReadTime = (text: string | null) => {
    if (!text) return "2 min read";
    const words = text.split(/\s+/).length;
    const mins = Math.max(2, Math.ceil(words / 200));
    return `${mins} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <FadeIn className="text-center max-w-md">
          <h1 className="text-4xl font-bold font-poppins mb-4 text-foreground">Article Not Found</h1>
          <p className="text-muted-foreground font-sans mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="font-bold">
            <Link to="/news">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to News
            </Link>
          </Button>
        </FadeIn>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-background border-b">
        {article.image_url && (
          <div className="absolute inset-0 z-0">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
          </div>
        )}
        <div className="relative z-10 container px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <FadeIn>
            <Link
              to="/news"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-secondary transition-colors uppercase tracking-wider mb-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Publications
            </Link>

            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest border border-primary/20">
                  <Tag className="h-3 w-3 inline mr-1.5" />
                  {article.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(article.published_at)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  {estimateReadTime(article.content)}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-poppins text-foreground leading-tight mb-6">
                {article.title}
              </h1>

              {article.summary && (
                <p className="text-lg text-muted-foreground font-sans leading-relaxed max-w-2xl">
                  {article.summary}
                </p>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Article Body */}
      <section className="py-16 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <SlideUp>
              {/* Featured Image */}
              {article.image_url && (
                <div className="rounded-2xl overflow-hidden border shadow-sm mb-12">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="prose prose-lg max-w-none font-sans text-foreground/90 leading-relaxed">
                {article.content ? (
                  article.content.split("\n").map((paragraph, idx) =>
                    paragraph.trim() ? (
                      <p key={idx} className="mb-5 text-base leading-[1.85]">
                        {paragraph}
                      </p>
                    ) : (
                      <br key={idx} />
                    )
                  )
                ) : (
                  <p className="text-muted-foreground italic">
                    Full article content is not available at this time.
                  </p>
                )}
              </div>

              {/* Share Bar */}
              <div className="mt-12 pt-8 border-t flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                  <Share2 className="h-4 w-4" />
                  Share this article
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-success" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                    </>
                  )}
                </Button>
              </div>
            </SlideUp>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-surface border-t">
          <div className="container px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold font-poppins text-foreground mb-8">
              Related Publications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/news/${post.slug || post.id}`}
                  className="group bg-card rounded-3xl border overflow-hidden hover-lift transition-all shadow-sm"
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80 text-xs font-bold text-muted-foreground uppercase">
                        {post.category}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground font-semibold mb-2">
                      {new Date(post.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="text-sm font-bold font-poppins text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Disclosure */}
      <section className="py-8 bg-surface border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Research Disclosures: The macroeconomic analysis, market briefs, and corporate announcements provided on this platform are for informational purposes only and do not constitute formal investment advice, an offer to sell, or a solicitation of an offer to buy any security or financial instrument. TrustBank relies on internal models and third-party data sources believed to be reliable; however, we make no representation as to their absolute accuracy or completeness. Past performance is no guarantee of future results. Forward-looking statements are subject to numerous assumptions, risks, and uncertainties, which change over time. Please consult your dedicated wealth manager or corporate advisor before executing any strategic financial decisions based on this research.
          </p>
        </div>
      </section>
    </>
  );
}
