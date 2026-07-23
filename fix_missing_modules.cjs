const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');
const appsDir = path.join(rootDir, 'apps');
const packagesDir = path.join(rootDir, 'packages');

function moveDir(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            moveDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log("Copying remaining directories...");
// Move remaining packages
moveDir(path.join(srcDir, 'services'), path.join(packagesDir, 'shared-utils', 'src', 'services'));
moveDir(path.join(srcDir, 'utils'), path.join(packagesDir, 'shared-utils', 'src', 'utils'));
moveDir(path.join(srcDir, 'components', 'skeletons'), path.join(packagesDir, 'shared-ui', 'src', 'components', 'skeletons'));
if (!fs.existsSync(path.join(packagesDir, 'shared-ui', 'src', 'components'))) {
    fs.mkdirSync(path.join(packagesDir, 'shared-ui', 'src', 'components'), {recursive: true});
}
if (fs.existsSync(path.join(srcDir, 'components', 'public', 'Motion.tsx'))) {
    fs.copyFileSync(path.join(srcDir, 'components', 'public', 'Motion.tsx'), path.join(packagesDir, 'shared-ui', 'src', 'components', 'Motion.tsx'));
}

// Move admin components to banking-app
moveDir(path.join(srcDir, 'components', 'admin'), path.join(appsDir, 'banking-app', 'src', 'components', 'admin'));

// Now fix imports in all apps and packages again
function replaceImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix Motion import which moved from public/Motion to shared-ui/components/Motion
    if (content.includes('@/components/public/Motion')) {
        content = content.replace(/@\/components\/public\/Motion/g, '@trustbank/shared-ui/components/Motion');
        changed = true;
    }

    if (content.includes('@/services')) {
        content = content.replace(/@\/services/g, '@trustbank/shared-utils/services');
        changed = true;
    }
    
    if (content.includes('@/utils')) {
        content = content.replace(/@\/utils/g, '@trustbank/shared-utils/utils');
        changed = true;
    }
    
    if (content.includes('@/components/skeletons')) {
        content = content.replace(/@\/components\/skeletons/g, '@trustbank/shared-ui/components/skeletons');
        changed = true;
    }

    // Fix the logo import
    if (content.includes('@/assets/logo.png')) {
        content = content.replace(/@\/assets\/logo\.png/g, '../../assets/logo.png'); // Wait, if it's in shared-ui, it doesn't have an assets folder.
        // It's better to use relative imports, or just let Vite resolve it if we copy assets to shared-ui
        changed = true;
    }
    
    // AuthContext and BrandContext inside ProtectedRoute
    if (content.includes('@/contexts/AuthContext')) {
        content = content.replace(/@\/contexts\/AuthContext/g, '@trustbank/shared-utils/contexts/AuthContext');
        changed = true;
    }

    if (content.includes('@/components/ThemeToggle')) {
        content = content.replace(/@\/components\/ThemeToggle/g, '@trustbank/shared-ui/components/ThemeToggle');
        changed = true;
    }
    
    if (content.includes('@/components/PageTransition')) {
        content = content.replace(/@\/components\/PageTransition/g, '@trustbank/shared-ui/components/PageTransition');
        changed = true;
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

console.log("Fixing missing imports...");
processDirectory(appsDir);
processDirectory(packagesDir);

// Copy assets to shared-ui so it can resolve logo
if (!fs.existsSync(path.join(packagesDir, 'shared-ui', 'src', 'assets'))) {
    moveDir(path.join(srcDir, 'assets'), path.join(packagesDir, 'shared-ui', 'src', 'assets'));
}

// In shared-ui components, `@/assets/logo.png` should resolve to `../assets/logo.png` or `../../assets/logo.png`.
// We need to just update shared-ui to resolve `@/*` to its own `src/*`.
const sharedUiTsConfig = {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src"]
};
fs.writeFileSync(path.join(packagesDir, 'shared-ui', 'tsconfig.json'), JSON.stringify(sharedUiTsConfig, null, 2));

console.log("Done fixing remaining pieces.");
