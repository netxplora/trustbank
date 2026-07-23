import { Star } from "lucide-react";

const testimonials = [
  { name: "Adebayo Johnson", role: "Small Business Owner", text: "TrustBank helped me grow my business with their quick SME loan process. The digital banking platform makes managing my finances effortless." },
  { name: "Chioma Okafor", role: "Teacher", text: "I love how easy it is to save and track my finances. The mobile banking app is so user-friendly. Best banking experience I've ever had." },
  { name: "Ibrahim Musa", role: "Market Trader", text: "The agency banking network means I can access my money even in my local market. TrustBank truly understands our needs." },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-surface">
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Testimonials</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Our Customers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(({ name, role, text }) => (
            <div key={name} className="bg-card rounded-xl p-8 border shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{text}"</p>
              <div>
                <p className="font-semibold text-foreground text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
