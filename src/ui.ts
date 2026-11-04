// Interface HTML par-dessus le canvas : dialogues, journal, clavier à code, notifications.
import { setStatic, sfx, startStatic, stopStatic } from './audio.js';
import { iconUrl } from './sprites.js';
import { CLUES, ITEMS, QUESTIONS, THREADS } from './story.js';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---------- dialogues (texte qui s'écrit lettre par lettre) ----------
let queue: string[] = [];
let current = '';
let shown = 0;
let after: (() => void) | undefined;
let typing: number | undefined;

export const dialogOpen = () => !$('dialog').hidden;

export function say(lines: string[], then?: () => void) {
  if (dialogOpen()) {
    // un dialogue est déjà ouvert : on enchaîne à la suite
    const prevAfter = after;
    queue.push(...lines);
    after = () => {
      prevAfter?.();
      then?.();
    };
    return;
  }
  queue = lines.slice();
  after = then;
  $('dialog').hidden = false;
  next();
}

function next() {
  const line = queue.shift();
  if (line === undefined) {
    $('dialog').hidden = true;
    const fn = after;
    after = undefined;
    fn?.();
    return;
  }
  current = line;
  shown = 0;
  $('dialog-text').textContent = '';
  $('dialog-more').hidden = true;
  clearInterval(typing);
  typing = window.setInterval(() => {
    shown += 1;
    $('dialog-text').textContent = current.slice(0, shown);
    if (shown % 3 === 0 && current[shown - 1] !== ' ') sfx.blip();
    if (shown >= current.length) {
      clearInterval(typing);
      typing = undefined;
      $('dialog-more').hidden = false;
    }
  }, 22);
}

/** Bouton A pendant un dialogue : finit la ligne en cours, ou passe à la suivante. */
export function advanceDialog() {
  if (typing !== undefined) {
    clearInterval(typing);
    typing = undefined;
    $('dialog-text').textContent = current;
    $('dialog-more').hidden = false;
  } else {
    sfx.advance();
    next();
  }
}

// ---------- notification « Journal mis à jour » ----------
let toastTimer: number | undefined;
export function toast(text: string) {
  const el = $('toast');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth; // relance l'animation
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 2600);
}

// ---------- journal ----------
export const journalOpen = () => !$('journal').hidden;

export function renderJournal(
  clues: Set<string>, items: Set<string>, fresh: Set<string>, openQ: Set<string>, solvedQ: Set<string>,
) {
  const body = $('journal-body');
  body.innerHTML = '';
  const found = CLUES.filter((c) => clues.has(c.id)).length;
  const pending = QUESTIONS.filter((q) => openQ.has(q.id) && !solvedQ.has(q.id)).length;
  $('journal-progress').textContent =
    found === 0
      ? 'Rien encore. Examine ce qui t’entoure.'
      : `${found} découverte${found > 1 ? 's' : ''}` + (pending ? ` · ${pending} question${pending > 1 ? 's' : ''} en suspens` : '');

  const card = (title: string, text: string, cls: string) => {
    const el = document.createElement('div');
    el.className = 'clue ' + cls;
    el.innerHTML = '<strong></strong><p></p>';
    el.querySelector('strong')!.textContent = title;
    el.querySelector('p')!.textContent = text;
    return el;
  };

  for (const th of THREADS) {
    const got = CLUES.filter((c) => c.thread === th.id && clues.has(c.id));
    const qs = QUESTIONS.filter((q) => q.thread === th.id && openQ.has(q.id));
    if (got.length === 0 && qs.length === 0) continue; // un fil n'apparaît qu'une fois entamé
    const section = document.createElement('section');
    section.className = 'thread';
    const h = document.createElement('h3');
    h.innerHTML = `<span class="icon">${th.icon}</span><span></span>`;
    (h.lastElementChild as HTMLElement).textContent = th.title;
    section.appendChild(h);
    for (const q of qs) {
      const solved = solvedQ.has(q.id);
      section.appendChild(
        card(solved ? q.ask : `? ${q.ask}`, solved ? q.answer : 'Pas encore de réponse.', (solved ? 'answer' : 'question') + (fresh.has(q.id) ? ' fresh' : '')),
      );
    }
    for (const c of got) section.appendChild(card(c.title, c.text, fresh.has(c.id) ? 'fresh' : ''));
    body.appendChild(section);
  }
}

// ---------- sac à dos ----------
export const bagOpen = () => !$('bag').hidden;

export function setBag(open: boolean) {
  if (open) sfx.page();
  $('bag').hidden = !open;
}

export function renderBag(items: string[], onUse: (id: string) => void, sondeOn: boolean) {
  const grid = $('bag-grid');
  const detail = $('bag-detail');
  grid.innerHTML = '';
  detail.innerHTML = '';
  if (items.length === 0) {
    detail.textContent = 'Ton sac est vide.';
    return;
  }
  const select = (id: string, cell: HTMLElement) => {
    grid.querySelectorAll('.slot').forEach((s) => s.classList.remove('selected'));
    cell.classList.add('selected');
    sfx.key();
    const it = ITEMS[id];
    detail.innerHTML = '<strong></strong><p></p>';
    detail.querySelector('strong')!.textContent = it?.name ?? id;
    detail.querySelector('p')!.textContent = it?.text ?? '';
    if (it?.usable) {
      const btn = document.createElement('button');
      btn.className = 'menu primary';
      btn.textContent = id === 'sonde' ? (sondeOn ? 'Éteindre' : 'Allumer') : 'Utiliser';
      btn.addEventListener('click', () => onUse(id));
      detail.appendChild(btn);
    }
  };
  items.forEach((id, i) => {
    const cell = document.createElement('button');
    cell.className = 'slot';
    const img = document.createElement('img');
    img.src = iconUrl(id);
    img.alt = ITEMS[id]?.name ?? id;
    cell.appendChild(img);
    cell.addEventListener('click', () => select(id, cell));
    grid.appendChild(cell);
    if (i === 0) select(id, cell);
  });
}

// ---------- jauge de la Sonde ----------
const LEVELS = ['Aucune source aux environs', 'Signal faible', 'Signal proche', 'Tout près !'];
let lastDetector = '';
export function setDetector(on: boolean, level: number) {
  const key = on ? String(level) : 'off';
  if (key === lastDetector) return;
  lastDetector = key;
  const el = $('detector');
  el.hidden = !on;
  if (!on) return;
  el.dataset.level = String(level);
  el.querySelector('.bars')!.innerHTML = [1, 2, 3].map((i) => `<i class="${i <= level ? 'on' : ''}"></i>`).join('');
  el.querySelector('.label')!.textContent = LEVELS[level];
}

export function setJournal(open: boolean) {
  if (open) sfx.page();
  $('journal').hidden = !open;
}

// ---------- clavier à code ----------
let digits = [0, 0, 0, 0];
let cursor = 0;
let onCode: ((code: string) => void) | undefined;
export const keypadOpen = () => !$('keypad').hidden;

function renderKeypad() {
  $('keypad-digits').querySelectorAll<HTMLElement>('.digit').forEach((el, i) => {
    el.querySelector('span')!.textContent = String(digits[i]);
    el.classList.toggle('active', i === cursor);
  });
}

export function openKeypad(title: string, cb: (code: string) => void) {
  $('keypad-title').textContent = title;
  digits = [0, 0, 0, 0];
  cursor = 0;
  onCode = cb;
  $('keypad').hidden = false;
  renderKeypad();
}

export function keypadInput(b: string) {
  if (b !== 'a' && b !== 'b') sfx.key();
  if (b === 'up') digits[cursor] = (digits[cursor] + 1) % 10;
  else if (b === 'down') digits[cursor] = (digits[cursor] + 9) % 10;
  else if (b === 'left') cursor = (cursor + 3) % 4;
  else if (b === 'right') cursor = (cursor + 1) % 4;
  else if (b === 'a') return submitKeypad();
  else if (b === 'b') return closeKeypad();
  renderKeypad();
}

function submitKeypad() {
  const code = digits.join('');
  const cb = onCode;
  closeKeypad();
  cb?.(code);
}

function closeKeypad() {
  $('keypad').hidden = true;
  onCode = undefined;
}

export function setupKeypadTouch() {
  $('keypad-digits').querySelectorAll<HTMLElement>('.digit').forEach((el, i) => {
    el.querySelector('.up')!.addEventListener('click', () => { cursor = i; keypadInput('up'); });
    el.querySelector('.down')!.addEventListener('click', () => { cursor = i; keypadInput('down'); });
    el.querySelector('span')!.addEventListener('click', () => { cursor = i; sfx.key(); renderKeypad(); });
  });
  $('keypad-ok').addEventListener('click', submitKeypad);
  $('keypad-cancel').addEventListener('click', closeKeypad);
}

// ---------- fondu et lieu ----------
export function fade(mid: () => void) {
  const el = $('fade');
  el.classList.add('on');
  window.setTimeout(() => {
    mid();
    el.classList.remove('on');
  }, 260);
}

export function showPlace(name: string) {
  const el = $('place');
  el.textContent = name;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

// ---------- fenêtres pause / confirmation ----------
export const overlayOpen = () => !$('pause').hidden || !$('confirm').hidden;

export function confirm(question: string, onYes: () => void) {
  $('confirm-text').textContent = question;
  $('confirm').hidden = false;
  const yes = $('confirm-yes');
  const no = $('confirm-no');
  const close = () => {
    $('confirm').hidden = true;
    yes.onclick = null;
    no.onclick = null;
  };
  yes.onclick = () => {
    close();
    onYes();
  };
  no.onclick = close;
}

// ---------- récepteur radio (molette de fréquence) ----------
let freq = 40.0;
let target = 47.2;
let onLock: (() => void) | undefined;
let locked = false;
export const radioOpen = () => !$('radio').hidden;

function clarityOf(f: number) {
  return Math.max(0, 1 - Math.abs(f - target) / 2.5);
}

function renderRadio() {
  $('radio-freq').textContent = freq.toFixed(1).replace('.', ',');
  const clarity = clarityOf(freq);
  $('radio-meter').querySelectorAll('i').forEach((el, i) => el.classList.toggle('on', clarity > i / 8));
  const lockedNow = Math.abs(freq - target) < 0.05;
  $('radio-status').textContent = lockedNow ? 'Signal détecté !' : clarity > 0.6 ? 'Quelque chose…' : clarity > 0.2 ? 'Grésillements' : 'Bruit';
  $('radio').classList.toggle('locked', lockedNow);
  setStatic(lockedNow ? 1 : clarity * 0.7);
  if (lockedNow && !locked) {
    locked = true;
    window.setTimeout(() => {
      closeRadio();
      onLock?.();
    }, 900);
  }
}

export function openRadio(targetFreq: number, cb: () => void) {
  target = targetFreq;
  onLock = cb;
  locked = false;
  freq = 40.0;
  $('radio').hidden = false;
  startStatic();
  renderRadio();
}

export function closeRadio() {
  $('radio').hidden = true;
  stopStatic();
}

function nudge(delta: number) {
  if (locked) return;
  freq = Math.round(Math.min(60, Math.max(30, freq + delta)) * 10) / 10;
  sfx.key();
  renderRadio();
}

export function radioInput(b: string) {
  if (b === 'right') nudge(0.1);
  else if (b === 'left') nudge(-0.1);
  else if (b === 'up') nudge(1);
  else if (b === 'down') nudge(-1);
  else if (b === 'b' || b === 'menu' || b === 'bag') closeRadio();
}

export function setupRadioTouch() {
  document.querySelectorAll<HTMLElement>('[data-tune]').forEach((el) => {
    let timer: number | undefined;
    const step = Number(el.dataset.tune);
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      nudge(step);
      stop();
      timer = window.setInterval(() => nudge(step), 140); // maintenir pour tourner la molette
    });
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    el.addEventListener('pointerleave', stop);
  });
  $('radio-close').addEventListener('click', closeRadio);
}
