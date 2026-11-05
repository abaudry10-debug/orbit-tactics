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
  style: 'lab' | 'res' | 'metro' | 'spatio' | 'helios' | 'house' | 'obs';
}

/** Grand décor dessiné par-dessus les cases (navette, antenne…), aligné sur le bas de son emprise. */
export interface Decal {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'shuttle' | 'dish' | 'tower' | 'radioTower' | 'train' | 'bigTree';
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
      { id: 'pixelSleep', x: 3, y: 3, sprite: 'dogSleep', hiddenUntil: 'pixelSleep' },
      { id: 'capsuleA', x: 4, y: 2, sprite: 'capsuleFrost', script: 'capsuleFrost' },
      { id: 'capsuleB', x: 6, y: 2, sprite: 'capsuleFrost', script: 'capsuleFrost' },
      { id: 'terminal', x: 9, y: 2, sprite: 'terminal', script: 'terminal' },
      { id: 'heatAlert', x: 8, y: 1, sprite: 'heatAlert', script: 'heatAlert' },
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
  b.rect(29, 1, 4, 2, 'K'); // abri de chantier, au milieu du lac : porte en (30,2)
  b.rect(3, 13, 7, 4, '#').rect(11, 13, 5, 3, '#').rect(25, 13, 4, 3, '#');
  b.rect(31, 12, 7, 4, '#'); // centre de recherche, porte en (34,15)
  b.rect(3, 24, 5, 3, '#');
  b.rect(10, 18, 5, 3, '#'); // bouche de métro, escalier en (12,20)
  b.rect(24, 24, 14, 4, 'H'); // aire d'envol du spatioport
  b.rect(31, 20, 7, 4, '#'); // spatioport, portes en (34,23)
  b.rect(25, 25, 4, 2, 'N'); // navette écrasée

  b.border('*');
  b.rect(0, 9, 1, 3, ',').set(0, 10, '-'); // sortie ouest : toute la largeur de l'avenue
  b.rect(19, 29, 3, 1, ','); // sortie sud : toute la largeur de la rue
  b.points('T', [[1, 1], [2, 1], [13, 1], [38, 7], [1, 14], [1, 27], [12, 23], [22, 26], [38, 13], [16, 7], [33, 8]]);
  b.points('*', [[12, 1], [22, 1], [23, 1], [17, 13], [23, 14], [9, 22], [14, 23], [26, 18], [37, 18], [1, 18], [17, 28], [23, 27]]); // gravats sur les bas-côtés, jamais sur la route
  b.points('C', [[14, 10], [27, 9], [20, 14], [6, 11], [34, 11]]);

  return {
    id: 'vesper',
    name: 'Ruines de Vesper',
    outdoor: true,
    width: b.width,
    height: b.height,
    rows: b.rows,
    dryFlag: 'pondDry',
    objects: [
      { id: 'chantierDoor', x: 30, y: 2, sprite: 'shackDoor', door: { to: 'chantier', x: 4, y: 4, dir: 'up' } },
      { id: 'chantierSign', x: 23, y: 6, sprite: 'sign', script: 'chantierSign' },
      { id: 'labEntrance', x: 7, y: 5, sprite: 'labDoorOpen', script: 'labEntrance', door: { to: 'lab', x: 5, y: 8, dir: 'up' } },
      { id: 'signVesper', x: 9, y: 7, sprite: 'sign', script: 'signVesper' },
      { id: 'thermo', x: 13, y: 12, sprite: 'thermometer', script: 'thermometer' },
      { id: 'posterShade', x: 6, y: 16, sprite: 'poster', script: 'posterShade' },
      { id: 'robot', x: 30, y: 14, sprite: 'robot', script: 'robot' },
      { id: 'missionPlaque', x: 20, y: 19, sprite: 'monument', script: 'missionPlaque' },
      { id: 'pixelOff', x: 23, y: 7, sprite: 'dogOff', script: 'pixelOff', hideWhen: 'pixelOn' },
      { id: 'memoCard1', x: 22, y: 7, sprite: 'memoCard', script: 'memoCard1', hideWhen: 'memo1Found' },
      { id: 'shinyCar', x: 34, y: 11, sprite: 'car', script: 'shinyCar' },
      { id: 'noteLea', x: 24, y: 8, sprite: 'note', script: 'noteLea' },
      { id: 'crate1', x: 17, y: 25, sprite: 'crate', script: 'crate' },
      { id: 'metro', x: 12, y: 20, sprite: 'stairs', script: 'metro', door: { to: 'metro', x: 5, y: 2, dir: 'down', needs: 'hasLamp' } },
      {
        id: 'spatioport', x: 34, y: 23, sprite: 'bunkerDoor', spriteWhen: ['heliosOn', 'bunkerDoorOpen'], script: 'spatioport',
        door: { to: 'spatioportInt', x: 11, y: 10, dir: 'up', needs: 'heliosOn' },
      },
      {
        id: 'researchDoor', x: 34, y: 15, sprite: 'bunkerDoor', spriteWhen: ['researchOpen', 'bunkerDoorOpen'], script: 'researchDoor',
        door: { to: 'research', x: 10, y: 12, dir: 'up', needs: 'researchOpen' },
      },
      ...[9, 10, 11].map((y) => exit(`toQuartier${y}`, 0, y, { to: 'quartier', x: 34, y: y + 2, dir: 'left' })),
      ...[19, 20, 21].map((x) => exit(`toCentrale${x}`, x, 29, { to: 'centrale', x: x - 5, y: 1, dir: 'down' })),
      { id: 'signToQuartier', x: 1, y: 8, sprite: 'signLeft', script: 'signToQuartier' },
      { id: 'signToCentrale', x: 22, y: 28, sprite: 'signDown', script: 'signToCentrale' },
    ],
    skins: [
      { x: 3, y: 1, w: 9, h: 5, style: 'lab' },
      { x: 31, y: 12, w: 7, h: 4, style: 'res' },
      { x: 10, y: 18, w: 5, h: 3, style: 'metro' },
      { x: 31, y: 20, w: 7, h: 4, style: 'spatio' },
    ],
    marks: [
      { x: 9, y: 5, sprite: 'labEmblem' }, { x: 5, y: 5, sprite: 'labEmblem' },
      { x: 32, y: 15, sprite: 'atomEmblem' }, { x: 36, y: 15, sprite: 'atomEmblem' },
      { x: 11, y: 20, sprite: 'metroSign' }, { x: 13, y: 20, sprite: 'metroSign' },
      { x: 32, y: 23, sprite: 'rocketEmblem' }, { x: 36, y: 23, sprite: 'rocketEmblem' },
    ],
    decals: [
      { x: 25, y: 25, w: 4, h: 2, kind: 'shuttle' },
      { x: 33, y: 13, w: 2, h: 1, kind: 'dish' },
    ],
  };
}

// ---------- Quartier résidentiel (extérieur, à l'ouest) ----------
function buildQuartier(): GameMap {
  const b = new Builder(36, 26, '.');
  b.rect(2, 8, 5, 2, '"').rect(20, 2, 3, 3, '"').rect(10, 21, 6, 3, '"').rect(30, 8, 4, 2, '"');
  b.rect(1, 11, 35, 3, ',').rect(1, 12, 35, 1, '-'); // rue principale
  b.rect(11, 14, 3, 6, ','); // allée vers le sud

  b.rect(3, 2, 7, 5, '#'); // maison Moreau (Betti), porte en (6,6)
  b.rect(13, 2, 6, 5, '#'); // maison du pilote
  b.rect(24, 2, 7, 5, '#'); // maison du radioamateur
  b.rect(3, 16, 6, 4, '#');
  b.rect(16, 16, 4, 4, '#');
  b.rect(22, 16, 6, 4, 'v'); // potager desséché
  b.rect(21, 15, 8, 1, '|').rect(21, 20, 8, 1, '|').rect(21, 16, 1, 4, '|').rect(28, 16, 1, 3, '|');
  b.rect(30, 17, 4, 5, '*'); // château d'eau effondré
  b.rect(23, 23, 2, 1, 'N'); // le grand arbre, sous le potager

  b.border('*');
  b.rect(35, 11, 1, 3, ',').set(35, 12, '-'); // sortie est : toute la largeur de la rue
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
      {
        id: 'leaHouse', x: 6, y: 6, sprite: 'houseDoor', script: 'leaHouse',
        door: { to: 'maisonLea', x: 5, y: 6, dir: 'up', needs: 'leaOpen' },
      },
      { id: 'leaMailbox', x: 8, y: 8, sprite: 'sign', script: 'leaMailbox' },
      { id: 'motherJournal', x: 16, y: 8, sprite: 'note', script: 'motherJournal' },
      { id: 'pilotHouse', x: 15, y: 6, sprite: 'houseDoor', script: 'pilotHouse' },
      { id: 'radioNotes', x: 28, y: 8, sprite: 'note', script: 'radioNotes' },
      { id: 'radioHouse', x: 27, y: 6, sprite: 'houseDoor', script: 'radioHouse' },
      { id: 'ticket', x: 3, y: 10, sprite: 'note', script: 'ticket' },
      { id: 'letter', x: 6, y: 21, sprite: 'note', script: 'letter' },
      { id: 'frecklesLetter', x: 17, y: 20, sprite: 'note', script: 'frecklesLetter' },
      { id: 'garden', x: 27, y: 21, sprite: 'plantsSign', script: 'garden' },
      { id: 'shed', x: 29, y: 19, sprite: 'shed', script: 'shed' },
      { id: 'thermo2', x: 18, y: 14, sprite: 'thermometer', script: 'thermometer2' },
      { id: 'tank', x: 31, y: 22, sprite: 'crate', script: 'tank' },
      // la trappe de la cabane : invisible et franchissable tant qu'on ne l'a pas trouvée
      {
        id: 'cabinHatch', x: 26, y: 23, sprite: 'trapdoor', script: 'cabinHatch', hiddenUntil: 'knowsCabin',
        door: { to: 'cabane', x: 4, y: 4, dir: 'up', needs: 'knowsCabin' },
      },
      ...[11, 12, 13].map((y) => exit(`toVesper${y}`, 35, y, { to: 'vesper', x: 1, y: y - 2, dir: 'right' })),
      { id: 'signToVesperE', x: 34, y: 10, sprite: 'signRight', script: 'signToVesper' },
    ],
    skins: [
      { x: 3, y: 2, w: 7, h: 5, style: 'house' },
      { x: 13, y: 2, w: 6, h: 5, style: 'house' },
      { x: 24, y: 2, w: 7, h: 5, style: 'house' },
      { x: 3, y: 16, w: 6, h: 4, style: 'house' },
      { x: 16, y: 16, w: 4, h: 4, style: 'house' },
    ],
    decals: [{ x: 23, y: 23, w: 2, h: 1, kind: 'bigTree' }],
    solidBase: 'dust',
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
  b.set(26, 8, 'N'); // tour solaire
  b.border('*');
  b.rect(14, 0, 3, 1, '.'); // sortie nord : toute la largeur de la piste
  return {
    id: 'centrale',
    name: 'Centrale solaire Hélios',
    outdoor: true,
    width: b.width,
    height: b.height,
    rows: b.rows,
    objects: [
      { id: 'heliosSign', x: 13, y: 6, sprite: 'sign', script: 'heliosSign' },
      { id: 'controlPanel', x: 19, y: 12, sprite: 'crate', script: 'controlPanel' },
      {
        id: 'heliosDoor', x: 21, y: 10, sprite: 'heliosDoor', spriteWhen: ['turbinesOpen', 'bunkerDoorOpen'], script: 'heliosDoor',
        door: { to: 'turbines', x: 6, y: 6, dir: 'up', needs: 'turbinesOpen' },
      },
      ...[14, 15, 16].map((x) => exit(`toVesperN${x}`, x, 0, { to: 'vesper', x: x + 5, y: 28, dir: 'up' })),
      { id: 'signToVesperN', x: 17, y: 1, sprite: 'signUpSand', script: 'signToVesper' },
    ],
    energy: [{ x: 22, y: 13, goneWhen: 'batteryFound' }],
    skins: [{ x: 18, y: 7, w: 7, h: 4, style: 'helios' }],
    marks: [{ x: 19, y: 10, sprite: 'sunEmblem' }, { x: 23, y: 10, sprite: 'sunEmblem' }],
    decals: [{ x: 26, y: 8, w: 1, h: 1, kind: 'tower' }],
    solidBase: 'sand',
  };
}

// ---------- Étape 2 : maison de Betti (intérieur) ----------
function buildMaisonLea(): GameMap {
  const b = new Builder(10, 8, 'w');
  b.border('Y').rect(1, 1, 8, 1, 'Y');
  return {
    id: 'maisonLea', name: 'Chez Betti', outdoor: false, width: b.width, height: b.height, rows: b.rows,
    objects: [
      { id: 'leaBed', x: 2, y: 2, sprite: 'bed', script: 'leaBed' },
      { id: 'leaDrawings', x: 5, y: 1, sprite: 'drawings', script: 'leaDrawings' },
      { id: 'leaDiary', x: 7, y: 2, sprite: 'desk', script: 'leaDiary' },
      { id: 'leaToys', x: 8, y: 5, sprite: 'toybox', script: 'leaToys' },
      { id: 'pixelBasket', x: 2, y: 5, sprite: 'dogBasket', script: 'pixelBasket' },
      { id: 'leaExit', x: 5, y: 7, sprite: 'houseDoor', door: { to: 'quartier', x: 6, y: 7, dir: 'down' } },
    ],
  };
}

// ---------- Étape 2 : la cabane secrète de Betti ----------
function buildCabane(): GameMap {
  const b = new Builder(8, 6, 'w');
  b.border('K').rect(1, 1, 6, 1, 'K');
  return {
    id: 'cabane', name: 'La cabane secrète', outdoor: false, width: b.width, height: b.height, rows: b.rows,
    objects: [
      { id: 'lampBox', x: 2, y: 2, sprite: 'lampBox', spriteWhen: ['hasLamp', 'lampBoxEmpty'], script: 'lampBox' },
      { id: 'leaLastNote', x: 5, y: 2, sprite: 'note', script: 'leaLastNote' },
      { id: 'musicBox', x: 6, y: 3, sprite: 'musicBox', script: 'musicBox' },
      { id: 'cabaneExit', x: 4, y: 5, sprite: 'plankFront', door: { to: 'quartier', x: 26, y: 24, dir: 'down' } },
    ],
  };
}

// ---------- Étape 2 : le métro (dans le noir) ----------
function buildMetro(): GameMap {
  const b = new Builder(40, 14, 'W');
  b.rect(1, 8, 38, 2, 'r'); // la voie, d'un bout à l'autre
  // trois stations : Centre, Marée, Colline
  for (const [x, w] of [[1, 10], [15, 9], [31, 8]] as const) b.rect(x, 2, w, 5, 'm').rect(x, 7, w, 1, '_');
  b.rect(26, 10, 13, 3, 'm'); // dépôt sous la voie
  b.rect(28, 11, 6, 1, 'N'); // rame figée
  return {
    id: 'metro', name: 'Métro — ligne 2', outdoor: false, dark: true, width: b.width, height: b.height, rows: b.rows,
    solidBase: 'rails',
    objects: [
      { id: 'metroUpCentre', x: 5, y: 1, sprite: 'metroStairsUp', door: { to: 'vesper', x: 12, y: 21, dir: 'down' } },
      { id: 'lazarePoster', x: 3, y: 1, sprite: 'lazarePoster', script: 'lazarePoster' },
      { id: 'networkMap', x: 8, y: 1, sprite: 'networkMap', script: 'networkMap' },
      { id: 'mareeSign', x: 17, y: 1, sprite: 'networkMap', script: 'mareeSign' },
      { id: 'lostFound', x: 20, y: 2, sprite: 'counter', script: 'lostFound' },
      { id: 'metroTicket', x: 23, y: 5, sprite: 'note', script: 'metroTicket' },
      { id: 'memoCard3', x: 33, y: 6, sprite: 'memoCard', script: 'memoCard3', hideWhen: 'memo3Found' },
      { id: 'caisson', x: 36, y: 11, sprite: 'caisson', spriteWhen: ['noyauFound', 'caissonEmpty'], script: 'caisson' },
      { id: 'metroUpColline', x: 35, y: 1, sprite: 'metroStairsUp', door: { to: 'colline', x: 4, y: 11, dir: 'down' } },
    ],
    decals: [{ x: 28, y: 11, w: 6, h: 1, kind: 'train' }],
  };
}

// ---------- Étape 2 : la colline de l'observatoire ----------
function buildColline(): GameMap {
  const b = new Builder(26, 20, '.');
  b.rect(2, 2, 6, 4, '"').rect(16, 13, 6, 4, '"');
  b.rect(10, 3, 7, 5, '#'); // observatoire
  b.rect(3, 9, 3, 1, '#'); // abri de la bouche de métro
  b.set(20, 8, 'N'); // tour radio
  b.border('*');
  b.points('T', [[2, 15], [8, 17], [23, 4], [13, 15]]);
  b.points('*', [[18, 3], [7, 13], [22, 11]]);
  return {
    id: 'colline', name: 'Colline de l’observatoire', outdoor: true, width: b.width, height: b.height, rows: b.rows,
    objects: [
      { id: 'collineStairs', x: 4, y: 10, sprite: 'stairs', door: { to: 'metro', x: 35, y: 2, dir: 'down' } },
      {
        id: 'obsDoor', x: 13, y: 7, sprite: 'obsDoor', spriteWhen: ['obsOpen', 'labDoorOpen'], script: 'obsDoor',
        door: { to: 'observatoire', x: 6, y: 7, dir: 'up', needs: 'obsOpen' },
      },
      { id: 'obsConsole', x: 15, y: 9, sprite: 'console', script: 'obsConsole' },
      { id: 'obsLog', x: 11, y: 9, sprite: 'note', script: 'obsLog' },
      { id: 'towerLadder', x: 20, y: 9, sprite: 'towerBase', script: 'towerLadder', door: { to: 'sommet', x: 4, y: 4, dir: 'up' } },
    ],
    skins: [{ x: 10, y: 3, w: 7, h: 5, style: 'obs' }],
    decals: [{ x: 19, y: 8, w: 2, h: 1, kind: 'radioTower' }],
    solidBase: 'dust',
  };
}

// ---------- Étape 2 : le sommet de la tour radio ----------
function buildSommet(): GameMap {
  const b = new Builder(9, 7, 'k');
  b.rect(2, 2, 5, 3, 'g');
  return {
    id: 'sommet', name: 'Sommet de la tour radio', outdoor: true, width: b.width, height: b.height, rows: b.rows,
    voidTile: 'sky',
    objects: [
      { id: 'bigAntenna', x: 4, y: 2, sprite: 'antennaBase', script: 'bigAntenna' },
      { id: 'sommetLadder', x: 4, y: 5, sprite: 'ladder', door: { to: 'colline', x: 20, y: 10, dir: 'down' } },
    ],
  };
}

// ---------- Étape 3 : salle des turbines d'Hélios ----------
function buildTurbines(): GameMap {
  const b = new Builder(12, 8, 'm');
  b.border('W').rect(1, 1, 10, 1, 'W');
  return {
    id: 'turbines', name: 'Salle des turbines', outdoor: false, width: b.width, height: b.height, rows: b.rows,
    objects: [
      { id: 'switchPanel', x: 6, y: 1, sprite: 'switchPanel', spriteWhen: ['heliosOn', 'switchPanelOn'], script: 'switchPanel' },
      { id: 'restartPlaque', x: 8, y: 1, sprite: 'plaque', script: 'restartPlaque' },
      { id: 'turbineA', x: 2, y: 3, sprite: 'turbine', script: 'turbine' },
      { id: 'turbineB', x: 9, y: 3, sprite: 'turbine', script: 'turbine' },
      { id: 'techNote', x: 2, y: 6, sprite: 'note', script: 'techNote' },
      { id: 'turbinesExit', x: 6, y: 7, sprite: 'metroStairsUp', door: { to: 'centrale', x: 21, y: 11, dir: 'down' } },
    ],
  };
}

// ---------- Étape 3 : intérieur de l'observatoire ----------
function buildObservatoire(): GameMap {
  const b = new Builder(12, 9, '=');
  b.border('X').rect(1, 1, 10, 1, 'X');
  return {
    id: 'observatoire', name: 'Observatoire', outdoor: false, width: b.width, height: b.height, rows: b.rows,
    objects: [
      { id: 'telescope', x: 6, y: 3, sprite: 'telescope', script: 'telescope' },
      { id: 'orbitChart', x: 3, y: 1, sprite: 'orbitChart', script: 'orbitChart' },
      { id: 'obsJournal', x: 9, y: 4, sprite: 'desk', script: 'obsJournal' },
      { id: 'obsExit', x: 6, y: 8, sprite: 'labDoorOpen', door: { to: 'colline', x: 13, y: 8, dir: 'down' } },
    ],
  };
}

// ---------- Étape 3 : le spatioport (hangar et salle de contrôle) ----------
function buildSpatioportInt(): GameMap {
  const b = new Builder(22, 12, 'H');
  b.border('X').rect(1, 1, 20, 1, 'X');
  b.rect(12, 2, 1, 9, 'X').set(12, 6, '='); // cloison de la salle de contrôle, avec un passage
  b.rect(13, 2, 8, 9, '=');
  b.rect(2, 3, 4, 2, 'N').rect(2, 7, 4, 2, 'N'); // navettes clouées au sol
  return {
    id: 'spatioportInt', name: 'Spatioport — hangar', outdoor: false, width: b.width, height: b.height, rows: b.rows,
    solidBase: 'pad',
    objects: [
      { id: 'missionBoard', x: 16, y: 1, sprite: 'missionBoard', script: 'missionBoard' },
      { id: 'varnDesk', x: 19, y: 4, sprite: 'varnDesk', script: 'varnDesk' },
      { id: 'codebook', x: 18, y: 8, sprite: 'book', script: 'codebook' },
      { id: 'hangarNote', x: 8, y: 5, sprite: 'note', script: 'hangarNote' },
      { id: 'archiveTerm', x: 15, y: 8, sprite: 'archiveTerm', script: 'archiveTerm' },
      { id: 'cultureDoor', x: 8, y: 1, sprite: 'labDoorOpen', door: { to: 'culture', x: 6, y: 7, dir: 'up' } },
      { id: 'spatioExit', x: 11, y: 11, sprite: 'labDoorOpen', door: { to: 'vesper', x: 34, y: 24, dir: 'down' } },
    ],
    decals: [
      { x: 2, y: 3, w: 4, h: 2, kind: 'shuttle' },
      { x: 2, y: 7, w: 4, h: 2, kind: 'shuttle' },
    ],
  };
}

// ---------- Abri de chantier, au milieu du lac toxique ----------
function buildChantier(): GameMap {
  const b = new Builder(9, 6, 'w');
  b.border('K').rect(1, 1, 7, 1, 'K');
  return {
    id: 'chantier', name: 'Abri de chantier', outdoor: false, width: b.width, height: b.height, rows: b.rows,
    objects: [
      { id: 'suitLocker', x: 2, y: 2, sprite: 'locker', spriteWhen: ['suitTaken', 'lockerOpen'], script: 'suitLocker' },
      { id: 'workerNote', x: 5, y: 2, sprite: 'note', script: 'workerNote' },
      { id: 'chantierCrate', x: 7, y: 3, sprite: 'crate', script: 'chantierCrate' },
      { id: 'chantierExit', x: 4, y: 5, sprite: 'labDoorOpen', door: { to: 'vesper', x: 30, y: 3, dir: 'down' } },
    ],
  };
}

// ---------- Laboratoire de culture, derrière le hangar ----------
function buildCulture(): GameMap {
  const b = new Builder(12, 9, '=');
  b.border('X').rect(1, 1, 10, 1, 'X');
  return {
    id: 'culture', name: 'Laboratoire de culture', outdoor: false, width: b.width, height: b.height, rows: b.rows,
    objects: [
      { id: 'tankA', x: 2, y: 2, sprite: 'cultureTank', script: 'tankFull' },
      { id: 'tankB', x: 4, y: 2, sprite: 'cultureTankEmpty', script: 'tankEmpty' },
      { id: 'tankC', x: 6, y: 2, sprite: 'cultureTank', script: 'tankFull' },
      { id: 'tankD', x: 8, y: 2, sprite: 'cultureTankBroken', script: 'tankBroken' },
      { id: 'cultureBoard', x: 10, y: 1, sprite: 'whiteboard', script: 'cultureBoard' },
      { id: 'cultureCrateA', x: 2, y: 6, sprite: 'crate', script: 'cultureCrates' },
      { id: 'cultureCrateB', x: 3, y: 6, sprite: 'crate', script: 'cultureCrates' },
      { id: 'cultureDesk', x: 9, y: 5, sprite: 'desk', script: 'cultureDesk' },
      { id: 'cultureExit', x: 6, y: 8, sprite: 'labDoorOpen', door: { to: 'spatioportInt', x: 8, y: 2, dir: 'down' } },
    ],
  };
}

export const MAPS: Record<string, GameMap> = {
  lab: buildLab(),
  vesper: buildVesper(),
  quartier: buildQuartier(),
  research: buildResearch(),
  centrale: buildCentrale(),
  maisonLea: buildMaisonLea(),
  cabane: buildCabane(),
  metro: buildMetro(),
  colline: buildColline(),
  sommet: buildSommet(),
  turbines: buildTurbines(),
  observatoire: buildObservatoire(),
  spatioportInt: buildSpatioportInt(),
  culture: buildCulture(),
  chantier: buildChantier(),
};

export const START = { map: 'lab', x: 2, y: 3, dir: 'down' as Dir };

export function objectAt(map: GameMap, x: number, y: number): MapObject | undefined {
  return map.objects.find((o) => o.x === x && o.y === y);
}

export function charAt(map: GameMap, x: number, y: number): string {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return '*';
  return map.rows[y][x];
}
