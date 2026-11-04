// Cartes du jeu, construites à partir de formes simples (rectangles, points)
// pour rester faciles à modifier.
//
// Légende des cases :
//   .  poussière        "  herbe sèche      ,  asphalte       -  route (marquage)
//   #  ruine (mur)      ~  eau toxique      *  gravats        |  clôture
//   T  arbre mort       C  épave de voiture
//   =  sol du labo      X  mur du labo

import type { Dir } from './sprites.js';

export const SOLID = new Set(['#', '~', '*', '|', 'T', 'C', 'X']);

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
  sprite: string;
  spriteWhen?: [flag: string, sprite: string]; // change d'apparence quand le drapeau est levé
  script?: string; // script d'interaction (voir story.ts)
  door?: Door;
}

export interface GameMap {
  id: string;
  name: string;
  outdoor: boolean;
  width: number;
  height: number;
  rows: string[][];
  objects: MapObject[];
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
      { id: 'capsuleA', x: 4, y: 2, sprite: 'capsuleEmpty', script: 'capsuleEmpty' },
      { id: 'capsuleB', x: 6, y: 2, sprite: 'capsuleEmpty', script: 'capsuleEmpty' },
      { id: 'terminal', x: 9, y: 2, sprite: 'terminal', script: 'terminal' },
      { id: 'locker', x: 10, y: 6, sprite: 'locker', spriteWhen: ['badge', 'lockerOpen'], script: 'locker' },
      { id: 'crateLab', x: 1, y: 7, sprite: 'terminalOff', script: 'deadTerminal' },
      {
        id: 'labDoor', x: 5, y: 9, sprite: 'labDoor', spriteWhen: ['badge', 'labDoorOpen'], script: 'labDoor',
        door: { to: 'vesper', x: 7, y: 6, dir: 'down', needs: 'badge' },
      },
    ],
  };
}

// ---------- Ville de Vesper (extérieur) ----------
function buildVesper(): GameMap {
  const b = new Builder(40, 30, '.');

  // herbe sèche par plaques
  b.rect(1, 6, 4, 2, '"').rect(14, 2, 5, 3, '"').rect(30, 16, 6, 3, '"').rect(2, 20, 5, 4, '"').rect(10, 25, 6, 3, '"');

  // routes : une grande avenue est-ouest, une rue nord-sud
  b.rect(1, 9, 38, 3, ',').rect(1, 10, 38, 1, '-');
  b.rect(19, 12, 3, 16, ',');
  // place du Monument
  b.rect(16, 17, 9, 5, ',');

  // laboratoire (ruine au nord-ouest), entrée en (7,5)
  b.rect(3, 1, 9, 5, '#');
  // lac toxique au nord-est
  b.rect(25, 1, 12, 5, '~').rect(27, 6, 8, 1, '~').rect(24, 2, 1, 3, '~');
  // pâtés de maisons en ruine
  b.rect(3, 13, 7, 4, '#').rect(11, 13, 5, 3, '#').rect(25, 13, 4, 3, '#');
  b.rect(3, 24, 5, 3, '#');
  // Abri Delta au sud-est, porte en (33,25)
  b.rect(29, 21, 9, 5, '#');
  b.rect(28, 20, 1, 7, '|').rect(28, 27, 4, 1, '|').rect(35, 27, 4, 1, '|');

  // bordure de gravats et d'arbres morts
  b.border('*');
  b.points('T', [[1, 1], [2, 1], [13, 1], [38, 7], [1, 14], [1, 27], [12, 20], [24, 25], [38, 13], [16, 7], [33, 8]]);
  b.points('*', [[12, 1], [22, 1], [23, 1], [17, 13], [23, 14], [9, 21], [10, 21], [14, 23], [26, 18], [37, 18], [1, 18]]);
  b.points('C', [[14, 10], [27, 9], [20, 14], [6, 11], [34, 11]]);
  // passages bouchés pour guider l'exploration
  b.rect(1, 12, 1, 1, '*');

  return {
    id: 'vesper',
    name: 'Ruines de Vesper',
    outdoor: true,
    width: b.width,
    height: b.height,
    rows: b.rows,
    objects: [
      {
        id: 'labEntrance', x: 7, y: 5, sprite: 'ruinDoor', script: 'labEntrance',
        door: { to: 'lab', x: 5, y: 8, dir: 'up' },
      },
      { id: 'signVesper', x: 9, y: 7, sprite: 'sign', script: 'signVesper' },
      { id: 'posterShield', x: 6, y: 16, sprite: 'poster', script: 'poster' },
      { id: 'diary', x: 5, y: 18, sprite: 'note', script: 'diary' },
      { id: 'robot', x: 30, y: 14, sprite: 'robot', script: 'robot' },
      { id: 'monument', x: 20, y: 19, sprite: 'monument', script: 'monument' },
      { id: 'crate1', x: 17, y: 25, sprite: 'crate', script: 'crate' },
      { id: 'crate2', x: 36, y: 15, sprite: 'crate', script: 'crate' },
      { id: 'noteDog', x: 24, y: 7, sprite: 'note', script: 'noteDog' },
      {
        id: 'bunkerDoor', x: 33, y: 25, sprite: 'bunkerDoor', spriteWhen: ['deltaOpen', 'bunkerDoorOpen'], script: 'bunkerDoor',
      },
    ],
  };
}

export const MAPS: Record<string, GameMap> = {
  lab: buildLab(),
  vesper: buildVesper(),
};

export const START = { map: 'lab', x: 2, y: 3, dir: 'down' as Dir };

export function objectAt(map: GameMap, x: number, y: number): MapObject | undefined {
  return map.objects.find((o) => o.x === x && o.y === y);
}

export function charAt(map: GameMap, x: number, y: number): string {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return '*';
  return map.rows[y][x];
}
