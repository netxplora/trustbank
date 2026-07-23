const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components')
];

const replacements = [
  // Success
  { regex: /\bbg-(?:emerald|green)-50\b/g, replacement: "bg-success/10" },
  { regex: /\bbg-(?:emerald|green)-100\b/g, replacement: "bg-success/20" },
  { regex: /\btext-(?:emerald|green)-700\b/g, replacement: "text-success" },
  { regex: /\btext-(?:emerald|green)-800\b/g, replacement: "text-success" },
  { regex: /\border-(?:emerald|green)-100\b/g, replacement: "border-success/20" },
  { regex: /\border-(?:emerald|green)-200\b/g, replacement: "border-success/30" },

  // Warning
  { regex: /\bbg-(?:amber|yellow)-50\b/g, replacement: "bg-warning/10" },
  { regex: /\bbg-(?:amber|yellow)-100\b/g, replacement: "bg-warning/20" },
  { regex: /\btext-(?:amber|yellow)-700\b/g, replacement: "text-warning" },
  { regex: /\btext-(?:amber|yellow)-800\b/g, replacement: "text-warning" },
  { regex: /\border-(?:amber|yellow)-100\b/g, replacement: "border-warning/20" },
  { regex: /\border-(?:amber|yellow)-200\b/g, replacement: "border-warning/30" },

  // Destructive/Error
  { regex: /\bbg-red-50\b/g, replacement: "bg-destructive/10" },
  { regex: /\bbg-red-100\b/g, replacement: "bg-destructive/20" },
  { regex: /\btext-red-700\b/g, replacement: "text-destructive" },
  { regex: /\btext-red-800\b/g, replacement: "text-destructive" },
  { regex: /\border-red-100\b/g, replacement: "border-destructive/20" },
  { regex: /\border-red-200\b/g, replacement: "border-destructive/30" },

  // Primary
  { regex: /\bbg-blue-50\b/g, replacement: "bg-primary/10" },
  { regex: /\bbg-blue-100\b/g, replacement: "bg-primary/20" },
  { regex: /\btext-blue-700\b/g, replacement: "text-primary" },
  { regex: /\btext-blue-800\b/g, replacement: "text-primary" },
  { regex: /\border-blue-100\b/g, replacement: "border-primary/20" },
  { regex: /\border-blue-200\b/g, replacement: "border-primary/30" },
];

function processDirectory(directory) {
  if (!fs.existsSync(directory)) return;
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Skip these system files
      if (fullPath.includes('BrandContext.tsx') || fullPath.includes('AdminSettingsPage.tsx')) {
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

targetDirs.forEach(processDirectory);
console.log("Light colors refactoring complete.");
