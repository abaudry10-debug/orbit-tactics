// Copie les fichiers statiques (HTML, CSS) dans dist/ après la compilation TypeScript.
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
for (const f of ['index.html', 'style.css', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png']) copyFileSync(f, `dist/${f}`);
writeFileSync('dist/.nojekyll', '');
console.log('Fichiers statiques copiés dans dist/');
