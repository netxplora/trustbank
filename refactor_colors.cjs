const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src');

const replacements = [
  // Primary (Blue) replacements -> primary
  { regex: /\b(bg-blue-500|bg-blue-600|bg-blue-700|bg-[#0047FF])\b/g, replacement: "bg-primary" },
  { regex: /\b(text-blue-500|text-blue-600|text-blue-700|text-[#0047FF])\b/g, replacement: "text-primary" },
  { regex: /\border-blue-500|border-blue-600|border-blue-700|border-[#0047FF]\b/g, replacement: "border-primary" },
  { regex: /\bhover:bg-blue-600|hover:bg-blue-700\b/g, replacement: "hover:bg-primary/90" },
  { regex: /\bhover:text-blue-600|hover:text-blue-700\b/g, replacement: "hover:text-primary/90" },
  { regex: /\btext-blue-400\b/g, replacement: "text-primary" },

  // Success (Emerald/Green) replacements -> success or accent
  { regex: /\bbg-emerald-500|bg-emerald-600|bg-green-500|bg-green-600\b/g, replacement: "bg-success" },
  { regex: /\btext-emerald-500|text-emerald-600|text-green-500|text-green-600\b/g, replacement: "text-success" },
  { regex: /\border-emerald-500|border-emerald-600\b/g, replacement: "border-success" },
  { regex: /\bbg-emerald-500\/10|bg-green-500\/10\b/g, replacement: "bg-success/10" },
  { regex: /\bbg-emerald-500\/20\b/g, replacement: "bg-success/20" },

  // Warning (Amber/Yellow) replacements -> warning
  { regex: /\bbg-amber-500|bg-yellow-500|bg-amber-600\b/g, replacement: "bg-warning" },
  { regex: /\btext-amber-500|text-yellow-500|text-amber-600\b/g, replacement: "text-warning" },
  { regex: /\border-amber-500|border-yellow-500\b/g, replacement: "border-warning" },
  { regex: /\bbg-amber-500\/10|bg-yellow-500\/10\b/g, replacement: "bg-warning/10" },

  // Error/Destructive (Red) replacements -> destructive
  { regex: /\bbg-red-500|bg-red-600\b/g, replacement: "bg-destructive" },
  { regex: /\btext-red-500|text-red-600\b/g, replacement: "text-destructive" },
  { regex: /\border-red-500|border-red-600\b/g, replacement: "border-destructive" },
  { regex: /\bbg-red-500\/10\b/g, replacement: "bg-destructive/10" },

  // Midnight Navy equivalents (Secondary)
  { regex: /\bbg-slate-900|bg-gray-900\b/g, replacement: "bg-secondary" }, // Only specific cases if desired, wait, Phase 13 replaced slate-900 with bg-background or bg-card. 

  // Recharts specific Hex codes (if they use standard colors)
  { regex: /"#B4223A"/g, replacement: '"var(--primary)"' },
  { regex: /"#0047FF"/g, replacement: '"var(--primary)"' },
  { regex: /"#16C784"/g, replacement: '"var(--success)"' },
  { regex: /"#10B981"/g, replacement: '"var(--success)"' },
  { regex: /"#F59E0B"/g, replacement: '"var(--warning)"' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Special exemption to not ruin the BrandContext itself or AdminSettingsPage inputs where we might actually type these Hexes.
      if (fullPath.includes('BrandContext.tsx') || fullPath.includes('AdminSettingsPage.tsx') || fullPath.includes('compute_hsl.js')) {
        continue;
      }

      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(targetDir);
console.log("Refactoring complete.");
