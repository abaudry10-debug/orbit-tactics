import type { Card } from './types';

// Les 20 cartes du deck de départ (voir le document de règles) + le jeton Nanite.
export const CARDS: Record<string, Card> = {
  scout: {
    id: 'scout', kind: 'unit', name: 'Drone éclaireur', cost: 1, atk: 1, hp: 1,
    move: 'king', attack: 'adjacent', effect: 'drawOnSummon', glyph: 'DÉ',
    text: "À l'invocation, pioche 1 carte.",
  },
  trooper: {
    id: 'trooper', kind: 'unit', name: 'Soldat de bord', cost: 1, atk: 1, hp: 2,
    move: 'cross', attack: 'adjacent', glyph: 'SB',
    text: 'Corps à corps.',
  },
  interceptor: {
    id: 'interceptor', kind: 'unit', name: 'Chasseur intercepteur', cost: 2, atk: 2, hp: 2,
    move: 'line3', attack: 'lineShot3', glyph: 'CI',
    text: "Tire sur le premier ennemi en ligne droite, jusqu'à 3 cases.",
  },
  engineer: {
    id: 'engineer', kind: 'unit', name: 'Ingénieur', cost: 2, atk: 1, hp: 3,
    move: 'king', attack: 'adjacent', effect: 'repair', glyph: 'IN',
    text: "Action : répare 2 PV à un allié adjacent, au lieu d'attaquer.",
  },
  saboteur: {
    id: 'saboteur', kind: 'unit', name: 'Saboteur', cost: 2, atk: 2, hp: 2,
    move: 'knight', attack: 'adjacent', effect: 'stunOnHit', glyph: 'SA',
    text: 'La cible touchée ne peut pas agir à son prochain tour.',
  },
  swarm: {
    id: 'swarm', kind: 'unit', name: 'Essaim nanite', cost: 2, atk: 1, hp: 2,
    move: 'king', attack: 'adjacent', effect: 'spawnNanite', glyph: 'EN',
    text: "À l'invocation, crée un Nanite 1/1 sur une case adjacente libre.",
  },
  bomb: {
    id: 'bomb', kind: 'unit', name: 'Drone explosif', cost: 2, atk: 0, hp: 1,
    move: 'king', attack: 'none', effect: 'selfDestruct', glyph: 'DX',
    text: 'Action : se sacrifie, 2 dégâts à chaque ennemi adjacent.',
  },
  bomber: {
    id: 'bomber', kind: 'unit', name: 'Bombardier', cost: 3, atk: 2, hp: 3,
    move: 'diag2', attack: 'adjacent', effect: 'splash', glyph: 'BO',
    text: '1 dégât en plus à chaque ennemi adjacent à la cible.',
  },
  teleporter: {
    id: 'teleporter', kind: 'unit', name: 'Téléporteur', cost: 3, atk: 2, hp: 3,
    move: 'knight', attack: 'adjacent', effect: 'swap', glyph: 'TÉ',
    text: "Peut remplacer le déplacement du tour par un échange de place avec un allié.",
  },
  sentinel: {
    id: 'sentinel', kind: 'unit', name: 'Sentinelle IA', cost: 3, atk: 2, hp: 4,
    move: 'none', attack: 'diagShot3', glyph: 'SI',
    text: "Immobile. Tire en diagonale, jusqu'à 3 cases.",
  },
  mech: {
    id: 'mech', kind: 'unit', name: 'Mécha lourd', cost: 4, atk: 3, hp: 6,
    move: 'forward', attack: 'adjacent', effect: 'shield', glyph: 'ML',
    text: 'Bouclier : les alliés adjacents subissent 1 dégât de moins.',
  },
  artillery: {
    id: 'artillery', kind: 'unit', name: 'Artilleur orbital', cost: 4, atk: 3, hp: 3,
    move: 'cross', attack: 'lineShotInf', glyph: 'AO',
    text: 'Tire sur le premier ennemi en ligne droite, sans limite de portée.',
  },
  cruiser: {
    id: 'cruiser', kind: 'unit', name: 'Croiseur', cost: 5, atk: 4, hp: 7,
    move: 'line2', attack: 'adjacent', glyph: 'CR',
    text: 'Corps à corps.',
  },
  titan: {
    id: 'titan', kind: 'unit', name: 'Titan', cost: 7, atk: 4, hp: 10,
    move: 'king', attack: 'adjacent', effect: 'cleave', glyph: 'TI',
    text: 'Son attaque frappe tous les ennemis adjacents.',
  },
  overcharge: {
    id: 'overcharge', kind: 'power', name: 'Surcharge', cost: 1, effect: 'overcharge', glyph: '⚡',
    text: "Une unité alliée gagne +2 ATK jusqu'à la fin du tour.",
  },
  hyperjump: {
    id: 'hyperjump', kind: 'power', name: 'Saut hyperspatial', cost: 2, effect: 'hyperjump', glyph: '⟿',
    text: "Déplace une unité alliée sur n'importe quelle case libre, sans compter comme ton déplacement.",
  },
  freeze: {
    id: 'freeze', kind: 'power', name: 'Gel', cost: 2, effect: 'freeze', glyph: '❄',
    text: 'Une unité ennemie ne peut ni bouger ni agir à son prochain tour.',
  },
  repairPower: {
    id: 'repairPower', kind: 'power', name: "Réparation d'urgence", cost: 2, effect: 'repairPower', glyph: '✚',
    text: 'Soigne 4 PV à une unité alliée ou au Vaisseau amiral.',
  },
  barrage: {
    id: 'barrage', kind: 'power', name: 'Tir de barrage', cost: 3, effect: 'barrage', glyph: '✸',
    text: '3 dégâts à une unité ennemie.',
  },
  hack: {
    id: 'hack', kind: 'power', name: 'Piratage', cost: 6, effect: 'hack', glyph: '⌬',
    text: 'Une unité ennemie de coût 3 ou moins passe définitivement dans ton camp.',
  },
  nanite: {
    id: 'nanite', kind: 'unit', name: 'Nanite', cost: 0, atk: 1, hp: 1,
    move: 'king', attack: 'adjacent', glyph: 'na', token: true,
    text: 'Jeton créé par l’Essaim nanite.',
  },
};

export const STARTER_DECK: string[] = Object.values(CARDS)
  .filter((c) => !(c.kind === 'unit' && c.token))
  .map((c) => c.id);

export const FLAGSHIP = {
  name: 'Vaisseau amiral',
  hp: 20,
  cannonCost: 2,
  cannonDamage: 2,
  text: "Se déplace d'1 case. Canon principal (2 énergie, 1 fois par tour) : 2 dégâts à un ennemi adjacent.",
};

export function getCard(id: string): Card {
  const c = CARDS[id];
  if (!c) throw new Error(`Carte inconnue : ${id}`);
  return c;
}
