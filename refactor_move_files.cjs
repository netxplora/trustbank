const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');
const appsDir = path.join(rootDir, 'apps');
const packagesDir = path.join(rootDir, 'packages');

const publicAppDir = path.join(appsDir, 'public-website', 'src');
const bankingAppDir = path.join(appsDir, 'banking-app', 'src');

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

// 1. Move shared packages
console.log("Moving shared packages...");
moveDir(path.join(srcDir, 'components', 'ui'), path.join(packagesDir, 'shared-ui', 'src', 'components', 'ui'));
moveDir(path.join(srcDir, 'hooks'), path.join(packagesDir, 'shared-hooks', 'src'));
moveDir(path.join(srcDir, 'integrations'), path.join(packagesDir, 'shared-utils', 'src', 'integrations'));
moveDir(path.join(srcDir, 'contexts'), path.join(packagesDir, 'shared-utils', 'src', 'contexts'));
moveDir(path.join(srcDir, 'lib'), path.join(packagesDir, 'shared-utils', 'src', 'lib'));
if (fs.existsSync(path.join(srcDir, 'index.css'))) {
    fs.copyFileSync(path.join(srcDir, 'index.css'), path.join(packagesDir, 'shared-ui', 'src', 'index.css'));
}

// 2. Move Apps
console.log("Moving apps...");
// Banking App
moveDir(path.join(srcDir, 'components', 'dashboard'), path.join(bankingAppDir, 'components', 'dashboard'));
moveDir(path.join(srcDir, 'pages', 'dashboard'), path.join(bankingAppDir, 'pages', 'dashboard'));
moveDir(path.join(srcDir, 'pages', 'admin'), path.join(bankingAppDir, 'pages', 'admin'));

// Public App
moveDir(path.join(srcDir, 'components', 'public'), path.join(publicAppDir, 'components', 'public'));

// Other public pages need to be moved individually
const allPages = fs.existsSync(path.join(srcDir, 'pages')) ? fs.readdirSync(path.join(srcDir, 'pages'), { withFileTypes: true }) : [];
for (let page of allPages) {
    if (page.isFile()) {
        const name = page.name;
        // Auth pages go to banking app according to PRD: "If visitor is not authenticated... redirect to app.trustbank.com/auth/login"
        // Wait, the PRD says: "If the visitor is not authenticated: The Login button should redirect to: https://app.trustbank.com/auth/login"
        // So LoginPage, RegisterPage, ResetPasswordPage go to banking-app
        if (['LoginPage.tsx', 'RegisterPage.tsx', 'ResetPasswordPage.tsx', 'AccessDenied.tsx', 'MaintenancePage.tsx', 'ServerErrorPage.tsx'].includes(name)) {
            if (!fs.existsSync(path.join(bankingAppDir, 'pages'))) fs.mkdirSync(path.join(bankingAppDir, 'pages'), {recursive: true});
            fs.copyFileSync(path.join(srcDir, 'pages', name), path.join(bankingAppDir, 'pages', name));
        } else {
            if (!fs.existsSync(path.join(publicAppDir, 'pages'))) fs.mkdirSync(path.join(publicAppDir, 'pages'), {recursive: true});
            fs.copyFileSync(path.join(srcDir, 'pages', name), path.join(publicAppDir, 'pages', name));
        }
    }
}

console.log("File moving complete. DO NOT DELETE ORIGINAL SRC YET.");
