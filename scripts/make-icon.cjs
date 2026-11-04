// Génère les icônes PNG (iPhone et appli) à partir du pixel art du jeu.
// Usage : npm run build && node scripts/make-icon.cjs  (nécessite Playwright et un serveur sur dist/)
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('node:fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(process.argv[2] || 'http://127.0.0.1:8765/index.html');
  const out = await p.evaluate(async () => {
    const { hero } = await import('./js/sprites.js');
    const N = 36;
    const c = document.createElement('canvas'); c.width = N; c.height = N;
    const x = c.getContext('2d');
    const px = (a, y, w, h, col) => { x.fillStyle = col; x.fillRect(a, y, w, h); };
    // ciel brûlé en bandes
    const bands = ['#2a1226', '#3e1630', '#5a1d36', '#7d2638', '#a33a34', '#c9542f', '#e8733a', '#ff9a4d'];
    bands.forEach((col, i) => px(0, i * 3, N, 3, col));
    px(0, 24, N, 12, '#ff9a4d');
    // soleil voilé
    for (let yy = -6; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) if (xx * xx + yy * yy <= 36) px(26 + xx, 13 + yy, 1, 1, xx * xx + yy * yy <= 16 ? '#ffe0a3' : '#ffc27a');
    // poussière
    [[4, 5], [12, 8], [30, 3], [20, 10], [7, 14], [33, 20]].forEach(([a, y]) => px(a, y, 1, 1, '#ffd9b0'));
    // silhouette de ruines
    const sky = '#2b1424';
    px(0, 21, 5, 15, sky); px(1, 18, 2, 3, sky); px(5, 24, 4, 12, sky);
    px(9, 17, 3, 19, sky); px(10, 13, 1, 4, sky); px(12, 22, 3, 14, sky);
    px(23, 19, 4, 17, sky); px(24, 16, 1, 3, sky); px(26, 17, 1, 2, sky); px(27, 23, 4, 13, sky); px(31, 20, 5, 16, sky); px(33, 18, 2, 2, sky);
    // fenêtres éclairées
    [[2, 24], [10, 20], [24, 22], [32, 23], [28, 26]].forEach(([a, y]) => px(a, y, 1, 1, '#4fd1c5'));
    // sol
    px(0, 31, N, 5, '#5a3425'); px(0, 31, N, 1, '#8c5a38');
    // héros au centre
    x.imageSmoothingEnabled = false;
    x.drawImage(hero('down', 0), 10, 17);
    const scale = (s, size, pad) => {
      const o = document.createElement('canvas'); o.width = size; o.height = size;
      const ox = o.getContext('2d'); ox.imageSmoothingEnabled = false;
      ox.fillStyle = '#2a1226'; ox.fillRect(0, 0, size, size);
      ox.drawImage(c, pad, pad, N * s, N * s);
      return o.toDataURL('image/png');
    };
    return { a: scale(5, 180, 0), b: scale(14, 512, 4) };
  });
  fs.writeFileSync('icon-180.png', Buffer.from(out.a.split(',')[1], 'base64'));
  fs.writeFileSync('icon-512.png', Buffer.from(out.b.split(',')[1], 'base64'));
  console.log('icônes écrites');
  await b.close();
})();
