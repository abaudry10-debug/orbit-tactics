import { getCard } from './cards';
import { apply, flagshipOf, legalActions, other, unitCardOf } from './engine';
import type { Action, GameState, PlayerId } from './types';

// Bot glouton : à chaque étape, il essaie toutes les actions légales,
// garde celle qui améliore le plus son évaluation, et termine son tour
// quand plus rien n'améliore la position.

function pieceValue(atk: number, hp: number) {
  return atk * 2 + hp;
}

export function evaluate(s: GameState, me: PlayerId): number {
  if (s.winner === me) return 1e6;
  if (s.winner !== null && s.winner !== 'draw') return -1e6;
  const them = other(me);
  const myFlag = flagshipOf(s, me);
  const theirFlag = flagshipOf(s, them);
  let score = ((myFlag?.hp ?? 0) - (theirFlag?.hp ?? 0)) * 4;

  for (const p of s.pieces) {
    if (p.flagship) continue;
    const card = unitCardOf(p);
    const base = pieceValue(p.atk, p.hp) + (card?.cost ?? 0);
    let v = base;
    // se rapprocher du Vaisseau amiral adverse
    const target = p.owner === me ? theirFlag : myFlag;
    if (target) {
      const dist = Math.max(Math.abs(p.x - target.x), Math.abs(p.y - target.y));
      v += (6 - dist) * 0.6;
    }
    if (p.frozen) v -= 2;
    score += p.owner === me ? v : -v;
  }
  // garder de l'énergie inutilisée ne sert à rien : légère pénalité
  score -= s.players[me].energy * 0.3;
  // une carte en main vaut un peu
  score += s.players[me].hand.length * 0.5;
  return score;
}

export function chooseBotAction(s: GameState): Action {
  const me = s.current;
  const current = evaluate(s, me);
  let best: Action = { type: 'endTurn' };
  let bestScore = current + 0.01; // ne bouger que si c'est mieux
  for (const action of legalActions(s)) {
    if (action.type === 'endTurn') continue;
    const r = apply(s, action);
    if (!r.ok) continue;
    let score = evaluate(r.state, me);
    // jouer une carte coûte la carte en main : on compense par sa valeur
    if (action.type === 'play') score += getCard(s.players[me].hand[action.handIndex]).cost * 0.8;
    if (score > bestScore) {
      bestScore = score;
      best = action;
    }
  }
  return best;
}
