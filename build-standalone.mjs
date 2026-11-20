import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const moduleOrder = [
  'src/constants.js',
  'src/audio.js',
  'src/sprites.js',
  'src/particles.js',
  'src/ghost.js',
  'src/webgl-post.js',
  'src/editor.js',
  'src/levels.js',
  'src/player.js',
  'src/entities.js',
  'src/renderer.js',
  'src/game.js',
  'src/main.js',
];

const css = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const bundledJs = moduleOrder
  .map((rel) => {
    let code = fs.readFileSync(path.join(__dirname, rel), 'utf8');
    // Strip ES module import statements (single or multi-line)
    code = code.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    // Strip export keywords
    code = code.replace(/^\s*export\s+(?=(const|let|var|function|class)\b)/gm, '');
    return `// === ${rel} ===\n${code.trim()}\n`;
  })
  .join('\n');

const wrappedJs = `(() => {\n'use strict';\n${bundledJs}\n})();`;

html = html
  .replace('<link rel="stylesheet" href="./style.css" />', `<style>\n${css}\n</style>`)
  .replace(
    '<script type="module" src="./src/main.js"></script>',
    `<script>\n${wrappedJs}\n</script>`
  );

const distDir = path.join(__dirname, 'dist');
fs.mkdirSync(distDir, { recursive: true });

const standalonePath = path.join(distDir, 'chroma-knight.html');
const indexPath = path.join(distDir, 'index.html');
fs.writeFileSync(standalonePath, html, 'utf8');
fs.writeFileSync(indexPath, html, 'utf8');

console.log(`Built standalone HTML: ${standalonePath} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
