// Cartes du jeu, construites à partir de formes simples (rectangles, points)
// pour rester faciles à modifier.
//
// Légende des cases :
//   .  poussière        "  herbe sèche      ,  asphalte       -  route (marquage)
//   #  ruine (mur)      ~  eau toxique      *  gravats        |  clôture
//   T  arbre mort       C  épave de voiture S  sable (on peut y creuser)
//   P  panneau solaire  v  potager brûlé
//   =  sol du labo      X  mur du labo

import type { Dir } from './sprites.js';

export const SOLID = new Set(['#', '~', '*', '|', 'T', 'C', 'X', 'P']);

export interface Door {
  to: string; // carte d'arrivée
  x: number;
  y: number;
  dir: Dir;
  needs?: string; // drapeau requis pour passer
}

export interface MapObject {
  id: string;
  x: number;
  y: number;
  sprite: string; // '' = invisible (sortie de carte)
  spriteWhen?: [flag: string, sprite: string]; // change d'apparence quand le drapeau est levé
  script?: string; // script d'interaction (voir story.ts)
  door?: Door; // passer dessus mène à une autre carte
  passWhen?: string; // devient franchissable quand le drapeau est levé (porte, grille)
  hideWhen?: string; // disparaît quand le drapeau est levé
}

export interface EnergySource {
  x: number;
  y: number;
  goneWhen: string; // drapeau qui indique que la source a été récupérée
}

export interface GameMap {
  id: string;
  name: string;
  outdoor: boolean;
  width: number;
  height: number;
  rows: string[][];
  objects: MapObject[];
  energy?: EnergySource[];
}

class Builder {
  rows: string[][];
  width: number;
  height: number;
  constructor(width: number, height: number, fill: string) {
    this.width = width;
    this.height = height;
    this.rows = Array.from({ length: height }, () => Array(width).fill(fill));
  }
  rect(x: number, y: number, w: number, h: number, ch: string) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, ch);
    return this;
  }
  set(x: number, y: number, ch: string) {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height) this.rows[y][x] = ch;
    return this;
  }
  points(ch: string, pts: [number, number][]) {
    for (const [x, y] of pts) this.set(x, y, ch);
    return this;
  }
  border(ch: string) {
    this.rect(0, 0, this.width, 1, ch).rect(0, this.height - 1, this.width, 1, ch);
    this.rect(0, 0, 1, this.height, ch).rect(this.width - 1, 0, 1, this.height, ch);
    return this;
  }
}

const exit = (id: string, x: number, y: number, door: Door): MapObject => ({ id, x, y, sprite: '', door });

// ---------- Laboratoire Lazare (intérieur) ----------
function buildLab(): GameMap {
  const b = new Builder(12, 10, '=');
  b.border('X');
  b.rect(1, 1, 10, 1, 'X'); // mur du fond (épaisseur 2 pour l'effet de profondeur)
  b.rect(5, 5, 2, 1, 'X'); // cloison centrale
  return {
    id: 'lab',
    name: 'Laboratoire Lazare',
    outdoor: false,
    width: b.width,
    height: b.height,
    rows: b.rows,
    objects: [
      { id: 'capsule07', x: 2, y: 2, sprite: 'capsule', script: 'capsule07' },
      { id: 'capsuleA', x: 4, y: 2, sprite: 'capsuleFrost', script: 'capsuleFrost' },
      { id: 'capsuleB', x: 6, y: 2, sprite: 'capsuleFrost', script: 'capsuleFrost' },
      { id: 'terminal', x: 9, y: 2, sprite: 'terminal', script: 'terminal' },
      { id: 'register', x: 8, y: 6, sprite: 'book', script: 'register' },
      { id: 'locker', x: 10, y: 6, sprite: 'locker', spriteWhen: ['badge', 'lockerOpen'], script: 'locker' },
      { id: 'deadTerminal', x: 1, y: 7, sprite: 'terminalOff', script: 'deadTerminal' },
      {
        id: 'labDoor', x: 5, y: 9, sprite: 'labDoor', spriteWhen: ['badge', 'labDoorOpen'], script: 'labDoor',
        door: { to: 'vesper', x: 7, y: 6, dir: 'down', needs: 'badge' },
      },
    ],
  };
}

// ---------- Ville de Vesper (extérieur, carrefour de tous les lieux) ----------
function buildVesper(): GameMap {
  const b = new Builder(40, 30, '.');

  b.rect(1, 6, 4, 2, '"').rect(14, 2, 5, 3, '"').rect(30, 16, 6, 3, '"').rect(2, 20, 5, 4, '"').rect(10, 25, 6, 3, '"');

  // avenue est-ouest (vers le quartier résidentiel à l'ouest), rue nord-sud (vers la centrale au sud)
  b.rect(1, 9, 38, 3, ',').rect(1, 10, 38, 1, '-');
  b.rect(19, 12, 3, 18, ',');
  b.rect(16, 17, 9, 5, ','); // place des Missions

  b.rect(3, 1, 9, 5, '#'); // laboratoire, entrée en (7,5)
  b.rect(25, 1, 12, 5, '~').rect(27, 6, 8, 1, '~').rect(24, 2, 1, 3, '~'); // lac toxique
  b.rect(3, 13, 7, 4, '#').rect(11, 13, 5, 3, '#').rect(25, 13, 4, 3, '#');
  b.rect(31, 12, 7, 4, '#'); // centre de recherche, porte en (34,15)
  b.rect(3, 24, 5, 3, '#');
  b.rect(10, 18, 5, 3, '#'); // bouche de métro, escalier en (12,20)
  b.rect(29, 21, 9, 5, '#'); // spatioport, portes en (33,25)
  b.rect(28, 20, 1, 7, '|').rect(28, 27, 4, 1, '|').rect(35, 27, 4, 1, '|');

  b.border('*');
  b.rect(0, 10, 1, 1, '-'); // sortie ouest
  b.rect(19, 29, 3, 1, ','); // sortie sud
  b.points('T', [[1, 1], [2, 1], [13, 1], [38, 7], [1, 14], [1, 27], [12, 23], [24, 25], [38, 13], [16, 7], [33, 8]]);
  b.points('*', [[12, 1], [22, 1], [23, 1], [17, 13], [23, 14], [9, 22], [14, 23], [26, 18], [37, 18], [1, 18], [19, 29], [21, 29]]);
  b.points('C', [[14, 10], [27, 9], [20, 14], [6, 11], [34, 11]]);

  return {
    id: 'vesper',
    name: 'Ruines de Vesper',
    outdoor: true,
    width: b.width,
    height: b.height,
    rows: b.rows,
    objects: [
      { id: 'labEntrance', x: 7, y: 5, sprite: 'ruinDoor', script: 'labEntrance', door: { to: 'lab', x: 5, y: 8, dir: 'up' } },
      { id: 'signVesper', x: 9, y: 7, sprite: 'sign', script: 'signVesper' },
      { id: 'thermo', x: 13, y: 12, sprite: 'thermometer', script: 'thermometer' },
      { id: 'posterShade', x: 6, y: 16, sprite: 'poster', script: 'posterShade' },
      { id: 'robot', x: 30, y: 14, sprite: 'robot', script: 'robot' },
      { id: 'missionPlaque', x: 20, y: 19, sprite: 'monument', script: 'missionPlaque' },
      { id: 'pixelOff', x: 23, y: 7, sprite: 'dogOff', script: 'pixelOff', hideWhen: 'pixelOn' },
      { id: 'noteLea', x: 24, y: 8, sprite: 'note', script: 'noteLea' },
      { id: 'crate1', x: 17, y: 25, sprite: 'crate', script: 'crate' },
      { id: 'metro', x: 12, y: 20, sprite: 'stairs', script: 'metro' },
      { id: 'spatioport', x: 33, y: 25, sprite: 'bunkerDoor', script: 'spatioport' },
      {
        id: 'researchDoor', x: 34, y: 15, sprite: 'bunkerDoor', spriteWhen: ['researchOpen', 'bunkerDoorOpen'], script: 'researchDoor',
        door: { to: 'research', x: 10, y: 12, dir: 'up', needs: 'researchOpen' },
      },
      exit('toQuartier', 0, 10, { to: 'quartier', x: 34, y: 12, dir: 'left' }),
      exit('toCentrale', 20, 29, { to: 'centrale', x: 15, y: 1, dir: 'down' }),
    ],
  };
}

// ---------- Quartier résidentiel (extérieur, à l'ouest) ----------
function buildQuartier(): GameMap {
  const b = new Builder(36, 26, '.');
  b.rect(2, 8, 5, 2, '"').rect(20, 2, 3, 3, '"').rect(10, 21, 6, 3, '"').rect(30, 8, 4, 2, '"');
  b.rect(1, 11, 35, 3, ',').rect(1, 12, 35, 1, '-'); // rue principale
  b.rect(11, 14, 3, 6, ','); // allée vers le sud

  b.rect(3, 2, 7, 5, '#'); // maison Moreau (Léa), porte en (6,6)
  b.rect(13, 2, 6, 5, '#'); // maison du pilote
  b.rect(24, 2, 7, 5, '#'); // maison du radioamateur
  b.rect(3, 16, 6, 4, '#');
  b.rect(16, 16, 4, 4, '#');
  b.rect(22, 16, 6, 4, 'v'); // potager desséché
  b.rect(21, 15, 8, 1, '|').rect(21, 20, 8, 1, '|').rect(21, 16, 1, 4, '|').rect(28, 16, 1, 3, '|');
  b.rect(30, 17, 4, 5, '*'); // château d'eau effondré

  b.border('*');
  b.rect(35, 12, 1, 1, '-'); // sortie est
  b.points('T', [[1, 1], [11, 1], [22, 6], [33, 3], [1, 22], [9, 23], [20, 23], [34, 23], [10, 8]]);
  b.points('C', [[8, 12], [26, 11]]);
  b.points('*', [[19, 9], [2, 14], [29, 13]]);

  return {
    id: 'quartier',
    name: 'Quartier des Tilleuls',
    outdoor: true,
    width: b.width,
    height: b.height,
    rows: b.rows,
    objects: [
      { id: 'leaHouse', x: 6, y: 6, sprite: 'ruinDoor', script: 'leaHouse' },
      { id: 'leaMailbox', x: 8, y: 8, sprite: 'sign', script: 'leaMailbox' },
      { id: 'motherJournal', x: 16, y: 8, sprite: 'note', script: 'motherJournal' },
      { id: 'pilotHouse', x: 15, y: 6, sprite: 'ruinDoor', script: 'pilotHouse' },
      { id: 'radioNotes', x: 28, y: 8, sprite: 'note', script: 'radioNotes' },
      { id: 'radioHouse', x: 27, y: 6, sprite: 'ruinDoor', script: 'radioHouse' },
      { id: 'ticket', x: 3, y: 10, sprite: 'note', script: 'ticket' },
      { id: 'letter', x: 6, y: 21, sprite: 'note', script: 'letter' },
      { id: 'garden', x: 24, y: 21, sprite: 'plantsSign', script: 'garden' },
      { id: 'shed', x: 29, y: 19, sprite: 'shed', script: 'shed' },
      { id: 'thermo2', x: 18, y: 14, sprite: 'thermometer', script: 'thermometer2' },
      { id: 'tank', x: 31, y: 22, sprite: 'crate', script: 'tank' },
      exit('toVesper', 35, 12, { to: 'vesper', x: 1, y: 10, dir: 'right' }),
    ],
  };
}

// ---------- Centre de recherche (intérieur) ----------
function buildResearch(): GameMap {
  const b = new Builder(20, 14, '=');
  b.border('X');
  b.rect(1, 1, 18, 1, 'X');
  b.rect(1, 7, 18, 1, 'X'); // mur entre le hall et les salles
  b.rect(7, 1, 1, 7, 'X').rect(12, 1, 1, 7, 'X'); // salle scellée au centre
  b.set(4, 7, '=').set(15, 7, '='); // passages vers le labo 2 et les archives
  return {
    id: 'research',
    name: 'Centre de recherche',
    outdoor: false,
    width: b.width,
    height: b.height,
    rows: b.rows,
    objects: [
      { id: 'vitrine', x: 6, y: 9, sprite: 'vitrine', script: 'vitrine' },
      { id: 'hallTerminal', x: 14, y: 9, sprite: 'terminal', script: 'hallTerminal' },
      { id: 'lab2Desk', x: 2, y: 3, sprite: 'desk', script: 'lab2Desk' },
      { id: 'lab2Terminal', x: 5, y: 3, sprite: 'terminal', script: 'lab2Terminal' },
      { id: 'archiveShelf', x: 14, y: 3, sprite: 'shelf', script: 'archiveShelf' },
      { id: 'archiveTerminal', x: 17, y: 3, sprite: 'terminal', script: 'archiveTerminal' },
      { id: 'archiveBook', x: 17, y: 6, sprite: 'book', script: 'archiveBook' },
      { id: 'vent', x: 11, y: 7, sprite: 'vent', spriteWhen: ['sealedOpen', 'ventOpen'], script: 'vent' },
      { id: 'sealedDoor', x: 9, y: 7, sprite: 'labDoor', spriteWhen: ['sealedOpen', 'labDoorOpen'], script: 'sealedDoor', passWhen: 'sealedOpen' },
      { id: 'pedestal', x: 9, y: 3, sprite: 'pedestal', spriteWhen: ['matrice', 'pedestalEmpty'], script: 'pedestal' },
      { id: 'varnNote', x: 10, y: 5, sprite: 'book', script: 'varnNote' },
      { id: 'researchExit', x: 10, y: 13, sprite: 'labDoorOpen', door: { to: 'vesper', x: 34, y: 16, dir: 'down' } },
    ],
  };
}

// ---------- Centrale solaire Hélios (extérieur, dunes au sud) ----------
function buildCentrale(): GameMap {
  const b = new Builder(30, 22, 'S');
  b.rect(14, 1, 3, 6, '.'); // piste d'arrivée
  b.rect(4, 4, 7, 2, 'P').rect(4, 8, 7, 2, 'P').rect(19, 16, 8, 2, 'P'); // champs de panneaux
  b.rect(18, 7, 7, 4, '#'); // ruines de la centrale
  b.points('P', [[3, 13], [5, 14], [8, 12]]);
  b.points('*', [[17, 12], [25, 9], [12, 18], [6, 17], [27, 4]]);
  b.border('*');
  b.rect(15, 0, 1, 1, '.'); // sortie nord
  return {
    id: 'centrale',
    name: 'Centrale solaire Hélios',
    outdoor: true,
    width: b.width,
    height: b.height,
    rows: b.rows,
    objects: [
      { id: 'heliosSign', x: 13, y: 6, sprite: 'sign', script: 'heliosSign' },
      { id: 'controlPanel', x: 21, y: 11, sprite: 'crate', script: 'controlPanel' },
      exit('toVesperN', 15, 0, { to: 'vesper', x: 20, y: 28, dir: 'up' }),
    ],
    energy: [{ x: 22, y: 13, goneWhen: 'batteryFound' }],
  };
}

export const MAPS: Record<string, GameMap> = {
  lab: buildLab(),
  vesper: buildVesper(),
  quartier: buildQuartier(),
  research: buildResearch(),
  centrale: buildCentrale(),
};

export const START = { map: 'lab', x: 2, y: 3, dir: 'down' as Dir };

export function objectAt(map: GameMap, x: number, y: number): MapObject | undefined {
  return map.objects.find((o) => o.x === x && o.y === y);
}

export function charAt(map: GameMap, x: number, y: number): string {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return '*';
  return map.rows[y][x];
}
