import { Wallet, Landmark, CreditCard as CardIcon, ShieldCheck, TrendingUp, Key, Coins, Briefcase } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { SectionHeader } from "./SectionHeader";
import { RevealOnScroll } from "./RevealOnScroll";

// Images from assets
import checkingImg from "@/assets/hero-checking.png";
import savingsImg from "@/assets/hero-savings.jpg";
import creditCardImg from "@/assets/home/credit_card.png";
import loansImg from "@/assets/hero-loans.jpg";
import digitalImg from "@/assets/hero-digital.jpg";
import aboutImg from "@/assets/hero-about.jpg";
import servicesImg from "@/assets/hero-services.jpg";
import careersImg from "@/assets/hero-careers.jpg";

const products = [
  {
    icon: Wallet,
    title: "Savings Accounts",
    description: "Secure high-yield accounts designed to help your savings compound efficiently over time.",
    image: savingsImg,
    link: "/savings",
  },
  {
    icon: Landmark,
    title: "Checking Accounts",
    description: "Manage your daily transactions with absolute ease, zero service fees, and direct deposits.",
    image: checkingImg,
    link: "/checking",
  },
  {
    icon: CardIcon,
    title: "Premium Credit Cards",
    description: "Earn unlimited cash back on your purchases, premium travel rewards, and solid fraud defenses.",
    image: creditCardImg,
    link: "/services",
  },
  {
    icon: TrendingUp,
    title: "Personal Loans",
    description: "Flexible, low-rate financing options designed to help you handle your personal goals.",
    image: loansImg,
    link: "/loans",
  },
  {
    icon: ShieldCheck,
    title: "Brokerage Investments",
    description: "Trade stocks, ETFs, and mutual funds directly from our integrated investments dashboard.",
    image: digitalImg,
    link: "/services",
  },
  {
    icon: Key,
    title: "Retirement IRAs",
    description: "Traditional and Roth IRA accounts designed to help secure a tax-advantaged financial retirement.",
    image: aboutImg,
    link: "/about",
  },
  {
    icon: Coins,
    title: "Certificates of Deposit",
    description: "Lock in fixed rates up to 12 months for guaranteed interest growth with zero risk.",
    image: servicesImg,
    link: "/services",
  },
  {
    icon: Briefcase,
    title: "Business Banking",
    description: "SME checking accounts, commercial credit lines, and merchant services for small businesses.",
    image: careersImg,
    link: "/services",
  },
];

export function ProductGridV2() {
  return (
    <section className="py-20 bg-background relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our Offerings"
          title="Designed for Your Financial Future"
          description="We provide comprehensive banking solutions tailored to support checking, borrowing, and growing your personal wealth."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p, index) => (
            <RevealOnScroll key={p.title} delay={`${(index % 4) * 100}ms`}>
              <ProductCard
                icon={p.icon}
                title={p.title}
                description={p.description}
                image={p.image}
                link={p.link}
              />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
