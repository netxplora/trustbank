import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';
import path from 'path';

process.chdir('C:/Users/ADMIN/Documents/New Website/trustbank');
const html = fs.readFileSync(path.resolve('dist/index.html'), 'utf8');

const virtualConsole = new VirtualConsole();
virtualConsole.on("error", (err) => {
  console.log("JSDOM CONSOLE ERROR:", err);
});
virtualConsole.on("jsdomError", (err) => {
  console.log("JSDOM RUNTIME ERROR:", err.message, err.detail);
});

console.log("Loading JSDOM pointing to http://localhost:4173/ ...");
const dom = new JSDOM(html, {
  url: "http://localhost:4173/",
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
});

setTimeout(() => {
  console.log("Root HTML:", dom.window.document.getElementById('root')?.innerHTML);
  process.exit(0);
}, 5000);
