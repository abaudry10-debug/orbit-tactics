// Les souvenirs de Pixel : cinq petites scènes en pixel art, projetées par son œil.
// Chaque souvenir est une suite de tableaux animés (dessinés à chaque image, t en secondes),
// avec une phrase en sous-titre. Le rendu « projection abîmée » (cyan, parasites) est fait par ui.ts.

import { dogSprite, type DogLook } from './sprites.js';

type Ctx = CanvasRenderingContext2D;
export const MW = 160;
export const MH = 112;

export interface Tableau {
  caption: string;
  dur: number;
  draw: (c: Ctx, t: number) => void;
}
export interface Memory {
  title: string;
  tableaux: Tableau[];
}

const INK = '#1c1020';
const SKIN = '#f0c39a';
const r = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
const disc = (c: Ctx, cx: number, cy: number, rad: number, col: string) => {
  c.fillStyle = col;
  for (let y = -rad; y <= rad; y++) {
    const w = Math.floor(Math.sqrt(rad * rad - y * y));
    c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
};

// ---------- personnages ----------
interface Pose {
  dir?: 'left' | 'right' | 'front';
  walk?: number; // phase de marche
  arms?: 'down' | 'up' | 'hug' | 'throw' | 'hold';
  kneel?: boolean;
  back?: boolean; // de dos
}

/** Betti, une petite fille aux couettes, robe jaune. Pieds en (x, y). */
function betti(c: Ctx, x: number, y: number, o: Pose = {}) {
  const k = o.kneel ? 3 : 0;
  const step = o.walk ? Math.round(Math.sin(o.walk) * 1) : 0;
  // jambes
  if (!o.kneel) {
    r(c, x - 2, y - 4 - step, 2, 4 + step, '#6a4a3a');
    r(c, x + 1, y - 4 + step, 2, 4 - step, '#6a4a3a');
    r(c, x - 2, y - 1, 2, 1, INK);
    r(c, x + 1, y - 1, 2, 1, INK);
  } else {
    r(c, x - 3, y - 2, 7, 2, '#6a4a3a');
  }
  // robe
  r(c, x - 4, y - 10 + k, 9, 7, INK);
  r(c, x - 3, y - 9 + k, 7, 5, '#f2c94c');
  r(c, x - 3, y - 5 + k, 7, 1, '#d4a52c');
  // bras
  const arm = (ax: number, ay: number, w: number, h: number) => r(c, ax, ay, w, h, SKIN);
  if (o.arms === 'up') { arm(x - 6, y - 14 + k, 2, 4); arm(x + 5, y - 14 + k, 2, 4); }
  else if (o.arms === 'hug') { arm(x - 5, y - 8 + k, 10, 2); }
  else if (o.arms === 'throw') { arm(x + 4, y - 13 + k, 2, 4); arm(x - 5, y - 8 + k, 2, 3); }
  else if (o.arms === 'hold') { arm(x + 4, y - 8 + k, 3, 2); arm(x - 5, y - 8 + k, 2, 3); }
  else { arm(x - 5, y - 9 + k, 2, 4); arm(x + 4, y - 9 + k, 2, 4); }
  // tête et couettes
  const hy = y - 17 + k;
  r(c, x - 4, hy, 9, 8, INK);
  r(c, x - 3, hy + 1, 7, 6, o.back ? '#5a3420' : SKIN);
  r(c, x - 3, hy + 1, 7, 2, '#5a3420');
  r(c, x - 6, hy + 2, 2, 4, '#5a3420');
  r(c, x + 5, hy + 2, 2, 4, '#5a3420');
  r(c, x - 6, hy + 2, 2, 1, '#e8622c'); // élastiques
  r(c, x + 5, hy + 2, 2, 1, '#e8622c');
  if (!o.back) {
    if (o.dir === 'left') r(c, x - 2, hy + 4, 1, 1, INK);
    else if (o.dir === 'right') r(c, x + 2, hy + 4, 1, 1, INK);
    else { r(c, x - 1, hy + 4, 1, 1, INK); r(c, x + 2, hy + 4, 1, 1, INK); }
    r(c, x - 2, hy + 5, 1, 1, '#f08a8a'); // joues
    r(c, x + 3, hy + 5, 1, 1, '#f08a8a');
  }
}

/** La maman de Betti : blouse de laboratoire, chignon. Pieds en (x, y). */
function maman(c: Ctx, x: number, y: number, o: Pose & { bend?: boolean } = {}) {
  const b = o.bend ? 3 : 0;
  const step = o.walk ? Math.round(Math.sin(o.walk) * 1) : 0;
  r(c, x - 3, y - 7 - step, 2, 7 + step, '#3a3f58');
  r(c, x + 1, y - 7 + step, 2, 7 - step, '#3a3f58');
  r(c, x - 3, y - 1, 2, 1, INK);
  r(c, x + 1, y - 1, 2, 1, INK);
  // blouse
  r(c, x - 5, y - 19 + b, 11, 13 - b, INK);
  r(c, x - 4, y - 18 + b, 9, 11 - b, '#e8edf2');
  r(c, x, y - 18 + b, 1, 11 - b, '#c9d1da');
  // bras
  if (o.arms === 'hold') r(c, x + 5, y - 13 + b, 4, 2, SKIN);
  else if (o.arms === 'up') r(c, x + 5, y - 20 + b, 2, 6, '#e8edf2');
  else { r(c, x - 6, y - 17 + b, 2, 8, '#e8edf2'); r(c, x + 5, y - 17 + b, 2, 8, '#e8edf2'); }
  // tête
  const hx = x + (o.bend ? 3 : 0), hy = y - 26 + b;
  r(c, hx - 4, hy, 8, 8, INK);
  r(c, hx - 3, hy + 1, 6, 6, o.back ? '#3a2418' : SKIN);
  r(c, hx - 3, hy + 1, 6, 2, '#3a2418');
  r(c, hx - 1, hy - 2, 3, 2, '#3a2418'); // chignon
  if (!o.back) {
    if (o.dir === 'left') r(c, hx - 2, hy + 4, 1, 1, INK);
    else if (o.dir === 'right') r(c, hx + 1, hy + 4, 1, 1, INK);
    else { r(c, hx - 2, hy + 4, 1, 1, INK); r(c, hx + 1, hy + 4, 1, 1, INK); }
  }
}

/** Pixel : on réutilise le vrai sprite du jeu. Pieds en (x, y). */
function pixel(c: Ctx, x: number, y: number, dir: 'left' | 'right', look: DogLook) {
  c.drawImage(dogSprite(dir, look), Math.round(x - 8), Math.round(y - 15));
}

function heart(c: Ctx, x: number, y: number) {
  r(c, x, y, 2, 2, '#ff6b8a'); r(c, x + 3, y, 2, 2, '#ff6b8a'); r(c, x, y + 1, 5, 2, '#ff6b8a'); r(c, x + 1, y + 3, 3, 1, '#ff6b8a'); r(c, x + 2, y + 4, 1, 1, '#ff6b8a');
}

// ---------- décors ----------
function workshop(c: Ctx) {
  r(c, 0, 0, MW, MH, '#6a4a32');
  for (let x = 0; x < MW; x += 12) r(c, x, 0, 1, 78, '#5a3c28');
  r(c, 0, 78, MW, MH - 78, '#4a3424');
  r(c, 0, 78, MW, 2, '#3a2818');
  // fenêtre, étagères, outils
  r(c, 110, 14, 30, 22, INK); r(c, 112, 16, 26, 18, '#9ad0f0'); r(c, 124, 16, 1, 18, INK); r(c, 112, 25, 26, 1, INK);
  r(c, 14, 20, 40, 3, '#3a2818'); r(c, 14, 36, 40, 3, '#3a2818');
  r(c, 18, 12, 6, 8, '#c0423b'); r(c, 28, 14, 4, 6, '#ffcf4a'); r(c, 40, 10, 8, 10, '#5b6b3a');
  r(c, 20, 28, 3, 8, '#a9b3c4'); r(c, 26, 30, 8, 2, '#a9b3c4'); r(c, 40, 27, 5, 9, '#7d8799');
  // l'établi
  r(c, 40, 66, 70, 6, '#2a1c12'); r(c, 42, 72, 4, 20, '#2a1c12'); r(c, 104, 72, 4, 20, '#2a1c12');
  r(c, 40, 64, 70, 3, '#8a6040');
  // la lampe
  r(c, 76, 0, 1, 20, '#2a1c12'); r(c, 71, 20, 11, 4, '#ffcf4a');
  c.fillStyle = 'rgba(255,230,150,0.12)';
  c.beginPath(); c.moveTo(71, 24); c.lineTo(82, 24); c.lineTo(108, 66); c.lineTo(44, 66); c.fill();
}

function oldStreet(c: Ctx, t: number) {
  // le ciel bleu d'avant
  for (let y = 0; y < 64; y++) r(c, 0, y, MW, 1, `rgb(${110 + y},${180 + y * 0.6},${235})`);
  disc(c, 130, 18, 8, '#fff6c8');
  for (let i = 0; i < 3; i++) {
    const x = ((i * 60 + t * 4) % (MW + 30)) - 20;
    r(c, x, 10 + i * 9, 18, 3, '#ffffff'); r(c, x + 4, 8 + i * 9, 9, 2, '#ffffff');
  }
  // maisons intactes
  const houses: [number, number, string][] = [[4, 26, '#c0423b'], [36, 22, '#2f6f8a'], [74, 28, '#d4a52c'], [108, 24, '#5b6b3a']];
  for (const [x, w, roof] of houses) {
    r(c, x, 40, w, 24, '#efe0c4'); r(c, x - 2, 34, w + 4, 6, roof);
    r(c, x + 4, 46, 5, 5, '#2f6f8a'); r(c, x + w - 9, 46, 5, 5, '#2f6f8a');
  }
  // arbres verts, herbe, trottoir
  for (const x of [28, 66, 100, 144]) { r(c, x, 46, 3, 18, '#5a3c28'); disc(c, x + 1, 42, 7, '#4f8a3a'); disc(c, x - 1, 40, 4, '#6aa84a'); }
  r(c, 0, 64, MW, 20, '#6aa84a');
  r(c, 0, 84, MW, MH - 84, '#a9a196');
  for (let x = 0; x < MW; x += 16) r(c, x, 84, 1, MH - 84, '#8f877c');
}

function labScene(c: Ctx, t: number) {
  r(c, 0, 0, MW, MH, '#c9d1da');
  for (let x = 0; x < MW; x += 10) r(c, x, 0, 1, 70, '#b4bec9');
  for (let y = 0; y < 70; y += 10) r(c, 0, y, MW, 1, '#b4bec9');
  r(c, 0, 70, MW, MH - 70, '#26324a');
  for (let x = 0; x < MW; x += 12) r(c, x, 70, 1, MH - 70, '#1e2840');
  // capsules
  for (const x of [12, 34, 56]) {
    r(c, x, 30, 16, 42, INK); r(c, x + 2, 33, 12, 30, '#7fd8e8'); r(c, x + 3, 34, 2, 28, '#c8f4fb');
    r(c, x + 4, 64, 8, 3, '#5ef0ff');
  }
  // terminal
  r(c, 110, 40, 30, 22, INK); r(c, 113, 43, 24, 14, '#0c2a1a');
  r(c, 115, 46, 12, 1, '#46e08a'); r(c, 115, 50, 18, 1, '#2a8a50'); if (Math.floor(t * 2) % 2) r(c, 128, 46, 2, 1, '#9dffcf');
  r(c, 106, 62, 38, 4, '#7d8799');
}

function redRoom(c: Ctx, t: number) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 5);
  r(c, 0, 0, MW, MH, '#4a3430');
  r(c, 0, 80, MW, MH - 80, '#2e201c');
  // la fenêtre rouge
  r(c, 96, 12, 40, 30, INK);
  r(c, 98, 14, 36, 26, `rgb(${200 + pulse * 55},${60 + pulse * 30},${30})`);
  r(c, 115, 14, 1, 26, INK); r(c, 98, 26, 36, 1, INK);
  c.fillStyle = `rgba(255,80,30,${0.12 + pulse * 0.1})`;
  c.beginPath(); c.moveTo(98, 40); c.lineTo(134, 40); c.lineTo(150, 80); c.lineTo(60, 80); c.fill();
  // la table
  r(c, 20, 52, 76, 5, '#2a1c12'); r(c, 20, 50, 76, 3, '#7a5232');
  r(c, 22, 57, 4, 26, '#2a1c12'); r(c, 90, 57, 4, 26, '#2a1c12');
  r(c, 26, 57, 64, 26, 'rgba(0,0,0,0.25)');
}

function capsuleHall(c: Ctx) {
  r(c, 0, 0, MW, MH, '#1c2438');
  r(c, 0, 76, MW, MH - 76, '#141a2a');
  for (let x = 0; x < MW; x += 14) r(c, x, 76, 1, MH - 76, '#101626');
  // des rangées de capsules qui s'éloignent
  for (let row = 0; row < 3; row++) {
    const s = 1 - row * 0.25;
    for (let i = 0; i < 9; i++) {
      const x = 6 + i * 18 * s + row * 12, y = 50 - row * 12;
      r(c, x, y, 10 * s, 26 * s, INK);
      r(c, x + 1, y + 2, 8 * s - 2, 18 * s, '#3a8aa0');
    }
  }
  // lumière froide
  c.fillStyle = 'rgba(160,220,255,0.08)';
  c.fillRect(0, 0, MW, 76);
}

/** Une file d'habitants en silhouette qui avance vers les capsules. */
function crowd(c: Ctx, t: number) {
  for (let i = 0; i < 9; i++) {
    const x = 150 - i * 14 - ((t * 6) % 14);
    const h = 20 + ((i * 7) % 6);
    const y = 92;
    r(c, x - 3, y - h, 7, h, '#3a3f58');
    r(c, x - 2, y - h - 5, 5, 5, '#4a4f68');
  }
}

// ---------- les cinq souvenirs ----------
export const MEMORIES: Memory[] = [
  {
    title: 'Le premier allumage',
    tableaux: [
      {
        caption: '« Maman, il va marcher ? »',
        dur: 4.2,
        draw: (c, t) => {
          workshop(c);
          maman(c, 60, 92, { dir: 'right', bend: true, arms: 'hold' });
          pixel(c, 84, 64, 'left', { pose: 'lie', eye: 'off', off: true });
          betti(c, 104, 92, { dir: 'left', arms: Math.floor(t * 2) % 2 ? 'up' : 'down' });
          if (Math.floor(t * 8) % 3 === 0) r(c, 72 + (t * 7 % 6), 58, 1, 1, '#ffef9a'); // étincelles du fer à souder
        },
      },
      {
        caption: '« Doucement… Voilà. »',
        dur: 3.6,
        draw: (c, t) => {
          workshop(c);
          maman(c, 60, 92, { dir: 'right', arms: 'down' });
          const on = t > 1.4;
          pixel(c, 84, 64, 'left', { pose: on ? 'sit' : 'lie', eye: on ? (t < 1.6 ? 'wide' : 'on') : 'closed', off: !on });
          if (on && t < 2.2) { c.fillStyle = 'rgba(94,240,255,0.35)'; c.fillRect(70, 44, 26, 22); }
          betti(c, 104, 92, { dir: 'left', arms: on ? 'up' : 'down' });
        },
      },
      {
        caption: '« Bonjour, toi. Je vais t’appeler… Pixel ! »',
        dur: 4.6,
        draw: (c, t) => {
          workshop(c);
          maman(c, 40, 92, { dir: 'right' });
          pixel(c, 86, 92, 'left', { pose: 'sit', eye: 'happy', tail: Math.floor(t * 10) % 2 });
          betti(c, 100, 92, { dir: 'left', arms: 'hug', kneel: true });
          for (let i = 0; i < 3; i++) heart(c, 82 + i * 7, 70 - ((t * 10 + i * 6) % 22));
        },
      },
    ],
  },
  {
    title: 'La première sortie',
    tableaux: [
      {
        caption: '« Viens, Pixel ! Le soleil est doux, aujourd’hui. »',
        dur: 4,
        draw: (c, t) => {
          oldStreet(c, t);
          const x = 20 + t * 14;
          betti(c, x + 16, 96, { dir: 'right', walk: t * 9 });
          pixel(c, x, 96, 'right', { pose: 'stand', frame: Math.floor(t * 8) % 4, tail: Math.floor(t * 8) % 2 });
        },
      },
      {
        caption: '« Attrape ! »',
        dur: 3.4,
        draw: (c, t) => {
          oldStreet(c, t + 4);
          betti(c, 34, 96, { dir: 'right', arms: t < 0.6 ? 'throw' : 'down' });
          // l'écrou vole
          const k = Math.min(1, t / 1.2);
          const nx = 40 + k * 90, ny = 82 - Math.sin(k * Math.PI) * 34;
          r(c, nx - 1, ny - 1, 3, 3, INK); r(c, nx, ny, 1, 1, '#c3c9d3');
          const px = 50 + Math.min(1, Math.max(0, (t - 0.4) / 2.4)) * 78;
          pixel(c, px, 96, 'right', { pose: 'stand', frame: Math.floor(t * 14) % 4, tail: Math.floor(t * 9) % 2, earsDown: true });
        },
      },
      {
        caption: '« C’est ton jouet, maintenant. Rien qu’à toi. »',
        dur: 4.4,
        draw: (c, t) => {
          oldStreet(c, t + 8);
          betti(c, 66, 96, { dir: 'right', kneel: true, arms: 'hold' });
          pixel(c, 86, 96, 'left', { pose: 'sit', eye: 'happy', tail: Math.floor(t * 12) % 2 });
          r(c, 76, 87, 3, 3, INK); r(c, 77, 88, 1, 1, '#c3c9d3'); // l'écrou posé à ses pattes
        },
      },
    ],
  },
  {
    title: 'Le laboratoire',
    tableaux: [
      {
        caption: '« Maman travaille ici, sur les batteries. »',
        dur: 4,
        draw: (c, t) => {
          labScene(c, t);
          maman(c, 104, 96, { dir: 'right', arms: 'up' });
          betti(c, 80, 98, { dir: 'right' });
          pixel(c, 62, 98, 'right', { pose: 'sit', eye: t % 3 < 0.15 ? 'closed' : 'on', tail: Math.floor(t * 3) % 2 });
        },
      },
      {
        caption: '« Ta batterie est unique, Pixel. La seule BS-1 qui marche vraiment. »',
        dur: 4.8,
        draw: (c, t) => {
          labScene(c, t);
          maman(c, 96, 96, { dir: 'left', bend: true, arms: 'hold' });
          // la batterie BS-1 qui luit
          const glow = 0.4 + 0.3 * Math.sin(t * 4);
          c.fillStyle = `rgba(255,207,74,${glow})`; c.fillRect(99, 78, 10, 8);
          r(c, 101, 80, 6, 4, '#ffcf4a'); r(c, 103, 79, 2, 1, INK);
          pixel(c, 80, 98, 'right', { pose: 'sit', eye: 'wide', tail: 1 });
          betti(c, 58, 98, { dir: 'right' });
        },
      },
      {
        caption: '« Et ces boîtes en verre, c’est pour dormir longtemps ? »',
        dur: 4.4,
        draw: (c, t) => {
          labScene(c, t);
          betti(c, 42, 98, { back: true, arms: 'up' });
          pixel(c, 60, 98, 'left', { pose: 'sit', eye: 'on', tail: 2 });
          maman(c, 104, 96, { dir: 'left' });
        },
      },
    ],
  },
  {
    title: 'La première vague',
    tableaux: [
      {
        caption: '« J’ai peur, Pixel… »',
        dur: 4.6,
        draw: (c, t) => {
          redRoom(c, t);
          betti(c, 52, 82, { dir: 'right', kneel: true, arms: 'hug' });
          pixel(c, 68, 82, 'left', { pose: 'scared', eye: 'wide', tail: 3 });
        },
      },
      {
        caption: '« On partira ensemble. Promis. »',
        dur: 4.6,
        draw: (c, t) => {
          redRoom(c, t);
          betti(c, 56, 82, { dir: 'right', kneel: true, arms: 'hug' });
          pixel(c, 64, 82, 'left', { pose: 'sit', eye: 'happy', tail: Math.floor(t * 4) % 2 });
          if (t > 1.5) heart(c, 58, 54 - ((t - 1.5) * 6));
        },
      },
    ],
  },
  {
    title: 'Le jour du départ',
    tableaux: [
      {
        caption: '« Les adultes disent que tu ne peux pas venir avec nous… »',
        dur: 5.2,
        draw: (c, t) => {
          capsuleHall(c);
          crowd(c, t);
          maman(c, 40, 100, { dir: 'right', back: false });
          betti(c, 58, 100, { dir: 'right', kneel: true });
          pixel(c, 76, 100, 'left', { pose: 'sit', eye: t % 2.5 < 0.15 ? 'closed' : 'on', tail: 2, earsDown: true });
        },
      },
      {
        caption: '« Attends-moi ici. Veille sur ceux qui restent. »',
        dur: 5.6,
        draw: (c, t) => {
          capsuleHall(c);
          // plus près : Betti à genoux, front contre la tête de Pixel
          betti(c, 66, 100, { dir: 'right', kneel: true, arms: 'hug' });
          pixel(c, 80, 100, 'left', { pose: 'sit', eye: 'closed', tail: 2, earsDown: true });
          if (t > 2.6) r(c, 70, 85 + ((t - 2.6) * 6) % 10, 1, 2, '#9ad0f0'); // une larme
        },
      },
      {
        caption: '…',
        dur: 5,
        draw: (c, t) => {
          capsuleHall(c);
          crowd(c, t + 3);
          // elle s'éloigne, la main dans celle de sa maman, et se retourne
          const x = 70 + t * 10;
          maman(c, x + 12, 100, { dir: 'right', back: true, walk: t * 8 });
          betti(c, x, 100, { dir: t > 2.6 && t < 3.8 ? 'left' : 'right', back: !(t > 2.6 && t < 3.8), walk: t * 8 });
          pixel(c, 44, 100, 'right', { pose: 'sit', eye: 'on', tail: 2, earsDown: true });
        },
      },
    ],
  },
];
