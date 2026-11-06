// Mode développeur, caché : ?dev dans l'adresse, ou cinq touchers rapides sur le titre.
// Un petit bouton « DEV » ouvre un panneau : se téléporter, prendre un objet, sauter
// à une étape de l'histoire, déclencher une vague, revoir un souvenir, lancer la fin.
import { ch } from './chapter.js';
import type { Game } from './game.js';
import type { Dir } from './sprites.js';
import * as ui from './ui.js';
import { SOLID, charAt } from './world.js';

const KEY = 'vesper-dev';

export function devEnabled(): boolean {
  try {
    if (new URLSearchParams(location.search).has('dev')) localStorage.setItem(KEY, '1');
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function setEnabled(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    /* rien */
  }
}

/** Une case où poser le héros sur une carte : l'arrivée d'une porte qui y mène, sinon une case libre. */
function landing(mapId: string): { x: number; y: number; dir: Dir } {
  const c = ch();
  if (c.start.map === mapId) return c.start;
  for (const m of Object.values(c.maps)) for (const o of m.objects) if (o.door?.to === mapId) return { x: o.door.x, y: o.door.y, dir: o.door.dir };
  const m = c.maps[mapId];
  for (let y = 1; y < m.height; y++) for (let x = 1; x < m.width; x++) if (!SOLID.has(charAt(m, x, y))) return { x, y, dir: 'down' };
  return { x: 1, y: 1, dir: 'down' };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', cls = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

export function setupDev(getGame: () => Game, inGame: () => boolean) {
  // cinq touchers rapides sur le grand titre : active ou coupe le mode
  let taps: number[] = [];
  document.querySelector('#title h1')?.addEventListener('pointerdown', () => {
    const now = performance.now();
    taps = [...taps.filter((t) => now - t < 1500), now];
    if (taps.length >= 5) {
      taps = [];
      const on = !devEnabled();
      setEnabled(on);
      btn.hidden = !on;
      ui.toast(on ? 'Mode développeur activé' : 'Mode développeur coupé');
    }
  });

  const btn = el('button', 'DEV', 'dev-btn');
  btn.hidden = !devEnabled();
  const panel = el('div', '', 'dev-panel');
  panel.hidden = true;
  // hors de l'écran de jeu : celui-ci bloque les touchers (manette), ce qui empêche le clic sur iPhone
  document.getElementById('app')!.append(btn, panel);

  const close = () => (panel.hidden = true);
  btn.addEventListener('click', () => {
    if (!panel.hidden) return close();
    build();
    panel.hidden = false;
  });

  function section(title: string) {
    const s = el('section');
    s.append(el('h3', title));
    panel.append(s);
    return s;
  }
  function action(parent: HTMLElement, label: string, run: () => void) {
    const b = el('button', label);
    b.addEventListener('click', () => {
      if (!inGame()) return ui.toast('Lance d’abord une partie');
      close();
      run();
    });
    parent.append(b);
  }

  function build() {
    panel.replaceChildren();
    const c = ch();
    const head = el('header');
    head.append(el('strong', `DEV · ${c.title}`));
    const x = el('button', '✕');
    x.addEventListener('click', close);
    head.append(x);
    panel.append(head);

    const maps = section('Aller à');
    for (const [id, m] of Object.entries(c.maps))
      action(maps, m.name || id, () => {
        const g = getGame();
        const at = landing(id);
        g.warp(id, at.x, at.y, at.dir);
      });

    const items = section('Prendre un objet');
    for (const [id, it] of Object.entries(c.items)) action(items, it.name, () => getGame().api.item(id));

    if (c.dev?.presets.length) {
      const steps = section('Sauter à une étape');
      for (const p of c.dev.presets)
        action(steps, p.label, () => {
          const g = getGame();
          for (const f of p.flags) g.flags.add(f);
          for (const i of p.items) g.items.add(i);
          g.refreshQuestions(true);
          g.save();
          const at = p.at ?? { map: g.map.id, x: g.x, y: g.y, dir: g.dir };
          g.warp(at.map, at.x, at.y, at.dir);
          ui.toast(`Étape : ${p.label}`);
        });
    }

    const misc = section('Déclencher');
    if (c.features.heatWaves) action(misc, 'Vague de chaleur', () => getGame().startHeat('cycle', 1));
    c.memories.forEach((_, i) => action(misc, `Souvenir ${i + 1}`, () => getGame().replayMemory(i + 1)));
    for (const a of c.dev?.actions ?? []) action(misc, a.label, () => a.run(getGame()));

    const end = section('Mode développeur');
    const off = el('button', 'Désactiver');
    off.addEventListener('click', () => {
      setEnabled(false);
      btn.hidden = true;
      close();
    });
    end.append(off);
  }
}
