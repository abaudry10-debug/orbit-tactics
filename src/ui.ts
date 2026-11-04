// Interface HTML par-dessus le canvas : dialogues, journal, clavier à code, notifications.
import { sfx } from './audio.js';
import { CLUES, ITEMS, THREADS } from './story.js';

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

export function renderJournal(clues: Set<string>, items: Set<string>, fresh: Set<string>) {
  const body = $('journal-body');
  body.innerHTML = '';
  const found = CLUES.filter((c) => clues.has(c.id)).length;
  $('journal-progress').textContent =
    found === 0 ? 'Rien encore. Examine ce qui t’entoure.' : `${found} découverte${found > 1 ? 's' : ''}`;

  const card = (title: string, text: string, isFresh: boolean) => {
    const el = document.createElement('div');
    el.className = 'clue' + (isFresh ? ' fresh' : '');
    el.innerHTML = '<strong></strong><p></p>';
    el.querySelector('strong')!.textContent = title;
    el.querySelector('p')!.textContent = text;
    return el;
  };

  for (const th of THREADS) {
    const got = CLUES.filter((c) => c.thread === th.id && clues.has(c.id));
    if (got.length === 0) continue; // un fil n'apparaît qu'une fois entamé
    const section = document.createElement('section');
    section.className = 'thread';
    const h = document.createElement('h3');
    h.innerHTML = `<span class="icon">${th.icon}</span><span></span>`;
    (h.lastElementChild as HTMLElement).textContent = th.title;
    section.appendChild(h);
    for (const c of got) section.appendChild(card(c.title, c.text, fresh.has(c.id)));
    body.appendChild(section);
  }

  if (items.size > 0) {
    const inv = document.createElement('section');
    inv.className = 'thread';
    inv.innerHTML = '<h3><span class="icon">✦</span><span>Sac</span></h3>';
    for (const id of items) {
      const it = ITEMS[id];
      if (it) inv.appendChild(card(it.name, it.text, false));
    }
    body.appendChild(inv);
  }
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

export function openKeypad(cb: (code: string) => void) {
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
export const overlayOpen = () => !$('pause').hidden || !$('confirm').hidden || !$('ending').hidden;

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
