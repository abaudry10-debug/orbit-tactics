import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, START } from '../src/chapters/vesper/maps.js';
import { SOLID, charAt, objectAt, type GameMap } from '../src/engine/world.js';
import { CLUES, ITEMS, MISSION_CODE, QUESTIONS, SCRIPTS, THREADS } from '../src/chapters/vesper/story.js';

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

/** Points d'arrivée d'une carte : départ du jeu et toutes les portes qui y mènent. */
function arrivals(id: string): [number, number][] {
  const pts: [number, number][] = [];
  if (START.map === id) pts.push([START.x, START.y]);
  for (const m of Object.values(MAPS)) for (const o of m.objects) if (o.door?.to === id) pts.push([o.door.x, o.door.y]);
  return pts;
}

/** Case pleine ; l'eau asséchée par une vague (dryFlag) devient praticable, comme en fin de partie. */
const solid = (map: GameMap, x: number, y: number) => {
  const ch = charAt(map, x, y);
  if (ch === '~' && map.dryFlag) return false;
  return SOLID.has(ch);
};

/** Cases accessibles à pied (portes internes ouvertes, comme en fin de partie). */
function reachable(map: GameMap, starts: [number, number][]): Set<string> {
  const seen = new Set(starts.map(([x, y]) => `${x},${y}`));
  const stack = starts.map((p) => [...p]);
  while (stack.length) {
    const [x, y] = stack.pop()!;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const k = `${nx},${ny}`;
      if (seen.has(k) || nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
      const obj = objectAt(map, nx, ny);
      if (obj && !obj.passWhen) continue;
      if (!obj && solid(map, nx, ny)) continue;
      seen.add(k);
      stack.push([nx, ny]);
    }
  }
  return seen;
}

const usable = (area: Set<string>, x: number, y: number) => DIRS.some(([dx, dy]) => area.has(`${x + dx},${y + dy}`));

test('les cartes ont des lignes de largeur constante', () => {
  for (const m of Object.values(MAPS)) {
    assert.equal(m.rows.length, m.height, m.id);
    for (const row of m.rows) assert.equal(row.length, m.width, m.id);
  }
});

test('chaque carte est reliée et chaque objet est accessible', () => {
  for (const m of Object.values(MAPS)) {
    const starts = arrivals(m.id);
    assert.ok(starts.length > 0, `${m.id} : aucune entrée`);
    const area = reachable(m, starts);
    for (const o of m.objects) assert.ok(usable(area, o.x, o.y) || area.has(`${o.x},${o.y}`), `${m.id} : ${o.id} inaccessible`);
  }
});

test('les arrivées sont des cases libres', () => {
  for (const m of Object.values(MAPS)) {
    for (const [x, y] of arrivals(m.id)) {
      assert.ok(!solid(m, x, y), `${m.id} (${x},${y}) : arrivée dans un mur`);
      assert.equal(objectAt(m, x, y), undefined, `${m.id} (${x},${y}) : arrivée sur un objet`);
    }
  }
});

test('la batterie est enterrée dans le sable, sur une case accessible', () => {
  const m = MAPS.centrale;
  const area = reachable(m, arrivals('centrale'));
  for (const e of m.energy ?? []) {
    assert.equal(charAt(m, e.x, e.y), 'S');
    assert.ok(area.has(`${e.x},${e.y}`) || usable(area, e.x, e.y));
  }
});

test('chaque objet a un script existant, chaque objet du sac est décrit', () => {
  for (const m of Object.values(MAPS)) for (const o of m.objects) if (o.script) assert.ok(SCRIPTS[o.script], o.script);
  for (const id of ['badge', 'sonde', 'pelle', 'battery', 'matrice', 'lampe', 'capteur', 'noyau', 'antenne', 'ecrou', 'combinaison']) assert.ok(ITEMS[id], id);
});

test('chaque indice, objet et réponse est obtenable', () => {
  const clues = new Set<string>(['mis7', 'memo1', 'memo2', 'memo3', 'memo4', 'memo5', 'memo6']); // donnés par le moteur (signal radio, souvenirs de Pixel)
  const items = new Set<string>();
  const flags = new Set<string>(['pixelOn', 'batteryFound', 'signalFound', 'knowsCabin', 'arch_plans', 'archUnlock_plans']); // posés par le moteur (Pixel, fouille, radio, trappe)
  for (const assumeAll of [false, true]) {
    for (const run of Object.values(SCRIPTS)) {
      const api = {
        has: () => assumeAll,
        set: (f: string) => void flags.add(f),
        clue: (id: string) => void clues.add(id),
        item: (id: string) => void items.add(id),
        hasItem: () => false,
        say: (_l: string[], then?: () => void) => then?.(),
        keypad: (_t: string, cb: (c: string) => void) => cb(MISSION_CODE),
        sfx: () => {},
        ui: (_k: string, then?: () => void) => then?.(),
      };
      run(api);
    }
  }
  const threads = new Set(THREADS.map((t) => t.id));
  for (const c of CLUES) {
    assert.ok(threads.has(c.thread), c.id);
    assert.ok(clues.has(c.id), `indice jamais donné : ${c.id}`);
  }
  for (const id of ['badge', 'sonde', 'pelle', 'matrice', 'lampe', 'capteur', 'noyau']) assert.ok(items.has(id), `objet jamais donné : ${id}`);
  for (const q of QUESTIONS) {
    assert.ok(q.opensWith.every((c) => clues.has(c)), `${q.id} : ouverture impossible`);
    assert.ok(clues.has(q.answeredBy) || flags.has(q.answeredBy), `${q.id} : réponse impossible`);
  }
});

test('la progression complète est possible : chaque porte finit par s’ouvrir', () => {
  // On rejoue tous les scripts tant que de nouveaux drapeaux apparaissent,
  // en ne connaissant au départ que ce que le moteur pose lui-même.
  const flags = new Set<string>(['pixelOn', 'batteryFound', 'signalFound', 'knowsCabin', 'arch_plans', 'archUnlock_plans']);
  const items = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    const before = flags.size + items.size;
    for (const run of Object.values(SCRIPTS)) {
      run({
        has: (f: string) => flags.has(f),
        set: (f: string) => void flags.add(f),
        clue: () => {},
        item: (id: string) => void items.add(id),
        hasItem: (id: string) => items.has(id),
        say: (_l: string[], then?: () => void) => then?.(),
        keypad: (_t: string, cb: (c: string) => void) => cb(MISSION_CODE),
        sfx: () => {},
        ui: (_k: string, then?: () => void) => then?.(),
      });
    }
    if (flags.size + items.size > before) grew = true;
  }
  // tous les objets nécessaires au transporteur s'obtiennent au fil de la progression
  for (const id of ['badge', 'sonde', 'pelle', 'matrice', 'lampe', 'capteur', 'noyau', 'antenne']) assert.ok(items.has(id), `objet jamais obtenu : ${id}`);
  for (const f of ['heliosOn', 'plansRead', 'codebookRead']) assert.ok(flags.has(f), `étape jamais atteinte : ${f}`);
  for (const m of Object.values(MAPS)) {
    for (const o of m.objects) {
      if (o.door?.needs) assert.ok(flags.has(o.door.needs), `${o.id} : ${o.door.needs} jamais posé`);
      if (o.passWhen) assert.ok(flags.has(o.passWhen), `${o.id} : ${o.passWhen} jamais posé`);
    }
  }
});
