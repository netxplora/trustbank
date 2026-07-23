const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, 'apps');
const apps = ['public-website', 'banking-app'];

apps.forEach(app => {
    const appDir = path.join(appsDir, app);
    
    // 1. Update tailwind.config.ts
    const tailwindPath = path.join(appDir, 'tailwind.config.ts');
    if (fs.existsSync(tailwindPath)) {
        let content = fs.readFileSync(tailwindPath, 'utf8');
        content = content.replace(
            /content:\s*\[[\s\S]*?\]/, 
            `content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/shared-ui/src/**/*.{ts,tsx}"
  ]`
        );
        fs.writeFileSync(tailwindPath, content);
    }
    
    // 2. Update tsconfig.app.json (assuming it needs the aliases)
    const tsconfigPath = path.join(appDir, 'tsconfig.app.json');
    if (!fs.existsSync(tsconfigPath)) {
        // We copied tsconfig from root. Let's create it if it doesn't exist.
        // Actually, let's just make sure both apps have a clean tsconfig.json
        fs.writeFileSync(path.join(appDir, 'tsconfig.json'), JSON.stringify({
            "extends": "../../tsconfig.base.json",
            "compilerOptions": {
                "baseUrl": ".",
                "paths": {
                    "@/*": ["./src/*"]
                }
            },
            "include": ["src"],
            "references": [{ "path": "./tsconfig.node.json" }]
        }, null, 2));
    }
    
    // 3. Update vite.config.ts
    const vitePath = path.join(appDir, 'vite.config.ts');
    if (fs.existsSync(vitePath)) {
        let content = fs.readFileSync(vitePath, 'utf8');
        // Ensure alias is correct
        content = content.replace(/path\.resolve\(__dirname, "src"\)/, `path.resolve(__dirname, "./src")`);
        fs.writeFileSync(vitePath, content);
    }
});

console.log("App configurations updated for monorepo.");
