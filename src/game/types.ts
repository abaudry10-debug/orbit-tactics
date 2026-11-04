// Types du moteur de règles. Ce module ne dépend ni de React ni d'Expo :
// il tournera tel quel sur le serveur multijoueur.

export type PlayerId = 0 | 1;

export interface Cell {
  x: number; // colonne, 0 à 5
  y: number; // rangée, 0 (en haut) à 5 (en bas)
}

export type MovePattern =
  | 'king' // 1 case, 8 directions
  | 'cross' // 1 case, orthogonale
  | 'line2'
  | 'line3'
  | 'diag2'
  | 'knight' // en L, saute par-dessus les pièces
  | 'forward' // 1 case vers l'avant ou sur les côtés
  | 'none';

export type AttackPattern =
  | 'adjacent' // 8 cases autour
  | 'lineShot3' // première pièce en ligne droite, jusqu'à 3 cases
  | 'lineShotInf' // première pièce en ligne droite, sans limite
  | 'diagShot3' // première pièce en diagonale, jusqu'à 3 cases
  | 'none';

export type UnitEffect =
  | 'drawOnSummon'
  | 'spawnNanite'
  | 'repair'
  | 'stunOnHit'
  | 'selfDestruct'
  | 'splash'
  | 'swap'
  | 'shield'
  | 'cleave';

export type PowerEffect = 'overcharge' | 'hyperjump' | 'freeze' | 'repairPower' | 'barrage' | 'hack';

export interface UnitCard {
  id: string;
  kind: 'unit';
  name: string;
  cost: number;
  atk: number;
  hp: number;
  move: MovePattern;
  attack: AttackPattern;
  effect?: UnitEffect;
  text: string;
  glyph: string;
  token?: boolean; // créé par un effet, jamais dans un deck
}

export interface PowerCard {
  id: string;
  kind: 'power';
  name: string;
  cost: number;
  effect: PowerEffect;
  text: string;
  glyph: string;
}

export type Card = UnitCard | PowerCard;

export interface Piece {
  id: number;
  cardId: string; // 'flagship' pour le Vaisseau amiral
  owner: PlayerId;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  atk: number;
  atkBonus: number; // bonus jusqu'à la fin du tour (Surcharge)
  flagship: boolean;
  summonSick: boolean; // « en saut » : vient d'arriver
  acted: boolean; // a déjà attaqué ou utilisé son action ce tour
  frozen: boolean; // ne peut ni bouger ni agir jusqu'à la fin du prochain tour de son camp
}

export interface PlayerState {
  deck: string[];
  hand: string[];
  energy: number;
  maxEnergy: number;
  turnsTaken: number;
}

export type Winner = PlayerId | 'draw' | null;

export interface GameState {
  pieces: Piece[];
  players: [PlayerState, PlayerState];
  current: PlayerId;
  turn: number; // nombre total de tours commencés (les deux joueurs)
  moved: boolean; // la pièce du tour a-t-elle déjà été déplacée ?
  cannonUsed: boolean;
  nextId: number;
  rng: number; // graine du générateur pseudo-aléatoire
  winner: Winner;
  log: string[];
}

export type Action =
  | { type: 'play'; handIndex: number; target?: Cell; target2?: Cell }
  | { type: 'move'; pieceId: number; to: Cell }
  | { type: 'attack'; pieceId: number; target: Cell }
  | { type: 'ability'; pieceId: number; target?: Cell }
  | { type: 'endTurn' };
