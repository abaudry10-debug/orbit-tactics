// Les tuiles d'Azura : un monde vert, turquoise et blanc, tout l'inverse de Vesper.
import { T, paint, registerIcons, registerTiles, type Painter } from '../../engine/sprites.js';

const { r, rng, speckle } = paint;

export const AZ = {
  ink: '#14101c',
  grass: '#5fae4e', grassDark: '#448f3e', grassLight: '#86cc63', grassDeep: '#357a34',
  flowerY: '#ffe066', flowerW: '#fff6e0', flowerP: '#f39ac6', flowerB: '#8fc4ff',
  path: '#dccb9e', pathDark: '#c2ad7e', pathLight: '#ece0bc',
  stone: '#dfe4e2', stoneDark: '#b9c2c0', stoneLight: '#f2f5f3',
  water: '#2ec4bd', waterDeep: '#1aa2a3', waterLight: '#82efe3', foam: '#eafffb',
  rock: '#cfc6b2', rockDark: '#a59a84', rockDeep: '#7f7562', moss: '#7fb85a',
  wood: '#a5764a', woodDark: '#77522f', woodLight: '#c89664', rope: '#e3cf9a',
  white: '#f3f7f6', whiteShade: '#d3dcdb', whiteDeep: '#aebcbb', teal: '#2a9d9a', tealDark: '#1d6f70', tealLight: '#5fd0c6',
  leaf: '#3f9e48', leafDark: '#2b7436', leafLight: '#72c865', trunk: '#7a5534', trunkDark: '#57391f',
  glass: '#bff3f6', glassDark: '#7fd4dc', red: '#e0574f', paper: '#fbf3df', sun: '#ffd45e',
};

// ---------- sols ----------
const azGrass: Painter = (c, v) => {
  speckle(c, 201 + v * 17, AZ.grass, [[AZ.grassDark, 16], [AZ.grassLight, 10]]);
  const blade = (x: number, y: number) => { r(c, x, y, 1, 2, AZ.grassDark); r(c, x + 1, y - 1, 1, 3, AZ.grassLight); r(c, x + 2, y, 1, 2, AZ.grassDark); };
  blade(3, 4); blade(10, 10); if (v !== 1) blade(7, 13);
};
const azFlowers: Painter = (c, v) => {
  azGrass(c, v);
  const rand = rng(331 + v * 23);
  const cols = [AZ.flowerY, AZ.flowerW, AZ.flowerP, AZ.flowerB];
  for (let i = 0; i < 5; i++) {
    const x = 1 + Math.floor(rand() * 13), y = 1 + Math.floor(rand() * 13);
    const col = cols[Math.floor(rand() * cols.length)];
    r(c, x, y, 2, 2, col);
    r(c, x, y + 2, 1, 1, AZ.grassDeep);
  }
};
const azTall: Painter = (c, v) => {
  azGrass(c, v);
  for (const x of [1, 4, 7, 10, 13]) {
    const h = 6 + ((x * 7 + v * 3) % 4);
    r(c, x, 15 - h, 1, h, AZ.grassDeep);
    r(c, x + 1, 14 - h, 1, h, AZ.grassLight);
  }
};
const azPath: Painter = (c, v) => {
  speckle(c, 241 + v * 11, AZ.path, [[AZ.pathDark, 14], [AZ.pathLight, 8]]);
  if (v === 1) { r(c, 4, 6, 2, 2, AZ.pathDark); r(c, 11, 11, 2, 1, AZ.pathDark); }
};
const azStone: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.stone);
  const off = v === 1 ? 4 : 0;
  r(c, 0, 7, T, 1, AZ.stoneDark); r(c, 0, 15, T, 1, AZ.stoneDark);
  r(c, (7 + off) % T, 0, 1, 7, AZ.stoneDark); r(c, (3 + off) % T, 8, 1, 7, AZ.stoneDark);
  r(c, 1, 1, 4, 1, AZ.stoneLight); r(c, 9, 9, 4, 1, AZ.stoneLight);
};
const azDeck: Painter = (c) => {
  r(c, 0, 0, T, T, AZ.wood);
  for (const y of [0, 4, 8, 12]) { r(c, 0, y, T, 1, AZ.woodDark); r(c, 0, y + 1, T, 1, AZ.woodLight); }
  r(c, 5, 2, 1, 1, AZ.woodDark); r(c, 11, 6, 1, 1, AZ.woodDark); r(c, 3, 10, 1, 1, AZ.woodDark); r(c, 12, 14, 1, 1, AZ.woodDark);
};
const azFloor: Painter = (c) => {
  r(c, 0, 0, T, T, '#d9b98c');
  for (const x of [0, 5, 10, 15]) r(c, x, 0, 1, T, '#c49f70');
  r(c, 2, 3, 2, 1, '#e6caa0'); r(c, 12, 10, 2, 1, '#e6caa0');
};

// ---------- eau ----------
const waterFrame = (frame: number, shore: boolean): Painter => (c, v) => {
  r(c, 0, 0, T, T, AZ.water);
  r(c, 0, 9, T, 7, AZ.waterDeep);
  const rand = rng(97 + v * 13);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(rand() * 12), y = 2 + Math.floor(rand() * 12);
    const dx = frame ? 2 : 0;
    r(c, (x + dx) % 13, y, 3, 1, AZ.waterLight);
  }
  // un éclat de soleil qui clignote
  if ((frame + v) % 2 === 0) r(c, 3 + v * 4, 5, 1, 1, AZ.foam);
  if (shore) {
    r(c, 0, 0, T, 2, AZ.grassDark);
    r(c, 0, 2, T, 1, AZ.foam);
    for (let x = frame; x < T; x += 3) r(c, x, 3, 1, 1, AZ.foam);
  }
};

// ---------- falaises et rochers ----------
const azRockTop: Painter = (c, v) => {
  speckle(c, 271 + v * 7, AZ.rock, [[AZ.rockDark, 10], ['#ddd5c2', 8]]);
  r(c, 0, 0, T, 2, AZ.moss);
  r(c, 3, 2, 3, 1, AZ.moss); r(c, 10, 2, 2, 1, AZ.moss);
};
const azRockFace: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.rockDark);
  for (const x of [2, 6, 11]) r(c, x + (v % 2), 0, 1, T - 3, AZ.rockDeep);
  r(c, 0, 0, T, 2, AZ.rock);
  r(c, 4, 4, 2, 3, AZ.rock); r(c, 9, 7, 2, 2, AZ.rock);
  r(c, 0, T - 3, T, 3, AZ.rockDeep);
};

// ---------- végétation (peinte sur l'herbe : les ombres suivent leur forme) ----------
const azTree: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 7, 11, 2, 4, AZ.trunk); r(c, 8, 11, 1, 4, AZ.trunkDark);
  r(c, 2, 2, 12, 9, AZ.leaf); r(c, 3, 1, 10, 11, AZ.leaf); r(c, 1, 4, 14, 5, AZ.leaf);
  r(c, 3, 2, 5, 3, AZ.leafLight); r(c, 2, 4, 3, 2, AZ.leafLight); r(c, 9, 3, 2, 1, AZ.leafLight);
  r(c, 4, 9, 8, 2, AZ.leafDark); r(c, 11, 5, 3, 4, AZ.leafDark);
  if (v === 2) { r(c, 5, 6, 1, 1, AZ.flowerP); r(c, 10, 4, 1, 1, AZ.flowerP); r(c, 7, 8, 1, 1, AZ.flowerP); }
};
const azBush: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 3, 6, 10, 7, AZ.leaf); r(c, 2, 8, 12, 4, AZ.leaf);
  r(c, 4, 6, 4, 2, AZ.leafLight); r(c, 3, 11, 10, 2, AZ.leafDark);
  if (v === 1) { r(c, 6, 9, 1, 1, AZ.red); r(c, 9, 8, 1, 1, AZ.red); }
};
const azForest: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.leafDark);
  const rand = rng(401 + v * 31);
  for (let i = 0; i < 6; i++) r(c, Math.floor(rand() * 13), Math.floor(rand() * 13), 4, 3, i % 2 ? AZ.leaf : '#24622f');
  r(c, 2 + v * 3, 3, 3, 2, AZ.leafLight);
};

// ---------- ponts suspendus ----------
const bridge = (vertical: boolean): Painter => (c) => {
  waterFrame(0, false)(c, 0);
  const R = (x: number, y: number, w: number, h: number, col: string) => (vertical ? r(c, y, x, h, w, col) : r(c, x, y, w, h, col));
  // les planches, puis les cordes de chaque côté
  R(0, 3, T, 10, AZ.wood);
  for (let i = 0; i < T; i += 3) R(i, 3, 1, 10, AZ.woodDark);
  R(0, 3, T, 1, AZ.woodLight);
  R(0, 1, T, 1, AZ.rope); R(0, 14, T, 1, AZ.rope);
  R(0, 2, T, 1, 'rgba(0,0,0,0.15)');
  R(2, 0, 1, 3, AZ.woodDark); R(10, 13, 1, 3, AZ.woodDark);
};

// ---------- bâtiments d'Aurore ----------
const aurTop: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.white);
  r(c, 0, 0, T, 1, AZ.stoneLight);
  r(c, 0, 15, T, 1, AZ.whiteShade);
  r(c, 7, 0, 1, T, '#e4ebea');
  if (v === 1) { r(c, 3, 4, 8, 6, AZ.tealDark); for (let x = 4; x < 11; x += 2) r(c, x, 4, 1, 6, AZ.teal); r(c, 3, 4, 8, 1, AZ.tealLight); }
};
const aurFront: Painter = (c, v) => {
  r(c, 0, 0, T, T, AZ.white);
  r(c, 0, 0, T, 2, AZ.teal);
  r(c, 0, 2, T, 1, AZ.tealDark);
  r(c, 0, 13, T, 3, AZ.whiteDeep);
  r(c, 0, 12, T, 1, AZ.whiteShade);
  if (v !== 2) {
    // un hublot rond
    r(c, 5, 5, 6, 5, AZ.tealDark); r(c, 4, 6, 8, 3, AZ.tealDark);
    r(c, 5, 6, 6, 3, AZ.glass); r(c, 6, 5, 4, 5, AZ.glass);
    r(c, 6, 6, 2, 1, '#ffffff');
  }
};
const aurDoor: Painter = (c) => {
  aurFront(c, 2);
  r(c, 4, 3, 8, 13, AZ.tealDark);
  r(c, 5, 4, 6, 12, AZ.teal);
  r(c, 7, 4, 2, 12, AZ.tealLight);
  r(c, 10, 9, 1, 2, AZ.white);
};
const aurDoorClosed: Painter = (c) => {
  aurDoor(c, 0);
  r(c, 5, 8, 6, 2, AZ.red);
};
const azWallTop: Painter = (c) => {
  r(c, 0, 0, T, T, '#e9efee');
  r(c, 0, 15, T, 1, AZ.whiteShade);
};
const azWallFront: Painter = (c) => {
  r(c, 0, 0, T, T, '#cfe3df');
  r(c, 0, 0, T, 2, AZ.teal);
  r(c, 0, 13, T, 3, '#a9c6c1');
};

// ---------- objets ----------
const cuve = (mine: boolean): Painter => (c, v) => {
  azGrass(c, v);
  // l'ombre portée au sol
  r(c, 4, 14, 9, 1, 'rgba(0,0,0,0.18)');
  // la coque blanche, arrondie aux deux bouts
  r(c, 5, 1, 6, 14, AZ.whiteDeep);
  r(c, 4, 2, 8, 12, AZ.whiteDeep);
  r(c, 5, 1, 6, 13, AZ.white);
  r(c, 4, 2, 8, 11, AZ.white);
  r(c, 5, 2, 1, 10, AZ.stoneLight);
  // le creux, où l'on était allongé
  r(c, 6, 3, 4, 9, AZ.tealDark);
  r(c, 6, 4, 4, 7, '#2f8f8b');
  r(c, 7, 3, 2, 2, '#3aa7a2');
  // le couvercle de verre, rabattu sur le côté
  r(c, 12, 3, 2, 10, AZ.glassDark);
  r(c, 12, 4, 1, 8, AZ.glass);
  r(c, 13, 5, 1, 2, '#ffffff');
  // un témoin lumineux
  r(c, 7, 13, 2, 1, mine ? AZ.sun : AZ.whiteShade);
  if (mine) r(c, 3, 6, 1, 3, AZ.sun);
};
const cuveLog: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 7, 9, 2, 6, AZ.whiteDeep);
  r(c, 3, 2, 10, 8, AZ.white);
  r(c, 4, 3, 8, 5, '#123a40');
  r(c, 5, 4, 5, 1, AZ.tealLight); r(c, 5, 6, 3, 1, AZ.tealLight);
};
const tideBoard = (wet: boolean): Painter => (c, v) => {
  azStone(c, v);
  r(c, 3, 9, 1, 7, AZ.woodDark); r(c, 12, 9, 1, 7, AZ.woodDark);
  r(c, 1, 1, 14, 10, AZ.woodDark);
  r(c, 2, 2, 12, 8, AZ.paper);
  // une vague, et deux horaires
  r(c, 3, 4, 2, 1, AZ.teal); r(c, 5, 3, 2, 1, AZ.teal); r(c, 7, 4, 2, 1, AZ.teal);
  r(c, 10, 3, 3, 1, AZ.ink); r(c, 10, 5, 3, 1, AZ.ink);
  r(c, 3, 7, 10, 1, AZ.ink);
  if (wet) { r(c, 10, 3, 3, 1, AZ.red); r(c, 11, 4, 1, 2, AZ.red); r(c, 12, 4, 1, 1, AZ.red); }
};
const siren = (on: boolean): Painter => (c, v) => {
  azStone(c, v);
  r(c, 7, 4, 2, 12, AZ.whiteDeep); r(c, 7, 4, 1, 12, AZ.white);
  r(c, 4, 1, 8, 4, AZ.red); r(c, 5, 1, 6, 1, '#f08a80'); r(c, 3, 2, 1, 2, '#a83b35'); r(c, 12, 2, 1, 2, '#a83b35');
  if (on) r(c, 9, 7, 2, 2, AZ.tealLight);
  else { r(c, 9, 8, 1, 4, AZ.ink); r(c, 10, 12, 2, 1, AZ.ink); r(c, 11, 13, 1, 1, AZ.flowerY); }
};
const stall: Painter = (c, v) => {
  azStone(c, v);
  r(c, 1, 1, 14, 4, AZ.white);
  for (let x = 1; x < 15; x += 4) r(c, x, 1, 2, 4, AZ.teal);
  r(c, 1, 5, 14, 1, AZ.tealDark);
  r(c, 2, 7, 12, 7, AZ.woodDark); r(c, 2, 7, 12, 1, AZ.woodLight);
  const fruit: [number, number, string][] = [[3, 9, '#ff9a3c'], [6, 9, '#ff9a3c'], [9, 9, '#c45ad8'], [12, 9, '#c45ad8'], [4, 11, '#ffe066'], [8, 11, '#ffe066'], [11, 11, '#7ad85a']];
  for (const [x, y, col] of fruit) { r(c, x, y, 2, 2, col); r(c, x, y, 1, 1, '#ffffff'); }
};
const townSign: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 3, 9, 1, 7, AZ.woodDark); r(c, 12, 9, 1, 7, AZ.woodDark);
  r(c, 1, 2, 14, 8, AZ.woodDark); r(c, 2, 3, 12, 6, AZ.woodLight);
  r(c, 3, 4, 10, 1, AZ.woodDark); r(c, 4, 6, 8, 1, AZ.woodDark);
};
const pathSign: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 7, 7, 2, 9, AZ.woodDark);
  r(c, 2, 2, 11, 5, AZ.woodLight); r(c, 13, 3, 1, 3, AZ.woodLight); r(c, 14, 4, 1, 1, AZ.woodLight);
  r(c, 3, 4, 8, 1, AZ.woodDark);
};
const lamp: Painter = (c, v) => {
  azStone(c, v);
  r(c, 7, 4, 2, 11, AZ.whiteDeep); r(c, 7, 4, 1, 11, AZ.white);
  r(c, 5, 1, 6, 3, AZ.tealDark); r(c, 6, 2, 4, 1, AZ.tealLight);
  r(c, 6, 14, 4, 2, AZ.whiteDeep);
};
const bench: Painter = (c, v) => {
  azStone(c, v);
  r(c, 1, 6, 14, 3, AZ.wood); r(c, 1, 6, 14, 1, AZ.woodLight); r(c, 1, 3, 14, 2, AZ.woodDark);
  r(c, 2, 9, 1, 4, AZ.woodDark); r(c, 13, 9, 1, 4, AZ.woodDark);
};
const flowerBox: Painter = (c, v) => {
  azStone(c, v);
  r(c, 1, 7, 14, 7, AZ.woodDark); r(c, 2, 8, 12, 5, AZ.wood);
  for (const [x, col] of [[2, AZ.flowerP], [5, AZ.flowerY], [8, AZ.flowerW], [11, AZ.flowerB]] as [number, string][]) {
    r(c, x + 1, 4, 1, 4, AZ.leafDark); r(c, x, 2, 3, 3, col);
  }
};
const waterPost: Painter = (c, v) => {
  waterFrame(v % 2, false)(c, v);
  r(c, 6, 0, 4, 14, AZ.white);
  for (let y = 1; y < 14; y += 3) r(c, 6, y, 4, 1, AZ.red);
  r(c, 5, 13, 6, 2, 'rgba(255,255,255,0.5)');
};
const workbench: Painter = (c) => {
  azFloor(c, 0);
  r(c, 0, 3, T, 9, AZ.woodDark); r(c, 0, 3, T, 2, AZ.woodLight);
  r(c, 2, 6, 4, 3, AZ.tealDark); r(c, 3, 7, 2, 1, AZ.tealLight);
  r(c, 9, 6, 1, 4, '#9aa3b3'); r(c, 11, 7, 3, 1, '#9aa3b3'); r(c, 12, 5, 1, 2, AZ.red);
  r(c, 1, 12, 2, 4, AZ.woodDark); r(c, 13, 12, 2, 4, AZ.woodDark);
};
const shelfAz: Painter = (c) => {
  azWallFront(c, 0);
  r(c, 1, 4, 14, 1, AZ.woodDark); r(c, 1, 9, 14, 1, AZ.woodDark);
  r(c, 2, 1, 3, 3, '#9aa3b3'); r(c, 7, 2, 2, 2, AZ.flowerY); r(c, 11, 1, 3, 3, AZ.teal);
  r(c, 3, 6, 4, 3, AZ.woodLight); r(c, 9, 6, 2, 3, AZ.red); r(c, 12, 7, 2, 2, '#9aa3b3');
};
const drawingPixel: Painter = (c) => {
  azWallFront(c, 0);
  r(c, 2, 2, 12, 10, AZ.paper);
  r(c, 2, 2, 12, 1, '#e8dcc0');
  // un chien robot dessiné par une enfant : corps gris, œil bleu
  r(c, 5, 6, 6, 3, '#8f99a8'); r(c, 9, 4, 3, 3, '#8f99a8'); r(c, 10, 5, 1, 1, '#3fb6ff');
  r(c, 5, 9, 1, 2, '#8f99a8'); r(c, 9, 9, 1, 2, '#8f99a8'); r(c, 4, 5, 1, 2, '#8f99a8');
  r(c, 3, 3, 2, 2, AZ.sun);
  r(c, 4, 11, 7, 1, AZ.red);
};
const bedAz: Painter = (c) => {
  azFloor(c, 0);
  r(c, 1, 1, 14, 14, AZ.woodDark);
  r(c, 2, 2, 12, 12, '#e8eef0');
  r(c, 3, 3, 10, 3, AZ.white);
  r(c, 2, 7, 12, 7, AZ.teal); r(c, 2, 7, 12, 1, AZ.tealLight);
};
const azFence: Painter = (c, v) => {
  azGrass(c, v);
  r(c, 0, 6, T, 2, AZ.woodLight); r(c, 0, 10, T, 1, AZ.wood);
  r(c, 2, 4, 2, 10, AZ.woodDark); r(c, 12, 4, 2, 10, AZ.woodDark);
};

const fountain = (frame: number): Painter => (c, v) => {
  azStone(c, v);
  r(c, 1, 3, 14, 12, AZ.stoneDark);
  r(c, 2, 2, 12, 12, AZ.stoneLight);
  r(c, 3, 4, 10, 9, AZ.waterDeep);
  r(c, 3, 4, 10, 4, AZ.water);
  r(c, 7, 5, 2, 6, AZ.whiteShade);
  r(c, 7, 2 + frame, 2, 3, AZ.waterLight);
  r(c, 6 - frame, 4, 1, 1, AZ.foam); r(c, 9 + frame, 4, 1, 1, AZ.foam);
  r(c, 4 + frame * 5, 9, 2, 1, AZ.waterLight);
};

registerTiles(
  {
    fountain0: fountain(0), fountain1: fountain(1),
    azGrass, azFlowers, azTall, azPath, azStone, azDeck, azFloor,
    azWater0: waterFrame(0, false), azWater1: waterFrame(1, false), azShore0: waterFrame(0, true), azShore1: waterFrame(1, true),
    azRockTop, azRockFace, azTree, azBush, azForest, azBridgeH: bridge(false), azBridgeV: bridge(true),
    aurTop, aurFront, aurDoor, aurDoorClosed, azWallTop, azWallFront,
    cuveOpen: cuve(false), cuveMine: cuve(true), cuveLog, tideBoard: tideBoard(false), tideBoardWet: tideBoard(true),
    sirenOn: siren(true), sirenOff: siren(false), stall, townSign, pathSign, lampAz: lamp, bench, flowerBox, waterPost,
    workbench, shelfAz, drawingPixel, bedAz, azFence,
  },
  ['azGrass', 'azPath', 'azStone', 'azFloor'],
);

registerIcons({
  fruit: (c) => {
    r(c, 4, 5, 8, 8, '#ff9a3c'); r(c, 3, 7, 10, 4, '#ff9a3c'); r(c, 5, 6, 2, 2, '#ffd8a8');
    r(c, 7, 2, 2, 3, AZ.leafDark); r(c, 9, 2, 3, 2, AZ.leaf);
  },
});
