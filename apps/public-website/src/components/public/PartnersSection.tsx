const partners = [
  "Federal Deposit Insurance Corporation (FDIC)",
  "Federal Reserve Bank",
  "Office of the Comptroller of the Currency (OCC)",
  "Financial Crimes Enforcement Network (FinCEN)",
  "Plaid",
  "Stripe",
];

export function PartnersSection() {
  return (
    <section className="py-12 border-b">
      <div className="container">
        <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">
          Trusted & Regulated By
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
          {partners.map((name) => (
            <span key={name} className="text-sm font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
