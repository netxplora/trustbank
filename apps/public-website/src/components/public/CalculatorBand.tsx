import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@trustbank/shared-ui/components/ui/tabs";
import { Button } from "@trustbank/shared-ui/components/ui/button";
import { Slider } from "@trustbank/shared-ui/components/ui/slider";
import { Calculator, Percent, DollarSign, Calendar } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

export function CalculatorBand() {
  // Loan States
  const [loanAmount, setLoanAmount] = useState(15000);
  const [loanTerm, setLoanTerm] = useState(36);
  const [loanRate, setLoanRate] = useState(6.99);

  // Savings States
  const [initialDeposit, setInitialDeposit] = useState(5000);
  const [monthlyContribution, setMonthlyContribution] = useState(250);
  const [savingsYears, setSavingsYears] = useState(10);
  const [savingsRate, setSavingsRate] = useState(4.75);

  // Calculations
  const calcLoanMonthly = () => {
    const monthlyRate = loanRate / 100 / 12;
    if (monthlyRate === 0) return loanAmount / loanTerm;
    const payment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
      (Math.pow(1 + monthlyRate, loanTerm) - 1);
    return payment;
  };

  const calcSavingsFuture = () => {
    const r = savingsRate / 100 / 12;
    const n = savingsYears * 12;
    
    // Future value of initial deposit
    const fvInitial = initialDeposit * Math.pow(1 + r, n);
    
    // Future value of monthly contributions
    let fvContributions = 0;
    if (r > 0) {
      fvContributions =
        monthlyContribution * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    } else {
      fvContributions = monthlyContribution * n;
    }
    
    return fvInitial + fvContributions;
  };

  const calcSavingsTotalPrincipal = () => {
    return initialDeposit + monthlyContribution * savingsYears * 12;
  };

  const loanMonthlyPayment = calcLoanMonthly();
  const savingsFutureValue = calcSavingsFuture();
  const savingsPrincipal = calcSavingsTotalPrincipal();
  const savingsInterest = savingsFutureValue - savingsPrincipal;

  return (
    <section className="py-20 bg-muted/30 border-y">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Financial Calculators"
          title="Plan Your Next Milestone"
          description="Estimate your monthly loan payments or visualize your savings growth over time before signing up."
        />

        <div className="max-w-4xl mx-auto bg-card border rounded-2xl shadow-elevated overflow-hidden">
          <Tabs defaultValue="loan" className="w-full">
            <div className="border-b px-6 pt-4 bg-muted/20">
              <TabsList className="grid grid-cols-2 w-full max-w-sm mb-4">
                <TabsTrigger value="loan">Loan Calculator</TabsTrigger>
                <TabsTrigger value="savings">Savings Estimator</TabsTrigger>
              </TabsList>
            </div>

            {/* Loan Tab */}
            <TabsContent value="loan" className="p-6 sm:p-8 m-0">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Inputs */}
                <div className="md:col-span-7 space-y-6">
                  {/* Amount */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-foreground">Loan Amount</span>
                      <span className="text-primary text-base font-bold">${loanAmount.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[loanAmount]}
                      min={1000}
                      max={100000}
                      step={500}
                      onValueChange={(val) => setLoanAmount(val[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$1,000</span>
                      <span>$100,000</span>
                    </div>
                  </div>

                  {/* Term */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-foreground">Term Duration</span>
                      <span className="text-primary text-base font-bold">{loanTerm} Months</span>
                    </div>
                    <Slider
                      value={[loanTerm]}
                      min={12}
                      max={72}
                      step={12}
                      onValueChange={(val) => setLoanTerm(val[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>12 months</span>
                      <span>72 months</span>
                    </div>
                  </div>

                  {/* Rate */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-foreground">Interest Rate (APR)</span>
                      <span className="text-primary text-base font-bold">{loanRate.toFixed(2)}%</span>
                    </div>
                    <Slider
                      value={[loanRate]}
                      min={2.99}
                      max={19.99}
                      step={0.1}
                      onValueChange={(val) => setLoanRate(val[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>2.99%</span>
                      <span>19.99%</span>
                    </div>
                  </div>
                </div>

                {/* Outputs */}
                <div className="md:col-span-5 bg-primary/5 rounded-xl border border-primary/10 p-6 text-center space-y-4">
                  <Calculator className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Estimated Monthly Payment</p>
                    <p className="text-4xl font-extrabold text-primary mt-1">
                      ${loanMonthlyPayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1.5 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Principal Total:</span>
                      <span className="font-semibold text-foreground">${loanAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Repayment:</span>
                      <span className="font-semibold text-foreground">
                        ${(loanMonthlyPayment * loanTerm).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="default" asChild>
                    <a href={`/register?product=loan`}>Apply Online Now</a>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Savings Tab */}
            <TabsContent value="savings" className="p-6 sm:p-8 m-0">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Inputs */}
                <div className="md:col-span-7 space-y-6">
                  {/* Initial */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-foreground">Initial Deposit</span>
                      <span className="text-primary text-base font-bold">${initialDeposit.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[initialDeposit]}
                      min={100}
                      max={50000}
                      step={500}
                      onValueChange={(val) => setInitialDeposit(val[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$100</span>
                      <span>$50,000</span>
                    </div>
                  </div>

                  {/* Monthly */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-foreground">Monthly Addition</span>
                      <span className="text-primary text-base font-bold">${monthlyContribution.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[monthlyContribution]}
                      min={0}
                      max={2000}
                      step={50}
                      onValueChange={(val) => setMonthlyContribution(val[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$0</span>
                      <span>$2,000</span>
                    </div>
                  </div>

                  {/* Years */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-foreground">Saving Horizon</span>
                      <span className="text-primary text-base font-bold">{savingsYears} Years</span>
                    </div>
                    <Slider
                      value={[savingsYears]}
                      min={1}
                      max={30}
                      step={1}
                      onValueChange={(val) => setSavingsYears(val[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 year</span>
                      <span>30 years</span>
                    </div>
                  </div>

                  {/* APY */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-foreground">Savings Rate (APY)</span>
                      <span className="text-primary text-base font-bold">{savingsRate.toFixed(2)}%</span>
                    </div>
                    <Slider
                      value={[savingsRate]}
                      min={0.5}
                      max={10.0}
                      step={0.05}
                      onValueChange={(val) => setSavingsRate(val[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.50%</span>
                      <span>10.00%</span>
                    </div>
                  </div>
                </div>

                {/* Outputs */}
                <div className="md:col-span-5 bg-primary/5 rounded-xl border border-primary/10 p-6 text-center space-y-4">
                  <Calculator className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Estimated Account Value</p>
                    <p className="text-4xl font-extrabold text-primary mt-1">
                      ${savingsFutureValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1.5 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Your Contributions:</span>
                      <span className="font-semibold text-foreground">${savingsPrincipal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Compounded:</span>
                      <span className="font-semibold text-foreground">
                        ${savingsInterest.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="default" asChild>
                    <a href={`/register?product=savings`}>Start Saving Today</a>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
