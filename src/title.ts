// Illustration animée de l'écran d'accueil, en pixel art dessiné en code.
// Un ciel brûlé, une étoile énorme qui se couche sur des ruines, une petite
// planète bleue au loin, et le héros, de dos, qui regarde le ciel.
import { hero } from './sprites.js';

// Taille logique : 160 px sur le petit côté en vertical, 110 px de haut en horizontal.
let W = 160;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let h = 280;
let running = false;
let skyline: { x: number; w: number; top: number; antenna: number; windows: [number, number][] }[] = [];
let dust: { x: number; y: number; v: number; a: number }[] = [];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const px = (x: number, y: number, w: number, hh: number, col: string) => {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(hh));
};

function layout() {
  const rect = canvas.getBoundingClientRect();
  const ratio = rect.height > 0 && rect.width > 0 ? rect.height / rect.width : 1.8;
  if (ratio >= 1) {
    W = 160;
    h = Math.round(W * ratio);
  } else {
    h = 110;
    W = Math.round(h / ratio);
  }
  canvas.width = W;
  canvas.height = h;
  ctx.imageSmoothingEnabled = false;

  // silhouette de la ville en ruine (toujours la même)
  const rand = rng(2141);
  skyline = [];
  let x = -4;
  while (x < W + 4) {
    const w = 6 + Math.floor(rand() * 14);
    const top = 10 + Math.floor(rand() * 34);
    const windows: [number, number][] = [];
    for (let i = 0; i < 3; i++) if (rand() > 0.55) windows.push([x + 2 + Math.floor(rand() * (w - 3)), Math.floor(rand() * top)]);
    skyline.push({ x, w, top, antenna: rand() > 0.7 ? 4 + Math.floor(rand() * 8) : 0, windows });
    x += w + (rand() > 0.6 ? 2 : 0);
  }
  dust = Array.from({ length: 36 }, () => ({ x: Math.random() * W, y: Math.random() * h, v: 3 + Math.random() * 6, a: 0.2 + Math.random() * 0.5 }));
}

function draw(t: number) {
  const horizon = Math.round(h * 0.6);

  // ciel en bandes, avec un tramage entre chaque bande
  const bands = ['#12081a', '#1e0c22', '#2e1028', '#46162e', '#651f32', '#8a2c33', '#b23e30', '#d6562d', '#f07a36', '#ff9a4d'];
  const bh = horizon / bands.length;
  bands.forEach((col, i) => {
    px(0, i * bh, W, bh + 1, col);
    if (i > 0) {
      ctx.fillStyle = bands[i - 1];
      for (let y = Math.round(i * bh); y < Math.round(i * bh) + 2; y++) for (let xx = (y % 2); xx < W; xx += 2) ctx.fillRect(xx, y, 1, 1);
    }
  });

  // quelques étoiles pâles en haut
  const stars = rng(7);
  for (let i = 0; i < 18; i++) {
    const sx = Math.floor(stars() * W);
    const sy = Math.floor(stars() * horizon * 0.35);
    const tw = Math.sin(t * 1.5 + i) > 0.6 ? '#ffffff' : '#9a7a9a';
    px(sx, sy, 1, 1, tw);
  }

  // la petite planète bleue, très loin
  const bx = Math.round(W * 0.84);
  const by = Math.round(h * 0.4);
  for (let y = -3; y <= 3; y++) for (let xx = -3; xx <= 3; xx++) {
    const d = xx * xx + y * y;
    if (d <= 10) px(bx + xx, by + y, 1, 1, d <= 3 ? '#bfe6ff' : xx + y < 0 ? '#7fc4ff' : '#3a6fb0');
  }
  if (Math.sin(t * 0.8) > 0) px(bx - 5, by - 5, 1, 1, '#d8f0ff');

  // l'étoile énorme et trop proche, qui écrase l'horizon
  const sr = Math.round(Math.min(W, h) * 0.36);
  const scx = Math.round(W * 0.46);
  const scy = horizon + Math.round(sr * 0.2);
  const pulse = Math.sin(t * 0.7) * 1.2;
  for (let y = -sr - 6; y <= sr + 6; y++) {
    for (let xx = -sr - 6; xx <= sr + 6; xx++) {
      const d = Math.sqrt(xx * xx + y * y);
      if (scy + y > horizon + 2) continue;
      let col = '';
      if (d <= sr * 0.62) col = '#fff3c4';
      else if (d <= sr * 0.82) col = '#ffe08a';
      else if (d <= sr + pulse) col = '#ffc160';
      else if (d <= sr + 5 + pulse && (xx + y + Math.floor(t * 4)) % 2 === 0) col = '#ffb050'; // halo tramé
      if (col) px(scx + xx, scy + y, 1, 1, col);
    }
  }
  // traînées de chaleur devant l'étoile
  for (let i = 0; i < 4; i++) {
    const yy = horizon - 8 - i * 9 + Math.round(Math.sin(t + i) * 1.5);
    px(scx - sr + 6 + i * 3, yy, sr * 1.4, 1, 'rgba(255,230,170,0.35)');
  }

  // fins rais de lumière qui montent de la ville vers le ciel (sans rien expliquer)
  for (const [lx, phase] of [[Math.round(W * 0.22), 0], [Math.round(W * 0.68), 2.1], [Math.round(W * 0.9), 4.2]] as const) {
    const a = 0.1 + 0.08 * Math.sin(t * 0.9 + phase);
    px(lx, 0, 1, horizon - 6, `rgba(120,240,230,${a.toFixed(3)})`);
  }

  // ruines en silhouette
  const city = '#2a1222';
  for (const b of skyline) {
    const top = horizon - b.top;
    px(b.x, top, b.w, h - top, city);
    // sommet brisé
    px(b.x + 1, top - 2, Math.max(1, b.w - 4), 2, city);
    px(b.x + b.w - 2, top - 1, 1, 1, '#1a0a16');
    if (b.antenna) px(b.x + Math.floor(b.w / 2), top - b.antenna, 1, b.antenna, city);
    for (const [wx, wy] of b.windows) px(wx, top + 3 + wy, 1, 1, Math.sin(t * 2 + wx) > 0.85 ? '#ffe08a' : '#4fd1c5');
  }

  // butte au premier plan, où se tient le héros
  const ground = Math.round(h * 0.7);
  px(0, ground, W, h - ground, '#1a0c16');
  for (let xx = 0; xx < W; xx++) {
    const bump = Math.round(Math.sin(xx * 0.09) * 2 + Math.sin(xx * 0.23) * 1);
    px(xx, ground - 3 + bump, 1, 4, '#1a0c16');
  }
  const r2 = rng(19);
  for (let i = 0; i < 14; i++) px(Math.floor(r2() * W), ground + 2 + Math.floor(r2() * (h - ground - 4)), 2 + Math.floor(r2() * 3), 1, '#2e1824');

  // le héros, de dos, qui regarde le ciel
  ctx.drawImage(hero('up', 0), Math.round(W / 2 - 8), ground - 15);

  // poussière qui dérive
  for (const p of dust) {
    p.x += p.v * 0.016;
    p.y += Math.sin(t + p.x) * 0.05;
    if (p.x > W) p.x = -1;
    px(p.x, p.y, 1, 1, `rgba(255,214,160,${p.a})`);
  }
}

let lastDraw = 0;
function loop(now: number) {
  if (!running) return;
  if (now - lastDraw > 66) {
    // ~15 images par seconde : assez pour l'ambiance, léger pour la batterie
    lastDraw = now;
    draw(now / 1000);
  }
  requestAnimationFrame(loop);
}

export function startTitleScene(el: HTMLCanvasElement) {
  canvas = el;
  ctx = el.getContext('2d')!;
  layout();
  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
}

export function stopTitleScene() {
  running = false;
}

export function relayoutTitleScene() {
  if (canvas) layout();
}
