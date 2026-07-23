const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components')
];

const replacements = [
  { search: /bg-slate-950\/95/g, replace: 'bg-background/95' },
  { search: /bg-slate-950/g, replace: 'bg-background' },
  { search: /from-slate-900/g, replace: 'from-background' },
  { search: /via-slate-950/g, replace: 'via-background' },
  { search: /to-slate-900/g, replace: 'to-background' },
  { search: /text-slate-400/g, replace: 'text-muted-foreground' },
  { search: /text-slate-300/g, replace: 'text-muted-foreground' },
  { search: /text-slate-200/g, replace: 'text-muted-foreground' },
  { search: /text-slate-500/g, replace: 'text-muted-foreground' },
  { search: /text-slate-600/g, replace: 'text-muted-foreground' },
  { search: /border-slate-800/g, replace: 'border-border' },
  { search: /border-slate-700/g, replace: 'border-border' },
  { search: /bg-slate-800/g, replace: 'bg-muted' },
  { search: /bg-slate-900/g, replace: 'bg-surface' },
  { search: /text-white/g, replace: 'text-foreground' }
];

function processDirectory(directory) {
  if (!fs.existsSync(directory)) return;
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('AdminSettingsPage.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const { search, replace } of replacements) {
        content = content.replace(search, replace);
      }
      
      // Specifically fix buttons that use text-foreground where they should probably just inherit
      // but let's just do the automated replacements first.
      
      if (content !== original) {
        console.log(`Updated: ${fullPath}`);
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

targets.forEach(processDirectory);
console.log("Refactoring complete.");
