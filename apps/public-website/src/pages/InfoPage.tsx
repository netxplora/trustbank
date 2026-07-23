import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { PageHero } from "@/components/public/PageHero";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "@trustbank/shared-ui/components/Motion";
import { SectionHeader } from "@/components/public/SectionHeader";
import { infoPagesData, InfoPageContent } from "@/data/infoPages";
import NotFound from "./NotFound";
import { CheckCircle2, FileText, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Link } from "react-router-dom";

// Premium Local Hero Images
import HeroDigital from "@/assets/hero-digital.jpg";
import HeroLoans from "@/assets/hero-loans.jpg";
import HeroChecking from "@/assets/hero-checking.png";
import HeroSavings from "@/assets/hero-savings.jpg";
import HeroServices from "@/assets/hero-services.jpg";
import HeroAbout from "@/assets/hero-about.jpg";
import HeroContact from "@/assets/hero-contact.jpg";
import HeroFaq from "@/assets/hero-faq.jpg";

interface CmsPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_blocks: any[];
  is_published: boolean;
}

export default function InfoPage() {
  const { slug } = useParams<{ slug: string }>();
  const [cmsPage, setCmsPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (slug) {
      fetchCmsPage();
    }
  }, [slug]);

  const fetchCmsPage = async () => {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("cms_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (data) {
        setCmsPage(data as CmsPage);
      } else {
        setCmsPage(null);
      }
    } catch (e) {
      console.error("Error fetching CMS page:", e);
      setCmsPage(null);
    } finally {
      setLoading(false);
    }
  };

  const localData = slug ? infoPagesData[slug] : null;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If page does not exist in CMS and doesn't exist in localData, redirect to NotFound
  if (!cmsPage && !localData) {
    return <NotFound />;
  }

  // Determine Title, Description, Image, Stats and badges
  const title = cmsPage?.title || localData?.title || "";
  const description = cmsPage?.description || localData?.description || "";
  
  // Intelligent Image Selection using premium local assets
  let finalImage = HeroDigital; // Default fallback
  const s = slug || "";
  
  if (localData?.image && !localData.image.includes('unsplash.com')) {
    finalImage = localData.image;
  } else {
    // Map slugs to local premium assets
    if (s.includes('loan') || s.includes('mortgage') || s.includes('finance')) {
      finalImage = HeroLoans;
    } else if (s.includes('card') || s.includes('checking') || s.includes('personal')) {
      finalImage = HeroChecking;
    } else if (s.includes('youth') || s.includes('student') || s.includes('saving') || s.includes('invest')) {
      finalImage = HeroSavings;
    } else if (s.includes('business') || s.includes('corporate') || s.includes('merchant') || s.includes('payroll')) {
      finalImage = HeroServices;
    } else if (s.includes('about') || s.includes('leader') || s.includes('govern')) {
      finalImage = HeroAbout;
    } else if (s.includes('support') || s.includes('contact') || s.includes('help')) {
      finalImage = HeroContact;
    } else if (s.includes('faq') || s.includes('complaint') || s.includes('security')) {
      finalImage = HeroFaq;
    } else if (s.includes('digital') || s.includes('mobile') || s.includes('online')) {
      finalImage = HeroDigital;
    }
  }

  const image = finalImage;
  const stats = localData?.stats || [];
  
  // Expand data extraction
  const overviewText = localData?.overviewText || "";
  const eligibilityText = localData?.eligibilityText || "";
  const eligibilityRequirements = localData?.eligibilityRequirements || [];
  const benefitsTitle = localData?.benefitsTitle || "Core Advantages";
  const benefits = localData?.benefits || [];
  const featuresTitle = localData?.featuresTitle || "Detailed Specifications";
  const features = localData?.features || [];
  const stepsTitle = localData?.stepsTitle || "Onboarding Process";
  const steps = localData?.steps || [];
  const scenariosTitle = localData?.scenariosTitle || "Everyday Customer Use Cases";
  const scenarios = localData?.scenarios || [];
  const securityTitle = localData?.securityTitle || "Vault & Asset Safeguards";
  const securityText = localData?.securityText || "";
  const securityPoints = localData?.securityPoints || [];
  const faqsTitle = localData?.faqsTitle || "Frequently Asked Questions";
  const faqs = localData?.faqs || [];
  const relatedTitle = localData?.relatedTitle || "Related Financial Solutions";
  const related = localData?.related || [];
  const additionalContent = localData?.additionalContent || "";

  // Dynamic Page Title SEO
  document.title = `${title} | TrustBank Premium Banking`;

  return (
    <>
      <PageHero
        title={title}
        description={description}
        image={image}
        primaryCtaText={localData?.primaryCtaText}
        primaryCtaLink={localData?.primaryCtaLink}
        secondaryCtaText={localData?.secondaryCtaText}
        secondaryCtaLink={localData?.secondaryCtaLink}
        stats={stats}
        showTrustBadges={localData?.showTrustBadges !== undefined ? localData.showTrustBadges : true}
      />

      <SlideUp>
        {/* If CMS Page has Content Blocks */}
        {cmsPage && cmsPage.content_blocks && cmsPage.content_blocks.length > 0 ? (
          <section className="py-24 bg-background border-b">
            <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
              <div className="space-y-12">
                {cmsPage.content_blocks.map((block: any, idx: number) => {
                  if (block.type === "text") {
                    return (
                      <div key={block.id || idx} className="prose prose-slate max-w-none text-muted-foreground font-sans leading-relaxed text-sm">
                        {block.content?.text || ""}
                      </div>
                    );
                  }
                  if (block.type === "features") {
                    return (
                      <div key={block.id || idx} className="bg-slate-50 border rounded-xl p-6">
                        <h4 className="font-poppins font-bold text-foreground text-base mb-4">
                          {block.content?.title || "Key Features"}
                        </h4>
                        {block.content?.list && Array.isArray(block.content.list) && (
                          <ul className="space-y-3">
                            {block.content.list.map((item: string, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </section>
        ) : (
          // Otherwise, render structured local fallbacks
          <div className="w-full">
            
            {/* SECTION 2: Overview & Eligibility */}
            {overviewText && (
              <section className="py-20 bg-background border-b">
                <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-7">
                      <h2 className="text-2xl md:text-3xl font-poppins font-bold text-foreground mb-4">Product Overview</h2>
                      <p className="text-sm text-muted-foreground font-sans leading-relaxed mb-6 whitespace-pre-line">{overviewText}</p>
                    </div>
                    {eligibilityText && (
                      <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-6">
                        <h3 className="text-base font-poppins font-semibold text-foreground mb-3">Eligibility & Requirements</h3>
                        <p className="text-xs text-muted-foreground font-sans leading-relaxed mb-4">{eligibilityText}</p>
                        {eligibilityRequirements && eligibilityRequirements.length > 0 && (
                          <ul className="space-y-2">
                            {eligibilityRequirements.map((req, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 3: Benefits Section */}
            {benefits && benefits.length > 0 && (
              <section className="py-20 bg-surface border-b">
                <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
                  <SectionHeader
                    eyebrow="Key Benefits"
                    title={benefitsTitle}
                    description="Designed around liquidity, protection, and long-term capital preservation."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    {benefits.map((benefit, i) => (
                      <div key={i} className="bg-card border border-muted/50 rounded-2xl p-6 shadow-sm hover-lift transition-all flex flex-col justify-between">
                        <div>
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <h4 className="font-poppins font-semibold text-foreground text-sm mb-2">
                            {benefit.title}
                          </h4>
                          <p className="text-xs leading-relaxed text-muted-foreground font-sans">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 4: Features Section */}
            {features && features.length > 0 && (
              <section className="py-20 bg-background border-b">
                <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
                  <SectionHeader
                    eyebrow="Core Features"
                    title={featuresTitle}
                    description="Detailed technical capabilities and tools built into this service."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    {features.map((feature, i) => (
                      <div key={i} className="flex gap-4 items-start bg-card/40 border border-muted/30 rounded-xl p-5">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-poppins font-semibold text-foreground text-sm mb-1.5">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed font-sans">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 5: How It Works Steps */}
            {steps && steps.length > 0 && (
              <section className="py-20 bg-surface border-b">
                <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
                  <SectionHeader
                    eyebrow="Onboarding Flow"
                    title={stepsTitle}
                    description="Simple and streamlined steps from onboarding to daily operation."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
                    {steps.map((step, i) => (
                      <div key={i} className="bg-card border border-muted/40 rounded-xl p-5 relative shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="text-3xl font-poppins font-bold text-primary/15 mb-4">{i + 1}</div>
                          <h4 className="font-poppins font-semibold text-foreground text-xs uppercase tracking-wider mb-2 pr-8">{step.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed font-sans">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 6: Customer Scenarios */}
            {scenarios && scenarios.length > 0 && (
              <section className="py-20 bg-background border-b">
                <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
                  <SectionHeader
                    eyebrow="Practical Scenarios"
                    title={scenariosTitle}
                    description="See how other accounts utilize this service in daily commercial and retail applications."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    {scenarios.map((sc, i) => (
                      <div key={i} className="bg-card border border-muted/50 rounded-2xl p-6 shadow-sm flex flex-col h-full">
                        <h4 className="font-poppins font-semibold text-foreground text-sm mb-2">{sc.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed font-sans">{sc.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 7: Security & Protection */}
            {securityPoints && securityPoints.length > 0 && (
              <section className="py-20 bg-slate-950 text-white border-b border-slate-900">
                <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <h2 className="text-2xl md:text-3xl font-poppins font-bold">{securityTitle}</h2>
                    <p className="text-xs text-slate-400 mt-2 font-sans">{securityText || "Advanced protocols safeguarding your capital."}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {securityPoints.map((p, i) => (
                      <div key={i} className="flex gap-3 bg-white/5 border border-white/10 rounded-xl p-5 items-start">
                        <Lock className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 8: FAQ Section */}
            {faqs && faqs.length > 0 && (
              <section className="py-20 bg-surface border-b">
                <div className="container px-4 sm:px-6 lg:px-8 max-w-3xl">
                  <SectionHeader
                    eyebrow="Helpdesk FAQs"
                    title={faqsTitle}
                    description="Answers to common questions regarding account settings and compliance."
                  />
                  <div className="space-y-4 mt-12">
                    {faqs.map((faq, i) => {
                      const isOpen = openFaq === i;
                      return (
                        <div key={i} className="border border-muted/50 rounded-xl overflow-hidden bg-card transition-all shadow-sm">
                          <button
                            className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                            onClick={() => setOpenFaq(isOpen ? null : i)}
                          >
                            <span className="font-semibold text-foreground text-sm pr-8">{faq.q}</span>
                            <span className="text-muted-foreground shrink-0">{isOpen ? "−" : "+"}</span>
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-6 pt-0 border-t border-muted/20 mt-2">
                              <p className="text-xs text-muted-foreground leading-relaxed pt-4 font-sans">
                                {faq.a}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 9: Related Services & Final CTA */}
            <section className="py-20 bg-background">
              <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
                {related && related.length > 0 && (
                  <div className="mb-12">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">{relatedTitle}</h4>
                    <div className="flex flex-wrap justify-center gap-3">
                      {related.map((r, i) => (
                        <Button key={i} variant="outline" size="sm" asChild>
                          <Link to={r.to}>{r.label}</Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {additionalContent && (
                  <div className="bg-card border border-muted/50 rounded-2xl p-8 shadow-sm text-left max-w-3xl mx-auto mb-12">
                    <h4 className="font-poppins font-bold text-foreground text-base mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-secondary" /> Compliance & Legal Specifications
                    </h4>
                    <p className="text-xs leading-relaxed text-muted-foreground font-sans">
                      {additionalContent}
                    </p>
                  </div>
                )}

                <div className="h-1 w-12 bg-primary mx-auto mb-6 rounded" />
                <h2 className="text-2xl md:text-3xl font-poppins font-bold text-foreground mb-4">Start Your Banking Relationship</h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mb-8 font-sans">
                  Open an account online in minutes or coordinate details directly with our customer advisory desk.
                </p>
                <div className="flex justify-center gap-4">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-6 rounded-lg text-xs font-bold uppercase tracking-wider" asChild>
                    <Link to={localData?.primaryCtaLink || "/register"}>
                      {localData?.primaryCtaText || "Open Account"}
                    </Link>
                  </Button>
                  <Button variant="outline" className="border-input hover:bg-accent text-foreground font-medium px-8 py-6 rounded-lg text-xs font-bold uppercase tracking-wider" asChild>
                    <Link to="/contact">Speak to Advisor</Link>
                  </Button>
                </div>
              </div>
            </section>

          </div>
        )
        }
      </SlideUp>
    </>
  );
}
