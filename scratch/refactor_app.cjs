const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf-8');

// We need to import lazy and Suspense from 'react'
if (!content.includes('import React, { Suspense, lazy }')) {
  content = 'import React, { Suspense, lazy } from "react";\nimport { PageLoader } from "@/components/ui/PageLoader";\n' + content;
}

// Regex to match: import Something from "./pages/Something";
// or import Something from "@/components/...";
const importRegex = /^import\s+([A-Za-z0-9_]+)\s+from\s+["'](\.\/pages\/[^"']+)["'];$/gm;

content = content.replace(importRegex, (match, p1, p2) => {
  return `const ${p1} = lazy(() => import("${p2}"));`;
});

// Also wrap <Routes> inside <Suspense>
if (!content.includes('<Suspense fallback={<PageLoader />}>')) {
  content = content.replace('<Routes>', '<Suspense fallback={<PageLoader />}>\n              <Routes>');
  content = content.replace('</Routes>', '</Routes>\n              </Suspense>');
}

fs.writeFileSync(appPath, content);
console.log('App.tsx rewritten successfully.');
