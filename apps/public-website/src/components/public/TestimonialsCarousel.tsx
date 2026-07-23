import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { supabase } from "@trustbank/shared-utils/integrations/supabase/client";
import { RevealOnScroll } from "./RevealOnScroll";
import { SlideUp } from "./Motion";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  city: string | null;
  rating: number | null;
  text: string;
  photo_url: string | null;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    role: "Financial Analyst",
    city: "Boston, MA",
    rating: 5,
    text: "Switching my investment portfolio to TrustBank has been the best choice for my retirement planning. The platform interface is clean and straightforward.",
    photo_url: null,
  },
  {
    id: "2",
    name: "David Vance",
    role: "Real Estate Agent",
    city: "Austin, TX",
    rating: 5,
    text: "The e-statement download and payee systems are incredibly seamless. The loan calculator let me estimate my payments and secure a commercial loan within days.",
    photo_url: null,
  },
  {
    id: "3",
    name: "Maria Rodriguez",
    role: "Small Business Owner",
    city: "Miami, FL",
    rating: 5,
    text: "Managing scheduled payroll and payments for my store is finally stress-free. The recurring bill pay option has completely automated our bills.",
    photo_url: null,
  },
];

export function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setTestimonials(data as Testimonial[]);
      } else {
        setTestimonials(defaultTestimonials);
      }
    } catch (e) {
      console.error("Error fetching testimonials:", e);
      setTestimonials(defaultTestimonials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 lg:py-32 bg-background relative overflow-hidden border-y border-border">
      {/* Ambient background lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SlideUp>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary block mb-4">
              Client Reviews
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-poppins font-bold tracking-tight mb-6 text-foreground">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Thousands</span> of Clients
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-sans">
              Read real feedback from verified customers about their banking and wealth management experiences.
            </p>
          </SlideUp>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => {
              const stars = Array(t.rating || 5).fill(0);
              const initials = t.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              return (
                <RevealOnScroll key={t.id} delay={`${idx * 150}ms`}>
                  <div className="group relative bg-card/50 backdrop-blur-xl rounded-2xl p-8 border border-border hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-500 h-full flex flex-col justify-between overflow-hidden">
                    {/* Hover glow effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="space-y-5 relative z-10">
                      {/* Large quote icon */}
                      <Quote className="h-8 w-8 text-primary/20" />

                      {/* Rating Stars */}
                      <div className="flex gap-1">
                        {stars.map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary/80 text-primary/80" />
                        ))}
                      </div>

                      {/* Comment text */}
                      <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                        "{t.text}"
                      </p>
                    </div>

                    {/* Customer Profile Row */}
                    <div className="flex items-center gap-4 mt-8 pt-5 border-t border-border/50 relative z-10">
                      {t.photo_url ? (
                        <img
                          src={t.photo_url}
                          alt={t.name}
                          className="h-11 w-11 rounded-full object-cover border-2 border-primary/20"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0 border-2 border-primary/20">
                          {initials}
                        </div>
                      )}

                      <div className="leading-none">
                        <p className="font-bold text-foreground text-sm font-poppins">{t.name}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t.role} {t.city && `· ${t.city}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
