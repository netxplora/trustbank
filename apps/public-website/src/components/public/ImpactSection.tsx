const stats = [
  { value: "50,000+", label: "Customers Served" },
  { value: "$5B+", label: "Loans Disbursed" },
  { value: "10,000+", label: "Businesses Supported" },
  { value: "15+", label: "Years of Service" },
];

export function ImpactSection() {
  return (
    <section className="py-20" style={{ background: "var(--hero-gradient)" }}>
      <div className="container">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary-foreground/70 uppercase tracking-wider mb-2">Our Impact</p>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Making a Difference</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">{value}</p>
              <p className="text-sm text-primary-foreground/70">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
