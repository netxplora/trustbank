import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { SlideUp, FadeIn } from "./Motion";

const testimonials = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "CEO, TechFlow Innovations",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
    service: "Commercial Banking",
    rating: 5,
    text: "Moving our corporate treasury to TrustBank was the best financial decision we made this year. Their APIs seamlessly integrated with our ERP, and our dedicated relationship manager understands our exact cash flow needs."
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Private Wealth Client",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
    service: "Wealth Management",
    rating: 5,
    text: "The level of personalized attention is unmatched. My advisor didn't just look at my portfolio; they looked at my family's entire financial picture to structure a legacy plan that gives us complete peace of mind."
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "Small Business Owner",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop",
    service: "Business Lending",
    rating: 5,
    text: "When we needed capital to expand our second location, TrustBank moved incredibly fast. Their lending team was transparent, professional, and genuinely invested in seeing our business succeed."
  }
];

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      <div className="container px-4 sm:px-6 lg:px-8">
        <SlideUp className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Client Success</h2>
          <h3 className="text-3xl md:text-5xl font-poppins font-bold text-slate-900 mb-6">
            Trusted by leaders worldwide.
          </h3>
        </SlideUp>

        <div className="max-w-5xl mx-auto relative">
          {/* Main Carousel Container */}
          <div className="relative h-[400px] md:h-[300px]">
            {testimonials.map((testimonial, idx) => {
              const isActive = idx === currentIndex;
              return (
                <div
                  key={testimonial.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 ${
                    isActive ? "opacity-100 translate-x-0 z-10" : "opacity-0 translate-x-8 pointer-events-none z-0"
                  }`}
                >
                  {/* Photo Profile */}
                  <div className="w-24 h-24 md:w-48 md:h-48 shrink-0 relative">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover rounded-full shadow-lg border-4 border-white"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
                      <Quote className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex justify-center md:justify-start gap-1 mb-4 text-warning">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-lg md:text-xl text-slate-700 font-sans italic leading-relaxed mb-6">
                      "{testimonial.text}"
                    </p>
                    <div>
                      <h4 className="font-bold text-slate-900 font-poppins text-lg">{testimonial.name}</h4>
                      <div className="text-sm text-slate-500 font-medium">
                        {testimonial.role} <span className="mx-2">•</span> <span className="text-primary">{testimonial.service}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center gap-4 mt-8">
            <button 
              onClick={prev}
              className="h-12 w-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white/40 hover:text-primary dark:hover:text-primary hover:border-primary hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={next}
              className="h-12 w-12 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white/40 hover:text-primary dark:hover:text-primary hover:border-primary hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
