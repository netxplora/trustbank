import { useBrand } from "@trustbank/shared-utils/contexts/BrandContext";
import defaultLogo from "../../assets/logo.png";

export function PageLoader() {
  // Try to use brand context, but fallback gracefully if not available
  let logoUrl: string | undefined;
  let siteName = "TrustBank";
  
  try {
    const brand = useBrand();
    logoUrl = brand?.visuals?.primary_logo;
    siteName = brand?.identity?.platform_name || "TrustBank";
  } catch {
    // BrandProvider not available yet (e.g., during initial Suspense)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 w-full">
      {/* Logo */}
      <div className="animate-skeleton-wave">
        <img 
          src={logoUrl || defaultLogo} 
          alt={siteName} 
          className="h-14 w-14 rounded-xl bg-white p-1.5 object-contain shadow-sm" 
          width={56} 
          height={56} 
        />
      </div>

      {/* Progress bar */}
      <div className="w-40 h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary/60 rounded-full"
          style={{
            backgroundSize: "200% 100%",
            backgroundImage: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
            animation: "shimmer 1.5s linear infinite",
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground font-sans animate-pulse">Loading...</p>
    </div>
  );
}
