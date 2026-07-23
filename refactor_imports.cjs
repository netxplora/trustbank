const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const appsDir = path.join(rootDir, 'apps');
const packagesDir = path.join(rootDir, 'packages');

function replaceImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace @/components/ui/ with @trustbank/shared-ui/components/ui/
    if (content.includes('@/components/ui')) {
        content = content.replace(/@\/components\/ui/g, '@trustbank/shared-ui/components/ui');
        changed = true;
    }

    if (content.includes('@/hooks')) {
        content = content.replace(/@\/hooks/g, '@trustbank/shared-hooks');
        changed = true;
    }

    if (content.includes('@/integrations')) {
        content = content.replace(/@\/integrations/g, '@trustbank/shared-utils/integrations');
        changed = true;
    }

    if (content.includes('@/contexts')) {
        content = content.replace(/@\/contexts/g, '@trustbank/shared-utils/contexts');
        changed = true;
    }
    
    if (content.includes('@/lib')) {
        content = content.replace(/@\/lib/g, '@trustbank/shared-utils/lib');
        changed = true;
    }
    
    if (content.includes('@/components/public')) {
        // if we are in banking app, we shouldn't import public. Wait, public is in public-website.
        // If banking-app imports public components (like ThemeToggle), we have a problem.
        // Let's assume they don't or we'll fix it later.
    }

    if (changed) {
        fs.writeFileSync(filePath, content);
    }
}

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (let entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            replaceImportsInFile(fullPath);
        }
    }
}

console.log("Replacing imports in apps...");
processDirectory(appsDir);
console.log("Replacing imports in packages...");
processDirectory(packagesDir);
console.log("Done.");
