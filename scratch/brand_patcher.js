const fs = require('fs');
const path = require('path');

const filesToPatch = [
  "src/pages/SavingsPage.tsx",
  "src/pages/LoansPage.tsx",
  "src/pages/FAQPage.tsx",
  "src/pages/DigitalBankingPage.tsx",
  "src/pages/NewsPage.tsx",
  "src/pages/ServicesPage.tsx",
  "src/pages/dashboard/TransfersPage.tsx",
  "src/pages/RegisterPage.tsx",
  "src/pages/ResetPasswordPage.tsx",
  "src/pages/LoginPage.tsx",
  "src/pages/MaintenancePage.tsx",
  "src/pages/ServerErrorPage.tsx",
  "src/pages/NotFound.tsx",
  "src/pages/public/VerifyCertificate.tsx",
  "src/components/dashboard/deposits/CryptoDepositExperience.tsx",
  "src/components/dashboard/TransactionDetailsModal.tsx",
  "src/components/dashboard/TransactionPinDialog.tsx",
  "src/components/public/TestimonialsCarousel.tsx",
  "src/components/public/TrustRibbon.tsx",
  "src/components/public/PremiumCTA.tsx",
  "src/components/public/NewsInsights.tsx"
];

for (const relPath of filesToPatch) {
  const fullPath = path.join('C:\\Users\\ADMIN\\Documents\\New Website\\trustbank', relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes('TrustBank')) continue;
  
  // Try to inject useBrand
  if (!content.includes('useBrand')) {
    // Find the last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + 
                'import { useBrand } from "@/contexts/BrandContext";\n' + 
                content.slice(endOfLastImport + 1);
    }
  }

  // To replace TrustBank with dynamic brandName, we can just replace TrustBank with a placeholder if it's within quotes.
  // Actually, replacing all TrustBank occurrences with `{brandName}` in JSX and `brandName` in strings is hard via regex.
  // But wait! We can just use the same trick as InfoPage for files that define static arrays:
  // function applyBrand(obj, brand) { ... }
  // We can do this! But let's keep it simple: replace TrustBank string literals with `{brandName}` in JSX.
  
  console.log(`Needs manual patch: ${relPath}`);
}
