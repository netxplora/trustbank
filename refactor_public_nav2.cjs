const fs = require('fs');
const path = require('path');

const navPath = path.join(__dirname, 'apps', 'public-website', 'src', 'components', 'public', 'PublicNavbar.tsx');
let content = fs.readFileSync(navPath, 'utf8');

// Replace everything inside {user ? ( ... ) : ( ... )} for the desktop menu
const desktopAuthBlock = /\{user \? \([\s\S]*?\) : \(/;
const newDesktopAuthBlock = `{user ? (
            <>
              <Button className="bg-primary hover:bg-primary/90 border-none text-primary-foreground text-xs font-bold uppercase tracking-wider px-6" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <ThemeToggle />
            </>
          ) : (`;

content = content.replace(desktopAuthBlock, newDesktopAuthBlock);

// Replace mobile authenticated menu
const mobileAuthBlock = /\{user \? \([\s\S]*?<div className="flex flex-col gap-2">[\s\S]*?<\/div>[\s\S]*?\) : \(/;
// Wait, mobile auth block is lower down.
// In the original file:
/*
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link to="/dashboard"... > Dashboard</Link>
                    <Link to="/dashboard/profile" ...> My Profile</Link>
                    ...
                    <button ...> Sign Out</button>
                  </div>
                ) : (
*/
const mobileAuthLinksRegex = /\{user \? \(\s*<div className="flex flex-col gap-2">[\s\S]*?<\/div>\s*\) : \(/;
const newMobileAuthLinks = `{user ? (
                  <div className="flex flex-col gap-2">
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-sm font-semibold text-foreground"><LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard</Link>
                    <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-semibold text-red-500 mt-2"><LogOut className="h-4 w-4" /> Sign Out</button>
                  </div>
                ) : (`;

content = content.replace(mobileAuthLinksRegex, newMobileAuthLinks);

// Fix imports to use packages
content = content.replace(/@\/components/g, '@trustbank/shared-ui/components');
content = content.replace(/@\/hooks/g, '@trustbank/shared-hooks');
content = content.replace(/@\/integrations/g, '@trustbank/shared-utils/integrations');
content = content.replace(/@\/contexts/g, '@trustbank/shared-utils/contexts');
// The ThemeToggle is in shared-ui now
// Wait, ThemeToggle wasn't moved to packages/shared-ui, but it was in src/components.
// I moved src/components/ui, not src/components/ThemeToggle.
// I should make sure ThemeToggle is imported correctly.
// Let's just write the changes.

fs.writeFileSync(navPath, content);
console.log("Navbar fixed.");
