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

// ---------- étape 1 : dunes, quartier, centre de recherche ----------
const sand: Painter = (c, v) => {
  speckle(c, 71 + v * 9, '#c9945a', [['#b07c48', 9], ['#e0b27a', 8]]);
  if (v === 0) { r(c, 2, 5, 5, 1, '#b07c48'); r(c, 6, 4, 3, 1, '#e0b27a'); } // ride de vent
  if (v === 2) { r(c, 8, 11, 6, 1, '#b07c48'); r(c, 9, 10, 3, 1, '#e0b27a'); }
};

const hole: Painter = (c, v) => {
  sand(c, v);
  r(c, 3, 5, 10, 7, '#8a5f36'); r(c, 4, 6, 8, 5, '#5e3e22'); r(c, 5, 7, 6, 3, '#3e2814');
  r(c, 2, 11, 3, 2, '#e0b27a'); r(c, 11, 4, 3, 2, '#e0b27a'); // sable rejeté
};

const panel: Painter = (c, v) => {
  sand(c, v);
  r(c, 1, 12, 14, 2, 'rgba(0,0,0,0.25)');
  r(c, 7, 10, 2, 4, P.metalDark);
  r(c, 1, 3, 14, 8, P.ink); r(c, 2, 4, 12, 6, '#24406a');
  r(c, 2, 6, 12, 1, '#335a8c'); r(c, 7, 4, 1, 6, '#335a8c');
  if (v !== 1) { r(c, 9, 5, 4, 1, P.glass); r(c, 4, 8, 2, 1, '#9ad8ff'); } // reflets
  else { r(c, 4, 5, 6, 1, P.ink); r(c, 6, 6, 1, 3, P.ink); } // fêlure
};

const deadPlants: Painter = (c, v) => {
  speckle(c, 23 + v * 3, '#6e4a30', [['#5a3a24', 12], ['#82583a', 6]]);
  for (const x of [2, 7, 12]) {
    r(c, x, 6, 1, 7, '#3e2a1c'); r(c, x + 1, 5, 2, 1, '#2a1c12'); r(c, x - 1, 8, 1, 1, '#4a3626');
    r(c, x + 1, 9, 1, 1, '#7a5a2a');
  }
};

const shed: Painter = (c, v) => {
  dust(c, v);
  r(c, 1, 13, 14, 2, 'rgba(0,0,0,0.3)');
  r(c, 2, 5, 12, 9, P.wood); r(c, 2, 5, 12, 1, '#7a604a');
  r(c, 1, 3, 14, 3, P.rust); r(c, 1, 3, 14, 1, P.rustLight);
  r(c, 6, 8, 4, 6, P.woodDark); r(c, 9, 10, 1, 1, P.hazard);
  for (const x of [3, 5, 11, 13]) r(c, x, 6, 1, 7, P.woodDark);
};

const thermometer: Painter = (c, v) => {
  dust(c, v);
  r(c, 7, 9, 2, 6, P.metalDark);
  r(c, 4, 1, 8, 9, P.ink); r(c, 5, 2, 6, 7, P.paper);
  r(c, 7, 3, 2, 4, '#e8e0d0'); r(c, 7, 3, 2, 4, P.red); r(c, 7, 7, 2, 1, P.red);
  r(c, 6, 2, 4, 1, P.red); // aiguille collée en haut
};

const stairs: Painter = (c) => {
  r(c, 0, 0, T, T, P.wallFront);
  for (let i = 0; i < 5; i++) { r(c, 1 + i, 3 + i * 2, 14 - i * 2, 2, i % 2 ? '#2c2832' : '#3a3540'); }
  r(c, 0, 0, T, 2, P.hazard); r(c, 0, 0, 2, 2, P.ink); r(c, 4, 0, 2, 2, P.ink); r(c, 8, 0, 2, 2, P.ink); r(c, 12, 0, 2, 2, P.ink);
  r(c, 5, 12, 6, 4, P.ink);
};

const vitrine: Painter = (c) => {
  labFloor(c, 0);
  r(c, 2, 8, 12, 7, P.metalDark); r(c, 2, 8, 12, 1, P.metalLight);
  r(c, 3, 2, 10, 7, 'rgba(160,240,255,0.18)'); r(c, 3, 2, 10, 1, P.metalLight); r(c, 3, 2, 1, 7, P.metalLight); r(c, 12, 2, 1, 7, P.metalLight);
  r(c, 5, 6, 6, 2, P.ink); r(c, 6, 11, 4, 2, P.paper); // socle vide + étiquette
  r(c, 4, 3, 1, 3, 'rgba(255,255,255,0.5)');
};

const desk: Painter = (c) => {
  labFloor(c, 0);
  r(c, 1, 6, 14, 8, P.woodDark); r(c, 1, 6, 14, 2, P.wood);
  r(c, 3, 3, 5, 4, P.ink); r(c, 4, 4, 3, 2, '#1d3a2a'); // vieux moniteur
  r(c, 9, 4, 4, 2, P.paper); r(c, 10, 5, 4, 2, '#d8ccb0'); // papiers
  r(c, 2, 9, 6, 1, '#3a2a1e'); r(c, 9, 10, 4, 3, '#2a1f17');
  r(c, 5, 7, 7, 1, '#1a1a1a'); r(c, 11, 7, 3, 1, '#c04a2a'); // câbles
};

const shelf: Painter = (c) => {
  labFloor(c, 0);
  r(c, 1, 1, 14, 14, P.woodDark);
  for (const y of [4, 9]) r(c, 1, y, 14, 1, P.wood);
  const books = ['#8a3a3a', '#3a5a8a', '#6a7a3a', '#a08a4a', '#5a3a6a'];
  for (let i = 0; i < 6; i++) { r(c, 2 + i * 2, 1, 2, 3, books[i % 5]); r(c, 2 + i * 2, 5 + (i % 2), 2, 4 - (i % 2), books[(i + 2) % 5]); }
  r(c, 3, 10, 9, 4, P.paper); r(c, 4, 11, 7, 1, '#9a8c70'); // classeur ouvert
};

const vent = (open: boolean): Painter => (c) => {
  labWallFront(c, 0);
  r(c, 4, 4, 8, 6, P.ink);
  if (open) { r(c, 5, 5, 6, 4, '#050508'); r(c, 3, 9, 3, 2, P.metal); }
  else for (const y of [5, 7]) r(c, 5, y, 6, 1, P.metal);
};

const pedestal = (full: boolean): Painter => (c) => {
  labFloor(c, 0);
  r(c, 4, 9, 8, 6, P.metalDark); r(c, 4, 9, 8, 1, P.metalLight); r(c, 3, 14, 10, 1, P.ink);
  if (full) {
    r(c, 5, 3, 6, 5, P.ink); r(c, 6, 4, 4, 3, '#b48cff'); r(c, 7, 5, 2, 1, '#f0e0ff');
    r(c, 4, 2, 1, 1, '#b48cff'); r(c, 11, 2, 1, 1, '#b48cff'); r(c, 7, 1, 1, 1, '#b48cff');
  } else r(c, 6, 8, 4, 1, P.neon);
};

const capsuleFrost: Painter = (c) => {
  labFloor(c, 0);
  r(c, 2, 1, 12, 15, P.metalDark); r(c, 3, 1, 10, 1, P.metalLight);
  r(c, 4, 3, 8, 9, '#b9d4e4'); r(c, 5, 4, 6, 7, '#d8ecf6');
  r(c, 6, 5, 4, 5, '#9ab4c6'); // silhouette sous le givre
  r(c, 5, 4, 1, 1, '#ffffff'); r(c, 10, 9, 1, 1, '#ffffff');
  r(c, 4, 13, 8, 2, P.metal); r(c, 6, 13, 1, 1, P.neon); r(c, 9, 13, 1, 1, P.neon);
};

const book: Painter = (c) => {
  labFloor(c, 0);
  r(c, 2, 5, 12, 9, P.metalDark); r(c, 2, 5, 12, 1, P.metalLight);
  r(c, 3, 3, 10, 7, P.ink); r(c, 4, 3, 4, 6, P.paper); r(c, 8, 3, 4, 6, '#e0d4b8');
  for (const y of [4, 6, 8]) { r(c, 5, y, 3, 1, '#7a6c56'); r(c, 9, y, 3, 1, '#7a6c56'); }
};

const plantsSign: Painter = (c, v) => sign(c, v);

const dogOff: Painter = (c, v) => {
  dust(c, v);
  drawDog(c, 0, true);
};

// ---------- bâtiments reconnaissables (toit + façade par style) ----------
// Laboratoire Lazare : panneaux blancs cliniques, néon turquoise.
const labTop: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#d7dde4'); r(c, 0, 0, T, 1, '#f2f5f8');
  r(c, 0, 7, T, 1, '#b9c2cc'); r(c, 7, 0, 1, T, '#b9c2cc');
  if (v === 1) { r(c, 3, 2, 3, 3, '#8e9aab'); r(c, 4, 3, 1, 1, '#4fd1c5'); } // ventilation
  if (v === 2) { r(c, 10, 10, 4, 3, '#a7b2bf'); r(c, 10, 10, 4, 1, '#c6ced8'); }
};
const labFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#e6eaef'); r(c, 0, 0, T, 2, '#b9c2cc');
  r(c, 0, 11, T, 2, P.neon); r(c, 0, 14, T, 2, '#9aa6b4');
  r(c, 3, 4, 10, 5, P.ink); r(c, 4, 5, 8, 3, '#2f6f8a'); r(c, 4, 5, 3, 1, '#9ad8ff');
  if (v === 2) { r(c, 4, 5, 8, 3, '#1c2533'); r(c, 6, 6, 3, 1, P.glass); } // vitre brisée
};
const labEmblem: Painter = (c) => {
  labFront(c, 0);
  r(c, 3, 2, 10, 9, '#e6eaef'); r(c, 4, 2, 8, 8, P.ink); r(c, 5, 3, 6, 6, '#e6eaef');
  r(c, 7, 3, 2, 6, P.neon); // capsule stylisée
  r(c, 6, 4, 4, 1, P.neon); r(c, 6, 7, 4, 1, P.neon);
};

// Centre de recherche : verre sombre, armature acier, antenne parabolique.
const resTop: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#3a4656'); r(c, 0, 0, T, 1, '#5a687a');
  for (let x = 0; x < T; x += 4) r(c, x, 0, 1, T, '#323c4a');
  if (v === 1) { r(c, 5, 5, 6, 6, '#56657a'); r(c, 6, 6, 4, 4, '#2a323e'); r(c, 7, 7, 2, 2, P.screen); } // lanterneau
};
const resFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#1c2a36'); r(c, 0, 0, T, 2, '#5a687a');
  for (const x of [0, 8]) r(c, x, 2, 1, 14, '#5a687a');
  r(c, 0, 8, T, 1, '#5a687a');
  r(c, 2, 3, 5, 4, '#2c5a6e'); r(c, 10, 3, 5, 4, '#2c5a6e'); r(c, 2, 10, 5, 5, '#24485a'); r(c, 10, 10, 5, 5, '#24485a');
  r(c, 3, 3, 2, 1, '#8fe0ff'); r(c, 11, 10, 2, 1, '#8fe0ff');
  if (v === 2) { r(c, 10, 3, 5, 4, '#0c1218'); r(c, 12, 4, 1, 2, '#8fe0ff'); }
};
const atomEmblem: Painter = (c) => {
  resFront(c, 0);
  r(c, 2, 2, 12, 12, P.ink); r(c, 3, 3, 10, 10, '#10202a');
  r(c, 4, 7, 8, 2, P.screen); r(c, 7, 4, 2, 8, P.screen); r(c, 5, 5, 2, 2, P.screen); r(c, 9, 9, 2, 2, P.screen);
  r(c, 9, 5, 2, 2, P.screen); r(c, 5, 9, 2, 2, P.screen); r(c, 7, 7, 2, 2, '#ffffff');
};

// Métro : auvent carrelé vert, grand « M ».
const metroTop: Painter = (c) => {
  r(c, 0, 0, T, T, '#2f6b52'); r(c, 0, 0, T, 1, '#4f9a78');
  for (let y = 3; y < T; y += 4) r(c, 0, y, T, 1, '#265844');
  for (let x = 2; x < T; x += 4) r(c, x, 0, 1, T, '#3a7d60');
};
const metroFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#d8d2c0'); r(c, 0, 0, T, 3, '#2f6b52'); r(c, 0, 3, T, 1, P.ink);
  for (let y = 6; y < T; y += 3) r(c, 0, y, T, 1, '#bfb8a4');
  for (let x = 3; x < T; x += 4) r(c, x, 4, 1, 12, '#bfb8a4');
  if (v === 1) { r(c, 4, 8, 4, 3, '#a59e8a'); } // carreaux tombés
};
const metroSign: Painter = (c) => {
  metroFront(c, 0);
  r(c, 2, 4, 12, 11, P.ink); r(c, 3, 5, 10, 9, '#f2c230');
  r(c, 4, 6, 2, 7, P.ink); r(c, 10, 6, 2, 7, P.ink); r(c, 6, 7, 1, 2, P.ink); r(c, 9, 7, 1, 2, P.ink); r(c, 7, 9, 2, 2, P.ink);
};

// Spatioport : hangar en tôle ondulée, bandes de danger, fusée.
const spatioTop: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#8c939e');
  for (let x = 0; x < T; x += 3) r(c, x, 0, 1, T, '#6e7480');
  r(c, 0, 0, T, 1, '#b4bac4');
  if (v === 2) { r(c, 4, 5, 6, 5, '#1c1a22'); r(c, 5, 6, 4, 2, '#3a2a2a'); } // trou dans la tôle
};
const spatioFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#5f6672'); r(c, 0, 0, T, 2, '#8c939e');
  for (let x = 0; x < T; x += 4) { r(c, x, 13, 2, 3, P.hazard); r(c, x + 2, 13, 2, 3, P.ink); }
  r(c, 0, 5, T, 1, '#4a505a'); r(c, 0, 9, T, 1, '#4a505a');
  if (v === 1) { r(c, 3, 3, 10, 2, P.ink); r(c, 4, 3, 8, 1, '#ff7a3d'); } // néon « départs » éteint
};
const rocketEmblem: Painter = (c) => {
  spatioFront(c, 0);
  r(c, 3, 1, 10, 11, P.ink); r(c, 4, 2, 8, 9, '#23344a');
  r(c, 7, 3, 2, 6, '#e6ecff'); r(c, 6, 5, 4, 3, '#e6ecff'); r(c, 7, 2, 2, 1, P.red);
  r(c, 5, 8, 1, 2, '#e6ecff'); r(c, 10, 8, 1, 2, '#e6ecff'); r(c, 7, 9, 2, 1, P.hazard);
};
const pad: Painter = (c, v) => {
  speckle(c, 41 + v * 5, '#57525e', [['#4c4854', 10], ['#625d6a', 6]]);
  r(c, 0, 0, T, 1, '#3e3a46'); r(c, 0, 0, 1, T, '#3e3a46'); // joints des dalles
  if (v === 2) { r(c, 11, 11, 3, 3, P.hazard); r(c, 12, 12, 1, 1, P.ink); } // balise
  if (v === 1) { r(c, 4, 6, 5, 1, '#3a3540'); r(c, 6, 7, 1, 3, '#3a3540'); } // fissure
};

// Centrale Hélios : toit couvert de cellules solaires, façade jaune et soleil.
const heliosTop: Painter = (c, v) => {
  r(c, 0, 0, T, T, P.ink);
  for (const [x, y] of [[1, 1], [9, 1], [1, 9], [9, 9]]) {
    r(c, x, y, 6, 6, v === 1 && x === 9 && y === 1 ? '#1a2436' : '#24406a');
    r(c, x, y + 2, 6, 1, '#335a8c'); r(c, x + 3, y, 1, 6, '#335a8c');
  }
  if (v !== 1) r(c, 10, 2, 2, 1, '#9ad8ff');
};
const heliosFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#c9a24a'); r(c, 0, 0, T, 2, '#8a6a2a'); r(c, 0, 14, T, 2, '#8a6a2a');
  r(c, 0, 6, T, 2, '#e8c45a');
  r(c, 3, 9, 4, 4, P.ink); r(c, 9, 9, 4, 4, P.ink); r(c, 4, 10, 2, 2, '#3a2a1a'); r(c, 10, 10, 2, 2, '#3a2a1a');
  if (v === 2) { r(c, 1, 3, 4, 1, '#8a6a2a'); r(c, 12, 2, 1, 4, '#8a6a2a'); } // fissures
};
const sunEmblem: Painter = (c) => {
  heliosFront(c, 0);
  r(c, 2, 1, 12, 12, P.ink); r(c, 3, 2, 10, 10, '#2a1a10');
  r(c, 6, 5, 4, 4, '#ffd34d'); r(c, 7, 3, 2, 1, '#ffd34d'); r(c, 7, 10, 2, 1, '#ffd34d');
  r(c, 4, 6, 1, 2, '#ffd34d'); r(c, 11, 6, 1, 2, '#ffd34d');
  r(c, 4, 3, 1, 1, '#ffb347'); r(c, 11, 3, 1, 1, '#ffb347'); r(c, 4, 10, 1, 1, '#ffb347'); r(c, 11, 10, 1, 1, '#ffb347');
};
const heliosDoor: Painter = (c) => {
  heliosFront(c, 1);
  r(c, 3, 3, 10, 13, P.ink); r(c, 4, 4, 8, 12, P.metal); r(c, 7, 4, 2, 12, P.metalDark);
  r(c, 4, 7, 8, 1, P.hazard); r(c, 10, 9, 1, 2, P.red);
};

// Maisons du quartier : toit de tuiles, façade crème.
const houseTop: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#8a4636');
  for (let y = 1; y < T; y += 4) { r(c, 0, y, T, 1, '#6e3428'); for (let x = (y % 8 === 1 ? 0 : 2); x < T; x += 4) r(c, x, y + 1, 1, 3, '#6e3428'); }
  r(c, 0, 0, T, 1, '#a85a46');
  if (v === 1) { r(c, 5, 6, 5, 4, '#2a1a16'); r(c, 6, 7, 3, 2, '#4a2a20'); } // tuiles envolées
};
const houseFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#d8c4a0'); r(c, 0, 0, T, 2, '#6e3428'); r(c, 0, 14, T, 2, '#a88e68');
  r(c, 4, 4, 8, 7, P.ink); r(c, 5, 5, 6, 5, '#2a3c4a'); r(c, 8, 5, 1, 5, P.ink); r(c, 5, 7, 6, 1, P.ink);
  r(c, 3, 11, 10, 1, '#8a6a4a');
  if (v === 1) { r(c, 5, 5, 3, 2, P.glass); }
  if (v === 2) { r(c, 4, 4, 8, 7, '#5a4636'); r(c, 4, 6, 8, 1, '#3e2f24'); r(c, 4, 9, 8, 1, '#3e2f24'); } // volet fermé
};
const houseDoor: Painter = (c) => {
  houseFront(c, 0);
  r(c, 4, 4, 8, 12, P.ink); r(c, 5, 5, 6, 11, '#6e4a30'); r(c, 9, 10, 1, 1, P.hazard);
};

// ---------- étape 2 : intérieurs, métro, colline ----------
const woodFloor: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#7a5636');
  for (const y of [0, 5, 10, 15]) r(c, 0, y, T, 1, '#5e4028');
  r(c, (v * 5) % T, 1, 1, 4, '#5e4028'); r(c, (v * 7 + 8) % T, 6, 1, 4, '#5e4028'); r(c, (v * 3 + 4) % T, 11, 1, 4, '#5e4028');
  r(c, 3, 2, 3, 1, '#8a6644');
};
const wallpaperTop: Painter = (c) => { r(c, 0, 0, T, T, '#4a3a4e'); r(c, 0, 0, T, 1, '#5e4a62'); };
const wallpaperFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#c9a98a');
  for (let x = 1; x < T; x += 4) for (let y = 2 + (x % 8 === 1 ? 0 : 3); y < 12; y += 6) r(c, x, y, 2, 2, '#b48e70');
  r(c, 0, 12, T, 4, '#6e4a30'); r(c, 0, 12, T, 1, '#8a6644');
  if (v === 2) r(c, 9, 3, 4, 5, '#a88468'); // tache d'humidité
};
const plankTop: Painter = (c) => { r(c, 0, 0, T, T, '#4a3424'); r(c, 0, 0, T, 1, '#5e4430'); };
const plankFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#7a5a3a');
  for (const x of [0, 5, 10]) r(c, x, 0, 1, T, '#5a3e26');
  r(c, 2, 4 + v, 1, 1, '#3a2818'); r(c, 12, 9 - v, 1, 1, '#3a2818');
  if (v === 1) { r(c, 6, 6, 3, 2, '#2f6fbf'); r(c, 6, 6, 3, 1, '#4f8fdf'); } // morceau de tôle bleue
};
const metroWallTop: Painter = (c) => { r(c, 0, 0, T, T, '#1e2228'); r(c, 0, 0, T, 1, '#2c3038'); };
const metroWallFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#cfc7b0');
  for (let y = 0; y < T; y += 4) r(c, 0, y, T, 1, '#b2aa92');
  for (let y = 0; y < T; y += 8) for (let x = 0; x < T; x += 8) r(c, x + (y % 16 ? 4 : 0), y, 1, 4, '#b2aa92');
  r(c, 0, 10, T, 2, '#2f6b52');
  if (v === 2) { r(c, 3, 3, 5, 3, '#8c846e'); r(c, 4, 6, 2, 2, '#8c846e'); }
};
const platform: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#6e6a62');
  r(c, 0, 0, T, 1, '#7e7a72'); r(c, 0, 8, T, 1, '#5e5a52'); r(c, 8, 0, 1, T, '#5e5a52');
  if (v === 1) r(c, 3, 4, 2, 1, '#4e4a44');
};
const platformEdge: Painter = (c) => {
  platform(c, 0);
  r(c, 0, 10, T, 3, P.hazard); for (let x = 0; x < T; x += 4) r(c, x, 10, 2, 3, P.ink);
  r(c, 0, 13, T, 3, '#2a2622');
};
const rails: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#2a2622');
  for (let x = 1; x < T; x += 5) r(c, x, 2, 3, 12, '#4a3a2a'); // traverses
  r(c, 0, 4, T, 1, '#8a8a92'); r(c, 0, 11, T, 1, '#8a8a92');
  if (v === 2) r(c, 7, 7, 2, 2, '#3a3632');
};
const sky: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#d6562d');
  if (v === 0) r(c, 4, 6, 6, 1, '#e8733a');
  if (v === 2) r(c, 9, 11, 4, 1, '#b23e30');
};
const grating: Painter = (c) => {
  r(c, 0, 0, T, T, '#3a3f48');
  for (let i = 0; i < T; i += 3) { r(c, i, 0, 1, T, '#555c68'); r(c, 0, i, T, 1, '#2a2e36'); }
  r(c, 0, 0, T, 1, '#6d7686');
};
const bed: Painter = (c, v) => {
  woodFloor(c, v);
  r(c, 1, 2, 14, 13, P.ink); r(c, 2, 3, 12, 11, '#c25a6a'); r(c, 2, 3, 12, 4, '#f0e0d0');
  r(c, 3, 4, 4, 2, '#ffffff'); for (let x = 3; x < 13; x += 3) r(c, x, 9, 1, 4, '#a84a5a');
};
const drawings: Painter = (c, v) => {
  wallpaperFront(c, v);
  r(c, 1, 2, 6, 7, P.paper); r(c, 2, 5, 4, 3, '#8a6a4a'); r(c, 3, 3, 2, 2, P.hazard); // cabane + lampe
  r(c, 9, 1, 6, 6, P.paper); r(c, 10, 4, 4, 2, '#9ad8ff'); r(c, 11, 2, 1, 1, P.hazard); r(c, 13, 2, 1, 1, P.hazard); // boîtes de verre et étoiles
};
const toybox: Painter = (c, v) => {
  woodFloor(c, v);
  r(c, 2, 6, 12, 9, P.ink); r(c, 3, 7, 10, 7, '#3a7d9a'); r(c, 3, 7, 10, 2, '#5a9dba');
  r(c, 5, 4, 3, 3, '#e05a4a'); r(c, 9, 3, 2, 4, P.hazard);
};
const lampBox: Painter = (c, v) => {
  woodFloor(c, v);
  r(c, 3, 9, 10, 6, P.woodDark); r(c, 3, 9, 10, 1, P.wood);
  r(c, 5, 4, 6, 5, P.ink); r(c, 6, 5, 4, 3, '#c04a2a'); r(c, 10, 5, 2, 3, '#fff3b0'); // lampe torche
};
const lampBoxEmpty: Painter = (c, v) => {
  woodFloor(c, v);
  r(c, 3, 9, 10, 6, P.woodDark); r(c, 3, 9, 10, 1, P.wood);
};
const counter: Painter = (c) => {
  platform(c, 0);
  r(c, 0, 6, T, 9, P.ink); r(c, 1, 7, 14, 7, '#8a6a4a'); r(c, 1, 7, 14, 2, '#a88464');
  r(c, 3, 2, 10, 4, P.ink); r(c, 4, 3, 8, 2, '#f2c230'); r(c, 6, 3, 1, 2, P.ink); r(c, 9, 3, 1, 2, P.ink); // panneau
};
const caisson = (full: boolean): Painter => (c) => {
  platform(c, 1);
  r(c, 2, 4, 12, 11, P.ink); r(c, 3, 5, 10, 9, '#d7dde4'); r(c, 3, 9, 10, 1, P.neon);
  r(c, 6, 6, 4, 2, full ? '#b48cff' : P.metalDark); r(c, 3, 5, 10, 1, '#f2f5f8');
};
const ladder: Painter = (c) => {
  sky(c, 1);
  r(c, 4, 0, 2, T, P.metalDark); r(c, 10, 0, 2, T, P.metalDark);
  for (let y = 2; y < T; y += 4) r(c, 4, y, 8, 1, P.metalLight);
};
const towerBase: Painter = (c, v) => {
  dust(c, v);
  r(c, 4, 0, 2, T, P.metalDark); r(c, 10, 0, 2, T, P.metalDark);
  for (let y = 2; y < T; y += 4) r(c, 4, y, 8, 1, P.metalLight);
  r(c, 2, 13, 12, 3, 'rgba(0,0,0,0.25)');
};
const metroStairsUp: Painter = (c) => {
  metroWallFront(c, 0);
  r(c, 2, 2, 12, 14, P.ink);
  for (let i = 0; i < 5; i++) r(c, 3, 3 + i * 3, 10, 2, i % 2 ? '#4a4652' : '#5a5662');
  r(c, 5, 0, 6, 2, '#f2c230');
};
const lazarePoster: Painter = (c, v) => {
  metroWallFront(c, v);
  r(c, 2, 1, 12, 9, P.ink); r(c, 3, 2, 10, 7, '#e6eaef');
  r(c, 6, 3, 4, 5, '#9ad8ff'); r(c, 7, 4, 2, 3, '#ffffff'); r(c, 4, 7, 8, 1, P.neon);
};
const networkMap: Painter = (c, v) => {
  metroWallFront(c, v);
  r(c, 1, 1, 14, 9, P.ink); r(c, 2, 2, 12, 7, '#f2efe6');
  r(c, 3, 5, 10, 1, '#d04a42'); r(c, 7, 3, 1, 5, '#3a7d60');
  for (const x of [3, 7, 12]) r(c, x, 4, 2, 3, P.ink);
};
const obsTop: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#d9dde4'); r(c, 0, 0, T, 2, '#f2f4f7');
  for (let x = 2; x < T; x += 5) r(c, x, 0, 1, T, '#b9c0ca');
  if (v === 1) { r(c, 6, 3, 4, 10, P.ink); r(c, 7, 4, 2, 8, '#24406a'); } // fente du télescope
};
const obsFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#8a96a8'); r(c, 0, 0, T, 2, '#b9c0ca'); r(c, 0, 14, T, 2, '#6a7688');
  r(c, 3, 5, 10, 5, P.ink); r(c, 4, 6, 8, 3, '#24406a'); r(c, 4, 6, 2, 1, '#9ad8ff');
  if (v === 2) { r(c, 4, 6, 8, 3, '#1a1e26'); }
};
const obsDoor: Painter = (c) => {
  obsFront(c, 1);
  r(c, 4, 3, 8, 13, P.ink); r(c, 5, 4, 6, 12, P.metal); r(c, 8, 4, 1, 12, P.metalDark); r(c, 10, 9, 1, 2, P.red);
};
const console_: Painter = (c, v) => {
  dust(c, v);
  r(c, 2, 5, 12, 10, P.metalDark); r(c, 2, 5, 12, 1, P.metalLight);
  r(c, 4, 7, 8, 4, P.ink); r(c, 5, 8, 4, 1, '#ffb347'); r(c, 5, 10, 2, 1, '#ffb347');
};

const trapdoor: Painter = (c, v) => {
  dust(c, v);
  r(c, 2, 2, 12, 12, P.ink); r(c, 3, 3, 10, 10, P.wood);
  for (const y of [5, 8, 11]) r(c, 3, y, 10, 1, P.woodDark);
  r(c, 7, 6, 2, 2, P.metalDark); r(c, 7, 6, 2, 1, P.metalLight); // anneau
};

// ---------- étape 3 ----------
const turbine: Painter = (c) => {
  platform(c, 0);
  r(c, 1, 2, 14, 13, P.ink); r(c, 2, 3, 12, 11, '#6a7280'); r(c, 2, 3, 12, 2, '#8a93a2');
  r(c, 4, 6, 8, 6, '#3a3f48'); r(c, 7, 6, 2, 6, '#8a93a2'); r(c, 4, 8, 8, 2, '#8a93a2'); // pales
  r(c, 12, 4, 1, 1, P.red);
};
const switchPanel = (on: boolean): Painter => (c) => {
  metroWallFront(c, 0);
  r(c, 1, 1, 14, 12, P.ink); r(c, 2, 2, 12, 10, '#3a3f48');
  for (let i = 0; i < 5; i++) { r(c, 3 + i * 2, 4, 1, 5, on ? '#46e08a' : '#8a3a3a'); r(c, 3 + i * 2, on ? 4 : 7, 1, 2, '#e6ecff'); }
  r(c, 3, 10, 10, 1, on ? '#46e08a' : P.hazard);
};
const plaque: Painter = (c, v) => {
  metroWallFront(c, v);
  r(c, 2, 2, 12, 8, P.ink); r(c, 3, 3, 10, 6, '#c9a24a'); r(c, 4, 5, 8, 1, '#5a4626'); r(c, 4, 7, 5, 1, '#5a4626');
};
const telescope: Painter = (c) => {
  labFloor(c, 0);
  r(c, 6, 9, 4, 6, P.metalDark); r(c, 3, 14, 10, 1, P.ink);
  r(c, 2, 3, 12, 5, P.ink); r(c, 3, 4, 10, 3, '#d9dde4'); r(c, 3, 4, 10, 1, '#f2f4f7'); r(c, 12, 3, 3, 5, '#24406a');
  r(c, 7, 7, 2, 3, P.metal);
};
const orbitChart: Painter = (c) => {
  labWallFront(c, 0);
  r(c, 1, 1, 14, 10, P.ink); r(c, 2, 2, 12, 8, '#0f1a30');
  c.fillStyle = '#9ad8ff'; for (let a = 0; a < 6.28; a += 0.35) c.fillRect(Math.round(8 + Math.cos(a) * 3), Math.round(6 + Math.sin(a) * 2), 1, 1);
  c.fillStyle = '#ff7a3d'; for (let a = 0; a < 6.28; a += 0.25) c.fillRect(Math.round(6 + Math.cos(a) * 5), Math.round(6 + Math.sin(a) * 1.5), 1, 1);
  r(c, 8, 6, 1, 1, '#ffe08a'); r(c, 3, 5, 2, 2, '#ff5a2d');
};
const missionBoard: Painter = (c, v) => {
  labWallFront(c, v);
  r(c, 0, 1, 16, 10, P.ink); r(c, 1, 2, 14, 8, '#10202a');
  for (let i = 0; i < 4; i++) { r(c, 2, 3 + i * 2, 6, 1, '#9aa3b3'); r(c, 10, 3 + i * 2, 3, 1, i === 0 ? '#46e08a' : '#d04a42'); }
};
const varnDesk: Painter = (c) => {
  desk(c, 0);
  r(c, 9, 4, 5, 3, '#7a2a2a'); r(c, 10, 5, 3, 1, '#c9a24a'); // carnet relié
};
const podPlans: Painter = (c) => {
  labFloor(c, 0);
  r(c, 1, 3, 14, 11, P.ink); r(c, 2, 4, 12, 9, '#2a4a8a');
  r(c, 4, 6, 8, 5, '#9ad8ff'); r(c, 5, 7, 6, 3, '#2a4a8a'); r(c, 7, 6, 2, 5, '#9ad8ff'); // schéma de capsule
  r(c, 3, 5, 2, 1, '#9ad8ff'); r(c, 11, 11, 2, 1, '#9ad8ff');
};
const dogSleep: Painter = (c) => {
  labFloor(c, 0);
  drawDog(c, 0, true);
};

const antennaBase: Painter = (c) => {
  grating(c, 0);
  r(c, 3, 11, 10, 4, P.ink); r(c, 4, 12, 8, 2, P.metalDark);
  r(c, 7, 1, 2, 11, P.metalDark); r(c, 7, 1, 1, 11, P.metalLight);
  r(c, 3, 3, 10, 1, P.metal); r(c, 4, 6, 8, 1, P.metal); r(c, 6, 0, 4, 1, P.red);
  r(c, 10, 12, 1, 1, '#46e08a');
};

export function radioTower(): HTMLCanvasElement {
  const [cv, c] = canvas(32, 80);
  const m = P.metalDark;
  r(c, 6, 20, 2, 60, m); r(c, 24, 20, 2, 60, m);
  for (let y = 22; y < 78; y += 8) { r(c, 6, y, 20, 1, P.metal); for (let i = 0; i < 8; i++) r(c, 7 + i * 2, y + 1 + (i % 4), 1, 1, P.metal); }
  r(c, 10, 10, 12, 12, m); r(c, 11, 11, 10, 10, '#454c59');
  r(c, 15, 0, 2, 12, m); r(c, 14, 0, 4, 2, P.red);
  r(c, 4, 12, 6, 8, P.ink); r(c, 5, 13, 4, 6, '#c9ced6'); r(c, 22, 14, 6, 6, P.ink); r(c, 23, 15, 4, 4, '#c9ced6'); // paraboles
  return cv;
}

export function bigTree(): HTMLCanvasElement {
  const [cv, c] = canvas(32, 52);
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(2, 46, 28, 5);
  const bark = P.woodDark;
  r(c, 12, 22, 8, 28, bark); r(c, 12, 22, 2, 28, P.wood); r(c, 9, 46, 14, 4, bark); // tronc et racines
  r(c, 6, 47, 4, 2, bark); r(c, 22, 47, 4, 2, bark);
  r(c, 4, 14, 10, 3, bark); r(c, 3, 8, 3, 8, bark); r(c, 18, 12, 11, 3, bark); r(c, 26, 5, 3, 9, bark); // grosses branches
  r(c, 14, 2, 3, 22, bark); r(c, 10, 0, 2, 6, bark); r(c, 19, 3, 2, 6, bark); r(c, 0, 6, 4, 2, bark); r(c, 28, 2, 4, 2, bark);
  r(c, 13, 30, 3, 3, '#2a1c12'); // un creux dans l'écorce
  return cv;
}

export function frozenTrain(): HTMLCanvasElement {
  const [cv, c] = canvas(96, 32);
  r(c, 0, 6, 96, 22, P.ink); r(c, 1, 7, 94, 20, '#c9ced6'); r(c, 1, 7, 94, 3, '#e6e9ee'); r(c, 1, 20, 94, 3, '#2f6b52');
  for (let x = 6; x < 92; x += 14) { r(c, x, 11, 9, 7, P.ink); r(c, x + 1, 12, 7, 5, '#1c2533'); }
  r(c, 47, 9, 2, 16, '#8a8f99');
  r(c, 2, 27, 92, 3, '#2a2622');
  return cv;
}

// ---------- grands décors (plus grands qu'une case) ----------
export function shuttleWreck(): HTMLCanvasElement {
  const [cv, c] = canvas(64, 48);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(4, 38, 58, 8);
  // fuselage couché, nez cassé à droite
  r(c, 4, 18, 50, 18, P.ink); r(c, 5, 19, 48, 16, '#d9dde4'); r(c, 5, 19, 48, 3, '#f2f4f7'); r(c, 5, 31, 48, 4, '#a9b0bb');
  r(c, 52, 21, 8, 12, P.ink); r(c, 53, 22, 6, 10, '#a9b0bb'); r(c, 58, 24, 4, 6, P.ink); // nez arraché
  r(c, 10, 23, 30, 2, P.red); // bande de couleur
  for (const x of [16, 24, 32]) { r(c, x, 26, 5, 4, P.ink); r(c, x + 1, 27, 3, 2, '#2f6f8a'); }
  r(c, 42, 25, 6, 8, P.ink); r(c, 43, 26, 4, 6, '#454c59'); // porte ouverte
  // aileron et réacteur
  r(c, 4, 6, 12, 14, P.ink); r(c, 6, 8, 9, 11, '#c9ced6'); r(c, 6, 8, 9, 2, '#e6e9ee');
  r(c, 0, 22, 6, 10, P.ink); r(c, 1, 23, 4, 8, '#3a3540'); r(c, 1, 25, 3, 4, '#ff7a3d');
  // brûlures et sable
  r(c, 30, 30, 10, 3, '#5a4a40'); r(c, 18, 20, 6, 2, '#8a8f99');
  r(c, 8, 34, 14, 3, '#c9945a'); r(c, 36, 35, 18, 3, '#c9945a');
  return cv;
}

export function dish(): HTMLCanvasElement {
  const [cv, c] = canvas(32, 32);
  r(c, 14, 18, 4, 12, P.metalDark); r(c, 10, 28, 12, 3, P.metal);
  r(c, 4, 6, 24, 14, P.ink); r(c, 5, 7, 22, 12, '#c9ced6'); r(c, 7, 9, 18, 8, '#a9b0bb'); r(c, 5, 7, 22, 2, '#e6e9ee');
  r(c, 15, 2, 2, 9, P.metalDark); r(c, 14, 1, 4, 2, P.red);
  return cv;
}

export function solarTower(): HTMLCanvasElement {
  const [cv, c] = canvas(16, 40);
  r(c, 5, 10, 6, 30, P.ink); r(c, 6, 11, 4, 29, '#d9dde4'); r(c, 6, 11, 1, 29, '#f2f4f7');
  r(c, 2, 0, 12, 11, P.ink); r(c, 3, 1, 10, 9, '#ffd34d'); r(c, 5, 3, 6, 5, '#fff3b0'); // capteur lumineux
  for (const y of [18, 26, 34]) r(c, 6, y, 4, 1, '#a9b0bb');
  return cv;
}

// ---------- Pixel, le chien robot ----------
function drawDog(c: Ctx, frame: number, off: boolean) {
  const body = off ? '#6a6f7a' : '#a9b3c4';
  const light = off ? '#80868f' : '#d3dbe8';
  const eye = off ? '#2a2d33' : '#5ef0ff';
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(3, 14, 11, 2);
  const leg = frame === 1 ? 1 : 0;
  r(c, 4, 12 - leg, 2, 3, P.ink); r(c, 11, 12 - (1 - leg), 2, 3, P.ink); // pattes
  r(c, 3, 7, 10, 6, P.ink); r(c, 4, 8, 8, 4, body); r(c, 4, 8, 8, 1, light); // corps
  r(c, 9, 3, 6, 6, P.ink); r(c, 10, 4, 4, 4, body); r(c, 10, 4, 4, 1, light); // tête
  r(c, 9, 1, 2, 3, P.ink); r(c, 13, 1, 2, 3, P.ink); // oreilles
  r(c, 12, 5, 1, 1, eye); r(c, 14, 6, 1, 1, P.ink); // œil, museau
  r(c, 1, 6, 3, 1, P.ink); r(c, 2, 5, 1, 1, P.ink); // queue
  r(c, 6, 9, 3, 2, off ? '#4a4d55' : '#ffcf4a'); // panneau solaire sur le dos
  if (off) r(c, 7, 9, 1, 2, P.ink); // fendu
}

const dogCache = new Map<string, HTMLCanvasElement>();
export function dog(dir: Dir, frame: number): HTMLCanvasElement {
  const id = `${dir}:${frame}`;
  let cv = dogCache.get(id);
  if (cv) return cv;
  const [c, ctx] = canvas();
  if (dir === 'left') { ctx.translate(T, 0); ctx.scale(-1, 1); }
  drawDog(ctx, frame, false);
  dogCache.set(id, c);
  cv = c;
  return cv;
}

// ---------- icônes du sac à dos (16 × 16) ----------
const ICONS: Record<string, Painter> = {
  badge: (c) => {
    r(c, 3, 2, 10, 13, P.ink); r(c, 4, 3, 8, 11, '#e8ecf2'); r(c, 4, 3, 8, 3, P.neon);
    r(c, 6, 7, 4, 4, '#9aa3b3'); r(c, 5, 12, 6, 1, '#6c7889'); r(c, 7, 0, 2, 3, P.metalDark);
  },
  sonde: (c) => {
    r(c, 3, 4, 10, 11, P.ink); r(c, 4, 5, 8, 9, '#3c4454'); r(c, 5, 6, 6, 4, '#0d1210');
    r(c, 6, 8, 1, 1, P.screen); r(c, 7, 7, 1, 2, P.screen); r(c, 8, 6, 1, 3, P.screen);
    r(c, 5, 11, 2, 2, P.red); r(c, 9, 11, 2, 2, P.hazard);
    r(c, 11, 0, 1, 5, P.metalLight); r(c, 10, 0, 3, 1, P.neon);
  },
  pelle: (c) => {
    r(c, 7, 1, 3, 2, P.woodDark); r(c, 8, 3, 1, 7, P.wood); r(c, 7, 3, 1, 7, P.woodDark);
    r(c, 5, 10, 6, 1, P.metalDark); r(c, 5, 11, 6, 3, P.metal); r(c, 6, 14, 4, 1, P.metal); r(c, 7, 15, 2, 1, P.metal);
    r(c, 5, 11, 1, 3, P.metalLight);
  },
  battery: (c) => {
    r(c, 2, 4, 12, 9, P.ink); r(c, 3, 5, 10, 7, '#24406a'); r(c, 3, 8, 10, 1, '#335a8c'); r(c, 8, 5, 1, 7, '#335a8c');
    r(c, 6, 13, 4, 2, P.metalDark); r(c, 7, 2, 2, 2, P.hazard); r(c, 4, 6, 2, 1, P.glass);
  },
  lampe: (c) => {
    r(c, 2, 6, 9, 5, P.ink); r(c, 3, 7, 7, 3, '#c04a2a'); r(c, 3, 7, 7, 1, '#e06a4a');
    r(c, 10, 4, 4, 9, P.ink); r(c, 11, 5, 2, 7, '#fff3b0'); r(c, 6, 7, 1, 1, P.hazard);
    r(c, 14, 6, 2, 1, '#fff3b0'); r(c, 14, 10, 2, 1, '#fff3b0'); r(c, 15, 8, 1, 1, '#fff3b0');
  },
  capteur: (c) => {
    r(c, 2, 6, 12, 9, P.ink); r(c, 3, 7, 10, 7, '#6a5a3a'); r(c, 4, 8, 5, 3, '#0d1210');
    r(c, 5, 9, 1, 1, '#ffb347'); r(c, 6, 10, 1, 1, '#ffb347'); r(c, 7, 9, 1, 1, '#ffb347');
    r(c, 10, 8, 2, 2, P.metalLight); r(c, 10, 11, 2, 2, P.metalLight); // molettes
    r(c, 11, 0, 1, 7, P.metalLight); r(c, 12, 0, 2, 1, P.metalLight);
  },
  noyau: (c) => {
    r(c, 4, 1, 8, 14, P.ink); r(c, 5, 2, 6, 12, '#d7dde4'); r(c, 6, 4, 4, 8, '#2a4a6a');
    r(c, 7, 5, 2, 6, P.neon); r(c, 7, 7, 2, 2, '#ffffff'); r(c, 5, 2, 6, 1, '#f2f5f8');
    r(c, 3, 6, 1, 4, P.metalDark); r(c, 12, 6, 1, 4, P.metalDark);
  },
  antenne: (c) => {
    r(c, 7, 6, 2, 9, P.metalDark); r(c, 7, 6, 1, 9, P.metalLight); r(c, 4, 14, 8, 2, P.ink);
    r(c, 2, 2, 12, 5, P.ink); r(c, 3, 3, 10, 3, '#c9ced6'); r(c, 3, 3, 10, 1, '#e6e9ee');
    r(c, 7, 0, 2, 3, P.red); r(c, 11, 8, 2, 2, '#46e08a');
  },
  matrice: (c) => {
    r(c, 3, 3, 10, 10, P.ink); r(c, 4, 4, 8, 8, '#4a2a7a'); r(c, 5, 5, 6, 6, '#b48cff'); r(c, 7, 7, 2, 2, '#f0e0ff');
    for (const i of [4, 7, 10]) { r(c, i, 1, 1, 2, P.metalLight); r(c, i, 13, 1, 2, P.metalLight); r(c, 1, i, 2, 1, P.metalLight); r(c, 13, i, 2, 1, P.metalLight); }
  },
};

const iconCache = new Map<string, string>();
/** Icône d'objet en image (data URL), affichée en grand avec des pixels nets. */
export function iconUrl(id: string): string {
  let url = iconCache.get(id);
  if (url) return url;
  const [c, ctx] = canvas();
  (ICONS[id] ?? ICONS.badge)(ctx, 0);
  url = c.toDataURL('image/png');
  iconCache.set(id, url);
  return url;
}

// ---------- registre des tuiles ----------
// Chaque nom donne des variantes (index v) ; l'eau a 2 images d'animation.
const REGISTRY: Record<string, Painter[]> = {
  sand: [sand], hole: [hole], panel: [panel], deadPlants: [deadPlants], shed: [shed], thermometer: [thermometer],
  stairs: [stairs], vitrine: [vitrine], desk: [desk], shelf: [shelf], vent: [vent(false)], ventOpen: [vent(true)],
  pedestal: [pedestal(true)], pedestalEmpty: [pedestal(false)], capsuleFrost: [capsuleFrost], book: [book],
  plantsSign: [plantsSign], dogOff: [dogOff],
  labTop: [labTop], labFront: [labFront], labEmblem: [labEmblem],
  resTop: [resTop], resFront: [resFront], atomEmblem: [atomEmblem],
  metroTop: [metroTop], metroFront: [metroFront], metroSign: [metroSign],
  spatioTop: [spatioTop], spatioFront: [spatioFront], rocketEmblem: [rocketEmblem], pad: [pad],
  heliosTop: [heliosTop], heliosFront: [heliosFront], sunEmblem: [sunEmblem], heliosDoor: [heliosDoor],
  houseTop: [houseTop], houseFront: [houseFront], houseDoor: [houseDoor],
  woodFloor: [woodFloor], wallpaperTop: [wallpaperTop], wallpaperFront: [wallpaperFront],
  plankTop: [plankTop], plankFront: [plankFront], metroWallTop: [metroWallTop], metroWallFront: [metroWallFront],
  platform: [platform], platformEdge: [platformEdge], rails: [rails], sky: [sky], grating: [grating],
  bed: [bed], drawings: [drawings], toybox: [toybox], lampBox: [lampBox], lampBoxEmpty: [lampBoxEmpty],
  counter: [counter], caisson: [caisson(true)], caissonEmpty: [caisson(false)], ladder: [ladder], towerBase: [towerBase],
  metroStairsUp: [metroStairsUp], lazarePoster: [lazarePoster], networkMap: [networkMap],
  obsTop: [obsTop], obsFront: [obsFront], obsDoor: [obsDoor], console: [console_], antennaBase: [antennaBase], trapdoor: [trapdoor],
  turbine: [turbine], switchPanel: [switchPanel(false)], switchPanelOn: [switchPanel(true)], plaque: [plaque],
  telescope: [telescope], orbitChart: [orbitChart], missionBoard: [missionBoard], varnDesk: [varnDesk],
  podPlans: [podPlans], dogSleep: [dogSleep],
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
