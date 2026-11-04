import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_DECK } from '../src/game/cards';
import { apply, attackTargets, createGame, flagshipOf, legalActions, moveTargets, playTargets } from '../src/game/engine';
import { chooseBotAction } from '../src/game/bot';
import type { Action, GameState } from '../src/game/types';

function must(s: GameState, a: Action): GameState {
  const r = apply(s, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

test('le deck de départ compte 20 cartes', () => {
  assert.equal(STARTER_DECK.length, 20);
});

test('mise en place : mains, énergie, Vaisseaux amiraux', () => {
  const s = createGame(42);
  assert.equal(s.players[0].hand.length, 5); // 4 + pioche du premier tour
  assert.equal(s.players[1].hand.length, 5);
  assert.equal(s.players[0].energy, 1);
  assert.equal(flagshipOf(s, 0)?.hp, 20);
  assert.equal(s.pieces.length, 2);
});

test('une unité invoquée est en saut puis peut bouger au tour suivant', () => {
  let s = createGame(1);
  s.players[0].hand = ['trooper'];
  s = must(s, { type: 'play', handIndex: 0, target: { x: 0, y: 5 } });
  const id = s.pieces.find((p) => p.cardId === 'trooper')!.id;
  assert.equal(moveTargets(s, id).length, 0);
  s = must(s, { type: 'endTurn' });
  s = must(s, { type: 'endTurn' });
  assert.ok(moveTargets(s, id).length > 0);
});

test('un seul déplacement par tour', () => {
  let s = createGame(2);
  const flag = flagshipOf(s, 0)!;
  s = must(s, { type: 'move', pieceId: flag.id, to: { x: 2, y: 4 } });
  assert.equal(moveTargets(s, flag.id).length, 0);
  assert.equal(apply(s, { type: 'move', pieceId: flag.id, to: { x: 2, y: 3 } }).ok, false);
});

test('déploiement limité aux deux rangées du fond', () => {
  const s = createGame(3);
  s.players[0].hand = ['trooper'];
  const cells = playTargets(s, 0);
  assert.ok(cells.every((c) => c.y >= 4));
  assert.equal(apply(s, { type: 'play', handIndex: 0, target: { x: 0, y: 2 } }).ok, false);
});

test("le Chasseur tire sur le premier ennemi en ligne, à 3 cases", () => {
  const s = createGame(4);
  s.pieces.push(
    { id: 100, cardId: 'interceptor', owner: 0, x: 0, y: 4, hp: 2, maxHp: 2, atk: 2, atkBonus: 0, flagship: false, summonSick: false, acted: false, frozen: false },
    { id: 101, cardId: 'trooper', owner: 1, x: 0, y: 1, hp: 2, maxHp: 2, atk: 1, atkBonus: 0, flagship: false, summonSick: false, acted: false, frozen: false },
  );
  assert.deepEqual(attackTargets(s, 100), [{ x: 0, y: 1 }]);
  const after = must(s, { type: 'attack', pieceId: 100, target: { x: 0, y: 1 } });
  assert.equal(after.pieces.find((p) => p.id === 101), undefined);
});

test('le bouclier du Mécha réduit les dégâts', () => {
  const s = createGame(5);
  s.players[0].hand = ['barrage'];
  s.players[0].energy = 3;
  s.pieces.push(
    { id: 200, cardId: 'trooper', owner: 1, x: 3, y: 2, hp: 2, maxHp: 2, atk: 1, atkBonus: 0, flagship: false, summonSick: false, acted: false, frozen: false },
    { id: 201, cardId: 'mech', owner: 1, x: 4, y: 2, hp: 6, maxHp: 6, atk: 3, atkBonus: 0, flagship: false, summonSick: false, acted: false, frozen: false },
  );
  // 3 dégâts - 1 de bouclier = 2 : le Soldat (2 PV) meurt quand même
  const after = must(s, { type: 'play', handIndex: 0, target: { x: 3, y: 2 } });
  assert.equal(after.pieces.find((p) => p.id === 200), undefined);
});

test('100 parties bot contre bot se terminent sans erreur', () => {
  let wins = [0, 0, 0];
  for (let seed = 1; seed <= 100; seed++) {
    let s = createGame(seed);
    let guard = 0;
    while (s.winner === null) {
      const a = chooseBotAction(s);
      s = must(s, a);
      assert.ok(++guard < 5000, 'partie infinie');
      for (const p of s.pieces) {
        assert.ok(p.x >= 0 && p.x < 6 && p.y >= 0 && p.y < 6);
        assert.ok(p.hp > 0);
      }
      assert.ok(s.players[0].energy >= 0 && s.players[1].energy >= 0);
    }
    wins[s.winner === 'draw' ? 2 : s.winner] += 1;
  }
  console.log(`Victoires J1 / J2 / nuls : ${wins.join(' / ')}`);
});

test('legalActions ne propose que des actions valides', () => {
  let s = createGame(7);
  for (let i = 0; i < 40 && s.winner === null; i++) {
    for (const a of legalActions(s)) assert.ok(apply(s, a).ok, JSON.stringify(a));
    s = must(s, chooseBotAction(s));
  }
});
