// Copie les fichiers statiques (HTML, CSS) dans dist/ après la compilation TypeScript.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
for (const f of ['index.html', 'privacy.html', 'style.css', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png']) copyFileSync(f, `dist/${f}`);
// la police (téléchargée par la compilation chez GitHub, cf. .github/workflows)
if (existsSync('fonts/VT323-Regular.ttf')) {
  mkdirSync('dist/fonts', { recursive: true });
  copyFileSync('fonts/VT323-Regular.ttf', 'dist/fonts/VT323-Regular.ttf');
}
writeFileSync('dist/.nojekyll', '');
console.log('Fichiers statiques copiés dans dist/');
