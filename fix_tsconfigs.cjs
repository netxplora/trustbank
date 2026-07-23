const fs = require('fs');
const path = require('path');

const apps = ['public-website', 'banking-app'];

apps.forEach(app => {
    const tsconfigPath = path.join(__dirname, 'apps', app, 'tsconfig.json');
    const content = {
        "extends": "../../tsconfig.base.json",
        "compilerOptions": {
            "baseUrl": ".",
            "paths": {
                "@/*": ["./src/*"],
                "@trustbank/shared-ui/*": ["../../packages/shared-ui/src/*"],
                "@trustbank/shared-utils/*": ["../../packages/shared-utils/src/*"],
                "@trustbank/shared-hooks/*": ["../../packages/shared-hooks/src/*"],
                "@trustbank/shared-types/*": ["../../packages/shared-types/src/*"]
            }
        },
        "include": ["src"],
        "references": [{ "path": "./tsconfig.node.json" }]
    };
    
    // Create dummy tsconfig.node.json to avoid reference error
    fs.writeFileSync(path.join(__dirname, 'apps', app, 'tsconfig.node.json'), JSON.stringify({
      "compilerOptions": {
        "composite": true,
        "module": "ESNext",
        "moduleResolution": "bundler",
        "allowSyntheticDefaultImports": true
      },
      "include": ["vite.config.ts"]
    }, null, 2));

    fs.writeFileSync(tsconfigPath, JSON.stringify(content, null, 2));
});

console.log("Fixed app tsconfigs.");
