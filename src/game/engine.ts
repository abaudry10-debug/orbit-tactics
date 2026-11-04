import { CARDS, FLAGSHIP, STARTER_DECK, getCard } from './cards';
import type { Action, Cell, GameState, MovePattern, Piece, PlayerId, PowerCard, UnitCard } from './types';

export const SIZE = 6;
export const MAX_ENERGY = 8;
export const MAX_HAND = 7;
export const TURN_LIMIT = 30;

const KING_DIRS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];
const ORTHO = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const DIAG = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];

// ---------- utilitaires ----------

function rand(state: GameState): number {
  // mulberry32 : déterministe, pour rejouer une partie à l'identique côté serveur
  let t = (state.rng = (state.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffle(state: GameState, arr: string[]): string[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand(state) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < SIZE && y < SIZE;
export const pieceAt = (s: GameState, x: number, y: number) => s.pieces.find((p) => p.x === x && p.y === y);
export const pieceById = (s: GameState, id: number) => s.pieces.find((p) => p.id === id);
export const other = (p: PlayerId): PlayerId => (p === 0 ? 1 : 0);
export const forwardDir = (p: PlayerId) => (p === 0 ? -1 : 1);
export const deployRows = (p: PlayerId) => (p === 0 ? [SIZE - 1, SIZE - 2] : [0, 1]);
export const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const flagshipOf = (s: GameState, p: PlayerId) => s.pieces.find((x) => x.flagship && x.owner === p);

export function unitCardOf(piece: Piece): UnitCard | null {
  if (piece.flagship) return null;
  const c = getCard(piece.cardId);
  return c.kind === 'unit' ? c : null;
}

export const pieceName = (p: Piece) => (p.flagship ? FLAGSHIP.name : getCard(p.cardId).name);

function log(s: GameState, msg: string) {
  s.log.push(msg);
  if (s.log.length > 30) s.log.shift();
}

function clone(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s));
}

// ---------- mise en place ----------

export function createGame(seed = Date.now() % 2147483647): GameState {
  const s: GameState = {
    pieces: [],
    players: [
      { deck: [], hand: [], energy: 0, maxEnergy: 0, turnsTaken: 0 },
      { deck: [], hand: [], energy: 0, maxEnergy: 0, turnsTaken: 0 },
    ],
    current: 0,
    turn: 0,
    moved: false,
    cannonUsed: false,
    nextId: 1,
    rng: seed | 0,
    winner: null,
    log: [],
  };
  for (const p of [0, 1] as PlayerId[]) {
    s.players[p].deck = shuffle(s, STARTER_DECK);
    s.pieces.push({
      id: s.nextId++, cardId: 'flagship', owner: p,
      x: p === 0 ? 2 : 3, y: p === 0 ? SIZE - 1 : 0,
      hp: FLAGSHIP.hp, maxHp: FLAGSHIP.hp, atk: 0, atkBonus: 0,
      flagship: true, summonSick: false, acted: false, frozen: false,
    });
    const handSize = p === 0 ? 4 : 5;
    for (let i = 0; i < handSize; i++) draw(s, p);
  }
  startTurn(s);
  return s;
}

function draw(s: GameState, p: PlayerId) {
  const pl = s.players[p];
  const card = pl.deck.shift();
  if (!card) return;
  if (pl.hand.length >= MAX_HAND) {
    log(s, `Main pleine : ${getCard(card).name} est défaussée.`);
    return;
  }
  pl.hand.push(card);
}

function startTurn(s: GameState) {
  const p = s.current;
  const pl = s.players[p];
  s.turn += 1;
  pl.turnsTaken += 1;
  pl.maxEnergy = Math.min(MAX_ENERGY, pl.turnsTaken);
  pl.energy = pl.maxEnergy;
  s.moved = false;
  s.cannonUsed = false;
  for (const piece of s.pieces) {
    if (piece.owner === p) {
      piece.summonSick = false;
      piece.acted = false;
    }
  }
  draw(s, p);
}

// ---------- déplacements ----------

function rays(s: GameState, from: Cell, dirs: number[][], max: number): Cell[] {
  const out: Cell[] = [];
  for (const [dx, dy] of dirs) {
    for (let i = 1; i <= max; i++) {
      const x = from.x + dx * i;
      const y = from.y + dy * i;
      if (!inBounds(x, y) || pieceAt(s, x, y)) break;
      out.push({ x, y });
    }
  }
  return out;
}

function steps(s: GameState, from: Cell, dirs: number[][]): Cell[] {
  return dirs
    .map(([dx, dy]) => ({ x: from.x + dx, y: from.y + dy }))
    .filter((c) => inBounds(c.x, c.y) && !pieceAt(s, c.x, c.y));
}

function movePatternOf(p: Piece): MovePattern {
  if (p.flagship) return 'king';
  return unitCardOf(p)?.move ?? 'none';
}

export function canPieceMove(s: GameState, p: Piece): boolean {
  return p.owner === s.current && !s.moved && !p.summonSick && !p.frozen && s.winner === null;
}

export function canPieceAct(s: GameState, p: Piece): boolean {
  return p.owner === s.current && !p.acted && !p.summonSick && !p.frozen && s.winner === null;
}

export function moveTargets(s: GameState, pieceId: number): Cell[] {
  const p = pieceById(s, pieceId);
  if (!p || !canPieceMove(s, p)) return [];
  const f = forwardDir(p.owner);
  switch (movePatternOf(p)) {
    case 'king': return steps(s, p, KING_DIRS);
    case 'cross': return steps(s, p, ORTHO);
    case 'line2': return rays(s, p, ORTHO, 2);
    case 'line3': return rays(s, p, ORTHO, 3);
    case 'diag2': return rays(s, p, DIAG, 2);
    case 'knight': return steps(s, p, KNIGHT);
    case 'forward': return steps(s, p, [[0, f], [-1, 0], [1, 0]]);
    default: return [];
  }
}

// ---------- attaques et actions ----------

function firstInRay(s: GameState, from: Cell, dirs: number[][], max: number): Piece[] {
  const out: Piece[] = [];
  for (const [dx, dy] of dirs) {
    for (let i = 1; i <= max; i++) {
      const x = from.x + dx * i;
      const y = from.y + dy * i;
      if (!inBounds(x, y)) break;
      const hit = pieceAt(s, x, y);
      if (hit) {
        out.push(hit);
        break;
      }
    }
  }
  return out;
}

function adjacentPieces(s: GameState, c: Cell): Piece[] {
  return s.pieces.filter((p) => Math.max(Math.abs(p.x - c.x), Math.abs(p.y - c.y)) === 1);
}

export function effectiveAtk(p: Piece) {
  return p.atk + p.atkBonus;
}

/** Cases ennemies que la pièce peut attaquer (pour le Vaisseau amiral : le Canon principal). */
export function attackTargets(s: GameState, pieceId: number): Cell[] {
  const p = pieceById(s, pieceId);
  if (!p || !canPieceAct(s, p)) return [];
  let candidates: Piece[] = [];
  if (p.flagship) {
    if (s.cannonUsed || s.players[p.owner].energy < FLAGSHIP.cannonCost) return [];
    candidates = adjacentPieces(s, p);
  } else {
    const card = unitCardOf(p)!;
    if (effectiveAtk(p) <= 0) return [];
    switch (card.attack) {
      case 'adjacent': candidates = adjacentPieces(s, p); break;
      case 'lineShot3': candidates = firstInRay(s, p, ORTHO, 3); break;
      case 'lineShotInf': candidates = firstInRay(s, p, ORTHO, SIZE); break;
      case 'diagShot3': candidates = firstInRay(s, p, DIAG, 3); break;
      default: candidates = [];
    }
  }
  return candidates.filter((t) => t.owner !== p.owner).map((t) => ({ x: t.x, y: t.y }));
}

/** Cible(s) de l'action propre : alliés à réparer, alliés avec qui échanger, ou la pièce elle-même (autodestruction). */
export function abilityTargets(s: GameState, pieceId: number): Cell[] {
  const p = pieceById(s, pieceId);
  if (!p || p.flagship) return [];
  const card = unitCardOf(p)!;
  switch (card.effect) {
    case 'repair':
      if (!canPieceAct(s, p)) return [];
      return adjacentPieces(s, p).filter((a) => a.owner === p.owner && a.hp < a.maxHp).map((a) => ({ x: a.x, y: a.y }));
    case 'swap':
      if (!canPieceMove(s, p)) return [];
      return s.pieces.filter((a) => a.owner === p.owner && a.id !== p.id).map((a) => ({ x: a.x, y: a.y }));
    case 'selfDestruct':
      if (!canPieceAct(s, p)) return [];
      return [{ x: p.x, y: p.y }];
    default:
      return [];
  }
}

function damage(s: GameState, target: Piece, amount: number, source: string) {
  if (!s.pieces.includes(target)) return;
  const shielded = adjacentPieces(s, target).some(
    (a) => a.owner === target.owner && !a.flagship && unitCardOf(a)?.effect === 'shield',
  );
  const dmg = Math.max(0, amount - (shielded ? 1 : 0));
  target.hp -= dmg;
  log(s, `${source} inflige ${dmg} à ${pieceName(target)}${shielded ? ' (bouclier)' : ''}.`);
  if (target.hp <= 0) {
    s.pieces = s.pieces.filter((x) => x !== target);
    if (target.flagship) {
      s.winner = other(target.owner);
      log(s, `Le Vaisseau amiral du joueur ${target.owner + 1} est détruit !`);
    } else {
      log(s, `${pieceName(target)} est détruit.`);
    }
  }
}

// ---------- cartes ----------

export function playTargets(s: GameState, handIndex: number, first?: Cell): Cell[] {
  const me = s.current;
  const pl = s.players[me];
  const id = pl.hand[handIndex];
  if (!id || s.winner !== null) return [];
  const card = getCard(id);
  if (card.cost > pl.energy) return [];
  const all: Cell[] = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) all.push({ x, y });
  const units = (owner: PlayerId) => s.pieces.filter((p) => p.owner === owner && !p.flagship);
  const cells = (ps: Piece[]) => ps.map((p) => ({ x: p.x, y: p.y }));

  if (card.kind === 'unit') {
    const rows = deployRows(me);
    return all.filter((c) => rows.includes(c.y) && !pieceAt(s, c.x, c.y));
  }
  switch ((card as PowerCard).effect) {
    case 'overcharge': return cells(units(me));
    case 'hyperjump':
      if (!first) return cells(units(me));
      return all.filter((c) => !pieceAt(s, c.x, c.y));
    case 'freeze': return cells(units(other(me)));
    case 'repairPower': return cells(s.pieces.filter((p) => p.owner === me && p.hp < p.maxHp));
    case 'barrage': return cells(units(other(me)));
    case 'hack':
      return cells(units(other(me)).filter((p) => getCard(p.cardId).cost <= 3));
    default: return [];
  }
}

/** Une carte demande-t-elle une deuxième cible ? (Saut hyperspatial : l'unité, puis la destination.) */
export const needsSecondTarget = (cardId: string) => cardId === 'hyperjump';

function summon(s: GameState, card: UnitCard, at: Cell, owner: PlayerId): Piece {
  const piece: Piece = {
    id: s.nextId++, cardId: card.id, owner, x: at.x, y: at.y,
    hp: card.hp, maxHp: card.hp, atk: card.atk, atkBonus: 0,
    flagship: false, summonSick: true, acted: false, frozen: false,
  };
  s.pieces.push(piece);
  return piece;
}

// ---------- appliquer une action ----------

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

export function apply(prev: GameState, action: Action): Result {
  if (prev.winner !== null) return { ok: false, error: 'La partie est terminée.' };
  const s = clone(prev);
  const me = s.current;
  const pl = s.players[me];
  const fail = (error: string): Result => ({ ok: false, error });
  const isIn = (cells: Cell[], c?: Cell) => !!c && cells.some((x) => sameCell(x, c));

  switch (action.type) {
    case 'play': {
      const id = pl.hand[action.handIndex];
      if (!id) return fail('Carte introuvable.');
      const card = getCard(id);
      if (card.cost > pl.energy) return fail("Pas assez d'énergie.");
      if (!isIn(playTargets(prev, action.handIndex), action.target)) return fail('Cible invalide.');
      const t = action.target!;
      if (card.kind === 'power' && card.effect === 'hyperjump') {
        if (!isIn(playTargets(prev, action.handIndex, t), action.target2)) return fail('Destination invalide.');
      }
      pl.energy -= card.cost;
      pl.hand.splice(action.handIndex, 1);
      log(s, `Joueur ${me + 1} joue ${card.name}.`);

      if (card.kind === 'unit') {
        summon(s, card, t, me);
        if (card.effect === 'drawOnSummon') draw(s, me);
        if (card.effect === 'spawnNanite') {
          const spot = KING_DIRS.map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy })).find(
            (c) => inBounds(c.x, c.y) && !pieceAt(s, c.x, c.y),
          );
          if (spot) summon(s, CARDS.nanite as UnitCard, spot, me);
        }
        break;
      }
      const target = pieceAt(s, t.x, t.y)!;
      switch (card.effect) {
        case 'overcharge': target.atkBonus += 2; break;
        case 'hyperjump': target.x = action.target2!.x; target.y = action.target2!.y; break;
        case 'freeze': target.frozen = true; log(s, `${pieceName(target)} est gelé.`); break;
        case 'repairPower': target.hp = Math.min(target.maxHp, target.hp + 4); break;
        case 'barrage': damage(s, target, 3, card.name); break;
        case 'hack':
          target.owner = me;
          target.summonSick = true;
          target.frozen = false;
          log(s, `${pieceName(target)} passe dans le camp du joueur ${me + 1}.`);
          break;
      }
      break;
    }

    case 'move': {
      if (!isIn(moveTargets(prev, action.pieceId), action.to)) return fail('Déplacement impossible.');
      const p = pieceById(s, action.pieceId)!;
      p.x = action.to.x;
      p.y = action.to.y;
      s.moved = true;
      break;
    }

    case 'attack': {
      if (!isIn(attackTargets(prev, action.pieceId), action.target)) return fail('Cible hors de portée.');
      const p = pieceById(s, action.pieceId)!;
      const target = pieceAt(s, action.target.x, action.target.y)!;
      p.acted = true;
      if (p.flagship) {
        pl.energy -= FLAGSHIP.cannonCost;
        s.cannonUsed = true;
        damage(s, target, FLAGSHIP.cannonDamage, 'Canon principal');
        break;
      }
      const card = unitCardOf(p)!;
      const atk = effectiveAtk(p);
      if (card.effect === 'cleave') {
        const foes = adjacentPieces(s, p).filter((x) => x.owner !== me);
        for (const f of foes) damage(s, f, atk, card.name);
      } else {
        const around = card.effect === 'splash' ? adjacentPieces(s, target).filter((x) => x.owner !== me) : [];
        damage(s, target, atk, card.name);
        for (const a of around) damage(s, a, 1, `${card.name} (éclats)`);
        if (card.effect === 'stunOnHit' && s.pieces.includes(target)) {
          target.frozen = true;
          log(s, `${pieceName(target)} est neutralisé.`);
        }
      }
      break;
    }

    case 'ability': {
      if (!isIn(abilityTargets(prev, action.pieceId), action.target)) return fail('Action impossible.');
      const p = pieceById(s, action.pieceId)!;
      const card = unitCardOf(p)!;
      const t = action.target!;
      if (card.effect === 'repair') {
        const ally = pieceAt(s, t.x, t.y)!;
        ally.hp = Math.min(ally.maxHp, ally.hp + 2);
        p.acted = true;
        log(s, `${card.name} répare ${pieceName(ally)}.`);
      } else if (card.effect === 'swap') {
        const ally = pieceAt(s, t.x, t.y)!;
        const [px, py] = [p.x, p.y];
        p.x = ally.x; p.y = ally.y;
        ally.x = px; ally.y = py;
        s.moved = true;
        log(s, `${card.name} échange sa place avec ${pieceName(ally)}.`);
      } else if (card.effect === 'selfDestruct') {
        const foes = adjacentPieces(s, p).filter((x) => x.owner !== me);
        s.pieces = s.pieces.filter((x) => x.id !== p.id);
        log(s, `${card.name} explose !`);
        for (const f of foes) damage(s, f, 2, card.name);
      }
      break;
    }

    case 'endTurn': {
      for (const piece of s.pieces) {
        piece.atkBonus = 0;
        if (piece.owner === me) piece.frozen = false;
      }
      if (s.turn >= TURN_LIMIT) {
        const a = flagshipOf(s, 0)?.hp ?? 0;
        const b = flagshipOf(s, 1)?.hp ?? 0;
        s.winner = a === b ? 'draw' : a > b ? 0 : 1;
        log(s, 'Limite de tours atteinte.');
        break;
      }
      s.current = other(me);
      startTurn(s);
      break;
    }
  }
  return { ok: true, state: s };
}

/** Toutes les actions légales du joueur courant (utilisé par le bot, et plus tard par le serveur). */
export function legalActions(s: GameState): Action[] {
  if (s.winner !== null) return [];
  const out: Action[] = [{ type: 'endTurn' }];
  const pl = s.players[s.current];
  pl.hand.forEach((id, handIndex) => {
    for (const target of playTargets(s, handIndex)) {
      if (needsSecondTarget(id)) {
        for (const target2 of playTargets(s, handIndex, target)) out.push({ type: 'play', handIndex, target, target2 });
      } else out.push({ type: 'play', handIndex, target });
    }
  });
  for (const p of s.pieces.filter((x) => x.owner === s.current)) {
    for (const to of moveTargets(s, p.id)) out.push({ type: 'move', pieceId: p.id, to });
    for (const target of attackTargets(s, p.id)) out.push({ type: 'attack', pieceId: p.id, target });
    for (const target of abilityTargets(s, p.id)) out.push({ type: 'ability', pieceId: p.id, target });
  }
  return out;
}
