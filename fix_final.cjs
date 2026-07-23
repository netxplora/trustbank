const fs = require('fs');
const path = require('path');

// 1. Fix main.tsx imports
['public-website', 'banking-app'].forEach(app => {
  let p = path.join(__dirname, 'apps', app, 'src', 'main.tsx');
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/import '\.\/index\.css';/, 'import "@trustbank/shared-ui/index.css";');
  fs.writeFileSync(p, c);
});

// 2. Fix AdminPaymentAnalytics.tsx
let p2 = path.join(__dirname, 'apps', 'banking-app', 'src', 'components', 'admin', 'AdminPaymentAnalytics.tsx');
if (fs.existsSync(p2)) {
    let c2 = fs.readFileSync(p2, 'utf8');
    c2 = c2.replace(/@\/integrations\/supabase\/client/g, '@trustbank/shared-utils/integrations/supabase/client');
    fs.writeFileSync(p2, c2);
}

// 3. Fix DashboardSkeleton.tsx
let p3 = path.join(__dirname, 'packages', 'shared-ui', 'src', 'components', 'skeletons', 'DashboardSkeleton.tsx');
if (fs.existsSync(p3)) {
    let c3 = fs.readFileSync(p3, 'utf8');
    c3 = c3.replace(/@\/components\/ui\/skeleton/g, '../ui/skeleton');
    fs.writeFileSync(p3, c3);
}

console.log('Fixed final TS errors');
