const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const appsDir = path.join(rootDir, 'apps');
const packagesDir = path.join(rootDir, 'packages');

// Create directories
['public-website', 'banking-app'].forEach(app => {
  fs.mkdirSync(path.join(appsDir, app, 'src'), { recursive: true });
});

['shared-ui', 'shared-utils', 'shared-hooks', 'shared-types'].forEach(pkg => {
  fs.mkdirSync(path.join(packagesDir, pkg, 'src'), { recursive: true });
});

// Helper to write package.json
function writePackageJson(targetPath, name, isApp = false) {
  const content = {
    name,
    version: "1.0.0",
    private: true,
    ...(isApp ? {
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview"
      }
    } : {
      main: "src/index.ts"
    })
  };
  fs.writeFileSync(path.join(targetPath, 'package.json'), JSON.stringify(content, null, 2));
}

// Write package.jsons
writePackageJson(path.join(appsDir, 'public-website'), '@trustbank/public-website', true);
writePackageJson(path.join(appsDir, 'banking-app'), '@trustbank/banking-app', true);
writePackageJson(path.join(packagesDir, 'shared-ui'), '@trustbank/shared-ui');
writePackageJson(path.join(packagesDir, 'shared-utils'), '@trustbank/shared-utils');
writePackageJson(path.join(packagesDir, 'shared-hooks'), '@trustbank/shared-hooks');
writePackageJson(path.join(packagesDir, 'shared-types'), '@trustbank/shared-types');

// Copy shared dependencies to package.jsons - wait, it's easier to just rely on root node_modules for now since we are using npm workspaces and it hoists everything.

// Let's create an index.ts file for each package so TS doesn't complain.
['shared-ui', 'shared-utils', 'shared-hooks', 'shared-types'].forEach(pkg => {
  fs.writeFileSync(path.join(packagesDir, pkg, 'src', 'index.ts'), 'export {};\n');
});

console.log("Monorepo scaffolded successfully!");
