// Chapitre 2 : Azura. Pour l'instant, la tranche verticale, jouable en mode développeur.
import { playTheme, sfx } from '../../engine/audio.js';
import type { Chapter } from '../../engine/chapter.js';
import { view, type Game } from '../../engine/game.js';
import { registerTiles, tile } from '../../engine/sprites.js';
import type { PersonLook } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';
import { MAPS_AZ, SOLID_AZ, START_AZ } from './maps.js';
import { CLUES_AZ, ITEMS_AZ, QUESTIONS_AZ, SCRIPTS_AZ, THREADS_AZ } from './story.js';
import { MASK, withFringe } from './tiles.js';

const look = (id: string, colors: Record<string, string>): PersonLook => ({ id, colors: { g: colors.s ?? '#f0c39a', w: '#14101c', ...colors } });

// Le héros, dans son nouveau corps : la combinaison blanche d'Aurore, sans lunettes ni écharpe.
const HERO_AZ = look('heroAz', {
  h: '#5a3b28', H: '#7a5236', d: '#3e281a', s: '#f0c39a', S: '#d39a72',
  r: '#2a9d9a', R: '#1d6f70', j: '#e3e9eb', J: '#ffffff', e: '#b4c0c4', p: '#c9d3d6', b: '#6b7b80', a: '#dfe6e8', A: '#f4f8f9',
});

const PEOPLE: Record<string, PersonLook> = {
  // Betti, vingt ans : cheveux roux, foulard jaune comme sa robe d'enfant, salopette d'atelier
  betti: look('betti', {
    h: '#c0602a', H: '#e08a4a', d: '#8a3f1c', s: '#f6cfae', S: '#e0a985',
    r: '#f2c230', R: '#c99a1a', j: '#3f7f6e', J: '#5aa08c', e: '#2c5c50', p: '#3b4a5a', b: '#5a3f2c', a: '#3f7f6e', A: '#5aa08c',
  }),
  ilda: look('ilda', {
    h: '#d9d9d9', H: '#ffffff', d: '#b0b0b0', s: '#eec7a4', S: '#cf9f7c',
    r: '#7a4f9a', R: '#5a3878', j: '#9b7fb8', J: '#b89bd2', e: '#6f5a88', p: '#5a4a6a', b: '#4a3a3a', a: '#9b7fb8', A: '#b89bd2',
  }),
  tom: look('tom', {
    h: '#2a2a33', H: '#44444f', d: '#1a1a20', s: '#b07a52', S: '#8e5e3c',
    r: '#e07a2a', R: '#a85618', j: '#7a8590', J: '#97a3ad', e: '#58616a', p: '#3a3f4a', b: '#2a2a2a', a: '#7a8590', A: '#97a3ad',
  }),
  nora: look('nora', {
    h: '#e8c870', H: '#f6e09a', d: '#b89a48', s: '#f3cdb0', S: '#d9a688',
    r: '#f3f7f6', R: '#c9d3d6', j: '#3f6fb0', J: '#5f8fd0', e: '#2c4f80', p: '#e0d8c8', b: '#6b5a48', a: '#3f6fb0', A: '#5f8fd0',
  }),
  joss: look('joss', {
    h: '#6b5a48', H: '#8a7660', d: '#4a3d30', s: '#e2b48c', S: '#c08e66',
    r: '#c0423b', R: '#8c2c2a', j: '#4a6a3a', J: '#5f8a4a', e: '#34502a', p: '#4a4a3a', b: '#3a2e22', a: '#4a6a3a', A: '#5f8a4a',
  }),
  pass1: look('pass1', {
    h: '#8a5a3a', H: '#a8754e', d: '#5f3c26', s: '#f0c39a', S: '#d39a72',
    r: '#5fd0c6', R: '#2a9d9a', j: '#f0d070', J: '#f8e49a', e: '#c8a848', p: '#5a6a7a', b: '#3a3030', a: '#f0d070', A: '#f8e49a',
  }),
  pass2: look('pass2', {
    h: '#1e1e26', H: '#34343e', d: '#121218', s: '#8e5e3c', S: '#704628',
    r: '#f39ac6', R: '#c0688f', j: '#e8eef0', J: '#ffffff', e: '#b4c0c4', p: '#2a9d9a', b: '#3a3030', a: '#e8eef0', A: '#ffffff',
  }),
  pass3: look('pass3', {
    h: '#b0b0b0', H: '#d0d0d0', d: '#8a8a8a', s: '#e8bc96', S: '#c99a76',
    r: '#3f6fb0', R: '#2c4f80', j: '#6a8a5a', J: '#82a272', e: '#4a6640', p: '#4a4a3a', b: '#3a2e22', a: '#6a8a5a', A: '#82a272',
  }),
  pass4: look('pass4', {
    h: '#d08a3a', H: '#e8a85a', d: '#a0662a', s: '#f6d2b4', S: '#dcae8e',
    r: '#ffffff', R: '#cccccc', j: '#c45ad8', J: '#d888e8', e: '#8a3a9a', p: '#3b4a5a', b: '#5a3f2c', a: '#c45ad8', A: '#d888e8',
  }),
  enfant: look('enfant', {
    h: '#3a2418', H: '#5a3a26', d: '#24160e', s: '#c98d62', S: '#a86f48',
    r: '#ffe066', R: '#d9b83a', j: '#e0574f', J: '#f08a80', e: '#a83b35', p: '#3b5a8a', b: '#2a2a2a', a: '#e0574f', A: '#f08a80',
  }),
};

// ---------- les lisières : quelles cases d'herbe touchent celle-ci ? ----------
const GRASSY = new Set(['"', ',', ';', 'A', 'u', 'd', 'c']);
function grassMask(g: Game, x: number, y: number): number {
  const rows = g.map.rows;
  const is = (dx: number, dy: number) => {
    const xx = x + dx, yy = y + dy;
    if (xx < 0 || yy < 0 || yy >= g.map.height || xx >= g.map.width) return false;
    return GRASSY.has(rows[yy][xx]);
  };
  let m = 0;
  if (is(0, -1)) m |= MASK.N;
  if (is(1, 0)) m |= MASK.E;
  if (is(0, 1)) m |= MASK.S;
  if (is(-1, 0)) m |= MASK.W;
  if (is(1, -1)) m |= MASK.NE;
  if (is(1, 1)) m |= MASK.SE;
  if (is(-1, 1)) m |= MASK.SW;
  if (is(-1, -1)) m |= MASK.NW;
  return m;
}

// ---------- au-delà des bords : un paysage qui prolonge la carte ----------
const h01 = (x: number, y: number, s: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};
/** Un bruit doux : des régions de quelques cases, qui ondulent. */
function smooth(x: number, y: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
  const a = h01(xi, yi, s), b = h01(xi + 1, yi, s), c = h01(xi, yi + 1, s), d = h01(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}
const WATERISH = new Set(['~', 'B', 'b']);
const BARE = new Set(['x', 'o', 'k', '1', '2', '3', '4']);

function wildTile(g: Game, x: number, y: number, seed: number): string {
  const h = h01(x, y, seed + 9);
  const t = g.time;
  if (h < 0.035) return 'crater';
  if (h < 0.075) return 'crystals' + (Math.floor(t * 1.5 + x * 0.7 + y) % 2);
  if (h < 0.095) return 'geyser' + (Math.floor(t * 3 + x + y * 2) % 3);
  if (h < 0.11) return 'fossil';
  if (h < 0.125) return 'spire' + (Math.floor(t * 2 + x) % 2);
  if (h < 0.2) return 'boulders';
  if (h < 0.205) return 'probe' + (Math.floor(t * 1.2) % 2);
  return 'regolith';
}

// La forêt est dessinée d'un seul tenant : des cimes rondes qui débordent d'une case sur l'autre.
const CANOPY_PAL: [string, string, string][] = [
  ['#2f9e8a', '#1f6f66', '#62d0b4'],
  ['#2f8fae', '#1e5f7a', '#6cc6e8'],
  ['#3a9a52', '#25693a', '#78cf7a'],
  ['#6a5aa8', '#463a7a', '#a796e0'],
];
const forestCache = new Map<string, HTMLCanvasElement>();
function forestCanvas(x: number, y: number, seed: number): HTMLCanvasElement {
  const key = `${seed}:${x},${y}`;
  let cv = forestCache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = 16;
  cv.height = 16;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#103236';
  c.fillRect(0, 0, 16, 16);
  // les arbres des cases voisines, pour que leurs cimes débordent jusqu'ici
  const trees: { cx: number; cy: number; rad: number; pal: [string, string, string]; fruit: number }[] = [];
  for (let j = y - 1; j <= y + 1; j++) {
    for (let i = x - 1; i <= x + 1; i++) {
      for (let k = 0; k < 2; k++) {
        const kind = smooth(i * 0.22, j * 0.22, seed + 1);
        trees.push({
          cx: (i - x) * 16 + 2 + h01(i, j, seed + k * 3) * 12,
          cy: (j - y) * 16 + 2 + h01(i, j, seed + k * 3 + 1) * 12,
          rad: 5 + h01(i, j, seed + k * 3 + 2) * 4,
          pal: CANOPY_PAL[kind < 0.3 ? 3 : kind < 0.5 ? 1 : kind < 0.75 ? 0 : 2],
          fruit: h01(i, j, seed + k + 40),
        });
      }
    }
  }
  trees.sort((a, b) => a.cy - b.cy);
  const disc = (cx: number, cy: number, rad: number, col: string) => {
    c.fillStyle = col;
    for (let py = Math.max(0, Math.floor(cy - rad)); py <= Math.min(15, Math.ceil(cy + rad)); py++) {
      const half = Math.sqrt(Math.max(0, rad * rad - (py - cy) ** 2));
      const x0 = Math.max(0, Math.round(cx - half)), x1 = Math.min(16, Math.round(cx + half));
      if (x1 > x0) c.fillRect(x0, py, x1 - x0, 1);
    }
  };
  for (const t of trees) {
    disc(t.cx + 1.5, t.cy + 2, t.rad, 'rgba(5,20,25,0.55)');
    disc(t.cx, t.cy, t.rad, t.pal[1]);
    disc(t.cx - 0.6, t.cy - 0.8, t.rad * 0.85, t.pal[0]);
    disc(t.cx - t.rad * 0.35, t.cy - t.rad * 0.4, t.rad * 0.4, t.pal[2]);
    if (t.fruit > 0.82) {
      c.fillStyle = t.fruit > 0.92 ? '#ff7ac8' : '#5ff0e0';
      for (const [dx, dy] of [[-2, 2], [2, 1], [0, -2]]) {
        const fx = Math.round(t.cx + dx), fy = Math.round(t.cy + dy);
        if (fx >= 0 && fy >= 0 && fx < 16 && fy < 16) c.fillRect(fx, fy, 1, 1);
      }
    }
  }
  if (forestCache.size > 4000) forestCache.clear();
  forestCache.set(key, cv);
  return cv;
}

function renderVoid(g: Game, c: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number) {
  const W = g.map.width, H = g.map.height;
  if (!g.map.outdoor) return false;
  const cx = Math.max(0, Math.min(W - 1, x)), cy = Math.max(0, Math.min(H - 1, y));
  const d = Math.max(cx - x, x - cx, cy - y, y - cy);
  const edge = g.map.rows[cy][cx];
  const seed = g.map.id.length * 13 + g.map.width;
  const wave = Math.floor(g.time * 1.4 + (x + y) * 0.35) % 2;
  const n = smooth(x * 0.18, y * 0.18, seed);
  let name = '';
  let forest = false;
  if (WATERISH.has(edge) && d <= 4 + Math.round(n * 3)) name = d > 3 ? 'farWater' : 'azWater' + wave;
  else if (WATERISH.has(edge) && d <= 5 + Math.round(n * 3)) name = 'azRockFace';
  else if (BARE.has(edge)) (n > 0.66 ? (forest = true) : (name = wildTile(g, x, y, seed)));
  else n < 0.22 ? (name = wildTile(g, x, y, seed)) : (forest = true);
  if (forest) {
    // de loin en loin, une clairière de champignons géants
    c.drawImage(forestCanvas(x, y, seed), sx, sy);
    // çà et là, un champignon géant, seul, décalé dans sa case
    const m = h01(x, y, seed + 21);
    if (m < 0.07) {
      const size = m < 0.015 ? 2 : m < 0.04 ? 1 : 0;
      const off = Math.round((h01(x, y, seed + 22) - 0.5) * 6);
      c.drawImage(tile('mushroom' + size, (x * 3 + y) & 0xff), sx + off, sy - Math.abs(off) / 2);
    }
  } else {
    // juste au-delà du bord, une ceinture de rochers : on voit qu'on ne peut pas aller plus loin
    if (d === 1 && name === 'regolith') name = 'boulders';
    else if (d === 2 && name === 'regolith' && h01(x, y, seed + 2) < 0.45) name = 'boulders';
    c.drawImage(tile(name, (x * 7 + y * 13) & 0xff), sx, sy);
  }
  // plus c'est loin, plus c'est sombre : un fondu continu, sans marches
  const shade = (k: number) => Math.min(0.55, 0.03 + k * 0.065);
  const gx = x < 0 ? 1 : x >= W ? -1 : 0, gy = y < 0 ? 1 : y >= H ? -1 : 0;
  const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
  const horiz = dx >= dy;
  const far = shade(d), near = shade(d - 1);
  const grad = horiz ? c.createLinearGradient(sx + (gx > 0 ? 0 : 16), 0, sx + (gx > 0 ? 16 : 0), 0) : c.createLinearGradient(0, sy + (gy > 0 ? 0 : 16), 0, sy + (gy > 0 ? 16 : 0));
  grad.addColorStop(0, `rgba(6,12,24,${far})`);
  grad.addColorStop(1, `rgba(6,12,24,${near})`);
  c.fillStyle = grad;
  c.fillRect(sx, sy, 16, 16);
  return true;
}

// ---------- les montagnes : une chaîne de pics qui débordent d'une case à l'autre ----------
const madeMountains = new Set<string>();
function mountainTile(g: Game, x: number, y: number, mask: number): string {
  const name = `mtn:${g.map.id}:${x},${y}:${mask}`;
  if (madeMountains.has(name)) return name;
  madeMountains.add(name);
  const rows = g.map.rows;
  const isM = (i: number, j: number) => i >= 0 && j >= 0 && i < g.map.width && j < g.map.height && rows[j][i] === 'M';
  const seed = g.map.id.length * 7;
  const peaks: { cx: number; base: number; h: number; half: number; snow: boolean }[] = [];
  for (let j = y - 1; j <= y + 2; j++) {
    for (let i = x - 1; i <= x + 1; i++) {
      if (!isM(i, j)) continue;
      // un pic par case ; plus haut s'il a de la montagne derrière lui
      const tall = isM(i, j - 1);
      peaks.push({
        cx: (i - x) * 16 + 8 + (h01(i, j, seed) - 0.5) * 6,
        base: (j - y) * 16 + 15,
        h: tall ? 18 + h01(i, j, seed + 1) * 10 : 11 + h01(i, j, seed + 1) * 3,
        half: 9 + h01(i, j, seed + 2) * 5,
        snow: h01(i, j, seed + 3) > 0.3,
      });
    }
  }
  peaks.sort((a, b) => a.base - b.base);
  const ground = withFringe('regolith', mask);
  registerTiles({
    [name]: (c, v) => {
      c.drawImage(tile(ground, v), 0, 0);
      for (const p of peaks) {
        const top = p.base - p.h;
        // l'ombre du pic au pied
        c.fillStyle = 'rgba(30,20,50,0.35)';
        c.fillRect(Math.round(p.cx - p.half + 2), p.base, Math.round(p.half * 2), 2);
        for (let yy = Math.max(top, -2); yy <= p.base; yy++) {
          if (yy < 0 || yy > 15) continue;
          const k = (yy - top) / p.h;
          const w = Math.max(1, Math.round(k * p.half));
          const snowy = p.snow && k < 0.3;
          c.fillStyle = snowy ? '#f0f4fb' : '#b0a3cc';
          c.fillRect(Math.round(p.cx - w), yy, w, 1);
          c.fillStyle = snowy ? '#c9cfe2' : '#6a5d8a';
          c.fillRect(Math.round(p.cx), yy, w, 1);
          c.fillStyle = '#3f3560';
          c.fillRect(Math.round(p.cx - w) - 1, yy, 1, 1);
          c.fillRect(Math.round(p.cx + w), yy, 1, 1);
          // une arête plus claire, et quelques strates
          if (!snowy && (yy - top) % 5 === 2) {
            c.fillStyle = '#8c7fae';
            c.fillRect(Math.round(p.cx - w * 0.6), yy, Math.max(1, Math.round(w * 0.4)), 1);
          }
        }
        const gy = Math.round(p.base - p.h * 0.35);
        if (gy >= 0 && gy < 16 && h01(p.cx, p.base, seed + 9) > 0.6) {
          c.fillStyle = '#5ff0e0';
          c.fillRect(Math.round(p.cx + 2), gy, 1, 1);
        }
      }
    },
  });
  return name;
}

// ---------- la sortie de la cuve : vapeur, puis on pose le pied sur la dalle ----------
interface Steam { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number }
interface Emerge { stage: 'steam' | 'out' | 'land'; t: number; puffs: Steam[]; done: (() => void) | null }
const emerging = new WeakMap<Game, Emerge>();
const CUVE = { x: 4, y: 5 }; // le haut de la cuve 07

function puff(e: Emerge, strong: boolean) {
  const n = strong ? 3 : 1;
  for (let i = 0; i < n; i++) {
    e.puffs.push({
      x: CUVE.x * 16 + 4 + Math.random() * 8,
      y: CUVE.y * 16 + 4 + Math.random() * 18,
      vx: (Math.random() - 0.5) * 14,
      vy: -6 - Math.random() * 10,
      r: 2 + Math.random() * 2,
      life: 0,
      max: 1.6 + Math.random() * 1.4,
    });
  }
}

function startEmerge(g: Game, done: () => void) {
  g.locked = true;
  g.heroAlpha = 0;
  g.x = CUVE.x;
  g.y = 7;
  g.dir = 'down';
  const e: Emerge = { stage: 'steam', t: 0, puffs: [], done };
  emerging.set(g, e);
  sfx.hiss();
}

function updateEmerge(g: Game, dt: number) {
  const e = emerging.get(g);
  if (!e) return;
  e.t += dt;
  for (const p of e.puffs) {
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.r += dt * 3.5;
  }
  e.puffs = e.puffs.filter((p) => p.life < p.max);
  if (e.stage === 'steam') {
    if (Math.random() < 0.7) puff(e, e.t < 1);
    if (e.t > 1.8) {
      // le héros sort de la vapeur et descend sur la dalle
      e.stage = 'out';
      e.t = 0;
      g.heroAlpha = 1;
      g.drag = { fx: CUVE.x, fy: CUVE.y + 0.9, t: 0, dur: 0.9 };
    }
  } else if (e.stage === 'out') {
    if (Math.random() < 0.3) puff(e, false);
    if (g.drag) {
      g.drag.t += dt / g.drag.dur;
      if (g.drag.t >= 1) g.drag = null;
    }
    if (!g.drag) {
      e.stage = 'land';
      e.t = 0;
      g.heroCrouch = 0.5;
      sfx.step();
    }
  } else if (e.stage === 'land' && e.t > 0.7) {
    // il se retourne vers sa cuve
    g.dir = 'up';
    g.locked = false;
    if (e.done) {
      const done = e.done;
      e.done = null;
      done();
    }
    // la vapeur finit de se dissiper
    if (!e.puffs.length || e.t > 4) emerging.delete(g);
  }
}

function drawSteam(g: Game, c: CanvasRenderingContext2D) {
  const e = emerging.get(g);
  if (!e) return;
  const [hx, hy] = g.heroPixel();
  const ox = Math.round(hx + 8 - view.w / 2);
  const oy = Math.round(hy + 8 - (view.h - view.padBottom) / 2);
  for (const p of e.puffs) {
    const a = 0.42 * (1 - p.life / p.max);
    c.fillStyle = `rgba(235,250,255,${a})`;
    c.beginPath();
    c.arc(Math.round(p.x - ox), Math.round(p.y - oy), p.r, 0, Math.PI * 2);
    c.fill();
  }
}

// ---------- l'ouverture : le ciel bleu, celui de la fin du chapitre 1 ----------
function skyOpening(done: () => void) {
  const screen = document.getElementById('screen')!;
  const cv = document.createElement('canvas');
  cv.width = 120;
  cv.height = 200;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:3;image-rendering:pixelated;';
  screen.appendChild(cv);
  const c = cv.getContext('2d')!;
  const clouds = Array.from({ length: 7 }, (_, i) => ({ x: (i * 47) % 140 - 20, y: 20 + i * 24, w: 18 + (i * 13) % 22, s: 2 + (i % 3) }));
  const t0 = performance.now();
  let raf = 0;
  const draw = () => {
    const t = (performance.now() - t0) / 1000;
    const g = c.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, '#2f7fd6');
    g.addColorStop(0.6, '#6fbef0');
    g.addColorStop(1, '#bfe8ff');
    c.fillStyle = g;
    c.fillRect(0, 0, cv.width, cv.height);
    // le soleil, doux, en haut à droite
    c.fillStyle = 'rgba(255,248,214,0.3)';
    c.beginPath(); c.arc(99, 21, 13, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,252,236,0.9)';
    c.beginPath(); c.arc(99, 21, 7, 0, Math.PI * 2); c.fill();
    // une planète géante cerclée d'anneaux, et deux lunes : on n'est plus chez soi
    c.fillStyle = 'rgba(220,235,255,0.55)';
    c.beginPath(); c.arc(30, 70, 26, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(180,200,240,0.5)';
    c.fillRect(14, 62, 10, 3); c.fillRect(30, 78, 14, 3); c.fillRect(20, 84, 8, 2);
    c.strokeStyle = 'rgba(240,248,255,0.7)';
    c.lineWidth = 2;
    c.beginPath(); c.ellipse(30, 70, 44, 8, -0.35, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(245,245,255,0.85)';
    c.beginPath(); c.arc(84, 120, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(200,205,230,0.9)';
    c.fillRect(81, 117, 2, 2); c.fillRect(86, 122, 3, 2);
    c.fillStyle = 'rgba(245,235,255,0.7)';
    c.beginPath(); c.arc(64, 44, 3, 0, Math.PI * 2); c.fill();
    for (const k of clouds) {
      const x = ((k.x + t * k.s) % 160) - 20;
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.fillRect(Math.round(x), k.y, k.w, 4);
      c.fillRect(Math.round(x) + 3, k.y - 3, k.w - 8, 3);
      c.fillStyle = 'rgba(200,225,245,0.9)';
      c.fillRect(Math.round(x) + 2, k.y + 4, k.w - 3, 1);
    }
    raf = requestAnimationFrame(draw);
  };
  draw();
  return {
    close() {
      cancelAnimationFrame(raf);
      cv.remove();
      done();
    },
  };
}

export const azura: Chapter = {
  id: 'azura',
  title: 'Azura',
  saveKey: 'vesper-azura-save-v1',
  start: START_AZ,
  shelter: { to: 'cuves', x: START_AZ.x, y: START_AZ.y, dir: 'down' },
  maps: MAPS_AZ,
  scripts: SCRIPTS_AZ,
  threads: THREADS_AZ,
  clues: CLUES_AZ,
  questions: QUESTIONS_AZ,
  items: ITEMS_AZ,
  achievements: [],
  memories: [],
  archives: [],
  archiveCode: '',
  switches: { labels: [], order: [] },
  intro: [],
  features: { heatWaves: false, movement: 'grid' },
  music: (map) => (map.id === 'atelier' ? 'home' : 'azura'),
  dialogStyle: 'azura',
  cutTargets: {},
  solid: SOLID_AZ,
  people: PEOPLE,
  heroLook: HERO_AZ,
  begin(g: Game) {
    playTheme('azura');
    const sky = skyOpening(() => {});
    ui.say(['…', 'Du bleu.', 'Un ciel bleu… et deux lunes.', 'Au-dessus de l’horizon, une planète immense, cerclée d’anneaux.', 'L’air est frais. Il sent l’herbe… et le métal chaud.'], () => {
      ui.fade(() => {
        sky.close();
        g.blackout = false;
        startEmerge(g, () => {
          ui.showPlace(g.map.name);
          ui.say([
            'Je suis… sur Azura.',
            'Ma cuve est ouverte. Toutes les autres aussi. Elles sont vides.',
            '(Touche A pour examiner ce qui t’entoure. Ton journal garde la trace de tout ce que tu découvres.)',
          ]);
        });
      });
    });
  },
  hooks: {
    tileName(g, ch, x, y, below) {
      const wave = Math.floor(g.time * 1.4 + (x + y) * 0.35) % 2;
      switch (ch) {
        case '"': return 'azGrass';
        case ',': return 'azFlowers';
        case ';': return 'azTall';
        case '.': return withFringe('azPath', grassMask(g, x, y));
        case ':': return 'azStone';
        case '=': return 'azDeck';
        case 'w': return 'azFloor';
        case '~': {
          const above = y > 0 ? g.map.rows[y - 1][x] : '~';
          const m = grassMask(g, x, y);
          if (m) return withFringe('azWater' + wave, m);
          return (above === '~' || above === 'B' || above === 'b' ? 'azWater' : 'azShore') + wave;
        }
        case 'F': return 'fountain' + (Math.floor(g.time * 3) % 2);
        case 'x':
        case 'X': return withFringe('regolith', grassMask(g, x, y));
        case 'Y': {
          const row = g.map.rows, at = (xx: number, yy: number) => (yy >= 0 && yy < g.map.height ? row[yy][xx] : '');
          const h = at(x - 1, y) === 'Y' || at(x + 1, y) === 'Y', v = at(x, y - 1) === 'Y' || at(x, y + 1) === 'Y';
          return withFringe('regolith', grassMask(g, x, y), h && !v ? 'fenceH' : v && !h ? 'fenceV' : 'fenceP');
        }
        case 'M': return mountainTile(g, x, y, grassMask(g, x, y));
        case 'o': return withFringe('crater', grassMask(g, x, y));
        case '1': return withFringe('bigCrater0', grassMask(g, x, y));
        case '2': return withFringe('bigCrater1', grassMask(g, x, y));
        case '3': return withFringe('bigCrater2', grassMask(g, x, y));
        case '4': return withFringe('bigCrater3', grassMask(g, x, y));
        case 'k': return withFringe('crystals' + (Math.floor(g.time * 1.5 + x * 0.7 + y) % 2), grassMask(g, x, y));
        case 'm': return 'metalFloor';
        case 'd': return 'slab';
        case 'c': {
          // horizontale, sauf si la conduite file vers le haut ou le bas
          const up = y > 0 ? g.map.rows[y - 1][x] : '', down = y + 1 < g.map.height ? g.map.rows[y + 1][x] : '';
          return up === 'c' || down === 'c' ? 'conduitV' : 'conduitH';
        }
        case 'b': return 'azBridgeH';
        case 'B': return 'azBridgeV';
        case 'R': return withFringe(below === 'R' ? 'azRockTop' : 'azRockFace', grassMask(g, x, y) & ~MASK.S & ~MASK.SE & ~MASK.SW);
        case 'A': return 'azTree';
        case 'u': return 'azBush';
        case '|': return 'azFence';
        case 'Z': return below === 'Z' ? 'azWallTop' : 'azWallFront';
        case '#': return 'aurFront';
        default: return undefined;
      }
    },
    objectSprite(g, name) {
      if (name === 'pylonTop') return 'pylonTop' + (Math.floor(g.time * 1.2) % 2);
      if (name === 'holoTop') return 'holoTop' + (Math.floor(g.time * 2.5) % 2);
      return undefined;
    },
    update(g, dt) {
      updateEmerge(g, dt);
    },
    renderVoid,
    heroWalking(g) {
      return emerging.get(g)?.stage === 'out';
    },
    renderAtmosphere(g, c, w, h) {
      drawSteam(g, c);
      if (!g.map.outdoor) {
        c.fillStyle = 'rgba(255,214,150,0.08)';
        c.fillRect(0, 0, w, h);
        return true;
      }
      // une lumière claire, et l'ombre des nuages qui glisse sur le paysage
      const grad = c.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(170,230,255,0.10)');
      grad.addColorStop(1, 'rgba(255,240,200,0.06)');
      c.fillStyle = grad;
      c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(20,60,70,0.07)';
      for (let i = 0; i < 3; i++) {
        const cx = ((g.time * 5 + i * 140) % (w + 160)) - 80;
        const cy = ((i * 97) % h) + 20;
        c.beginPath();
        c.ellipse(cx, cy, 60, 26, 0, 0, Math.PI * 2);
        c.fill();
      }
      // des spores lumineuses portées par le vent
      for (const p of g.particles) {
        c.fillStyle = `rgba(150,255,235,${p.a * 0.75})`;
        c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      // un drone de la colonie qui passe, avec son ombre au sol
      const period = 22;
      const k = (g.time % period) / period;
      const dx = -30 + k * (w + 60);
      const dy = h * 0.3 + Math.sin(g.time * 0.7) * 10;
      c.fillStyle = 'rgba(10,20,30,0.18)';
      c.fillRect(Math.round(dx) + 6, Math.round(dy) + 18, 9, 3);
      c.fillStyle = '#5f6b7a';
      c.fillRect(Math.round(dx), Math.round(dy), 11, 3);
      c.fillStyle = '#b8c4d0';
      c.fillRect(Math.round(dx) + 1, Math.round(dy), 9, 1);
      c.fillStyle = '#3f4856';
      c.fillRect(Math.round(dx) - 2, Math.round(dy) - 1, 4, 1);
      c.fillRect(Math.round(dx) + 9, Math.round(dy) - 1, 4, 1);
      c.fillStyle = Math.floor(g.time * 3) % 2 ? '#ff5a5a' : '#5ff0e0';
      c.fillRect(Math.round(dx) + 5, Math.round(dy) + 3, 1, 1);
      return true;
    },
    onEnterMap(g, mapId) {
      if (mapId === 'ville' && !g.flags.has('villeSeen')) {
        g.flags.add('villeSeen');
        sfx.success();
        ui.say(['Une ville !', 'Des maisons blanches, des passerelles au-dessus d’un lac… et des gens.', 'Ils sont là. Ils sont tous là.'], () => {
          // Betti accourt dès l'arrivée
          if (!g.flags.has('bettiMet')) SCRIPTS_AZ.bettiAccueil(g.api);
        });
      }
    },
  },
};
