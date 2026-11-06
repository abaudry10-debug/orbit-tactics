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
//   m  plancher métallique   c  conduite au sol
import type { Dir } from '../../engine/sprites.js';
import { Builder, exit, type GameMap, type MapObject } from '../../engine/world.js';

export const SOLID_AZ = new Set(['~', 'R', 'A', 'u', '|', '#', 'Z', 'F', '1', '2', '3', '4', 'k']);

const obj = (id: string, x: number, y: number, sprite: string, script?: string, extra: Partial<MapObject> = {}): MapObject => ({ id, x, y, sprite, script, ...extra });
const npc = (id: string, x: number, y: number, look: string, dir: Dir, script: string, extra: Partial<MapObject> = {}): MapObject => ({
  id, x, y, sprite: '', script, npc: { look, dir }, ...extra,
});
/** Un objet de deux cases de haut : le haut et le bas. */
const tall = (id: string, x: number, y: number, top: string, base: string, script?: string): MapObject[] => [obj(`${id}H`, x, y, top, script), obj(`${id}B`, x, y + 1, base, script)];
const pylon = (id: string, x: number, y: number) => tall(id, x, y, 'pylonTop', 'pylonBase', 'pylone');
const bigCrater = (b: Builder, x: number, y: number) => b.set(x, y, '1').set(x + 1, y, '2').set(x, y + 1, '3').set(x + 1, y + 1, '4');

// ---------- le champ des cuves ----------
function cuves(): GameMap {
  const W = 24, H = 18;
  const b = new Builder(W, H, '"');
  // au-delà des pylônes, la planète telle qu'elle était : nue, violette, criblée de cratères
  b.rect(0, 0, W, 4, 'x').rect(0, 4, 2, 12, 'x').rect(22, 4, 2, 12, 'x');
  bigCrater(b, 7, 0);
  b.points('o', [[3, 1], [15, 2], [20, 0], [0, 9], [23, 12], [1, 14]]);
  b.points('k', [[1, 2], [18, 1], [22, 3], [12, 0], [23, 6], [0, 12]]);
  b.rect(0, 16, W, 2, 'A');
  // les quais métalliques, et les conduites qui relient les cuves
  for (const y of [5, 9, 13]) { b.rect(3, y, 8, 2, 'm').rect(14, y, 7, 2, 'm'); b.rect(3, y + 2, 18, 1, 'c'); }
  b.rect(11, 4, 2, 14, '.');
  b.points(',', [[2, 8], [2, 9], [21, 11], [21, 10], [13, 15], [15, 15]]);
  b.points(';', [[2, 15], [21, 15], [10, 15]]);
  const objects: MapObject[] = [];
  const xs = [4, 6, 8, 15, 17, 19];
  let n = 0;
  for (const y of [5, 9, 13]) for (const x of xs) {
    n++;
    if (x === 4 && y === 5) objects.push(...tall('cuve07', x, y, 'cuveHeadMine', 'cuveFootMine', 'cuve07'));
    else objects.push(...tall(`cuve${n}`, x, y, 'cuveHead', 'cuveFoot', 'cuve'));
  }
  objects.push(...tall('registre', 10, 5, 'holoTop', 'holoBase', 'cuveLog'));
  objects.push(...pylon('pyl1', 2, 4), ...pylon('pyl2', 21, 4), ...pylon('pyl3', 2, 12), ...pylon('pyl4', 21, 12));
  objects.push(obj('solaire1', 14, 16, 'solarPanel', 'solaire'), obj('solaire2', 16, 16, 'solarPanel', 'solaire'), obj('antenne', 19, 16, 'dish', 'antenne'));
  objects.push(exit('versChemin', 11, 17, { to: 'chemin', x: 15, y: 1, dir: 'down' }));
  objects.push(exit('versChemin2', 12, 17, { to: 'chemin', x: 15, y: 1, dir: 'down' }));
  return { id: 'cuves', name: 'Le champ des cuves', outdoor: true, width: W, height: H, rows: b.rows, objects, voidTile: 'azForest' };
}

// ---------- le chemin des crêtes ----------
function chemin(): GameMap {
  const W = 30, H = 22;
  const b = new Builder(W, H, '"');
  // à l'est des pylônes, la terre n'a pas encore été semée
  b.rect(22, 0, 8, H, 'x');
  b.rect(0, 0, 22, 1, 'A').rect(0, 0, 2, H, 'A');
  bigCrater(b, 25, 3);
  b.points('o', [[23, 1], [28, 8], [24, 17], [27, 20], [23, 10]]);
  b.points('k', [[27, 1], [29, 5], [22, 6], [28, 16], [25, 19], [23, 20]]);
  b.rect(15, 0, 1, 1, '.');
  b.rect(15, 1, 1, 4, '.').rect(12, 4, 4, 1, '.').rect(12, 4, 1, 4, '.').rect(12, 7, 4, 1, '.').rect(15, 7, 1, 4, '.');
  b.rect(2, 8, 12, 2, 'R').rect(17, 8, 13, 2, 'R');
  b.rect(14, 8, 3, 2, '.');
  b.rect(0, 12, W, 3, '~');
  b.rect(15, 12, 1, 3, 'B');
  b.rect(15, 10, 1, 2, '.').rect(15, 15, 1, 7, '.');
  b.points('A', [[4, 3], [7, 2], [19, 3], [5, 17], [9, 19], [19, 17], [3, 20], [18, 20]]);
  b.points('u', [[9, 5], [18, 6], [20, 10], [8, 10], [11, 17], [13, 20]]);
  b.points(',', [[5, 6], [6, 6], [6, 5], [7, 16], [8, 16], [17, 17], [13, 18], [20, 19]]);
  b.points(';', [[3, 10], [4, 11], [3, 15], [12, 20], [20, 15]]);
  const objects: MapObject[] = [
    exit('versCuves', 15, 0, { to: 'cuves', x: 11, y: 16, dir: 'up' }),
    exit('versVille', 15, 21, { to: 'ville', x: 17, y: 1, dir: 'down' }),
    obj('panneauVille', 16, 17, 'pathSign', 'panneauVille'),
    obj('repere', 18, 12, 'waterPost', 'repere'),
    ...pylon('pylA', 21, 2), ...pylon('pylB', 21, 5), ...pylon('pylC', 21, 16), ...pylon('pylD', 21, 19),
    npc('joss', 13, 11, 'joss', 'down', 'joss'),
  ];
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
  b.rect(13, 18, 9, 3, ',').rect(15, 19, 5, 1, '"');
  // la passerelle au bord du lac, et le lac
  b.rect(1, 22, W - 2, 2, '=');
  b.rect(1, 24, W - 2, 4, '~');
  b.rect(17, 24, 1, 2, '=');
  b.points('A', [[1, 2], [10, 2], [23, 2], [32, 2], [1, 18], [32, 18], [12, 18], [22, 18], [14, 3], [20, 3]]);
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
