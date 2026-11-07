// Cartes du jeu, construites à partir de formes simples (rectangles, points)
// pour rester faciles à modifier.
//
// Légende des cases :
//   .  poussière        "  herbe sèche      ,  asphalte       -  route (marquage)
//   #  ruine (mur)      ~  eau toxique      *  gravats        |  clôture
//   T  arbre mort       C  épave de voiture S  sable (on peut y creuser)
//   P  panneau solaire  v  potager brûlé     H  aire d'envol      N  décor solide (épave…)
//   =  sol du labo      X  mur du labo
//   w  parquet          Y  mur tapissé      K  mur de planches
//   m  quai de métro    _  bord de quai     r  rails            W  mur de métro
//   g  caillebotis      k  ciel (vide)

import type { Dir } from './sprites.js';

export const SOLID = new Set(['#', '~', '*', '|', 'T', 'C', 'X', 'P', 'N', 'Y', 'K', 'W', 'k']);

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
  hiddenUntil?: string; // invisible et franchissable tant que le drapeau n'est pas levé (on peut quand même l'examiner)
  /** Un habitant : son apparence (voir Chapter.people) et son regard au repos. */
  npc?: { look: string; dir: Dir; /** Se promène autour de sa place (nombre de cases). */ wander?: number };
  /** Visible seulement quand ce drapeau est levé. */
  showWhen?: string;
}

export interface EnergySource {
  x: number;
  y: number;
  goneWhen: string; // drapeau qui indique que la source a été récupérée
}

/** Style de façade d'un bâtiment (les cases # de cette zone prennent ce dessin). */
export interface Skin {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Nom de la façade : les tuiles `${style}Top` et `${style}Front` doivent exister. */
  style: string;
}

/** Grand décor dessiné par-dessus les cases (navette, antenne…), aligné sur le bas de son emprise. */
export interface Decal {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'shuttle' | 'dish' | 'tower' | 'radioTower' | 'train' | 'bigTree' | (string & {});
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
  skins?: Skin[];
  marks?: { x: number; y: number; sprite: string }[]; // case remplacée par un dessin (enseigne, emblème)
  decals?: Decal[];
  solidBase?: string; // dessin sous les cases N
  dark?: boolean; // plongé dans le noir : il faut la lampe
  /** Drapeau qui assèche l'eau toxique (~) de cette carte : elle devient praticable. */
  dryFlag?: string;
  voidTile?: string; // dessin au-delà des bords (sinon ruines dehors, noir dedans)
}

export class Builder {
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

export const exit = (id: string, x: number, y: number, door: Door): MapObject => ({ id, x, y, sprite: '', door });

export function objectAt(map: GameMap, x: number, y: number): MapObject | undefined {
  return map.objects.find((o) => o.x === x && o.y === y);
}

export function charAt(map: GameMap, x: number, y: number): string {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return '*';
  return map.rows[y][x];
}
