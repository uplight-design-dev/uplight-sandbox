// Builds homepage-hero/index.html: a single self-contained file with the JS bundle,
// fonts and images inlined (drop-in for Framer / any static host).
//
//   npm install
//   npm run build
import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const here = (p) => new URL(p, import.meta.url);

const assets = {
  mark_book: ['MarkOT-Book.woff2', 'font/woff2'],
  mark_medium: ['MarkOT-Medium.woff2', 'font/woff2'],
  mark_bold: ['MarkOT-Bold.woff2', 'font/woff2'],
  hero: ['hero-bg.webp', 'image/webp'],
  logo: ['logo.svg', 'image/svg+xml'],
  ustorage: ['util-storage.webp', 'image/webp'],
  ucooling: ['util-cooling.webp', 'image/webp'],
  usolar: ['util-solar.webp', 'image/webp'],
  garage: ['card-garage.webp', 'image/webp'],
  heatpump: ['card-heatpump.webp', 'image/webp'],
  thermostat: ['card-thermostat.webp', 'image/webp'],
};

const js = await build({
  entryPoints: [here('src/hero.js').pathname],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  legalComments: 'none',
  write: false,
});

let html = await readFile(here('src/template.html'), 'utf8');
for (const [key, [file, mime]] of Object.entries(assets)) {
  const b64 = (await readFile(here(`src/assets/${file}`))).toString('base64');
  html = html.replaceAll(`{{${key}}}`, `data:${mime};base64,${b64}`);
}
html = html.replace('{{script}}', () => js.outputFiles[0].text.trim()); // fn form: no $-pattern surprises

const left = html.match(/{{\w+}}/);
if (left) throw new Error(`Unfilled placeholder in template: ${left[0]}`);

await writeFile(here('index.html'), html);
console.log(`Built index.html (${(html.length / 1024).toFixed(0)} KB)`);
