const fs = require('fs');
const path = require('path');

['public-website', 'banking-app'].forEach(app => {
  let p = path.join(__dirname, 'apps', app, 'vite.config.ts');
  let c = fs.readFileSync(p, 'utf8');
  
  if (!c.includes('@trustbank/shared-ui')) {
    c = c.replace(/alias: \{/, `alias: {
      "@trustbank/shared-ui": path.resolve(__dirname, "../../packages/shared-ui/src"),
      "@trustbank/shared-utils": path.resolve(__dirname, "../../packages/shared-utils/src"),
      "@trustbank/shared-hooks": path.resolve(__dirname, "../../packages/shared-hooks/src"),
      "@trustbank/shared-types": path.resolve(__dirname, "../../packages/shared-types/src"),`);
    fs.writeFileSync(p, c);
  }
});
console.log('Fixed vite.config.ts aliases');
