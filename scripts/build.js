const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');

function cleanDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function injectApiBase(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const script = `<script>window.API_BASE = '/api';</script>`;
  if (!html.includes('window.API_BASE')) {
    html = html.replace('<head>', `<head>\n  ${script}`);
  }
  fs.writeFileSync(filePath, html);
}

// Build: copy everything to dist
// Netlify Functions are deployed from netlify/functions separately
// Assets, pages, JS, CSS go to dist
cleanDir(dist);

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  const name = entry.name;
  if (['dist', 'node_modules', 'netlify', 'scripts', '.git'].includes(name)) continue;
  const src = path.join(root, name);
  const d = path.join(dist, name);
  if (entry.isDirectory()) copyDir(src, d);
  else fs.copyFileSync(src, d);
}

// Inject API_BASE into all HTML files
function walkHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(p);
    else if (entry.name.endsWith('.html')) injectApiBase(p);
  }
}
walkHtml(dist);

console.log('Build complete: dist/');
