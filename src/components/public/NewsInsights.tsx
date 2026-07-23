import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SlideUp, FadeIn, StaggerContainer, StaggerItem } from "./Motion";
import { ArrowRight, Clock, User } from "lucide-react";

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
    slug: "global-market-outlook-2026",
    title: "Global Market Outlook: Navigating the 2026 Interest Rate Environment",
    summary: "As central banks adjust their monetary policies, we analyze the implications for global equities, fixed income yields, and strategic asset allocation over the next four quarters.",
    category: "Market Outlook",
    image_url: "https://images.unsplash.com/photo-1590283603385-18ff3827fcce?q=80&w=1000&auto=format&fit=crop",
    published_at: new Date().toISOString(),
  },
  {
    id: "2",
    slug: "protecting-wealth-digital-age",
    title: "Protecting Generational Wealth in the Digital Age",
    summary: "Essential cybersecurity protocols and trust structures to safeguard your assets against emerging threats.",
    category: "Security",
    image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop",
    published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "3",
    slug: "sustainable-investing-trends",
    title: "The Rise of Sustainable Infrastructure Investing",
    summary: "Why institutional capital is increasingly flowing into green energy and sustainable real estate projects.",
    category: "Investing",
    image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop",
    published_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "4",
    slug: "future-of-corporate-treasury",
    title: "The Future of Corporate Treasury Management",
    summary: "How automation and real-time liquidity reporting are transforming treasury operations for multinationals.",
    category: "Corporate",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop",
    published_at: new Date(Date.now() - 86400000 * 10).toISOString(),
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
        .limit(4);

      if (data && data.length >= 4) {
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

  if (loading) return null;

  const featured = posts[0];
  const sidePosts = posts.slice(1, 4);

  return (
    <section className="py-24 bg-white dark:bg-slate-900 relative">
      <div className="container px-4 sm:px-6 lg:px-8">
        <SlideUp className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Perspectives</h2>
            <h3 className="text-3xl md:text-5xl font-poppins font-bold text-slate-900 dark:text-white">
              News & Insights
            </h3>
          </div>
          <Link to="/news" className="hidden md:inline-flex items-center font-bold text-primary hover:text-primary/80 transition-colors">
            View All Articles <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </SlideUp>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Featured Article */}
          <div className="lg:col-span-7">
            <FadeIn>
              <Link to={`/news/${featured.slug}`} className="group block relative rounded-3xl overflow-hidden h-full min-h-[500px] shadow-lg">
                <img 
                  src={featured.image_url || defaultPosts[0].image_url!} 
                  alt={featured.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full">
                      {featured.category || "Featured"}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-4 text-white/80 text-xs font-medium mb-4">
                      <span>
                        {new Date(featured.published_at!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 5 min read</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> TrustBank Research</span>
                    </div>
                    <h4 className="text-3xl md:text-4xl font-poppins font-bold text-white mb-4 leading-tight group-hover:text-primary/90 transition-colors">
                      {featured.title}
                    </h4>
                    <p className="text-white/80 text-lg line-clamp-2 max-w-2xl">
                      {featured.summary}
                    </p>
                  </div>
                </div>
              </Link>
            </FadeIn>
          </div>

          {/* Side Articles */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <StaggerContainer>
              {sidePosts.map((post, idx) => {
                const fallbackImg = defaultPosts[(idx + 1) % defaultPosts.length].image_url!;
                return (
                <StaggerItem key={post.id}>
                  <Link to={`/news/${post.slug}`} className="group flex flex-col sm:flex-row gap-6 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <div className="w-full sm:w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10 relative">
                      <img 
                        src={post.image_url || fallbackImg} 
                        alt={post.title} 
                        onError={(e) => {
                          e.currentTarget.onerror = null; // Prevent infinite loop
                          e.currentTarget.src = fallbackImg;
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">
                        {post.category || "News"}
                      </span>
                      <h4 className="text-lg font-poppins font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-3 text-slate-400 dark:text-white/40 text-[10px] font-medium uppercase tracking-wider">
                        <span>{new Date(post.published_at!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span>•</span>
                        <span>4 min read</span>
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
          
        </div>
        
        <div className="mt-8 md:hidden text-center">
          <Link to="/news" className="inline-flex items-center font-bold text-primary hover:text-primary/80 transition-colors">
            View All Articles <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
