import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet, Landmark, TrendingUp, Building2, Briefcase, CreditCard } from "lucide-react";
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from "./Motion";
import { Button } from "@/components/ui/button";

const services = [
  {
    id: "personal",
    title: "Personal Banking",
    icon: Wallet,
    description: "Comprehensive deposit and lending solutions designed to streamline your daily financial life with premium support.",
    benefits: ["High-yield savings", "No-fee checking", "Premium debit cards"],
    link: "/checking",
    color: "bg-primary",
  },
  {
    id: "business",
    title: "Business Banking",
    icon: Building2,
    description: "Scalable commercial accounts, payment processing, and treasury management for growing enterprises.",
    benefits: ["Merchant services", "Corporate cards", "Payroll solutions"],
    link: "/info/business-banking",
    color: "bg-secondary",
  },
  {
    id: "private",
    title: "Private Banking",
    icon: Landmark,
    description: "Exclusive advisory services, tailored lending, and bespoke financial structuring for high-net-worth individuals.",
    benefits: ["Dedicated advisor", "Custom lending", "Exclusive events"],
    link: "/services",
    color: "bg-slate-800",
  },
  {
    id: "wealth",
    title: "Wealth Management",
    icon: TrendingUp,
    description: "Strategic investment planning, portfolio management, and estate structuring to preserve and grow your assets.",
    benefits: ["Portfolio strategy", "Retirement planning", "Estate structuring"],
    link: "/info/wealth-management",
    color: "bg-primary",
  },
  {
    id: "corporate",
    title: "Corporate Banking",
    icon: Briefcase,
    description: "Institutional-grade financing, capital markets access, and global trade solutions for large corporations.",
    benefits: ["Trade finance", "Syndicated loans", "Capital markets"],
    link: "/info/corporate-banking",
    color: "bg-slate-600",
  },
  {
    id: "cards",
    title: "Premium Cards",
    icon: CreditCard,
    description: "Elite credit and debit cards offering exceptional travel benefits, concierge services, and unparalleled rewards.",
    benefits: ["Travel insurance", "Lounge access", "24/7 concierge"],
    link: "/info/debit-cards",
    color: "bg-rose-500",
  }
];

export function InteractiveServices() {
  const [activeId, setActiveId] = useState<string>(services[0].id);

  return (
    <section className="py-12 sm:py-20 lg:py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      <div className="container px-4 sm:px-6 lg:px-8">
        <SlideUp className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-primary mb-2 sm:mb-3">Our Expertise</h2>
          <h3 className="text-2xl sm:text-3xl md:text-5xl font-poppins font-bold text-slate-900 dark:text-white mb-3 sm:mb-6">
            Comprehensive financial solutions for every stage.
          </h3>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-white/70 font-sans">
            From daily personal banking to complex corporate treasury management, our suite of services is designed to meet your exact financial requirements.
          </p>
        </SlideUp>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-12">
          
          {/* Service Selector: Horizontal scroll on mobile, stacked column on desktop */}
          <div className="md:col-span-4 flex md:flex-col gap-2 overflow-x-auto scrollbar-none pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
            {services.map((service) => {
              const isActive = activeId === service.id;
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => setActiveId(service.id)}
                  className={`flex items-center gap-2.5 md:gap-4 p-2.5 md:p-4 text-left rounded-xl transition-all duration-300 shrink-0 md:shrink ${
                    isActive 
                      ? "bg-white dark:bg-slate-900 shadow-md border-l-4 border-primary scale-[1.01]" 
                      : "hover:bg-slate-100 dark:hover:bg-white/5 border-l-4 border-transparent text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className={`p-1.5 md:p-2 rounded-lg shrink-0 ${isActive ? "bg-primary/10 text-primary" : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/60"}`}>
                    <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <span className={`font-poppins font-semibold text-xs sm:text-sm md:text-base leading-tight whitespace-nowrap md:whitespace-normal ${isActive ? "text-slate-900 dark:text-white" : ""}`}>
                    {service.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Content Display */}
          <div className="md:col-span-8 min-h-[300px] sm:min-h-[360px] relative">
            {services.map((service) => (
              <div
                key={service.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-lg border border-slate-100 dark:border-white/5 transition-all duration-300 flex flex-col justify-between ${
                  activeId === service.id ? "block opacity-100 translate-y-0" : "hidden opacity-0 translate-y-4"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-xl flex items-center justify-center text-white ${service.color} shadow-md`}>
                      <service.icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <h4 className="text-lg sm:text-xl md:text-2xl font-poppins font-bold text-slate-900 dark:text-white leading-tight">{service.title}</h4>
                  </div>
                  
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-white/70 mb-5 leading-relaxed max-w-2xl">
                    {service.description}
                  </p>

                  <h5 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/50 mb-3">Key Benefits</h5>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                    {service.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 dark:text-white/80 font-medium">
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span className="leading-tight">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Button asChild size="sm" className="h-10 px-6 w-full sm:w-auto rounded-xl shadow-sm text-xs sm:text-sm">
                    <Link to={service.link}>
                      Explore {service.title} <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}
