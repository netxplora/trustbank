import { Smartphone, Download, Star } from "lucide-react";
import { Button } from "@trustbank/shared-ui/components/ui/button";

export function MobileAppSection() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Mobile Banking</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Bank On The Go</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Download the TrustBank mobile app and enjoy seamless banking from anywhere. Transfer funds, pay bills, manage your cards, and apply for loans — all from your smartphone.
              </p>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.8 rating • 50K+ downloads</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="default" size="lg" className="gap-2">
                  <Download className="h-4 w-4" /> App Store
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Download className="h-4 w-4" /> Google Play
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center p-10 md:p-14" style={{ background: "var(--hero-gradient)" }}>
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 w-full max-w-xs">
                <div className="bg-white/10 rounded-2xl p-6 mb-4 text-center">
                  <Smartphone className="h-12 w-12 text-primary-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-primary-foreground">TrustBank Mobile</p>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-primary-foreground/70">Balance</span>
                    <span className="text-sm font-bold text-primary-foreground">$1,250,000</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs text-primary-foreground/70">Last Transfer</span>
                    <span className="text-sm font-bold text-primary-foreground">$50,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
