import { Mail, Phone } from "lucide-react";
import { SlideUp, StaggerContainer, StaggerItem } from "./Motion";
import { Button } from "@/components/ui/button";

const managers = [
  {
    name: "James Aris",
    role: "Head of Strategic Advisory",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop",
    expertise: "M&A, Institutional Growth",
    bio: "Specializing in institutional portfolio expansion and high-level mergers, James brings 20 years of Wall Street insight."
  },
  {
    name: "Maya Lin",
    role: "Lead Wealth Manager",
    image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?q=80&w=600&auto=format&fit=crop",
    expertise: "Global Markets, Tech IPOs",
    bio: "Maya focuses on pre-IPO tech wealth and cross-border asset structures for the modern digital entrepreneur."
  },
  {
    name: "Marcus Thorne",
    role: "VP of Client Solutions",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
    expertise: "Trusts, Philanthropy",
    bio: "Marcus guides families through complex estate transitions and the establishment of sustainable philanthropic trusts."
  }
];

export function RelationshipManagers() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900 relative overflow-hidden border-t dark:border-white/5">
      <div className="container px-4 sm:px-6 lg:px-8">
        <SlideUp className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Personalized Service</h2>
          <h3 className="text-3xl md:text-5xl font-poppins font-bold text-slate-900 dark:text-white mb-6">
            Meet your dedicated advisors.
          </h3>
          <p className="text-lg text-slate-600 dark:text-white/70 font-sans">
            Banking is ultimately about people. Our relationship managers are industry veterans committed to understanding and achieving your unique financial goals.
          </p>
        </SlideUp>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {managers.map((manager, idx) => (
            <StaggerItem key={idx}>
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="h-64 overflow-hidden">
                  <img 
                    src={manager.image} 
                    alt={manager.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-8">
                  <h4 className="text-xl font-poppins font-bold text-slate-900 dark:text-white mb-1">{manager.name}</h4>
                  <div className="text-sm text-primary font-bold mb-4">{manager.role}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/50 font-bold mb-3">Expertise: {manager.expertise}</div>
                  <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed mb-6">
                    {manager.bio}
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl gap-2 hover:bg-primary hover:text-white hover:border-primary dark:border-white/20 dark:text-white dark:hover:text-white">
                      <Mail className="h-4 w-4" /> Email
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl gap-2 hover:bg-primary hover:text-white hover:border-primary dark:border-white/20 dark:text-white dark:hover:text-white">
                      <Phone className="h-4 w-4" /> Call
                    </Button>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
