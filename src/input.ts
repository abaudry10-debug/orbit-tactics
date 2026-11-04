// Entrées : clavier (ordinateur) et croix directionnelle tactile (téléphone).
import type { Dir } from './sprites.js';

export type Button = 'a' | 'b' | 'journal' | Dir;

const held = new Set<Dir>();
const order: Dir[] = []; // la dernière direction pressée gagne
const listeners: ((b: Button) => void)[] = [];

export function onPress(fn: (b: Button) => void) {
  listeners.push(fn);
}

function press(b: Button) {
  for (const fn of listeners) fn(b);
}

function hold(d: Dir) {
  if (!held.has(d)) {
    held.add(d);
    order.push(d);
  }
}

function release(d: Dir) {
  held.delete(d);
  const i = order.indexOf(d);
  if (i >= 0) order.splice(i, 1);
}

export function heldDir(): Dir | null {
  return order.length ? order[order.length - 1] : null;
}

export function releaseAll() {
  held.clear();
  order.length = 0;
}

const KEYS: Record<string, Button> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', z: 'up', s: 'down', a: 'left', q: 'left', d: 'right',
  ' ': 'a', Enter: 'a', e: 'a', j: 'journal', Tab: 'journal', Escape: 'b', Backspace: 'b',
};

export function setupInput() {
  window.addEventListener('keydown', (ev) => {
    const b = KEYS[ev.key] ?? KEYS[ev.key.toLowerCase()];
    if (!b) return;
    ev.preventDefault();
    if (b === 'up' || b === 'down' || b === 'left' || b === 'right') {
      if (!ev.repeat) press(b);
      hold(b);
    } else if (!ev.repeat) press(b);
  });
  window.addEventListener('keyup', (ev) => {
    const b = KEYS[ev.key] ?? KEYS[ev.key.toLowerCase()];
    if (b === 'up' || b === 'down' || b === 'left' || b === 'right') release(b);
  });
  window.addEventListener('blur', releaseAll);

  // Boutons tactiles : data-btn="up|down|left|right|a|journal|b"
  document.querySelectorAll<HTMLElement>('[data-btn]').forEach((el) => {
    const b = el.dataset.btn as Button;
    const isDir = b === 'up' || b === 'down' || b === 'left' || b === 'right';
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      el.setPointerCapture?.(ev.pointerId);
      el.classList.add('pressed');
      press(b);
      if (isDir) hold(b as Dir);
      navigator.vibrate?.(8);
    });
    const up = () => {
      el.classList.remove('pressed');
      if (isDir) release(b as Dir);
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', (ev) => ev.preventDefault());
  });
}
