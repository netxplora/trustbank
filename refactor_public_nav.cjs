const fs = require('fs');
const path = require('path');

const navPath = path.join(__dirname, 'apps', 'public-website', 'src', 'components', 'public', 'PublicNavbar.tsx');
let content = fs.readFileSync(navPath, 'utf8');

// Replace the user dropdown with a simple Dashboard button if authenticated
const userProfileDropdownRegex = /<div className="relative" onMouseLeave=\{\(\) => setProfileMenuOpen\(false\)\}>[\s\S]*?<\/div>/;
const simpleDashboardBtn = `<Button className="bg-primary hover:bg-primary/90 border-none text-primary-foreground text-xs font-bold uppercase tracking-wider px-6" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>`;

content = content.replace(userProfileDropdownRegex, simpleDashboardBtn);

// Replace mobile authenticated links
const mobileAuthLinksRegex = /<div className="flex flex-col gap-2">[\s\S]*?<button onClick=\{\(\) => \{ setMenuOpen\(false\); handleLogout\(\); \}\}[\s\S]*?<\/button>\s*<\/div>/;
const simpleMobileDashboard = `<div className="flex flex-col gap-2">
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-sm font-semibold text-foreground"><LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard</Link>
                    <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-semibold text-red-500 mt-2"><LogOut className="h-4 w-4" /> Sign Out</button>
                  </div>`;

content = content.replace(mobileAuthLinksRegex, simpleMobileDashboard);

fs.writeFileSync(navPath, content);
console.log("PublicNavbar.tsx refactored to remove dashboard routes.");
