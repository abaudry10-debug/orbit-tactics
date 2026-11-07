// Les cartes d'Azura (tranche verticale) : le champ des cuves, le chemin des crêtes,
// la ville de Nouvelle-Vesper et l'atelier de Betti.
//
// Légende :
//   "  herbe semée     ,  fleurs d'Azura   ;  roseaux         .  chemin
//   :  dalles          =  passerelle       ~  eau (lac, rivière)
//   b  pont (on le traverse de gauche à droite)   B  pont (de haut en bas)
//   R  rocher, falaise  A  arbre d'Azura   u  fougère   |  barrière
//   #  bâtiment d'Aurore (façade selon la zone)   Z  mur intérieur   w  plancher   F  fontaine
//   x  sol nu d'Azura (régolithe)   o  petit cratère   1 2 / 3 4  grand cratère   k  cristaux
//   m  plancher métallique   c  conduite au sol   d  dalle grise devant une cuve
//   X  sol nu, à l'intérieur de la zone jouable   Y  barrière d'énergie   M  montagne
import type { Dir } from '../../engine/sprites.js';
import { Builder, exit, type GameMap, type MapObject } from '../../engine/world.js';

export const SOLID_AZ = new Set(['~', 'R', 'A', 'u', '|', '#', 'Z', 'F', '1', '2', '3', '4', 'k', 'Y', 'M']);

const obj = (id: string, x: number, y: number, sprite: string, script?: string, extra: Partial<MapObject> = {}): MapObject => ({ id, x, y, sprite, script, ...extra });
const npc = (id: string, x: number, y: number, look: string, dir: Dir, script: string, extra: Partial<MapObject> = {}): MapObject => ({
  id, x, y, sprite: '', script, npc: { look, dir }, ...extra,
});
/** Un objet de deux cases de haut : le haut et le bas. */
const tall = (id: string, x: number, y: number, top: string, base: string, script?: string): MapObject[] => [obj(`${id}H`, x, y, top, script), obj(`${id}B`, x, y + 1, base, script)];
const pylon = (id: string, x: number, y: number) => tall(id, x, y, 'pylonTop', 'pylonBase', 'pylone');
const bigCrater = (b: Builder, x: number, y: number) => b.set(x, y, '1').set(x + 1, y, '2').set(x, y + 1, '3').set(x + 1, y + 1, '4');

// ---------- formes naturelles ----------
/** Une ondulation douce et déterministe (pour des bords qui ne soient pas droits). */
const wobble = (i: number, seed: number) => Math.sin(i * 0.7 + seed) * 1.2 + Math.sin(i * 1.9 + seed * 2.3) * 0.8;

/** Une tache aux contours irréguliers, autour de (cx, cy). `only` : ne remplace que certaines cases. */
function blob(b: Builder, cx: number, cy: number, rx: number, ry: number, ch: string, seed: number, only?: string) {
  for (let y = Math.floor(cy - ry * 1.4); y <= Math.ceil(cy + ry * 1.4); y++) {
    for (let x = Math.floor(cx - rx * 1.4); x <= Math.ceil(cx + rx * 1.4); x++) {
      if (x < 0 || y < 0 || x >= b.width || y >= b.height) continue;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const a = Math.atan2(dy, dx);
      const edge = 1 + 0.2 * Math.sin(3 * a + seed) + 0.12 * Math.sin(5 * a + seed * 2.1) + 0.07 * Math.sin(9 * a + seed * 0.7);
      if (Math.hypot(dx, dy) > edge) continue;
      if (only && !only.includes(b.rows[y][x])) continue;
      b.set(x, y, ch);
    }
  }
}

/** Les cases où l'on peut marcher (le reste est décor ou obstacle). */
const WALK = new Set(['"', ',', ';', '.', ':', '=', 'd', 'c', 'B', 'b', 'w', 'm', 'X']);

/**
 * Ferme la zone jouable : on part des entrées, on suit les cases praticables, et tout autour
 * on pose une barrière ou une montagne (sauf là où un obstacle naturel ferme déjà le passage).
 * Au-delà, le paysage reste visible, mais on ne peut plus y aller.
 */
function enclose(b: Builder, seeds: [number, number][], exits: [number, number][], kind: (x: number, y: number) => 'Y' | 'M') {
  const key = (x: number, y: number) => y * b.width + x;
  const inside = new Set<number>();
  const stack = [...seeds];
  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= b.width || y >= b.height || inside.has(key(x, y)) || !WALK.has(b.rows[y][x])) continue;
    inside.add(key(x, y));
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const isExit = (x: number, y: number) => exits.some(([ex, ey]) => ex === x && ey === y);
  // les cases jouables collées au bord de la carte deviennent elles aussi la limite
  for (const k of [...inside]) {
    const x = k % b.width, y = Math.floor(k / b.width);
    if ((x === 0 || y === 0 || x === b.width - 1 || y === b.height - 1) && !isExit(x, y)) inside.delete(k);
  }
  const edge: [number, number][] = [];
  for (let y = 0; y < b.height; y++) {
    for (let x = 0; x < b.width; x++) {
      if (inside.has(key(x, y)) || SOLID_AZ.has(b.rows[y][x])) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (inside.has(key(x + dx, y + dy))) { near = true; break; }
      if (near) edge.push([x, y]);
    }
  }
  for (const [x, y] of edge) b.set(x, y, kind(x, y));
  // les montagnes ont de l'épaisseur : jusqu'à deux rangées de plus, côté extérieur
  let ring = edge.filter(([x, y]) => b.rows[y][x] === 'M');
  for (let pass = 0; pass < 2; pass++) {
    const next: [number, number][] = [];
    for (const [x, y] of ring) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= b.width || ny >= b.height || inside.has(key(nx, ny)) || b.rows[ny][nx] === 'M') continue;
        if (SOLID_AZ.has(b.rows[ny][nx]) && b.rows[ny][nx] !== 'A') continue;
        b.set(nx, ny, 'M');
        next.push([nx, ny]);
      }
    }
    ring = next;
  }
}

// ---------- le champ des cuves ----------
function cuves(): GameMap {
  const W = 24, H = 18;
  // la planète telle qu'elle était, et la grande tache d'herbe semée autour des cuves
  const b = new Builder(W, H, 'x');
  blob(b, 11.5, 9.5, 11, 8.6, '"', 1);
  blob(b, 4, 15.5, 4, 2.4, '"', 4);
  blob(b, 19.5, 2.5, 3, 2, '"', 6);

  // fleurs et roseaux, en touffes
  blob(b, 2.6, 6.5, 1.3, 1.8, ',', 7, '"');
  blob(b, 20.6, 7.8, 1.2, 1.6, ',', 8, '"');
  blob(b, 9.6, 15.4, 1.6, 1, ';', 9, '"');
  blob(b, 21.2, 15, 1.4, 1.2, ';', 10, '"');
  blob(b, 15.8, 3.4, 1.5, 0.8, ',', 11, '"');
  // les cratères et les cristaux, sur le sol nu
  bigCrater(b, 7, 0);
  b.points('o', [[3, 1], [15, 1], [20, 0], [0, 7], [23, 13], [0, 14]]);
  b.points('k', [[1, 2], [18, 0], [23, 3], [12, 0], [23, 7], [1, 12]]);
  // des arbres d'Azura, en bosquets irréguliers
  b.points('A', [[1, 16], [2, 17], [6, 17], [7, 16], [17, 17], [18, 16], [22, 16], [23, 17], [0, 4], [23, 9]]);
  b.points('u', [[3, 16], [8, 17], [16, 17], [21, 17], [1, 5]]);
  // le sentier, qui serpente jusqu'au bas
  for (let y = 4; y < H; y++) {
    const px = y >= 15 ? 11 : 11 + Math.round(Math.sin(y * 0.6) * 0.9);
    b.set(px, y, '.').set(px + 1, y, '.');
  }
  const objects: MapObject[] = [];
  const xs = [4, 6, 8, 15, 17, 19];
  let n = 0;
  for (const y of [5, 9, 13]) {
    for (const x of xs) {
      n++;
      // l'herbe sous la cuve, sa dalle, et la conduite qui la relie à sa voisine
      b.set(x, y, '"').set(x, y + 1, '"').set(x, y + 2, 'd');
      if (x === 4 && y === 5) objects.push(...tall('cuve07', x, y, 'cuveHeadMine', 'cuveFootMine', 'cuve07'));
      else objects.push(...tall(`cuve${n}`, x, y, 'cuveHead', 'cuveFoot', 'cuve'));
    }
    for (const x of [5, 7, 16, 18]) b.set(x, y + 1, 'c');
  }
  const ground = (pts: [number, number][]) => pts.forEach(([x, y]) => b.set(x, y, '"'));
  ground([[10, 5], [10, 6], [2, 4], [2, 5], [21, 4], [21, 5], [2, 12], [2, 13], [21, 12], [21, 13], [14, 16], [16, 16], [19, 16]]);
  objects.push(...tall('registre', 10, 5, 'holoTop', 'holoBase', 'cuveLog'));
  objects.push(...pylon('pyl1', 2, 4), ...pylon('pyl2', 21, 4), ...pylon('pyl3', 2, 12), ...pylon('pyl4', 21, 12));
  objects.push(obj('solaire1', 14, 16, 'solarPanel', 'solaire'), obj('solaire2', 16, 16, 'solarPanel', 'solaire'), obj('antenne', 19, 16, 'dish', 'antenne'));
  objects.push(exit('versChemin', 11, 17, { to: 'chemin', x: 15, y: 1, dir: 'down' }));
  objects.push(exit('versChemin2', 12, 17, { to: 'chemin', x: 15, y: 1, dir: 'down' }));
  // au nord, une vraie chaîne de montagnes ; ailleurs, la barrière de la colonie
  b.rect(0, 0, W, 4, 'M');
  enclose(b, [[4, 7]], [[11, 17], [12, 17]], (_x, y) => (y <= 5 ? 'M' : 'Y'));
  return { id: 'cuves', name: 'Le champ des cuves', outdoor: true, width: W, height: H, rows: b.rows, objects, voidTile: 'azForest' };
}

// ---------- le chemin des crêtes ----------
function chemin(): GameMap {
  const W = 30, H = 22;
  const b = new Builder(W, H, '"');
  // à l'est, la terre n'a pas été semée : une limite nette, que la barrière suit tout droit
  const edge = (_y: number) => 21;
  for (let y = 0; y < H; y++) for (let x = edge(y) + 1; x < W; x++) b.set(x, y, 'x');
  // la forêt d'Azura, en lisière découpée au nord et à l'ouest
  for (let x = 0; x < 22; x++) for (let y = 0; y < 1 + Math.max(0, Math.round(wobble(x, 2) * 0.6)); y++) if (x !== 15) b.set(x, y, 'A');
  for (let y = 0; y < H; y++) for (let x = 0; x < 1 + Math.max(0, Math.round(wobble(y, 4) * 0.7)); x++) b.set(x, y, 'A');
  bigCrater(b, 25, 3);
  b.points('o', [[24, 1], [28, 8], [25, 17], [28, 20], [24, 10]]);
  b.points('k', [[27, 1], [29, 5], [23, 6], [28, 16], [26, 19], [24, 20]]);
  // la rivière qui serpente
  const river = (x: number) => 13 + Math.round(Math.sin(x * 0.35 + 0.4));
  for (let x = 0; x < W; x++) for (let k = -1; k <= 1; k++) b.set(x, river(x) + k, '~');
  b.set(8, river(8) - 2, '~').set(9, river(9) - 2, '~').set(24, river(24) + 2, '~');
  const rb = river(15);
  for (let k = -1; k <= 1; k++) b.set(15, rb + k, 'B');
  // le sentier
  b.rect(15, 0, 1, 5, '.').rect(12, 4, 4, 1, '.').rect(12, 4, 1, 4, '.').rect(12, 7, 4, 1, '.').rect(15, 7, 1, rb - 1 - 7, '.');
  b.rect(15, rb + 2, 1, H - rb - 2, '.');
  blob(b, 6, 5.5, 1.6, 1.2, ',', 5, '"');
  blob(b, 8, 17.5, 2, 1.2, ',', 6, '"');
  blob(b, 4, 11, 1.4, 1, ';', 7, '"');
  blob(b, 19.5, 18.5, 1.4, 1.2, ';', 8, '"');
  b.points('A', [[4, 3], [7, 2], [19, 3], [5, 18], [9, 19], [19, 17], [3, 20], [18, 20], [11, 20]]);
  b.points('u', [[9, 5], [18, 6], [20, 10], [8, 10], [11, 17], [13, 20], [6, 4]]);
  const pylons: MapObject[] = [];
  for (const [id, y] of [['pylA', 2], ['pylB', 6], ['pylC', 15]] as [string, number][]) {
    const x = Math.min(edge(y), edge(y + 1));
    b.set(x, y, '"').set(x, y + 1, '"');
    pylons.push(...pylon(id, x, y));
  }
  const post = 18;
  const joss: [number, number] = [13, river(13) - 2];
  b.set(joss[0], joss[1], '"');
  const objects: MapObject[] = [
    exit('versCuves', 15, 0, { to: 'cuves', x: 11, y: 16, dir: 'up' }),
    exit('versVille', 15, 21, { to: 'ville', x: 17, y: 1, dir: 'down' }),
    obj('panneauVille', 16, 17, 'pathSign', 'panneauVille'),
    obj('repere', post, river(post) - 1, 'waterPost', 'repere'),
    ...pylons,
    npc('joss', joss[0], joss[1], 'joss', 'down', 'joss'),
  ];
  b.set(16, 17, '"');
  // au sud, un massif que le sentier traverse par une gorge
  for (let y = 18; y < H; y++) for (let x = 0; x < 22; x++) if (x < 14 || x > 16) b.set(x, y, 'M');
  // à l'est, la barrière du terraformage ; à l'ouest, des montagnes
  enclose(b, [[15, 1]], [[15, 0], [15, 21]], (x) => (x >= 18 ? 'Y' : 'M'));
  return { id: 'chemin', name: 'Le chemin des crêtes', outdoor: true, width: W, height: H, rows: b.rows, objects, voidTile: 'azForest' };
}

// ---------- Nouvelle-Vesper ----------
function ville(): GameMap {
  const W = 34, H = 28;
  const b = new Builder(W, H, '"');
  b.rect(0, 0, W, 1, 'A').rect(0, 0, 1, H, 'A').rect(W - 1, 0, 1, H, 'A');
  b.rect(17, 0, 1, 7, '.');
  // deux rues, la place au milieu
  b.rect(2, 7, 30, 1, '.').rect(2, 16, 30, 1, '.');
  b.rect(2, 7, 1, 10, '.').rect(31, 7, 1, 10, '.');
  b.rect(12, 8, 11, 8, ':');
  b.set(17, 11, 'F');
  // les maisons d'Aurore
  b.rect(3, 2, 6, 4, '#').rect(25, 2, 6, 4, '#');
  b.rect(4, 9, 6, 4, '#').rect(24, 9, 6, 4, '#');
  b.rect(3, 18, 7, 4, '#'); // l'atelier de Betti
  b.rect(24, 18, 8, 4, '#'); // le centre des pilotes
  b.rect(6, 6, 1, 1, '.').rect(27, 6, 1, 1, '.');
  b.rect(6, 13, 1, 3, '.').rect(27, 13, 1, 3, '.');
  b.rect(11, 17, 1, 5, '.').rect(23, 17, 1, 5, '.');
  // un jardin entre l'atelier et le centre des pilotes
  blob(b, 17, 19.4, 4.6, 1.8, ',', 2, '"');
  blob(b, 17, 19.6, 1.8, 0.6, '"', 4, ',');
  // la passerelle au bord du lac, et le lac
  b.rect(1, 22, W - 2, 2, '=');
  b.rect(1, 24, W - 2, 4, '~');
  b.rect(17, 24, 1, 2, '=');
  b.points('A', [[1, 2], [10, 2], [23, 2], [32, 2], [1, 18], [32, 18], [12, 18], [22, 18], [14, 3], [20, 3], [1, 1], [2, 1], [31, 1], [32, 1], [1, 19], [32, 19], [11, 1], [22, 1]]);
  blob(b, 2.5, 15.5, 1.6, 1, ',', 5, '"');
  blob(b, 31.5, 15.5, 1.6, 1, ',', 6, '"');
  b.points('u', [[10, 5], [23, 5], [10, 10], [23, 12], [2, 13], [31, 13]]);
  b.points(',', [[15, 2], [16, 2], [18, 2], [19, 2], [12, 5], [21, 5], [3, 15], [30, 15], [11, 2], [22, 4]]);
  b.points(';', [[1, 15], [32, 15], [1, 20], [32, 20]]);
  b.rect(13, 21, 9, 1, 'c');
  const objects: MapObject[] = [
    exit('versChemin', 17, 0, { to: 'chemin', x: 15, y: 20, dir: 'up' }),
    ...pylon('pylV1', 1, 9), ...pylon('pylV2', 32, 9),
    obj('antennePilotes', 30, 17, 'dish', 'antenne'),
    obj('solaireJardin1', 14, 20, 'solarPanel', 'solaire'), obj('solaireJardin2', 20, 20, 'solarPanel', 'solaire'),
    obj('nomVille', 16, 3, 'townSign', 'nomVille'),
    obj('tableau', 14, 9, 'tideBoard', 'tableau', { spriteWhen: ['noraPainted', 'tideBoardWet'] }),
    obj('sirene', 21, 9, 'sirenOff', 'sirene'),
    obj('etal', 13, 13, 'stall', 'etal'),
    obj('banc1', 15, 14, 'bench', 'banc'),
    obj('banc2', 19, 14, 'bench', 'banc'),
    obj('fleurs1', 16, 10, 'flowerBox', 'fleurs'),
    obj('fleurs2', 18, 12, 'flowerBox', 'fleurs'),
    obj('lampe1', 12, 8, 'lampAz', 'lampe'),
    obj('lampe2', 22, 8, 'lampAz', 'lampe'),
    obj('lampe3', 12, 15, 'lampAz', 'lampe'),
    obj('lampe4', 22, 15, 'lampAz', 'lampe'),
    obj('maison1', 6, 5, 'aurDoorClosed', 'maison'),
    obj('maison2', 27, 5, 'aurDoorClosed', 'maison'),
    obj('maison3', 6, 12, 'aurDoorClosed', 'etiquette'),
    obj('maison4', 27, 12, 'aurDoorClosed', 'maison'),
    obj('portePilotes', 28, 21, 'aurDoorClosed', 'pilotes'),
    { id: 'porteAtelier', x: 6, y: 21, sprite: 'aurDoor', door: { to: 'atelier', x: 5, y: 7, dir: 'up', needs: 'bettiMet' }, script: 'atelierFerme' },
    obj('repere2', 9, 24, 'waterPost', 'repere'),
    obj('repere3', 25, 24, 'waterPost', 'repere'),
    npc('bettiPlace', 17, 4, 'betti', 'up', 'bettiAccueil', { hideWhen: 'bettiMet' }),
    npc('ilda', 14, 13, 'ilda', 'left', 'ilda'),
    npc('tom', 21, 10, 'tom', 'up', 'tom'),
    npc('nora', 14, 10, 'nora', 'up', 'nora', { showWhen: 'noraHere' }),
    npc('enfant', 17, 19, 'enfant', 'down', 'enfant'),
    npc('passant1', 19, 9, 'pass1', 'down', 'passant1', { npc: { look: 'pass1', dir: 'down', wander: 2 } }),
    npc('passant2', 8, 16, 'pass2', 'right', 'passant2', { npc: { look: 'pass2', dir: 'right', wander: 3 } }),
    npc('passant3', 20, 23, 'pass3', 'down', 'passant3'),
    npc('passant4', 26, 7, 'pass4', 'left', 'passant4', { npc: { look: 'pass4', dir: 'left', wander: 3 } }),
  ];
  // la ville est ceinte : des montagnes au nord, la barrière de la colonie sur les côtés
  for (let x = 0; x < W; x++) if (x !== 17) b.set(x, 0, 'M').set(x, 1, 'M');
  for (let y = 2; y < 22; y++) for (const x of [1, W - 2]) if (WALK.has(b.rows[y][x])) b.set(x, y, 'Y');
  enclose(b, [[17, 1]], [[17, 0]], (_x, y) => (y <= 2 ? 'M' : 'Y'));
  return {
    id: 'ville', name: 'Nouvelle-Vesper', outdoor: true, width: W, height: H, rows: b.rows, objects, voidTile: 'azForest',
    skins: [
      { x: 3, y: 2, w: 6, h: 4, style: 'aur' }, { x: 25, y: 2, w: 6, h: 4, style: 'aur' },
      { x: 4, y: 9, w: 6, h: 4, style: 'aur' }, { x: 24, y: 9, w: 6, h: 4, style: 'aur' },
      { x: 3, y: 18, w: 7, h: 4, style: 'aur' }, { x: 24, y: 18, w: 8, h: 4, style: 'aur' },
    ],
  };
}

// ---------- l'atelier de Betti ----------
function atelier(): GameMap {
  const b = new Builder(11, 9, 'w');
  b.rect(0, 0, 11, 2, 'Z').rect(0, 0, 1, 9, 'Z').rect(10, 0, 1, 9, 'Z').rect(0, 8, 11, 1, 'Z');
  b.set(5, 8, 'w'); // la porte
  const objects: MapObject[] = [
    exit('sortie', 5, 8, { to: 'ville', x: 6, y: 22, dir: 'down' }),
    obj('dessin', 4, 1, 'drawingPixel', 'dessin'),
    obj('etagere', 7, 1, 'shelfAz', 'etagere'),
    obj('etabli', 2, 3, 'workbench', 'etabli'),
    obj('etabli2', 3, 3, 'workbench', 'etabli'),
    obj('pieces', 2, 5, 'robotParts', 'pieces'),
    obj('lit', 8, 5, 'bedAz', 'lit'),
    npc('betti', 6, 3, 'betti', 'down', 'betti'),
  ];
  return { id: 'atelier', name: 'L’atelier de Betti', outdoor: false, width: 11, height: 9, rows: b.rows, objects };
}

export const MAPS_AZ: Record<string, GameMap> = { cuves: cuves(), chemin: chemin(), ville: ville(), atelier: atelier() };
export const START_AZ = { map: 'cuves', x: 4, y: 7, dir: 'up' as Dir };
