import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, SOLID, START, charAt, objectAt, type GameMap } from '../src/maps.js';
import { CLUES, DEDUCTIONS, SCRIPTS, THREADS } from '../src/story.js';

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

/** Cases accessibles à pied depuis (x, y), portes ouvertes ou non selon `open`. */
function reachable(map: GameMap, sx: number, sy: number, open: boolean): Set<string> {
  const seen = new Set([`${sx},${sy}`]);
  const stack = [[sx, sy]];
  while (stack.length) {
    const [x, y] = stack.pop()!;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const k = `${nx},${ny}`;
      if (seen.has(k) || nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
      const obj = objectAt(map, nx, ny);
      if (obj) continue; // les objets bloquent (on interagit depuis une case voisine)
      if (SOLID.has(charAt(map, nx, ny))) continue;
      seen.add(k);
      stack.push([nx, ny]);
    }
  }
  return seen;
}

/** Un objet est utilisable si une case voisine est accessible. */
function usable(map: GameMap, area: Set<string>, x: number, y: number) {
  return DIRS.some(([dx, dy]) => area.has(`${x + dx},${y + dy}`));
}

test('les cartes ont des lignes de largeur constante', () => {
  for (const m of Object.values(MAPS)) {
    assert.equal(m.rows.length, m.height, m.id);
    for (const row of m.rows) assert.equal(row.length, m.width, m.id);
  }
});

test('le départ est une case libre', () => {
  const m = MAPS[START.map];
  assert.ok(!SOLID.has(charAt(m, START.x, START.y)));
  assert.equal(objectAt(m, START.x, START.y), undefined);
});

test('tous les objets du labo sont accessibles depuis le réveil', () => {
  const m = MAPS.lab;
  const area = reachable(m, START.x, START.y, false);
  for (const o of m.objects) assert.ok(usable(m, area, o.x, o.y), `${o.id} inaccessible`);
});

test('tous les objets de Vesper sont accessibles depuis la sortie du labo', () => {
  const m = MAPS.vesper;
  const exit = MAPS.lab.objects.find((o) => o.door?.to === 'vesper')!.door!;
  const area = reachable(m, exit.x, exit.y, false);
  for (const o of m.objects) assert.ok(usable(m, area, o.x, o.y), `${o.id} inaccessible`);
  assert.ok(area.size > 400, `zone explorable trop petite : ${area.size}`);
});

test('les portes mènent à des cases libres', () => {
  for (const m of Object.values(MAPS)) {
    for (const o of m.objects) {
      if (!o.door) continue;
      const to = MAPS[o.door.to];
      assert.ok(to, `${o.id} : carte ${o.door.to} inconnue`);
      assert.ok(!SOLID.has(charAt(to, o.door.x, o.door.y)), `${o.id} : arrivée dans un mur`);
      assert.equal(objectAt(to, o.door.x, o.door.y), undefined, `${o.id} : arrivée sur un objet`);
    }
  }
});

test('chaque objet a un script existant', () => {
  for (const m of Object.values(MAPS)) for (const o of m.objects) if (o.script) assert.ok(SCRIPTS[o.script], o.script);
});

test('chaque indice appartient à un fil et est atteignable', () => {
  const threads = new Set(THREADS.map((t) => t.id));
  const given = new Set<string>();
  // On exécute chaque script avec une API factice pour lister les indices donnés.
  for (const run of Object.values(SCRIPTS)) {
    const flags = new Set<string>();
    const api = {
      has: (f: string) => flags.has(f),
      set: (f: string) => void flags.add(f),
      clue: (id: string) => void given.add(id),
      item: () => {},
      hasItem: () => false,
      say: (_l: string[], then?: () => void) => then?.(),
      keypad: (cb: (c: string) => void) => cb('2141'),
      finish: () => {},
    };
    run(api);
  }
  for (const d of DEDUCTIONS) given.add(d.clue);
  for (const c of CLUES) {
    assert.ok(threads.has(c.thread), c.id);
    assert.ok(given.has(c.id), `indice jamais donné : ${c.id}`);
  }
});
