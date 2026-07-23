import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { SectionHeader } from "./SectionHeader";
import { RevealOnScroll } from "./RevealOnScroll";
import { Calendar, ArrowRight } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  category: string | null;
  image_url: string | null;
  published_at: string | null;
}

const defaultPosts: Post[] = [
  {
    id: "1",
    slug: "navigating-2026-interest-rate",
    title: "Navigating the 2026 Interest Rate Environment",
    summary: "What the Fed changes mean for your high-yield savings account and CD options.",
    category: "Market Outlook",
    image_url: null,
    published_at: new Date().toISOString(),
  },
  {
    id: "2",
    slug: "protecting-wealth-against-fraud",
    title: "Protecting Your Wealth Against Fraud",
    summary: "Essential tips to secure your mobile device and monitor account activity.",
    category: "Security",
    image_url: null,
    published_at: new Date().toISOString(),
  },
  {
    id: "3",
    slug: "growth-digital-investment-accounts",
    title: "The Growth of Digital Investment Accounts",
    summary: "How self-directed brokerage options allow flexible retirement planning.",
    category: "Investing",
    image_url: null,
    published_at: new Date().toISOString(),
  },
];

export function NewsInsights() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data } = await (supabase as unknown as any)
        .from("cms_posts")
        .select("id, title, slug, summary, category, image_url, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);

      if (data && data.length > 0) {
        setPosts(data as Post[]);
      } else {
        setPosts(defaultPosts);
      }
    } catch (e) {
      console.error("Error fetching posts:", e);
      setPosts(defaultPosts);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Insights"
          title="News & Insights"
          description="Keep up with market trends, security updates, and wealth strategies curated by our analysts."
        />

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post, idx) => {
              const displayImage = post.image_url ? post.image_url.replace(".jpg", ".png") : null;
              return (
                <RevealOnScroll key={post.id} delay={`${idx * 150}ms`}>
                  <article className="group bg-card border border-muted/50 rounded-2xl overflow-hidden shadow-elevated flex flex-col justify-between h-full hover-lift transition-all">
                    <div>
                      {/* Image Header */}
                      <div className="relative h-52 bg-muted overflow-hidden">
                        {displayImage ? (
                          <img
                            src={displayImage}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              // If image fails, hide image element and show parent background
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(350,65%,20%)]/20 to-[hsl(40,60%,50%)]/20 flex items-center justify-center p-6 text-center text-xs font-poppins font-bold text-muted-foreground uppercase">
                            {post.category || "General News"}
                          </div>
                        )}
                        
                        {/* Floating Category tag */}
                        <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {post.category || "News"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 font-sans">
                          <Calendar className="h-3.5 w-3.5 text-accent" />
                          <span>
                            {post.published_at
                              ? new Date(post.published_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "June 2026"}
                          </span>
                        </div>

                        <h3 className="text-lg font-poppins font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground leading-relaxed font-sans line-clamp-3">
                          {post.summary}
                        </p>
                      </div>
                    </div>

                    {/* Read More Link */}
                    <div className="p-6 pt-0">
                      <Link
                        to={`/news/${post.slug || post.id}`}
                        className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-secondary transition-colors uppercase tracking-wider"
                      >
                        Read Full Article <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </article>
                </RevealOnScroll>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
