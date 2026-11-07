// Les tuiles d'Azura : une planète vivable, encore sauvage, où la colonie a semé son herbe.
// Autour de la colonie : un sol violet, des cratères, des cristaux. Dans la colonie : une herbe
// semée par les pilotes, des pylônes de terraformage, des conduites, des bâtiments d'Aurore.
import { T, paint, registerIcons, registerTiles, type Painter } from '../../engine/sprites.js';

const { r, rng, speckle } = paint;

export const AZ = {
  ink: '#14101c',
  grass: '#4ea866', grassDark: '#36884f', grassLight: '#7fd08a', grassDeep: '#2a6f45', sprout: '#7ff5e0',
  regolith: '#8a7ca6', regolithDark: '#6c5f8a', regolithLight: '#a99cc4', regolithDeep: '#4f4470', mineral: '#e8f6ff',
  path: '#c9bfd6', pathDark: '#a99dbb', pathLight: '#e2dbea',
  stone: '#e3e8ec', stoneDark: '#b9c2cc', stoneLight: '#f6f9fb',
  metal: '#8c99a8', metalDark: '#5f6b7a', metalLight: '#b8c4d0', metalDeep: '#3f4856',
  glow: '#5ff0e0', glowSoft: 'rgba(95,240,224,0.35)', violet: '#b36cf0', violetSoft: '#d7a6ff', pink: '#ff7ac8',
  water: '#2ec4bd', waterDeep: '#1aa2a3', waterLight: '#82efe3', foam: '#eafffb',
  rock: '#cbbfd2', rockDark: '#9d8fae', rockDeep: '#6f6286', moss: '#5fbf8a',
  white: '#f2f6f8', whiteShade: '#d0d9e0', whiteDeep: '#a9b6c2', teal: '#2a9d9a', tealDark: '#1d6f70', tealLight: '#5fd0c6',
  leaf: '#2f9e8a', leafDark: '#1f6f66', leafLight: '#62d0b4', trunk: '#d8d0e6', trunkDark: '#9f94b8',
  glass: '#bff3f6', glassDark: '#7fd4dc', red: '#ff5a5a', amber: '#ffc14a', paper: '#fbf3df', sun: '#ffd45e',
  screen: '#0d2a33', screenLine: '#5ff0e0',
};

// ---------- sols ----------
const azGrass: Painter = (c, v) => {
  speckle(c, 201 + v * 17, AZ.grass, [[AZ.grassDark, 16], [AZ.grassLight, 9]]);
  const blade = (x: number, y: number) => { r(c, x, y, 1, 2, AZ.grassDark); r(c, x + 1, y - 1, 1, 3, AZ.grassLight); r(c, x + 2, y, 1, 2, AZ.grassDark); };
  blade(3, 4); blade(10, 10); if (v !== 1) blade(7, 13);
  // de petites pousses d'ici, d'un vert presque bleu
  if (v === 2) { r(c, 12, 3, 1, 2, AZ.leafDark); r(c, 12, 2, 1, 1, AZ.sprout); }
  if (v === 0) { r(c, 5, 9, 1, 1, AZ.regolithDark); r(c, 6, 9, 1, 1, AZ.regolithLight); }
};
const azFlowers: Painter = (c, v) => {
  azGrass(c, v);
  // des fleurs d'Azura : des bulbes lumineux sur de fines tiges
  const rand = rng(331 + v * 23);
  const cols = [AZ.glow, AZ.violetSoft, AZ.pink, '#fff0a0'];
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(rand() * 12), y = 3 + Math.floor(rand() * 10);
    const col = cols[Math.floor(rand() * cols.length)];
    r(c, x + 1, y + 1, 1, 3, AZ.grassDeep);
    r(c, x, y, 3, 1, col); r(c, x + 1, y - 1, 1, 3, col);
    r(c, x + 1, y, 1, 1, '#ffffff');
  }
};
const azTall: Painter = (c, v) => {
  azGrass(c, v);
  // des roseaux d'ici, coiffés d'une petite boule claire
  for (const x of [1, 5, 9, 13]) {
    const h = 7 + ((x * 7 + v * 3) % 4);
    r(c, x, 15 - h, 1, h, AZ.grassDeep);
    r(c, x + 1, 14 - h, 1, h - 2, AZ.leafLight);
    r(c, x, 13 - h, 2, 2, x % 2 ? AZ.violetSoft : AZ.sprout);
  }
};
const regolith: Painter = (c, v) => {
  speckle(c, 611 + v * 19, AZ.regolith, [[AZ.regolithDark, 18], [AZ.regolithLight, 10]]);
  const rand = rng(77 + v * 5);
  for (let i = 0; i < 3; i++) { const x = Math.floor(rand() * 14), y = Math.floor(rand() * 14); r(c, x, y, 2, 1, AZ.regolithDeep); r(c, x, y - 1, 2, 1, AZ.regolithLight); }
  if (v === 1) r(c, 9, 5, 1, 1, AZ.mineral);
  if (v === 2) { r(c, 3, 11, 1, 1, AZ.mineral); r(c, 12, 2, 1, 1, AZ.glow); }
};
const crater: Painter = (c, v) => {
  regolith(c, v);
  r(c, 3, 4, 10, 8, AZ.regolithDeep);
  r(c, 2, 5, 12, 6, AZ.regolithDeep);
  r(c, 4, 5, 8, 6, AZ.regolithDark);
  r(c, 3, 6, 10, 4, AZ.regolithDark);
  r(c, 3, 3, 10, 1, AZ.regolithLight); r(c, 2, 4, 1, 1, AZ.regolithLight); r(c, 13, 4, 1, 1, AZ.regolithLight);
  r(c, 4, 12, 8, 1, AZ.regolithLight);
  r(c, 6, 7, 3, 2, '#5a4f7c');
};
/** Un grand cratère, en quatre morceaux (haut-gauche, haut-droite, bas-gauche, bas-droite). */
const bigCrater = (q: number): Painter => (c, v) => {
  regolith(c, v);
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 32;
  const k = cv.getContext('2d')!;
  const ell = (rx: number, ry: number, col: string, oy = 0) => { k.fillStyle = col; k.beginPath(); k.ellipse(16, 16 + oy, rx, ry, 0, 0, Math.PI * 2); k.fill(); };
  ell(15, 13, AZ.regolithLight, -1);
  ell(14, 12, AZ.regolithDeep);
  ell(12, 10, '#5a4f7c', 1);
  ell(7, 5, '#4a4068', 2);
  k.fillStyle = AZ.mineral; k.fillRect(20, 20, 1, 1); k.fillRect(11, 18, 1, 1);
  k.fillStyle = AZ.glow; k.fillRect(17, 19, 2, 1);
  c.imageSmoothingEnabled = false;
  c.drawImage(cv, (q % 2) * 16, Math.floor(q / 2) * 16, 16, 16, 0, 0, 16, 16);
};
const crystals = (frame: number): Painter => (c, v) => {
  regolith(c, v);
  r(c, 3, 13, 10, 2, 'rgba(0,0,0,0.2)');
  const shard = (x: number, h: number, col: string, hi: string) => {
    r(c, x, 14 - h, 3, h, col); r(c, x + 1, 13 - h, 1, 1, col); r(c, x, 14 - h, 1, h, hi);
  };
  shard(3, 7, '#3fb6c8', '#a8f6ff');
  shard(7, 11, '#2fa0c0', '#c8fbff');
  shard(11, 6, '#8a5ad8', '#d7b6ff');
  if (frame) { r(c, 8, 4, 1, 1, '#ffffff'); r(c, 4, 8, 1, 1, '#ffffff'); }
  else r(c, 12, 9, 1, 1, '#ffffff');
};
const azPath: Painter = (c, v) => {
  speckle(c, 241 + v * 11, AZ.path, [[AZ.pathDark, 14], [AZ.pathLight, 8]]);
  if (v === 1) { r(c, 4, 6, 2, 1, AZ.pathDark); r(c, 11, 11, 1, 1, AZ.pathDark); r(c, 9, 3, 1, 1, AZ.regolithDark); }
};
const metalFloor: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.metal);
  r(c, 0, 0, T, 1, AZ.metalLight); r(c, 0, 0, 1, T, AZ.metalLight);
  r(c, 0, 15, T, 1, AZ.metalDark); r(c, 15, 0, 1, T, AZ.metalDark);
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) r(c, x, y, 1, 1, AZ.metalDeep);
  for (let y = 4; y < 12; y += 2) r(c, 4, y, 8, 1, '#7d8a99');
  if (v === 1) r(c, 7, 1, 2, 1, AZ.glow);
};
const conduit = (vertical: boolean): Painter => (c, v) => {
  azGrass(c, v);
  const R = (x: number, y: number, w: number, h: number, col: string) => (vertical ? r(c, y, x, h, w, col) : r(c, x, y, w, h, col));
  R(0, 6, T, 5, AZ.metalDark);
  R(0, 6, T, 1, AZ.metalLight);
  R(0, 8, T, 1, AZ.glow);
  R(0, 10, T, 1, AZ.metalDeep);
  R(6, 5, 3, 7, AZ.metal); R(6, 5, 3, 1, AZ.metalLight);
};
const slab: Painter = (c, v) => {
  azGrass(c, v);
  // une dalle grise, biseautée, avec deux repères lumineux pour poser les pieds
  r(c, 1, 1, 14, 14, AZ.metalDeep);
  r(c, 1, 1, 14, 13, '#a3adb8');
  r(c, 1, 1, 14, 1, '#c9d1da'); r(c, 1, 1, 1, 13, '#c9d1da');
  r(c, 14, 1, 1, 13, '#7d8794');
  r(c, 3, 3, 10, 9, '#97a1ad');
  r(c, 4, 6, 3, 4, '#86909c'); r(c, 9, 6, 3, 4, '#86909c');
  r(c, 5, 5, 1, 1, AZ.glow); r(c, 10, 5, 1, 1, AZ.glow);
  r(c, 6, 12, 4, 1, AZ.metalDark);
};
const azStone: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.stone);
  r(c, 0, 0, T, 1, AZ.stoneLight); r(c, 0, 0, 1, T, AZ.stoneLight);
  r(c, 0, 15, T, 1, AZ.stoneDark); r(c, 15, 0, 1, T, AZ.stoneDark);
  // de petites lumières incrustées aux coins de certaines dalles
  if (v === 1) { r(c, 0, 0, 1, 1, AZ.glow); r(c, 1, 1, 1, 1, AZ.tealLight); }
  if (v === 2) { r(c, 5, 6, 6, 1, '#d4dbe2'); }
};
const azDeck: Painter = (c) => {
  r(c, 0, 0, T, T, AZ.metalDark);
  for (let y = 1; y < T; y += 3) r(c, 0, y, T, 1, AZ.metalDeep);
  for (let x = 1; x < T; x += 3) r(c, x, 0, 1, T, AZ.metal);
  r(c, 0, 0, T, 1, AZ.metalLight);
};
const azFloor: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#c9d2dc');
  r(c, 0, 0, T, 1, '#e3e9ef'); r(c, 0, 15, T, 1, '#a9b4c0'); r(c, 15, 0, 1, T, '#a9b4c0');
  if (v === 1) r(c, 3, 3, 10, 1, '#b8c3cf');
};

// ---------- eau ----------
const waterFrame = (frame: number, shore: boolean): Painter => (c, v) => {
  r(c, 0, 0, T, T, AZ.water);
  r(c, 0, 9, T, 7, AZ.waterDeep);
  const rand = rng(97 + v * 13);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(rand() * 12), y = 2 + Math.floor(rand() * 12);
    r(c, (x + (frame ? 2 : 0)) % 13, y, 3, 1, AZ.waterLight);
  }
  // des points lumineux sous la surface : quelque chose vit là-dedans
  if ((frame + v) % 2 === 0) r(c, 3 + v * 4, 12, 1, 1, AZ.glow);
  if ((frame + v) % 2 === 1) r(c, 11 - v * 2, 5, 1, 1, AZ.foam);
  if (shore) {
    r(c, 0, 0, T, 2, AZ.regolithDark);
    r(c, 0, 2, T, 1, AZ.foam);
    for (let x = frame; x < T; x += 3) r(c, x, 3, 1, 1, AZ.foam);
  }
};

// ---------- falaises et rochers ----------
const azRockTop: Painter = (c, v) => {
  speckle(c, 271 + v * 7, AZ.rock, [[AZ.rockDark, 10], ['#e0d6e6', 8]]);
  r(c, 0, 0, T, 2, AZ.moss);
  r(c, 3, 2, 3, 1, AZ.moss); r(c, 10, 2, 2, 1, AZ.moss);
  if (v === 1) r(c, 8, 9, 1, 1, AZ.glow);
};
const azRockFace: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.rockDark);
  // des strates violettes : une roche qui n'est pas d'ici
  for (const y of [4, 8, 11]) r(c, 0, y + (v % 2), T, 1, AZ.rockDeep);
  r(c, 0, 0, T, 2, AZ.rock);
  r(c, 4, 5, 3, 2, AZ.rock); r(c, 10, 9, 2, 1, AZ.rock);
  if (v === 2) { r(c, 7, 6, 1, 2, '#7fd8f0'); r(c, 8, 7, 1, 1, '#ffffff'); }
  r(c, 0, T - 2, T, 2, AZ.rockDeep);
};

// ---------- végétation d'Azura (peinte sur l'herbe : les ombres suivent leur forme) ----------
const azTree: Painter = (c, v) => {
  azGrass(c, v);
  // un tronc pâle et torsadé, une ombrelle de feuilles, des fruits lumineux qui pendent
  r(c, 7, 9, 2, 6, AZ.trunk); r(c, 8, 9, 1, 6, AZ.trunkDark); r(c, 6, 13, 1, 2, AZ.trunk); r(c, 9, 12, 1, 1, AZ.trunkDark);
  r(c, 1, 3, 14, 5, AZ.leaf); r(c, 3, 1, 10, 8, AZ.leaf); r(c, 0, 5, 16, 2, AZ.leaf);
  r(c, 3, 1, 6, 2, AZ.leafLight); r(c, 1, 4, 4, 1, AZ.leafLight); r(c, 10, 2, 3, 1, AZ.leafLight);
  r(c, 0, 7, 16, 1, AZ.leafDark); r(c, 2, 8, 12, 1, AZ.leafDark);
  r(c, 2, 9, 1, 2, AZ.leafDark); r(c, 13, 9, 1, 2, AZ.leafDark);
  r(c, 2, 11, 1, 1, v === 1 ? AZ.violetSoft : AZ.glow); r(c, 13, 11, 1, 1, v === 1 ? AZ.violetSoft : AZ.glow);
  if (v === 2) { r(c, 5, 9, 1, 2, AZ.leafDark); r(c, 5, 11, 1, 1, AZ.pink); }
};
const azBush: Painter = (c, v) => {
  azGrass(c, v);
  // des frondes spiralées, violettes et turquoise
  r(c, 3, 8, 10, 6, AZ.leafDark);
  r(c, 4, 6, 3, 6, AZ.violet); r(c, 4, 5, 2, 1, AZ.violetSoft); r(c, 3, 6, 1, 2, AZ.violetSoft);
  r(c, 9, 5, 3, 7, AZ.leaf); r(c, 10, 4, 2, 1, AZ.leafLight); r(c, 12, 5, 1, 2, AZ.leafLight);
  r(c, 7, 7, 2, 5, AZ.leafLight);
  r(c, 3, 13, 10, 1, AZ.grassDeep);
  if (v === 1) { r(c, 7, 6, 1, 1, AZ.glow); r(c, 11, 8, 1, 1, AZ.glow); }
};
const azForest: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#1d4f52');
  const rand = rng(401 + v * 31);
  for (let i = 0; i < 6; i++) r(c, Math.floor(rand() * 13), Math.floor(rand() * 13), 4, 3, i % 2 ? AZ.leafDark : '#2b6d62');
  r(c, 2 + v * 3, 3, 3, 2, AZ.leaf);
  r(c, 11 - v * 2, 10, 1, 1, i2(v));
};
const i2 = (v: number) => (v === 1 ? AZ.violetSoft : AZ.glow);

// ---------- ponts suspendus ----------
const bridge = (vertical: boolean): Painter => (c) => {
  waterFrame(0, false)(c, 0);
  const R = (x: number, y: number, w: number, h: number, col: string) => (vertical ? r(c, y, x, h, w, col) : r(c, x, y, w, h, col));
  R(0, 3, T, 10, AZ.metalDark);
  for (let i = 0; i < T; i += 2) R(i, 3, 1, 10, AZ.metalDeep);
  R(0, 3, T, 1, AZ.metalLight);
  R(0, 1, T, 1, AZ.whiteShade); R(0, 14, T, 1, AZ.whiteShade);
  R(0, 2, T, 1, 'rgba(0,0,0,0.2)');
  R(3, 0, 1, 3, AZ.metal); R(11, 13, 1, 3, AZ.metal);
  R(3, 0, 1, 1, AZ.glow); R(11, 15, 1, 1, AZ.glow);
};

// ---------- bâtiments d'Aurore ----------
const aurTop: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.white);
  r(c, 0, 0, T, 1, AZ.stoneLight);
  r(c, 0, 15, T, 1, AZ.whiteShade);
  r(c, 7, 0, 1, T, '#e1e8ee');

  if (v === 1) {
    // panneaux solaires
    r(c, 2, 3, 12, 8, AZ.metalDeep);
    for (let x = 3; x < 14; x += 3) r(c, x, 4, 2, 6, '#2b4f8a');
    r(c, 3, 4, 2, 1, '#6f9fe0'); r(c, 9, 4, 2, 1, '#6f9fe0');
  }
  if (v === 2) { r(c, 10, 9, 3, 3, AZ.whiteShade); r(c, 10, 9, 3, 1, AZ.metal); r(c, 11, 10, 1, 1, AZ.glow); }
};
const aurFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.white);
  r(c, 0, 0, T, 2, AZ.teal); r(c, 0, 2, T, 1, AZ.tealDark);
  r(c, 0, 3, T, 1, AZ.glow);
  r(c, 0, 12, T, 1, AZ.whiteShade);
  r(c, 0, 13, T, 3, AZ.metalDark);
  r(c, 2, 13, 2, 3, AZ.metalDeep); r(c, 12, 13, 2, 3, AZ.metalDeep);
  r(c, 0, 4, 1, 8, AZ.whiteShade);
  if (v === 0) {
    // un hublot, son cadre et son reflet
    r(c, 4, 5, 8, 6, AZ.metalDark); r(c, 5, 4, 6, 8, AZ.metalDark);
    r(c, 5, 5, 6, 6, AZ.glassDark); r(c, 6, 5, 4, 6, AZ.glass);
    r(c, 6, 6, 2, 1, '#ffffff'); r(c, 6, 7, 1, 1, '#ffffff');
  } else if (v === 1) {
    // une grille d'aération et un voyant
    r(c, 3, 6, 10, 5, AZ.whiteDeep);
    for (let y = 7; y < 11; y += 2) r(c, 4, y, 8, 1, AZ.metalDark);
    r(c, 13, 5, 1, 1, AZ.glow);
  } else {
    r(c, 3, 6, 4, 4, AZ.whiteShade); r(c, 9, 6, 4, 4, AZ.whiteShade); r(c, 4, 7, 2, 1, AZ.metal); r(c, 10, 7, 2, 1, AZ.metal);
  }
};
const aurDoor: Painter = (c) => {
  aurFront(c, 2);
  r(c, 3, 4, 10, 12, AZ.metalDark);
  r(c, 4, 5, 8, 11, AZ.teal);
  r(c, 7, 5, 2, 11, AZ.tealDark);
  r(c, 5, 6, 2, 1, AZ.tealLight); r(c, 9, 6, 2, 1, AZ.tealLight);
  r(c, 3, 4, 10, 1, AZ.glow);
  r(c, 13, 8, 2, 3, AZ.metalDeep); r(c, 13, 9, 2, 1, AZ.glow);
};
const aurDoorClosed: Painter = (c) => {
  aurDoor(c, 0);
  r(c, 3, 4, 10, 1, AZ.red);
  r(c, 13, 9, 2, 1, AZ.red);
};
const azWallTop: Painter = (c) => {
  r(c, 0, 0, T, T, '#dfe6ec');
  r(c, 0, 15, T, 1, AZ.whiteShade);
  r(c, 7, 0, 1, T, '#d2dae2');
};
const azWallFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#c4d2da');
  r(c, 0, 0, T, 2, AZ.teal); r(c, 0, 2, T, 1, AZ.glow);
  r(c, 0, 13, T, 3, '#9fb0bc');
  r(c, 7, 3, 1, 10, '#b3c2cc');
  if (v === 1) { r(c, 2, 5, 4, 5, AZ.screen); r(c, 3, 6, 2, 1, AZ.screenLine); r(c, 3, 8, 1, 1, AZ.screenLine); }
};

// ---------- les cuves (deux cases de haut : le couvercle, puis le socle) ----------
const cuveHead = (mine: boolean): Painter => (c, v) => {
  azGrass(c, v);
  r(c, 2, 4, 12, 12, AZ.metalDeep);
  // la coque, arrondie en haut
  r(c, 3, 3, 10, 13, AZ.whiteDeep); r(c, 4, 2, 8, 1, AZ.whiteDeep);
  r(c, 4, 3, 8, 13, AZ.white); r(c, 5, 2, 6, 1, AZ.white);
  r(c, 4, 4, 1, 12, AZ.stoneLight);
  // le creux, la forme d'un corps, le coussin
  r(c, 6, 5, 4, 11, '#1f5f66'); r(c, 6, 5, 4, 3, '#2f8f8b');
  r(c, 7, 6, 2, 2, '#4fb5ad');
  // le couvercle de verre, relevé vers l'arrière
  r(c, 4, 0, 8, 3, AZ.glassDark); r(c, 5, 0, 6, 2, AZ.glass); r(c, 6, 0, 2, 1, '#ffffff');
  // des tubes sur le côté
  r(c, 13, 6, 2, 1, AZ.metal); r(c, 13, 10, 2, 1, AZ.metal); r(c, 14, 6, 1, 5, AZ.metalDark);
  if (mine) { r(c, 2, 7, 1, 3, AZ.amber); r(c, 7, 3, 2, 1, AZ.amber); }
};
const cuveFoot = (mine: boolean): Painter => (c, v) => {
  azGrass(c, v);
  r(c, 2, 0, 12, 13, AZ.metalDeep);
  r(c, 3, 0, 10, 10, AZ.white); r(c, 4, 0, 1, 10, AZ.stoneLight);
  r(c, 6, 0, 4, 4, '#1f5f66');
  // le pupitre : voyants, numéro, ventilation
  r(c, 3, 10, 10, 4, AZ.metal); r(c, 3, 10, 10, 1, AZ.metalLight);
  r(c, 4, 11, 4, 2, AZ.screen); r(c, 5, 11, 2, 1, mine ? AZ.amber : AZ.screenLine);
  r(c, 9, 11, 1, 1, mine ? AZ.amber : '#3a4b56'); r(c, 11, 11, 1, 1, mine ? AZ.amber : AZ.glow);
  r(c, 9, 12, 3, 1, AZ.metalDark);
  r(c, 5, 6, 6, 2, AZ.whiteShade); r(c, 6, 6, 4, 1, AZ.metal);
  // l'ombre au sol
  r(c, 3, 14, 10, 1, 'rgba(0,0,0,0.25)');
};

// ---------- un terminal holographique (deux cases : l'image flottante, puis le pied) ----------
const holoTop = (frame: number): Painter => (c, v) => {
  azGrass(c, v);
  r(c, 3, 2, 10, 11, 'rgba(95,240,224,0.18)');
  r(c, 3, 2, 10, 1, AZ.glow); r(c, 3, 12, 10, 1, AZ.glow);
  r(c, 3, 2, 1, 11, 'rgba(95,240,224,0.7)'); r(c, 12, 2, 1, 11, 'rgba(95,240,224,0.7)');
  // le texte qui défile, et une ligne de balayage
  r(c, 5, 4, 6, 1, AZ.glow); r(c, 5, 6, 4, 1, 'rgba(95,240,224,0.8)'); r(c, 5, 8, 5, 1, 'rgba(95,240,224,0.8)'); r(c, 5, 10, 3, 1, AZ.amber);
  r(c, 4, 4 + frame * 5, 8, 1, 'rgba(255,255,255,0.35)');
  // le faisceau qui la projette
  r(c, 7, 13, 2, 3, 'rgba(95,240,224,0.35)');
};
const holoBase: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 7, 0, 2, 4, 'rgba(95,240,224,0.35)');
  r(c, 5, 3, 6, 2, AZ.glow); r(c, 6, 3, 4, 1, '#ffffff');
  r(c, 4, 5, 8, 8, AZ.metal); r(c, 4, 5, 8, 1, AZ.metalLight); r(c, 11, 5, 1, 8, AZ.metalDark);
  r(c, 6, 8, 4, 2, AZ.metalDeep); r(c, 7, 8, 1, 1, AZ.glow);
  r(c, 3, 13, 10, 2, AZ.metalDark);
  r(c, 3, 15, 10, 1, 'rgba(0,0,0,0.25)');
};

// ---------- la technologie de la colonie ----------
const pylonTop = (blink: boolean): Painter => (c, v) => {
  azGrass(c, v);
  r(c, 7, 2, 2, 14, AZ.metalDark); r(c, 7, 2, 1, 14, AZ.metalLight);
  for (const y of [5, 9, 13]) { r(c, 4, y, 8, 1, AZ.metal); r(c, 5, y + 1, 6, 1, AZ.glowSoft); }
  r(c, 6, 0, 4, 2, AZ.metal);
  r(c, 7, 0, 2, 1, blink ? AZ.red : '#6a2a2a');
};
const pylonBase: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 3, 6, 10, 8, AZ.metalDark); r(c, 3, 6, 10, 1, AZ.metalLight);
  r(c, 7, 0, 2, 6, AZ.metalDark); r(c, 7, 0, 1, 6, AZ.metalLight);
  r(c, 4, 8, 8, 1, AZ.metalDeep); r(c, 4, 10, 8, 1, AZ.metalDeep);
  r(c, 5, 12, 6, 1, AZ.glow);
  r(c, 2, 14, 12, 1, 'rgba(0,0,0,0.25)');
};
const solarPanel: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 7, 11, 2, 4, AZ.metalDark);
  r(c, 1, 2, 14, 10, AZ.metalDeep);
  for (let x = 2; x < 14; x += 4) for (let y = 3; y < 11; y += 4) r(c, x, y, 3, 3, '#2b4f8a');
  r(c, 2, 3, 3, 1, '#7faeea'); r(c, 6, 3, 3, 1, '#7faeea');
};
const dish: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 7, 9, 2, 6, AZ.metalDark); r(c, 4, 14, 8, 1, AZ.metalDeep);
  r(c, 2, 2, 12, 8, AZ.whiteShade); r(c, 3, 1, 10, 9, AZ.white); r(c, 5, 3, 6, 5, AZ.whiteShade);
  r(c, 7, 5, 2, 2, AZ.metalDark); r(c, 7, 4, 1, 1, AZ.red);
};
const cuveLog = holoBase; // gardé pour les anciennes sauvegardes

// ---------- objets de la ville ----------
const tideBoard = (fixed: boolean): Painter => (c, v) => {
  azStone(c, v);
  r(c, 3, 11, 1, 5, AZ.metalDark); r(c, 12, 11, 1, 5, AZ.metalDark);
  r(c, 1, 1, 14, 11, AZ.metalDark);
  r(c, 2, 2, 12, 9, AZ.screen);
  // la courbe des eaux, et deux horaires
  r(c, 3, 7, 2, 1, AZ.glow); r(c, 5, 6, 2, 1, AZ.glow); r(c, 7, 5, 1, 1, AZ.glow); r(c, 8, 6, 2, 1, AZ.glow); r(c, 10, 7, 2, 1, AZ.glow);
  r(c, 3, 3, 3, 1, fixed ? AZ.amber : AZ.screenLine); r(c, 9, 3, 3, 1, AZ.screenLine);
  r(c, 3, 9, 10, 1, '#1f4a55');
  if (fixed) r(c, 2, 2, 1, 1, AZ.amber);
};
const siren = (on: boolean): Painter => (c, v) => {
  azStone(c, v);
  r(c, 7, 5, 2, 10, AZ.metalDark); r(c, 7, 5, 1, 10, AZ.metalLight);
  r(c, 5, 14, 6, 2, AZ.metalDeep);
  r(c, 4, 1, 8, 4, on ? AZ.red : '#7a3a3a'); r(c, 5, 0, 6, 1, on ? '#ff9a9a' : '#9a5a5a');
  r(c, 5, 2, 2, 1, on ? '#ffd0d0' : '#a87070');
  r(c, 3, 2, 1, 2, AZ.metal); r(c, 12, 2, 1, 2, AZ.metal);
  if (!on) { r(c, 9, 8, 1, 4, AZ.ink); r(c, 10, 12, 2, 1, AZ.ink); r(c, 11, 13, 1, 1, AZ.amber); }
};
const stall: Painter = (c, v) => {
  azStone(c, v);
  r(c, 1, 1, 14, 4, AZ.white);
  for (let x = 1; x < 15; x += 4) r(c, x, 1, 2, 4, AZ.teal);
  r(c, 1, 5, 14, 1, AZ.glow);
  r(c, 2, 7, 12, 7, AZ.metal); r(c, 2, 7, 12, 1, AZ.metalLight); r(c, 2, 13, 12, 1, AZ.metalDark);
  // des fruits d'ici : orange, violets, et un qui luit
  const fruit: [number, number, string][] = [[3, 9, '#ff9a3c'], [6, 9, '#ff9a3c'], [9, 9, AZ.violet], [12, 9, AZ.violet], [4, 11, AZ.glow], [8, 11, '#ffe066'], [11, 11, AZ.pink]];
  for (const [x, y, col] of fruit) { r(c, x, y, 2, 2, col); r(c, x, y, 1, 1, '#ffffff'); }
};
const townSign: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 5, 12, 6, 3, AZ.metalDark); r(c, 5, 12, 6, 1, AZ.metalLight); r(c, 7, 11, 2, 1, AZ.glow);
  // le nom de la ville, en lettres de lumière qui flottent
  r(c, 1, 2, 14, 8, 'rgba(95,240,224,0.2)');
  r(c, 1, 2, 14, 1, AZ.glow); r(c, 1, 9, 14, 1, AZ.glow);
  r(c, 3, 4, 10, 1, AZ.glow); r(c, 4, 6, 8, 1, 'rgba(95,240,224,0.8)');
  r(c, 7, 10, 2, 1, 'rgba(95,240,224,0.4)');
};
const pathSign: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 7, 7, 2, 8, AZ.metalDark); r(c, 7, 7, 1, 8, AZ.metalLight);
  r(c, 2, 2, 11, 5, AZ.metalDeep); r(c, 13, 3, 1, 3, AZ.metalDeep); r(c, 14, 4, 1, 1, AZ.metalDeep);
  r(c, 3, 4, 8, 1, AZ.glow); r(c, 11, 4, 2, 1, AZ.glow);
};
const lamp: Painter = (c, v) => {
  azStone(c, v);
  r(c, 7, 5, 2, 10, AZ.metalDark); r(c, 7, 5, 1, 10, AZ.metalLight);
  r(c, 6, 14, 4, 2, AZ.metalDeep);
  // un globe qui flotte au-dessus du mât
  r(c, 5, 0, 6, 4, 'rgba(95,240,224,0.35)'); r(c, 6, 1, 4, 2, AZ.glow); r(c, 7, 1, 1, 1, '#ffffff');
};
const bench: Painter = (c, v) => {
  azStone(c, v);
  r(c, 1, 5, 14, 4, AZ.white); r(c, 1, 5, 14, 1, AZ.stoneLight); r(c, 1, 8, 14, 1, AZ.whiteShade);
  r(c, 2, 9, 2, 4, AZ.metalDark); r(c, 12, 9, 2, 4, AZ.metalDark);
  r(c, 3, 7, 10, 1, AZ.glow);
};
const flowerBox: Painter = (c, v) => {
  azStone(c, v);
  r(c, 1, 8, 14, 6, AZ.whiteDeep); r(c, 2, 8, 12, 1, AZ.white); r(c, 2, 13, 12, 1, AZ.metalDark);
  for (const [x, col] of [[2, AZ.glow], [5, AZ.violetSoft], [8, AZ.pink], [11, '#fff0a0']] as [number, string][]) {
    r(c, x + 1, 4, 1, 4, AZ.leafDark); r(c, x, 3, 3, 1, col); r(c, x + 1, 2, 1, 3, col);
  }
};
const waterPost: Painter = (c, v) => {
  waterFrame(v % 2, false)(c, v);
  // une jauge : des segments lumineux, du bas vers le haut
  r(c, 6, 0, 4, 14, AZ.metalDark); r(c, 6, 0, 1, 14, AZ.metalLight);
  for (let y = 1; y < 13; y += 2) r(c, 7, y, 2, 1, y > 8 ? AZ.glow : y > 4 ? AZ.amber : AZ.red);
  r(c, 5, 13, 6, 2, 'rgba(255,255,255,0.5)');
};
const fountain = (frame: number): Painter => (c, v) => {
  azStone(c, v);
  // un bassin rond, un jet d'eau, et des lumières au fond
  r(c, 4, 1, 8, 14, AZ.whiteDeep); r(c, 2, 3, 12, 10, AZ.whiteDeep); r(c, 1, 5, 14, 6, AZ.whiteDeep);
  r(c, 4, 2, 8, 12, AZ.white); r(c, 3, 3, 10, 10, AZ.white); r(c, 2, 5, 12, 6, AZ.white);
  r(c, 5, 4, 6, 8, AZ.waterDeep); r(c, 4, 5, 8, 6, AZ.waterDeep); r(c, 4, 5, 8, 2, AZ.water); r(c, 5, 4, 6, 2, AZ.water);
  r(c, 7, 6, 2, 3, AZ.metal);
  r(c, 7, 2 + frame, 2, 5, AZ.waterLight); r(c, 7, 1 + frame, 2, 1, '#ffffff');
  r(c, 5 - frame, 5, 1, 1, AZ.foam); r(c, 10 + frame, 5, 1, 1, AZ.foam);
  r(c, 5, 10, 1, 1, AZ.glow); r(c, 10, 9, 1, 1, AZ.glow); r(c, 8 - frame, 11, 1, 1, AZ.glow);
};

// ---------- intérieur ----------
const workbench: Painter = (c) => {
  azFloor(c, 0);
  r(c, 0, 3, T, 9, AZ.metalDark); r(c, 0, 3, T, 2, AZ.metalLight);
  r(c, 2, 6, 5, 3, AZ.screen); r(c, 3, 7, 3, 1, AZ.screenLine);
  r(c, 9, 6, 1, 4, AZ.metalLight); r(c, 11, 7, 3, 1, AZ.metalLight); r(c, 12, 5, 1, 2, AZ.red);
  r(c, 1, 12, 2, 4, AZ.metalDeep); r(c, 13, 12, 2, 4, AZ.metalDeep);
};
const robotParts: Painter = (c) => {
  azFloor(c, 0);
  // des pièces de robot en cours d'assemblage : une tête ronde, des pattes, un œil éteint
  r(c, 2, 4, 12, 9, AZ.metalDark); r(c, 2, 4, 12, 1, AZ.metalLight);
  r(c, 3, 6, 5, 4, '#9aa6b6'); r(c, 4, 5, 3, 1, '#9aa6b6'); r(c, 6, 7, 1, 1, '#3a4b56');
  r(c, 9, 6, 1, 5, '#9aa6b6'); r(c, 11, 6, 1, 5, '#9aa6b6'); r(c, 9, 10, 2, 1, '#6a7686'); r(c, 11, 10, 2, 1, '#6a7686');
  r(c, 13, 5, 1, 1, AZ.glow);
};
const shelfAz: Painter = (c) => {
  azWallFront(c, 0);
  r(c, 1, 5, 14, 1, AZ.metalDark); r(c, 1, 10, 14, 1, AZ.metalDark);
  r(c, 2, 2, 3, 3, AZ.metal); r(c, 7, 3, 2, 2, AZ.amber); r(c, 11, 2, 3, 3, AZ.teal);
  r(c, 3, 7, 4, 3, '#9aa6b6'); r(c, 9, 7, 2, 3, AZ.red); r(c, 12, 8, 2, 2, AZ.glow);
};
const drawingPixel: Painter = (c) => {
  azWallFront(c, 0);
  r(c, 2, 3, 12, 10, AZ.paper);
  r(c, 2, 3, 12, 1, '#e8dcc0');
  r(c, 5, 7, 6, 3, '#8f99a8'); r(c, 9, 5, 3, 3, '#8f99a8'); r(c, 10, 6, 1, 1, '#3fb6ff');
  r(c, 5, 10, 1, 2, '#8f99a8'); r(c, 9, 10, 1, 2, '#8f99a8'); r(c, 4, 6, 1, 2, '#8f99a8');
  r(c, 3, 4, 2, 2, '#ff9a3c');
  r(c, 4, 12, 7, 1, AZ.red);
};
const bedAz: Painter = (c) => {
  azFloor(c, 0);
  r(c, 1, 1, 14, 14, AZ.metalDark);
  r(c, 2, 2, 12, 12, '#e8eef0');
  r(c, 3, 3, 10, 3, AZ.white);
  r(c, 2, 7, 12, 7, AZ.teal); r(c, 2, 7, 12, 1, AZ.tealLight);
};
const azFence: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 0, 7, T, 2, AZ.metal); r(c, 0, 7, T, 1, AZ.metalLight); r(c, 0, 11, T, 1, AZ.metalDark);
  r(c, 2, 4, 2, 10, AZ.metalDark); r(c, 12, 4, 2, 10, AZ.metalDark);
  r(c, 2, 4, 2, 1, AZ.glow); r(c, 12, 4, 2, 1, AZ.glow);
};

const PAINTERS: Record<string, Painter> = {
    slab, azGrass, azFlowers, azTall, azPath, azStone, azDeck, azFloor, regolith, crater, metalFloor,
    bigCrater0: bigCrater(0), bigCrater1: bigCrater(1), bigCrater2: bigCrater(2), bigCrater3: bigCrater(3),
    crystals0: crystals(0), crystals1: crystals(1), conduitH: conduit(false), conduitV: conduit(true),
    azWater0: waterFrame(0, false), azWater1: waterFrame(1, false), azShore0: waterFrame(0, true), azShore1: waterFrame(1, true),
    azRockTop, azRockFace, azTree, azBush, azForest, azBridgeH: bridge(false), azBridgeV: bridge(true),
    aurTop, aurFront, aurDoor, aurDoorClosed, azWallTop, azWallFront,
    cuveHead: cuveHead(false), cuveFoot: cuveFoot(false), cuveHeadMine: cuveHead(true), cuveFootMine: cuveFoot(true),
    holoTop0: holoTop(0), holoTop1: holoTop(1), holoBase, cuveLog,
    pylonTop0: pylonTop(false), pylonTop1: pylonTop(true), pylonBase, solarPanel, dish,
    tideBoard: tideBoard(false), tideBoardWet: tideBoard(true),
    sirenOn: siren(true), sirenOff: siren(false), stall, townSign, pathSign, lampAz: lamp, bench, flowerBox, waterPost,
    fountain0: fountain(0), fountain1: fountain(1),
    workbench, robotParts, shelfAz, drawingPixel, bedAz, azFence,
};
registerTiles(PAINTERS, ['azGrass', 'azPath', 'azStone', 'azFloor', 'regolith', 'metalFloor']);

// ---------- lisières : l'herbe déborde, irrégulière, sur le sol voisin ----------
// Masque : 1 nord, 2 est, 4 sud, 8 ouest, 16 nord-est, 32 sud-est, 64 sud-ouest, 128 nord-ouest.
const N = 1, E = 2, S = 4, W = 8, NE = 16, SE = 32, SW = 64, NW = 128;
const made = new Set<string>();

/** La profondeur de l'herbe le long d'un bord : entre 1 et 6 pixels, en vagues irrégulières. */
function depth(i: number, seed: number) {
  const a = Math.sin(i * 0.9 + seed * 1.7) * 1.6 + Math.sin(i * 2.3 + seed * 3.1) * 0.9;
  return Math.max(1, Math.min(6, Math.round(3 + a)));
}

function fringe(c: CanvasRenderingContext2D, mask: number, seed: number) {
  const px = (x: number, y: number, col: string) => r(c, x, y, 1, 1, col);
  // la couche d'herbe, puis un liseré plus sombre sur son bord
  const grassAt = new Set<number>();
  const fill = (x: number, y: number) => grassAt.add(y * T + x);
  for (let i = 0; i < T; i++) {
    if (mask & N) for (let k = 0; k < depth(i, seed); k++) fill(i, k);
    if (mask & S) for (let k = 0; k < depth(i, seed + 5); k++) fill(i, T - 1 - k);
    if (mask & W) for (let k = 0; k < depth(i, seed + 9); k++) fill(k, i);
    if (mask & E) for (let k = 0; k < depth(i, seed + 13); k++) fill(T - 1 - k, i);
  }
  const corner = (cx: number, cy: number, s2: number) => {
    const rad = 3 + (s2 % 3);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) fill(x, y);
  };
  if (mask & NE && !(mask & (N | E))) corner(T - 1, 0, seed);
  if (mask & SE && !(mask & (S | E))) corner(T - 1, T - 1, seed + 1);
  if (mask & SW && !(mask & (S | W))) corner(0, T - 1, seed + 2);
  if (mask & NW && !(mask & (N | W))) corner(0, 0, seed + 3);
  const rand = rng(900 + seed * 7 + mask);
  for (const k of grassAt) {
    const x = k % T, y = Math.floor(k / T);
    const roll = rand();
    px(x, y, roll < 0.18 ? AZ.grassDark : roll < 0.28 ? AZ.grassLight : AZ.grass);
  }
  // le bord : un pixel sombre là où l'herbe s'arrête, et quelques brins qui dépassent
  for (const k of grassAt) {
    const x = k % T, y = Math.floor(k / T);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= T || ny >= T || grassAt.has(ny * T + nx)) continue;
      px(nx, ny, 'rgba(26,60,40,0.55)');
      if (rand() < 0.12) px(nx, ny, AZ.grassLight);
    }
  }
}

/**
 * Le nom d'une tuile avec ses lisières d'herbe, et éventuellement un élément posé par-dessus
 * (une barrière, une montagne) ; la tuile est dessinée la première fois qu'on la demande.
 */
export function withFringe(base: string, mask: number, top = ''): string {
  if (!mask && !top) return base;
  const name = `${base}~${mask}${top ? '+' + top : ''}`;
  if (!made.has(name)) {
    made.add(name);
    const painter = PAINTERS[base];
    const over = top ? OVERLAYS[top] : null;
    registerTiles({
      [name]: (c, v) => {
        painter(c, v);
        if (mask) fringe(c, mask, v * 4 + (mask % 7));
        over?.(c, v);
      },
    });
  }
  return name;
}

// ---------- ce qui ferme la zone jouable : barrières et montagnes ----------
/** Une barrière d'énergie : des bornes blanches et des faisceaux turquoise entre elles. */
const fencePost = (c: CanvasRenderingContext2D, x: number) => {
  r(c, x, 3, 3, 12, AZ.metalDark); r(c, x, 3, 1, 12, AZ.metalLight);
  r(c, x - 1, 13, 5, 3, AZ.metalDeep);
  r(c, x, 1, 3, 2, AZ.white); r(c, x + 1, 2, 1, 1, AZ.glow);
};
const fenceH: Painter = (c) => {
  r(c, 0, 13, T, 2, 'rgba(0,0,0,0.18)');
  for (const y of [5, 9]) { r(c, 0, y, T, 1, AZ.glow); r(c, 0, y - 1, T, 1, 'rgba(95,240,224,0.35)'); r(c, 0, y + 1, T, 1, 'rgba(95,240,224,0.35)'); }
  fencePost(c, 6);
};
const fenceV: Painter = (c) => {
  r(c, 9, 0, 3, T, 'rgba(0,0,0,0.15)');
  r(c, 7, 0, 1, T, AZ.glow); r(c, 6, 0, 1, T, 'rgba(95,240,224,0.35)'); r(c, 8, 0, 1, T, 'rgba(95,240,224,0.35)');
  fencePost(c, 6);
};
const fenceP: Painter = (c) => {
  r(c, 3, 13, 10, 2, 'rgba(0,0,0,0.18)');
  fencePost(c, 6);
  r(c, 5, 0, 5, 2, 'rgba(95,240,224,0.4)');
};
/** Une montagne : des pics violets, éclairés par la gauche, quelques reflets de cristal. */
const mountainPeak: Painter = (c, v) => {
  const peak = (cx: number, top: number, half: number) => {
    for (let y = top; y < T; y++) {
      const w = Math.round(((y - top) / (T - top)) * half);
      r(c, cx - w, y, w, 1, '#a99cc4');
      r(c, cx, y, w + 1, 1, '#6c5f8a');
      if (y < top + 3) { r(c, cx - w, y, w * 2 + 1, 1, '#e8eef8'); }
    }
  };
  if (v === 0) { peak(5, 2, 6); peak(11, 5, 6); }
  else if (v === 1) { peak(8, 0, 8); }
  else { peak(4, 6, 5); peak(10, 1, 7); }
  r(c, 7 + v, 11, 1, 1, AZ.glow);
};
const mountainBody: Painter = (c, v) => {
  r(c, 0, 0, T, T, '#7d7098');
  for (let i = 0; i < 4; i++) r(c, (i * 5 + v * 3) % 14, 2 + i * 3, 4, 1, '#9b8eb8');
  for (let i = 0; i < 3; i++) r(c, (i * 6 + v * 5 + 3) % 14, 4 + i * 4, 3, 1, '#5d5178');
  if (v === 2) r(c, 9, 7, 1, 2, AZ.glow);
};
const OVERLAYS: Record<string, Painter> = { fenceH, fenceV, fenceP, mountainPeak, mountainBody };
export const _keep = OVERLAYS;
export const MASK = { N, E, S, W, NE, SE, SW, NW };

registerIcons({
  fruit: (c) => {
    r(c, 4, 5, 8, 8, '#ff9a3c'); r(c, 3, 7, 10, 4, '#ff9a3c'); r(c, 5, 6, 2, 2, '#ffd8a8');
    r(c, 7, 2, 2, 3, AZ.leafDark); r(c, 9, 2, 3, 2, AZ.leaf); r(c, 9, 9, 1, 1, AZ.glow);
  },
});

// ---------- au-delà des bords : la planète sauvage ----------
// Des tuiles qu'on ne peut pas atteindre, mais qui racontent qu'Azura est vaste et vivante.
const disc = (c: CanvasRenderingContext2D, cx: number, cy: number, rad: number, col: string) => {
  for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
    for (let x = Math.floor(cx - rad); x <= cx + rad; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) r(c, x, y, 1, 1, col);
};

const CANOPY: [string, string, string][] = [
  ['#2f9e8a', '#1f6f66', '#62d0b4'],
  ['#2f8fae', '#1e5f7a', '#6cc6e8'],
  ['#3a9a52', '#25693a', '#78cf7a'],
  ['#6a5aa8', '#463a7a', '#a796e0'],
];
/** Des cimes d'arbres serrées, vues d'en haut. */
const canopy = (pal: number, glow: number): Painter => (c, v) => {
  const [mid, dark, light] = CANOPY[pal];
  r(c, 0, 0, T, T, '#123a3e');
  const rand = rng(1300 + pal * 97 + v * 31);
  for (let i = 0; i < 4; i++) {
    const cx = 2 + rand() * 12, cy = 2 + rand() * 12, rad = 3.5 + rand() * 3.5;
    disc(c, cx + 1, cy + 1.5, rad, dark);
    disc(c, cx, cy, rad, mid);
    disc(c, cx - rad * 0.35, cy - rad * 0.35, rad * 0.45, light);
  }
  if (glow) {
    const g2 = rng(77 + v * 13 + glow);
    for (let i = 0; i < 4; i++) r(c, Math.floor(g2() * 15), Math.floor(g2() * 15), 1, 1, glow === 1 ? AZ.glow : AZ.pink);
  }
};
/** Des champignons géants, chacun seul : petit, moyen, grand ; chapeau rose ou violet. */
const mushroom = (size: number): Painter => (c, v) => {
  const hue = v === 1 ? ['#b45ad0', '#7a3a9a', '#e0a0f0'] : ['#d0607a', '#8a3a50', '#f6a8b8'];
  const rad = [2.6, 3.8, 5.2][size];
  const cx = 8, cy = 8;
  disc(c, cx + 1.5, cy + 2, rad, 'rgba(0,0,0,0.35)');
  r(c, cx - 1, Math.round(cy + rad * 0.4), 2, Math.round(rad * 0.8), '#e8dcc8');
  disc(c, cx, cy, rad, hue[1]);
  disc(c, cx - 0.3, cy - 0.5, rad * 0.9, hue[0]);
  disc(c, cx - rad * 0.35, cy - rad * 0.4, rad * 0.35, hue[2]);
  r(c, Math.round(cx + rad * 0.3), Math.round(cy - rad * 0.2), 1, 1, '#fff0f6');
  if (size > 0) r(c, Math.round(cx - rad * 0.2), Math.round(cy + rad * 0.3), 1, 1, '#fff0f6');
  if (size === 2) r(c, cx + 1, cy + 2, 1, 1, AZ.glow);
};
const boulders: Painter = (c, v) => {
  regolith(c, v);
  const rock = (cx: number, cy: number, rad: number) => {
    disc(c, cx + 1, cy + 1.5, rad, 'rgba(20,10,40,0.35)');
    disc(c, cx, cy, rad, '#7a6c96');
    disc(c, cx - rad * 0.3, cy - rad * 0.3, rad * 0.55, '#a497c0');
    r(c, Math.round(cx - rad * 0.4), Math.round(cy - rad * 0.5), 1, 1, '#d8d0ea');
  };
  rock(5, 6, 4);
  if (v !== 1) rock(11, 10, 3);
  if (v === 2) rock(3, 12, 2);
};
const spire = (frame: number): Painter => (c, v) => {
  regolith(c, v);
  // une flèche de cristal, haute, avec son halo
  disc(c, 8, 9, 7, frame ? 'rgba(95,240,224,0.22)' : 'rgba(95,240,224,0.12)');
  for (let y = 1; y < 14; y++) {
    const w = y < 7 ? Math.ceil(y / 2) : Math.ceil((14 - y) / 2) + 1;
    r(c, 8 - w, y, w * 2, 1, y < 8 ? '#7fe8f8' : '#3fb6c8');
    r(c, 8 - w, y, 1, 1, '#ffffff');
  }
  r(c, 8, 2, 1, 11, '#c8fbff');
  if (frame) { r(c, 5, 4, 1, 1, '#ffffff'); r(c, 11, 9, 1, 1, '#ffffff'); }
};
const geyser = (frame: number): Painter => (c, v) => {
  regolith(c, v);
  // un évent bordé de croûtes minérales, et sa vapeur
  disc(c, 8, 10, 5, '#d9c08a');
  disc(c, 8, 10, 4, '#b08a5a');
  disc(c, 8, 10, 2.5, '#3a2f4a');
  r(c, 5, 8, 1, 1, '#fff6d8'); r(c, 11, 12, 1, 1, '#fff6d8');
  const puff = [[8, 6, 2.5], [7, 4, 3.5], [9, 2, 4.5]][frame];
  disc(c, puff[0], puff[1], puff[2], 'rgba(240,250,255,0.55)');
  disc(c, puff[0] - 1, puff[1] - 1, puff[2] * 0.6, 'rgba(255,255,255,0.6)');
};
const fossil: Painter = (c, v) => {
  regolith(c, v);
  // les côtes d'une bête immense, à moitié enfouies
  const bone = '#efe6d2', shade = '#b9ad94';
  r(c, 1, 8, 14, 2, shade); r(c, 1, 7, 14, 2, bone);
  for (const x of [3, 7, 11]) {
    r(c, x, 2, 2, 5, bone); r(c, x - 1, 1, 2, 2, bone); r(c, x + 1, 2, 1, 5, shade);
    r(c, x, 10, 2, 4, bone); r(c, x - 1, 13, 2, 2, bone); r(c, x + 1, 10, 1, 4, shade);
  }
  if (v === 1) r(c, 13, 3, 2, 2, AZ.glow);
};
const probe = (frame: number): Painter => (c, v) => {
  regolith(c, v);
  // une sonde d'Aurore, tombée là il y a longtemps : une coque, une aile solaire, une trace brûlée
  r(c, 1, 9, 14, 5, 'rgba(30,20,30,0.35)');
  r(c, 4, 5, 7, 6, AZ.white); r(c, 4, 5, 7, 1, AZ.stoneLight); r(c, 10, 5, 1, 6, AZ.whiteDeep);
  r(c, 5, 7, 3, 2, AZ.tealDark); r(c, 6, 7, 1, 1, AZ.tealLight);
  r(c, 11, 3, 4, 5, '#2b4f8a'); r(c, 12, 4, 1, 3, '#6f9fe0'); r(c, 10, 6, 1, 1, AZ.metal);
  r(c, 1, 10, 3, 1, AZ.metal); r(c, 2, 11, 2, 1, AZ.metalDark);
  r(c, 7, 4, 1, 1, frame ? AZ.red : '#5a2a2a');
};
const farWater: Painter = (c, v) => {
  waterFrame(v % 2, false)(c, v);
  r(c, 0, 0, T, T, 'rgba(10,40,60,0.15)');
};

const WILD: Record<string, Painter> = {
  canopy0: canopy(0, 0), canopy1: canopy(1, 0), canopy2: canopy(2, 0), canopy3: canopy(3, 0),
  canopyGlow0: canopy(0, 1), canopyGlow1: canopy(1, 2),
  mushroom0: mushroom(0), mushroom1: mushroom(1), mushroom2: mushroom(2), boulders, spire0: spire(0), spire1: spire(1), geyser0: geyser(0), geyser1: geyser(1), geyser2: geyser(2),
  fossil, probe0: probe(0), probe1: probe(1), farWater,
};
registerTiles(WILD);
Object.assign(PAINTERS, WILD); // pour pouvoir leur ajouter des lisières
