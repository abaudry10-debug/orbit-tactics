// Tout le pixel art du jeu est dessiné en code : pas de fichier image à charger.
// Chaque tuile fait 16 × 16 pixels.

export const T = 16;

type Ctx = CanvasRenderingContext2D;
type Painter = (c: Ctx, v: number) => void;

function canvas(w = T, h = T): [HTMLCanvasElement, Ctx] {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [cv, ctx];
}

const r = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(x, y, w, h);
};

// Générateur pseudo-aléatoire déterministe (même rendu à chaque chargement).
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const hash = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

// ---------- palette ----------
export const P = {
  ink: '#14101c',
  dust: '#a86f45',
  dustDark: '#8c5a38',
  dustLight: '#c48a5a',
  asphalt: '#4a4550',
  asphaltDark: '#38333e',
  crack: '#26212c',
  paint: '#b59a4a',
  wallTop: '#7d7480',
  wallTopLight: '#958c98',
  wallTopDark: '#625a66',
  wallFront: '#4f4855',
  wallFrontDark: '#3c3642',
  window: '#1d1a24',
  glass: '#6fd3e0',
  toxic: '#3f8f3a',
  toxicLight: '#6fd04f',
  toxicDark: '#2a6528',
  grass: '#b5a04a',
  grassDark: '#7d6d2e',
  labFloor: '#2b3446',
  labFloorLight: '#36415a',
  rivet: '#59688a',
  labWall: '#c9d2dc',
  labWallDark: '#8e9aab',
  neon: '#4fd1c5',
  wood: '#5a4636',
  woodDark: '#3e2f24',
  rust: '#8a4a2a',
  rustLight: '#b0643a',
  metal: '#6d7686',
  metalLight: '#9aa3b3',
  metalDark: '#454c59',
  hazard: '#e0b13a',
  red: '#d04a42',
  screen: '#46e08a',
  paper: '#e8dcc0',
};

function speckle(c: Ctx, seed: number, base: string, dots: [string, number][]) {
  r(c, 0, 0, T, T, base);
  const rand = rng(seed);
  for (const [col, n] of dots) for (let i = 0; i < n; i++) r(c, Math.floor(rand() * T), Math.floor(rand() * T), 1, 1, col);
}

// ---------- tuiles de sol et décor ----------
const dust: Painter = (c, v) => {
  speckle(c, 11 + v * 7, P.dust, [[P.dustDark, 10], [P.dustLight, 7]]);
  if (v === 2) { r(c, 3, 9, 4, 1, P.dustDark); r(c, 6, 10, 3, 1, P.dustDark); }
};

const grass: Painter = (c, v) => {
  dust(c, v);
  const tuft = (x: number, y: number) => {
    r(c, x, y, 1, 3, P.grassDark); r(c, x + 1, y - 1, 1, 4, P.grass); r(c, x + 2, y + 1, 1, 2, P.grassDark);
    r(c, x + 3, y, 1, 3, P.grass);
  };
  tuft(2, 4); tuft(9, 9); if (v !== 1) tuft(6, 12);
};

const asphalt: Painter = (c, v) => {
  speckle(c, 31 + v * 5, P.asphalt, [[P.asphaltDark, 14], ['#57525e', 6]]);
  if (v === 0) { r(c, 4, 3, 1, 3, P.crack); r(c, 5, 6, 1, 2, P.crack); r(c, 6, 8, 2, 1, P.crack); }
  if (v === 1) { r(c, 10, 9, 3, 1, P.crack); r(c, 9, 10, 1, 3, P.crack); }
};

const road: Painter = (c, v) => {
  asphalt(c, v);
  if (v !== 2) { r(c, 0, 7, 5, 2, P.paint); r(c, 9, 7, 5, 2, P.paint); }
};

const labFloor: Painter = (c) => {
  r(c, 0, 0, T, T, P.labFloor);
  r(c, 0, 0, T, 1, P.labFloorLight); r(c, 0, 0, 1, T, P.labFloorLight);
  r(c, 8, 0, 1, T, P.labFloorLight); r(c, 0, 8, T, 1, P.labFloorLight);
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) r(c, x, y, 1, 1, P.rivet);
};

const toxicFrame = (frame: number): Painter => (c, v) => {
  r(c, 0, 0, T, T, '#1f5a3a');
  r(c, 0, 0, T, 6, '#24694a');
  const rand = rng(91 + v * 13);
  for (let i = 0; i < 5; i++) r(c, Math.floor(rand() * T), 6 + Math.floor(rand() * 10), 3, 1, '#174630');
  const o = frame * 3;
  // vaguelettes : courbes claires
  const wave = (x: number, y: number) => {
    r(c, x % T, y, 2, 1, '#7be06a'); r(c, (x + 2) % T, y - 1, 2, 1, '#b6ff8a'); r(c, (x + 4) % T, y, 2, 1, '#7be06a');
  };
  wave(1 + o, 4);
  wave(8 + o, 10);
  if (v === 1) wave(4 + o, 14);
  if (frame === 1) { r(c, 11, 6, 1, 1, '#d6ffb0'); r(c, 12, 5, 1, 1, '#d6ffb0'); } // bulles
};

const rubble: Painter = (c, v) => {
  dust(c, v);
  const stone = (x: number, y: number, w: number, h: number) => {
    r(c, x, y, w, h, P.wallTopDark); r(c, x, y, w, 1, P.wallTopLight); r(c, x, y + h, w, 1, P.ink);
  };
  stone(1, 7, 6, 5); stone(6, 3, 6, 6); stone(9, 9, 6, 5); stone(3, 12, 4, 3);
  r(c, 7, 8, 2, 1, P.rust);
};

const fence: Painter = (c, v) => {
  dust(c, v);
  r(c, 0, 5, T, 2, P.wood); r(c, 0, 10, T, 2, P.wood);
  for (const x of [2, 12]) { r(c, x, 2, 3, 13, P.woodDark); r(c, x, 2, 3, 1, P.wood); }
  r(c, 0, 14, T, 1, 'rgba(0,0,0,0.25)');
};

// Bâtiments en ruine : « toit » ou « façade » selon ce qu'il y a dessous.
const wallTop: Painter = (c, v) => {
  r(c, 0, 0, T, T, P.wallTop);
  const rand = rng(51 + v);
  for (let i = 0; i < 8; i++) r(c, Math.floor(rand() * T), Math.floor(rand() * T), 2, 1, P.wallTopDark);
  r(c, 0, 0, T, 1, P.wallTopLight);
  if (v === 1) { r(c, 3, 9, 4, 1, P.wallTopDark); r(c, 6, 10, 1, 3, P.wallTopDark); } // fissure
  if (v === 2) { r(c, 10, 4, 3, 2, '#7a5a4c'); r(c, 11, 6, 1, 1, '#7a5a4c'); } // trace de rouille
};

const wallFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, P.wallFront);
  r(c, 0, 0, T, 2, P.wallTopDark);
  r(c, 0, 14, T, 2, P.wallFrontDark);
  // fenêtre
  r(c, 4, 5, 8, 6, P.ink); r(c, 5, 6, 6, 4, P.window);
  if (v === 0) { r(c, 5, 6, 2, 1, P.glass); r(c, 9, 8, 1, 2, P.glass); }
  if (v === 2) { r(c, 5, 6, 6, 4, P.wallFrontDark); r(c, 6, 10, 4, 1, P.ink); } // murée
  r(c, 1, 3, 1, 4, P.wallFrontDark); r(c, 13, 9, 2, 1, P.wallFrontDark); // fissures
};

const labWallTop: Painter = (c) => {
  r(c, 0, 0, T, T, P.labWallDark); r(c, 0, 0, T, 1, P.labWall); r(c, 0, 15, T, 1, '#6c7889');
};

const labWallFront: Painter = (c) => {
  r(c, 0, 0, T, T, P.labWall);
  r(c, 0, 0, T, 2, P.labWallDark); r(c, 7, 2, 1, 12, P.labWallDark);
  r(c, 0, 11, T, 2, P.neon); r(c, 0, 14, T, 2, '#6c7889');
};

// ---------- objets et décors solides ----------
const deadTree: Painter = (c, v) => {
  dust(c, v);
  r(c, 3, 14, 10, 2, 'rgba(0,0,0,0.25)');
  r(c, 7, 6, 3, 9, P.woodDark); r(c, 7, 6, 1, 9, P.wood);
  r(c, 4, 3, 1, 5, P.woodDark); r(c, 5, 7, 2, 1, P.woodDark);
  r(c, 11, 2, 1, 6, P.woodDark); r(c, 10, 7, 1, 2, P.woodDark);
  r(c, 8, 1, 1, 5, P.woodDark); r(c, 2, 2, 2, 1, P.woodDark); r(c, 12, 1, 2, 1, P.woodDark);
};

const carWreck: Painter = (c, v) => {
  dust(c, v);
  r(c, 1, 13, 14, 2, 'rgba(0,0,0,0.3)');
  r(c, 1, 7, 14, 6, P.rust); r(c, 1, 7, 14, 1, P.rustLight);
  r(c, 4, 3, 8, 5, P.rust); r(c, 4, 3, 8, 1, P.rustLight);
  r(c, 5, 4, 3, 3, '#2a3c4a'); r(c, 9, 4, 2, 3, '#2a3c4a'); r(c, 5, 4, 1, 1, P.glass);
  r(c, 2, 12, 3, 3, P.ink); r(c, 11, 12, 3, 3, P.ink);
  r(c, 7, 9, 2, 2, P.rustLight); r(c, 12, 8, 2, 1, P.hazard);
};

const capsule = (lit: boolean, broken: boolean): Painter => (c) => {
  labFloor(c, 0);
  r(c, 2, 1, 12, 15, P.metalDark); r(c, 3, 1, 10, 1, P.metalLight);
  r(c, 4, 3, 8, 9, broken ? '#1c2533' : lit ? '#2f6f8a' : '#1f3a4a');
  if (!broken) { r(c, 5, 4, 2, 6, 'rgba(160,240,255,0.55)'); r(c, 9, 9, 1, 2, 'rgba(160,240,255,0.4)'); }
  else { r(c, 5, 5, 3, 1, P.glass); r(c, 8, 7, 2, 1, P.glass); r(c, 6, 9, 1, 2, P.glass); }
  r(c, 4, 13, 8, 2, P.metal); r(c, 6, 13, 1, 1, lit ? P.screen : P.red); r(c, 9, 13, 1, 1, P.hazard);
};

const terminal = (on: boolean): Painter => (c) => {
  labFloor(c, 0);
  r(c, 2, 4, 12, 11, P.metalDark); r(c, 2, 4, 12, 1, P.metalLight);
  r(c, 4, 6, 8, 5, P.ink);
  if (on) { r(c, 5, 7, 5, 1, P.screen); r(c, 5, 9, 3, 1, P.screen); r(c, 9, 9, 1, 1, P.screen); }
  r(c, 4, 12, 8, 1, P.metal); r(c, 3, 14, 10, 1, P.ink);
};

const locker = (open: boolean): Painter => (c) => {
  labFloor(c, 0);
  r(c, 3, 1, 10, 14, P.metalDark); r(c, 3, 1, 10, 1, P.metalLight);
  if (open) { r(c, 4, 2, 8, 12, P.ink); r(c, 5, 8, 6, 1, P.metal); }
  else { r(c, 4, 2, 8, 12, P.metal); r(c, 7, 2, 1, 12, P.metalDark); r(c, 5, 4, 1, 1, P.ink); r(c, 9, 4, 1, 1, P.ink); r(c, 10, 8, 1, 2, P.hazard); }
};

const labDoor = (open: boolean): Painter => (c) => {
  r(c, 0, 0, T, T, P.labWall);
  r(c, 2, 1, 12, 15, P.metalDark);
  if (open) r(c, 3, 2, 10, 14, P.ink);
  else { r(c, 3, 2, 5, 14, P.metal); r(c, 8, 2, 5, 14, P.metal); r(c, 7, 2, 2, 14, P.metalDark); r(c, 13, 6, 1, 2, P.red); }
};

const ruinDoor: Painter = (c) => {
  wallFront(c, 1);
  r(c, 4, 4, 8, 12, P.ink); r(c, 5, 5, 6, 11, '#0f0c15'); r(c, 4, 4, 8, 1, P.wallTopDark);
};

const bunkerDoor = (open: boolean): Painter => (c) => {
  r(c, 0, 0, T, T, P.metalDark);
  r(c, 0, 0, T, 2, P.metalLight);
  for (let x = 0; x < T; x += 4) { r(c, x, 2, 2, 2, P.hazard); r(c, x + 2, 2, 2, 2, P.ink); }
  if (open) { r(c, 2, 5, 12, 11, P.ink); r(c, 3, 6, 10, 10, '#0b2a26'); r(c, 6, 13, 4, 1, P.neon); }
  else {
    r(c, 2, 5, 12, 11, P.metal); r(c, 7, 5, 2, 11, P.metalDark);
    r(c, 3, 7, 3, 1, P.metalLight); r(c, 10, 7, 3, 1, P.metalLight);
    r(c, 11, 10, 2, 3, P.ink); r(c, 11, 10, 2, 1, P.red); // clavier
  }
};

const robot: Painter = (c, v) => {
  dust(c, v);
  r(c, 2, 13, 12, 2, 'rgba(0,0,0,0.3)');
  r(c, 3, 8, 9, 6, P.metal); r(c, 3, 8, 9, 1, P.metalLight); r(c, 5, 10, 3, 2, P.metalDark);
  r(c, 9, 4, 5, 5, P.metal); r(c, 9, 4, 5, 1, P.metalLight); r(c, 11, 6, 2, 1, P.red); // tête tombée
  r(c, 1, 11, 2, 1, P.metalDark); r(c, 0, 12, 2, 1, P.metalDark); r(c, 12, 12, 3, 1, P.rust);
};

const sign: Painter = (c, v) => {
  dust(c, v);
  r(c, 7, 9, 2, 6, P.woodDark);
  r(c, 1, 2, 14, 8, P.ink); r(c, 2, 3, 12, 6, '#2f5d6b'); r(c, 3, 5, 10, 1, P.paper); r(c, 3, 7, 6, 1, P.paper);
  r(c, 11, 3, 3, 2, P.rust);
};

const monument: Painter = (c) => {
  road(c, 2);
  r(c, 2, 13, 12, 3, P.wallTopDark); r(c, 2, 13, 12, 1, P.wallTopLight);
  r(c, 5, 2, 6, 11, P.metal); r(c, 5, 2, 6, 1, P.metalLight); r(c, 6, 3, 1, 9, P.metalLight);
  r(c, 4, 1, 8, 2, P.neon); r(c, 7, 6, 2, 3, P.ink);
};

const note: Painter = (c, v) => {
  dust(c, v);
  r(c, 4, 6, 9, 7, P.ink); r(c, 4, 5, 8, 7, P.paper); r(c, 5, 7, 5, 1, '#9a8c70'); r(c, 5, 9, 4, 1, '#9a8c70');
  r(c, 11, 5, 1, 2, '#c9b98f');
};

const poster: Painter = (c, v) => {
  wallFront(c, v);
  r(c, 3, 3, 10, 10, P.ink); r(c, 4, 4, 8, 8, '#c25a2c'); r(c, 6, 6, 4, 4, P.hazard); r(c, 7, 7, 2, 2, P.ink);
};

const crate: Painter = (c, v) => {
  dust(c, v);
  r(c, 2, 4, 12, 11, P.woodDark); r(c, 3, 5, 10, 9, P.wood); r(c, 3, 9, 10, 1, P.woodDark); r(c, 2, 4, 12, 1, '#7a604a');
};

// ---------- registre des tuiles ----------
// Chaque nom donne des variantes (index v) ; l'eau a 2 images d'animation.
const REGISTRY: Record<string, Painter[]> = {
  dust: [dust], grass: [grass], asphalt: [asphalt], road: [road], labFloor: [labFloor],
  toxic0: [toxicFrame(0)], toxic1: [toxicFrame(1)], rubble: [rubble], fence: [fence],
  wallTop: [wallTop], wallFront: [wallFront], labWallTop: [labWallTop], labWallFront: [labWallFront],
  tree: [deadTree], car: [carWreck], ruinDoor: [ruinDoor],
  capsule: [capsule(true, false)], capsuleEmpty: [capsule(false, true)],
  terminal: [terminal(true)], terminalOff: [terminal(false)],
  locker: [locker(false)], lockerOpen: [locker(true)],
  labDoor: [labDoor(false)], labDoorOpen: [labDoor(true)],
  bunkerDoor: [bunkerDoor(false)], bunkerDoorOpen: [bunkerDoor(true)],
  robot: [robot], sign: [sign], monument: [monument], note: [note], poster: [poster], crate: [crate],
};

const VARIANTS = 3;
const cache = new Map<string, HTMLCanvasElement>();

export function tile(name: string, v = 0): HTMLCanvasElement {
  const variant = v % VARIANTS;
  const id = `${name}:${variant}`;
  let cv = cache.get(id);
  if (!cv) {
    const painter = REGISTRY[name]?.[0];
    if (!painter) throw new Error(`Tuile inconnue : ${name}`);
    const [c, ctx] = canvas();
    painter(ctx, variant);
    cache.set(id, c);
    cv = c;
  }
  return cv;
}

// ---------- héros ----------
// Codes couleur : k contour, h/H capuche, s peau, g lunettes, r écharpe, j/J veste, p pantalon, b bottes, a sac.
const HERO_PAL: Record<string, string> = {
  k: P.ink, h: '#3f6b73', H: '#6aa3a8', s: '#f0c39a', g: '#ffb347', r: '#c0423b',
  j: '#7a5232', J: '#a0703f', p: '#2d2a3e', b: '#4a3a2e', a: '#5b6b3a',
};

const HEAD_DOWN = [
  '................',
  '.....kkkkkk.....',
  '....kHHHHHHk....',
  '...kHhhhhhhHk...',
  '...khsssssshk...',
  '...kgggssgggk...',
  '...khsssssshk...',
  '....krrrrrrk....',
  '...kjrrJJjjjk...',
  '..kjjJJjjJJjjk..',
  '..ksjJjjjjJjsk..',
  '..kkjjjjjjjjkk..',
  '....kppppppk....',
];
const HEAD_UP = [
  '................',
  '.....kkkkkk.....',
  '....kHHHHHHk....',
  '...kHhhhhhhHk...',
  '...khhhhhhhhk...',
  '...khhhHHhhhk...',
  '...khhhhhhhhk...',
  '....krrrrrrk....',
  '...kjjjjjjjjk...',
  '..kjjaaaaaajjk..',
  '..ksjaaaaaajsk..',
  '..kkjaaaaaajkk..',
  '....kppppppk....',
];
const HEAD_SIDE = [
  '................',
  '.....kkkkkk.....',
  '....kHHHHHHk....',
  '...kHhhhhhhHk...',
  '...khhhhssssk...',
  '...khhhhsgggk...',
  '...khhhhssssk...',
  '....krrrrrrk....',
  '....kajjjJJk....',
  '....kajjjJJk....',
  '....kajsjJJk....',
  '....kkjjjjkk....',
  '....kppppppk....',
];
const LEGS_FRONT = [
  ['....kppkkppk....', '....kbbkkbbk....', '....kkkkkkkk....'],
  ['....kppkkppk....', '....kbbkkppk....', '....kkkkkbbk....'],
  ['....kppkkppk....', '....kppkkbbk....', '....kbbkkkkk....'],
];
const LEGS_SIDE = [
  ['.....kppppk.....', '.....kbbbbk.....', '.....kkkkkk.....'],
  ['....kpk..kpk....', '...kbk....kbk...', '...kk......kk...'],
  ['.....kpkkpk.....', '....kbk..kbk....', '....kk....kk....'],
];

export type Dir = 'down' | 'up' | 'left' | 'right';
const heroCache = new Map<string, HTMLCanvasElement>();

export function hero(dir: Dir, frame: number): HTMLCanvasElement {
  const id = `${dir}:${frame}`;
  let cv = heroCache.get(id);
  if (cv) return cv;
  const side = dir === 'left' || dir === 'right';
  const head = dir === 'down' ? HEAD_DOWN : dir === 'up' ? HEAD_UP : HEAD_SIDE;
  const legs = (side ? LEGS_SIDE : LEGS_FRONT)[frame % 3];
  const rows = [...head, ...legs];
  const [c, ctx] = canvas();
  // ombre au sol
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(4, 14, 8, 2);
  const bob = frame === 0 ? 0 : -1;
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const col = HERO_PAL[ch];
      if (!col) return;
      const px = dir === 'left' ? 15 - x : x;
      ctx.fillStyle = col;
      ctx.fillRect(px, y + (y < 13 ? bob : 0), 1, 1);
    });
  });
  heroCache.set(id, c);
  return c;
}
