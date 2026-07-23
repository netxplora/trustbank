import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Calculator, LineChart, ShieldAlert } from "lucide-react";
import { SlideUp, StaggerContainer, StaggerItem } from "./Motion";

const guides = [
  {
    title: "First-Time Home Buyer's Guide",
    description: "Navigate the mortgage process, understand rates, and secure your dream home with confidence.",
    icon: BookOpen,
    category: "Real Estate",
    link: "/info/mortgage-loans"
  },
  {
    title: "Retirement Planning Strategies",
    description: "Build a resilient portfolio designed to support your lifestyle through every stage of retirement.",
    icon: LineChart,
    category: "Wealth",
    link: "/info/retirement-planning"
  },
  {
    title: "Interactive Financial Calculators",
    description: "Project your investment growth, calculate loan amortization, and plan your savings goals.",
    icon: Calculator,
    category: "Tools",
    link: "/info/loan-calculator"
  },
  {
    title: "Cybersecurity Best Practices",
    description: "Learn how we protect your assets and what steps you can take to secure your digital identity.",
    icon: ShieldAlert,
    category: "Security",
    link: "/info/security-features"
  }
];

export function EducationHub() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 relative border-t dark:border-white/5">
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <SlideUp className="max-w-2xl">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Knowledge Center</h2>
            <h3 className="text-3xl md:text-5xl font-poppins font-bold text-slate-900 dark:text-white mb-4">
              Financial intelligence.
            </h3>
            <p className="text-lg text-slate-600 dark:text-white/70 font-sans">
              Expert insights, practical guides, and powerful tools to help you make informed financial decisions.
            </p>
          </SlideUp>
          <SlideUp delay={0.1}>
            <Link to="/news" className="inline-flex items-center font-bold text-primary hover:text-primary/80 transition-colors">
              View All Resources <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </SlideUp>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guides.map((guide, idx) => (
            <StaggerItem key={idx}>
              <Link 
                to={guide.link}
                className="group block h-full bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <guide.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/40 mb-3 block">
                  {guide.category}
                </span>
                <h4 className="text-lg font-poppins font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary dark:group-hover:text-primary transition-colors">
                  {guide.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
                  {guide.description}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
