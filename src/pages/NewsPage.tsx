import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight, Search, BarChart3, Building2, TrendingUp, Filter, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@/components/public/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import { supabase } from "@/integrations/supabase/client";
import heroNews from "@/assets/hero-news.jpg";

interface Post {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  category: string;
  status: string;
  published_at: string;
}

type NewsCategory = "Market Briefs" | "Corporate Announcements" | "Macroeconomic Analysis";

const fallbackArticles: Post[] = [
  { id: "fb-1", slug: "trustbank-enhanced-corporate-api", title: "TrustBank Unveils Enhanced Corporate API Infrastructure", summary: "Gain unified control over your treasury with our redesigned digital suite, allowing for automated SWIFT transfers and real-time ledger reconciliation directly through your ERP.", content: "", published_at: "2026-06-20T08:00:00Z", category: "Corporate Announcements", status: "published", image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600" },
  { id: "fb-2", slug: "federal-reserve-fixed-income-yields", title: "Federal Reserve Adjustments and Fixed Income Yields", summary: "An analysis of the recent Federal Open Market Committee (FOMC) minutes and the projected impact on corporate bond yields and institutional borrowing costs.", content: "", published_at: "2026-06-15T08:00:00Z", category: "Macroeconomic Analysis", status: "published", image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600" },
  { id: "fb-3", slug: "market-outlook-defensive-equities", title: "Market Outlook: Mitigating Volatility via Defensive Equities", summary: "Our Chief Investment Officer outlines strategic positioning and portfolio defensive strategies, emphasizing utility and consumer staple allocations for the upcoming fiscal quarter.", content: "", published_at: "2026-06-05T08:00:00Z", category: "Market Briefs", status: "published", image_url: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&q=80&w=600" },
  { id: "fb-4", slug: "corporate-lending-facility", title: "Strategic Commitment: $10 Billion Corporate Lending Facility", summary: "TrustBank announces a dedicated $10 billion capital allocation specifically designed to support middle-market enterprise expansion and strategic corporate acquisitions nationwide.", content: "", published_at: "2026-05-28T08:00:00Z", category: "Corporate Announcements", status: "published", image_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=600" },
  { id: "fb-5", slug: "geopolitical-supply-chain-disruptions", title: "Navigating Geopolitical Supply Chain Disruptions", summary: "A deep dive into how shifting global trade alliances and recent maritime disruptions are affecting domestic manufacturing and inventory financing requirements.", content: "", published_at: "2026-05-15T08:00:00Z", category: "Macroeconomic Analysis", status: "published", image_url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=600" },
  { id: "fb-6", slug: "tech-infrastructure-data-center-reits", title: "Sector Review: Technology Infrastructure and Data Center REITS", summary: "A brief review of the capital flows into digital infrastructure, focusing on the yield potential and associated risks of Data Center Real Estate Investment Trusts.", content: "", published_at: "2026-05-02T08:00:00Z", category: "Market Briefs", status: "published", image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600" },
];

const NewsPage = () => {
  const [articles, setArticles] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<NewsCategory | "All">("All");

  const categories: { name: NewsCategory | "All"; icon: React.ElementType }[] = [
    { name: "All", icon: Filter },
    { name: "Market Briefs", icon: BarChart3 },
    { name: "Corporate Announcements", icon: Building2 },
    { name: "Macroeconomic Analysis", icon: TrendingUp },
  ];

  useEffect(() => {
    fetchArticles();

    const channel = supabase
      .channel("public-news-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "cms_posts" }, () => fetchArticles())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchArticles = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as unknown as any)
        .from("cms_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data && data.length > 0) {
        setArticles(data as Post[]);
      } else {
        setArticles(fallbackArticles);
      }
    } catch (e) {
      console.error("Error fetching articles:", e);
      setArticles(fallbackArticles);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.summary && article.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "All" || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const estimateReadTime = (text: string | null) => {
    if (!text) return "2 min";
    const words = text.split(/\s+/).length;
    return `${Math.max(2, Math.ceil(words / 200))} min`;
  };

  return (
    <>
      <PageHero
        title="Institutional Research & Corporate Press"
        description="Access proprietary macroeconomic analysis, strategic market briefs, and official corporate announcements from TrustBank's senior advisory desk."
        image={heroNews}
        primaryCtaText="Latest Publications"
        primaryCtaLink="#publications"
        secondaryCtaText="Executive Leadership"
        secondaryCtaLink="/about"
        stats={[
          { value: "Fiduciary", label: "Research Standard" },
          { value: "Weekly", label: "Market Briefs" },
          { value: "Global", label: "Macro Analysis" },
        ]}
      />

      <section id="publications" className="py-20 lg:py-28 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Publications Archive"
            title="All Corporate Insights"
            description="Browse our complete archive of macroeconomic research, market updates, and institutional announcements."
          />

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 mt-10 mb-10 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                      activeCategory === cat.name
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-card text-muted-foreground hover:bg-muted border-muted/50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search publications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card font-sans"
              />
            </div>
          </div>

          {/* Results Count */}
          {!loading && (
            <p className="text-xs text-muted-foreground font-sans mb-6">
              Showing {filteredArticles.length} publication{filteredArticles.length !== 1 ? "s" : ""}
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </p>
          )}

          {/* Articles Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-2xl border overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <FadeIn className="text-center py-20">
              <p className="text-muted-foreground font-sans text-sm">No publications match your current filters.</p>
              <Button
                variant="outline"
                className="mt-4 font-bold text-xs"
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </FadeIn>
          ) : (
            <>
              {/* Featured Article — First item gets a large spotlight */}
              {filteredArticles.length > 0 && activeCategory === "All" && !searchQuery && (
                <FadeIn className="mb-12">
                  <Link
                    to={`/news/${filteredArticles[0].slug || filteredArticles[0].id}`}
                    className="group grid grid-cols-1 lg:grid-cols-2 gap-0 bg-card border border-muted/50 rounded-2xl overflow-hidden hover-lift transition-all shadow-sm"
                  >
                    <div className="aspect-video lg:aspect-auto lg:min-h-[340px] relative overflow-hidden bg-muted">
                      <img
                        src={
                          filteredArticles[0].image_url ||
                          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800"
                        }
                        alt={filteredArticles[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Featured
                      </span>
                    </div>
                    <div className="p-8 lg:p-10 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">
                        {filteredArticles[0].category}
                      </span>
                      <h3 className="text-xl lg:text-2xl font-bold font-poppins text-foreground leading-tight mb-4 group-hover:text-primary transition-colors">
                        {filteredArticles[0].title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                        {filteredArticles[0].summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-sans">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(filteredArticles[0].published_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {estimateReadTime(filteredArticles[0].content)} read
                        </span>
                      </div>
                      <span className="text-xs text-primary font-bold inline-flex items-center gap-1 mt-6 group-hover:gap-2 transition-all">
                        Read Full Briefing <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              )}

              {/* Remaining articles in standard 3-column grid */}
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(activeCategory === "All" && !searchQuery ? filteredArticles.slice(1) : filteredArticles).map((article) => (
                  <StaggerItem key={article.id}>
                    <Link
                      to={`/news/${article.slug || article.id}`}
                      className="group bg-card border border-muted/50 rounded-2xl overflow-hidden hover-lift transition-all flex flex-col justify-between h-full shadow-sm"
                    >
                      <div>
                        <div className="aspect-video relative overflow-hidden bg-muted">
                          <img
                            src={
                              article.image_url ||
                              "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600"
                            }
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src =
                                "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=600";
                            }}
                          />
                          <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {article.category}
                          </span>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-sans mb-3">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {new Date(article.published_at).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {estimateReadTime(article.content)} read
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-foreground font-poppins leading-snug mb-3 group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {article.summary}
                          </p>
                        </div>
                      </div>
                      <div className="p-6 pt-0 mt-auto">
                        <span className="text-xs text-primary font-bold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read Briefing <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </>
          )}
        </div>
      </section>

      {/* Research Disclosure */}
      <section className="py-8 bg-surface border-t border-border">
        <div className="container px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] leading-relaxed text-muted-foreground max-w-5xl mx-auto text-justify font-sans">
            Important Research Disclosures: The macroeconomic analysis, market briefs, and corporate announcements
            provided on this platform are for informational purposes only and do not constitute formal investment
            advice, an offer to sell, or a solicitation of an offer to buy any security or financial instrument.
            TrustBank relies on internal models and third-party data sources believed to be reliable; however, we make
            no representation as to their absolute accuracy or completeness. Past performance is no guarantee of future
            results. Forward-looking statements are subject to numerous assumptions, risks, and uncertainties, which
            change over time. Please consult your dedicated wealth manager or corporate advisor before executing any
            strategic financial decisions based on this research.
          </p>
        </div>
      </section>
    </>
  );
};

export default NewsPage;

