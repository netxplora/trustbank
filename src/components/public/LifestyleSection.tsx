import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SlideUp, FadeIn } from "./Motion";

export function LifestyleSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900 relative overflow-hidden border-t dark:border-white/5">
      <div className="container px-4 sm:px-6 lg:px-8">
        <SlideUp className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Who We Serve</h2>
          <h3 className="text-3xl md:text-5xl font-poppins font-bold text-slate-900 dark:text-white mb-6">
            Banking that adapts to your life.
          </h3>
          <p className="text-lg text-slate-600 dark:text-white/70 font-sans">
            Whether you are building your career, managing family wealth, or running a global enterprise, we have the specialized expertise to support you.
          </p>
        </SlideUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <FadeIn delay={0.1}>
            <div className="group relative rounded-3xl overflow-hidden h-[450px] shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1000&auto=format&fit=crop" 
                alt="Young professional" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 p-8">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider mb-4 border border-white/10">
                  Professionals
                </span>
                <h4 className="text-2xl font-poppins font-bold text-white mb-2">Build Your Wealth</h4>
                <p className="text-white/80 text-sm mb-6 max-w-sm line-clamp-2">
                  High-yield savings, premium credit options, and digital tools designed for the modern professional.
                </p>
                <Button variant="link" className="text-white p-0 h-auto font-semibold group-hover:text-primary transition-colors" asChild>
                  <Link to="/checking">Learn More <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>
            </div>
          </FadeIn>

          {/* Card 2 */}
          <FadeIn delay={0.2}>
            <div className="group relative rounded-3xl overflow-hidden h-[450px] shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1000&auto=format&fit=crop" 
                alt="Family" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 p-8">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider mb-4 border border-white/10">
                  Families
                </span>
                <h4 className="text-2xl font-poppins font-bold text-white mb-2">Secure Their Future</h4>
                <p className="text-white/80 text-sm mb-6 max-w-sm line-clamp-2">
                  Joint accounts, college savings plans, and generational wealth structuring for your peace of mind.
                </p>
                <Button variant="link" className="text-white p-0 h-auto font-semibold group-hover:text-primary transition-colors" asChild>
                  <Link to="/info/wealth-management">Learn More <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>
            </div>
          </FadeIn>

          {/* Card 3 */}
          <FadeIn delay={0.3}>
            <div className="group relative rounded-3xl overflow-hidden h-[450px] shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop" 
                alt="Business owners" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
              
              <div className="absolute inset-x-0 bottom-0 p-8">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider mb-4 border border-white/10">
                  Entrepreneurs
                </span>
                <h4 className="text-2xl font-poppins font-bold text-white mb-2">Scale Your Business</h4>
                <p className="text-white/80 text-sm mb-6 max-w-sm line-clamp-2">
                  Commercial lending, treasury management, and global payment solutions to power your growth.
                </p>
                <Button variant="link" className="text-white p-0 h-auto font-semibold group-hover:text-primary transition-colors" asChild>
                  <Link to="/info/business-banking">Learn More <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </div>
            </div>
          </FadeIn>

        </div>
      </div>
    </section>
  );
}
