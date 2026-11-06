// Les cartes d'Azura (tranche verticale) : le champ des cuves, le chemin des crêtes,
// la ville de Nouvelle-Vesper et l'atelier de Betti.
//
// Légende :
//   "  herbe          ,  fleurs          ;  hautes herbes   .  chemin
//   :  dalles         =  passerelle      ~  eau (lac, rivière)
//   b  pont (on le traverse de gauche à droite)   B  pont (de haut en bas)
//   R  rocher, falaise   A  arbre   u  buisson   |  barrière
//   #  bâtiment d'Aurore (façade selon la zone)   Z  mur intérieur   w  plancher   F  fontaine
import type { Dir } from '../../engine/sprites.js';
import { Builder, exit, type GameMap, type MapObject } from '../../engine/world.js';

export const SOLID_AZ = new Set(['~', 'R', 'A', 'u', '|', '#', 'Z', 'F']);

const obj = (id: string, x: number, y: number, sprite: string, script?: string, extra: Partial<MapObject> = {}): MapObject => ({ id, x, y, sprite, script, ...extra });
const npc = (id: string, x: number, y: number, look: string, dir: Dir, script: string, extra: Partial<MapObject> = {}): MapObject => ({
  id, x, y, sprite: '', script, npc: { look, dir }, ...extra,
});

// ---------- le champ des cuves ----------
function cuves(): GameMap {
  const b = new Builder(24, 18, '"');
  b.rect(0, 0, 24, 2, 'A').rect(0, 0, 2, 18, 'A').rect(22, 0, 2, 18, 'A').rect(0, 16, 24, 2, 'A');
  b.rect(2, 2, 20, 1, 'R');
  b.points('u', [[2, 3], [21, 3], [2, 15], [21, 14], [3, 15]]);
  b.points(',', [[3, 13], [4, 13], [4, 14], [18, 12], [19, 12], [19, 13], [8, 3], [9, 3], [15, 3], [16, 4]]);
  b.points(';', [[2, 9], [2, 10], [3, 10], [20, 6], [21, 7], [20, 7]]);
  b.rect(11, 9, 2, 9, '.');
  b.rect(10, 12, 1, 2, '.');
  const objects: MapObject[] = [];
  const xs = [4, 6, 8, 15, 17, 19];
  const ys = [5, 8, 11];
  let n = 0;
  for (const y of ys) for (const x of xs) {
    n++;
    if (x === 4 && y === 5) objects.push(obj('cuve07', x, y, 'cuveMine', 'cuve07'));
    else objects.push(obj(`cuve${n}`, x, y, 'cuveOpen', 'cuve'));
  }
  objects.push(obj('cuveLog', 11, 5, 'cuveLog', 'cuveLog'));
  objects.push(exit('versChemin', 11, 17, { to: 'chemin', x: 15, y: 1, dir: 'down' }));
  objects.push(exit('versChemin2', 12, 17, { to: 'chemin', x: 15, y: 1, dir: 'down' }));
  return { id: 'cuves', name: 'Le champ des cuves', outdoor: true, width: 24, height: 18, rows: b.rows, objects, voidTile: 'azForest' };
}

// ---------- le chemin des crêtes ----------
function chemin(): GameMap {
  const b = new Builder(30, 22, '"');
  b.rect(0, 0, 30, 1, 'A').rect(0, 0, 2, 22, 'A').rect(28, 0, 2, 22, 'A');
  b.rect(15, 0, 1, 1, '.');
  // le sentier qui serpente jusqu'à la rivière
  b.rect(15, 1, 1, 4, '.').rect(12, 4, 4, 1, '.').rect(12, 4, 1, 4, '.').rect(12, 7, 4, 1, '.').rect(15, 7, 1, 4, '.');
  // une falaise, coupée par le sentier
  b.rect(2, 8, 12, 2, 'R').rect(17, 8, 11, 2, 'R');
  b.rect(14, 8, 3, 2, '.');
  // la rivière turquoise et son pont suspendu
  b.rect(0, 12, 30, 3, '~');
  b.rect(15, 12, 1, 3, 'B');
  b.rect(15, 10, 1, 2, '.').rect(15, 15, 1, 7, '.');
  b.points('A', [[4, 3], [7, 2], [22, 3], [25, 5], [5, 17], [9, 19], [21, 17], [24, 19], [26, 16], [3, 20]]);
  b.points('u', [[9, 5], [19, 5], [20, 10], [8, 10], [11, 17], [19, 19]]);
  b.points(',', [[5, 6], [6, 6], [6, 5], [23, 10], [24, 10], [24, 11], [7, 16], [8, 16], [22, 20], [23, 20], [13, 18], [17, 17]]);
  b.points(';', [[3, 10], [4, 11], [26, 10], [25, 11], [3, 15], [27, 15], [12, 20], [18, 20]]);
  const objects: MapObject[] = [
    exit('versCuves', 15, 0, { to: 'cuves', x: 11, y: 16, dir: 'up' }),
    exit('versVille', 15, 21, { to: 'ville', x: 17, y: 1, dir: 'down' }),
    obj('panneauVille', 16, 17, 'pathSign', 'panneauVille'),
    obj('repere', 18, 12, 'waterPost', 'repere'),
    npc('joss', 13, 11, 'joss', 'down', 'joss'),
  ];
  return { id: 'chemin', name: 'Le chemin des crêtes', outdoor: true, width: 30, height: 22, rows: b.rows, objects, voidTile: 'azForest' };
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
  const objects: MapObject[] = [
    exit('versChemin', 17, 0, { to: 'chemin', x: 15, y: 20, dir: 'up' }),
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
    obj('lit', 8, 5, 'bedAz', 'lit'),
    npc('betti', 6, 3, 'betti', 'down', 'betti'),
  ];
  return { id: 'atelier', name: 'L’atelier de Betti', outdoor: false, width: 11, height: 9, rows: b.rows, objects };
}

export const MAPS_AZ: Record<string, GameMap> = { cuves: cuves(), chemin: chemin(), ville: ville(), atelier: atelier() };
export const START_AZ = { map: 'cuves', x: 4, y: 6, dir: 'down' as Dir };
