import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SlideUp, FadeIn } from "./Motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqData = [
  {
    category: "Accounts",
    questions: [
      {
        q: "What is required to open a premium checking account?",
        a: "Opening a premium checking account requires two forms of valid government ID, proof of address within the last 60 days, and an initial minimum deposit of $10,000. The entire process can be completed digitally through our secure onboarding portal."
      },
      {
        q: "How does the multi-currency account function?",
        a: "Our multi-currency account allows you to hold, send, and receive funds in up to 15 major global currencies from a single centralized dashboard. Currency conversions occur at competitive mid-market rates."
      }
    ]
  },
  {
    category: "Transfers & Payments",
    questions: [
      {
        q: "What are the limits on international wire transfers?",
        a: "Standard accounts have a daily international wire limit of $50,000. Private Wealth and Commercial clients can request elevated limits up to $1,000,000 per day subject to additional verification."
      },
      {
        q: "How fast do international payments process?",
        a: "Transfers via the SWIFT network typically clear within 1-3 business days. For urgent transfers to supported institutions, our priority wire service can settle within 24 hours."
      }
    ]
  },
  {
    category: "Security",
    questions: [
      {
        q: "How is my personal data protected?",
        a: "We employ 256-bit AES encryption across all digital platforms. We are fully compliant with SOC 2, GDPR, and local banking privacy regulations. We never sell your data to third parties."
      },
      {
        q: "What should I do if my card is lost or compromised?",
        a: "You can instantly freeze your card directly within our mobile app. Alternatively, our 24/7 fraud hotline is available worldwide to secure your account and issue emergency replacement cards."
      }
    ]
  }
];

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState(faqData[0].category);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const activeFaqs = faqData.find(d => d.category === activeCategory)?.questions || [];

  return (
    <section className="py-24 bg-white dark:bg-slate-900 relative">
      <div className="container px-4 sm:px-6 lg:px-8">
        <SlideUp className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Support</h2>
          <h3 className="text-3xl md:text-5xl font-poppins font-bold text-slate-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h3>
          <p className="text-lg text-slate-600 dark:text-white/70 font-sans">
            Clear answers to help you navigate our banking platform.
          </p>
        </SlideUp>

        <div className="max-w-4xl mx-auto">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {faqData.map((data) => (
              <button
                key={data.category}
                onClick={() => {
                  setActiveCategory(data.category);
                  setOpenIndex(0); // Reset open accordion on category change
                }}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeCategory === data.category
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {data.category}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="space-y-4 min-h-[300px]">
            {activeFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <FadeIn key={index} delay={index * 0.1}>
                  <div className={`border rounded-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'border-primary shadow-lg dark:shadow-primary/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}>
                    <button
                      className="w-full px-6 py-5 flex justify-between items-center bg-white dark:bg-slate-900/50"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                    >
                      <span className={`font-poppins font-bold text-left ${isOpen ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                        {faq.q}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'bg-primary/10 text-primary rotate-180' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60'}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out bg-white dark:bg-slate-900/50 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <p className="p-6 pt-0 text-slate-600 dark:text-white/70 leading-relaxed text-sm">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-500 dark:text-white/50 mb-4">Can't find what you're looking for?</p>
            <Button variant="outline" asChild className="rounded-xl px-8">
              <Link to="/contact">Visit Help Center</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
