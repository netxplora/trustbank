const fs = require('fs');

const file = 'src/pages/dashboard/DepositPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
content = content.replace(
  'import { Textarea } from "@/components/ui/textarea";',
  'import { Textarea } from "@/components/ui/textarea";\nimport CryptoDepositExperience from "@/components/dashboard/deposits/CryptoDepositExperience";'
);

// 2. Remove crypto specific state
content = content.replace(/  \/\/ Crypto State\n[\s\S]*?\/\/ Form State/m, '  // Form State');

// 3. Remove third party state
content = content.replace(/  const \[thirdPartyConfig, setThirdPartyConfig\] = useState\(\{ name: "MoonPay", url: "https:\/\/moonpay.com" \}\);\n/, '');

// 4. Remove unused imports if we want, but it's okay to leave them

// 5. Remove Crypto functions
content = content.replace(/  \/\/ ---------------- CRYPTO WORKFLOW ----------------\n[\s\S]*?\/\/ ---------------- RENDERERS ----------------/m, '  // ---------------- RENDERERS ----------------');

// 6. Replace crypto rendering block
const cryptoRenderRegex = /      \{fundingMethod === 'crypto' && \([\s\S]*?\{fundingMethod === 'crypto' && \(/;
// Wait, the block starts with `{fundingMethod === 'crypto' && (` and ends with `</Dialog>\n    </div>\n  );\n}`
// Let's replace from `{fundingMethod === 'crypto' && (` to the end.
const splitParts = content.split("      {fundingMethod === 'crypto' && (");
if (splitParts.length > 1) {
    content = splitParts[0] + 
`      {fundingMethod === 'crypto' && (
        <CryptoDepositExperience 
          accounts={accounts} 
          cryptoWallets={cryptoWallets} 
          onBack={resetFlow} 
        />
      )}
    </div>
  );
}
`;
}

// 7. Update resetFlow to remove crypto specific state clearing
content = content.replace(/    setCryptoStep\('asset_selection'\);\n/, '');
content = content.replace(/    setSelectedWallet\(null\);\n/, '');

fs.writeFileSync(file, content);
console.log('File updated successfully.');
