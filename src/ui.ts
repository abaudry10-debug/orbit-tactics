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

export function openKeypad(title: string, cb: (code: string) => void, subtitle = 'Code de mission') {
  $('keypad-title').textContent = title;
  $('keypad-sub').textContent = subtitle;
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
export const overlayOpen = () =>
  !$('pause').hidden || !$('confirm').hidden || !$('viewer').hidden || !$('switches').hidden || !$('finale').hidden;

export function confirm(question: string, onYes: () => void, onNo?: () => void, labels?: [string, string]) {
  $('confirm-text').textContent = question;
  $('confirm-yes').textContent = labels?.[0] ?? 'Oui';
  $('confirm-no').textContent = labels?.[1] ?? 'Non';
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
  no.onclick = () => {
    close();
    onNo?.();
  };
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


// ---------- visionneuse (carte des orbites, grille de décodage) ----------
let viewerClose: (() => void) | undefined;
let orbitAnim: number | undefined;

export function openViewer(title: string, body: HTMLElement, onClose?: () => void) {
  $('viewer-title').textContent = title;
  const holder = $('viewer-body');
  holder.innerHTML = '';
  holder.appendChild(body);
  viewerClose = onClose;
  $('viewer').hidden = false;
  sfx.page();
}

export function closeViewer() {
  if ($('viewer').hidden) return;
  $('viewer').hidden = true;
  cancelAnimationFrame(orbitAnim!);
  const cb = viewerClose;
  viewerClose = undefined;
  cb?.();
}

/** Carte des orbites, en pixel art animé : Vesper sur son orbite, et l'étoile errante sur la sienne, immense. */
export function orbitChart(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'orbit-wrap';
  const cv = document.createElement('canvas');
  cv.width = 160;
  cv.height = 120;
  cv.className = 'orbit-canvas';
  wrap.appendChild(cv);
  const legend = document.createElement('div');
  legend.className = 'orbit-legend';
  legend.innerHTML =
    '<span><i style="background:#ffe08a"></i>Notre soleil</span>' +
    '<span><i style="background:#6fb8ff"></i>Vesper</span>' +
    '<span><i style="background:#ff5a2d"></i>L’étoile errante</span>' +
    '<span><i style="background:#ff2a2a"></i>Prochain passage</span>';
  wrap.appendChild(legend);
  const c = cv.getContext('2d')!;
  const px = (x: number, y: number, col: string, w = 1, h = 1) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const sunX = 64, sunY = 60, rV = 22; // soleil et orbite de Vesper
  const ex = 128, ey = 60, ea = 90, eb = 30, tilt = 0; // ellipse de l'étoile errante
  const ell = (a: number): [number, number] => {
    const x = Math.cos(a) * ea, y = Math.sin(a) * eb;
    return [ex + x * Math.cos(tilt) - y * Math.sin(tilt), ey + x * Math.sin(tilt) + y * Math.cos(tilt)];
  };
  const close = Math.PI; // point de l'ellipse qui frôle l'orbite de Vesper
  const draw = (t: number) => {
    px(0, 0, '#0b1324', 160, 120);
    for (let x = 0; x < 160; x += 16) for (let y = 0; y < 120; y += 2) px(x, y, '#13203a');
    for (let y = 0; y < 120; y += 16) for (let x = 0; x < 160; x += 2) px(x, y, '#13203a');
    // orbite de l'étoile errante (pointillés orange)
    for (let a = 0; a < Math.PI * 2; a += 0.045) { const [x, y] = ell(a); if (Math.floor(a * 22) % 2 === 0) px(x, y, '#8a3a20'); }
    // orbite de Vesper (pointillés bleus)
    for (let a = 0; a < Math.PI * 2; a += 0.09) px(sunX + Math.cos(a) * rV, sunY + Math.sin(a) * rV, '#2f5a8a');
    // zone de passage, qui clignote
    const cx = sunX - rV - 3, cy = sunY; // juste à côté de l'orbite de Vesper
    if (Math.floor(t * 2) % 2 === 0) for (let a = 0; a < 6.3; a += 0.4) px(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, '#ff2a2a');
    // soleil
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) px(sunX + x, sunY + y, x * x + y * y <= 3 ? '#fff3c4' : '#ffe08a');
    // Vesper, qui tourne lentement
    const va = t * 0.5;
    px(sunX + Math.cos(va) * rV - 1, sunY + Math.sin(va) * rV - 1, '#6fb8ff', 3, 3);
    // l'étoile errante, qui approche du point de passage
    const sa = close + 0.55 - ((t * 0.04) % 0.5);
    const [sx, sy] = ell(sa);
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) px(sx + x, sy + y, x * x + y * y <= 6 ? '#ffb070' : '#ff5a2d');
    // traînée
    for (let k = 1; k < 6; k++) { const [tx, ty] = ell(sa + k * 0.04); px(tx, ty, '#ff7a3d'); }
    orbitAnim = requestAnimationFrame((ms) => draw(ms / 1000));
  };
  orbitAnim = requestAnimationFrame((ms) => draw(ms / 1000));
  return wrap;
}

export function codebookTable(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'codebook';
  const rows: [string, string][] = [
    ['···', '0'], ['··–', '1'], ['·–·', '2'], ['·––', '3'], ['–··', '4'], ['–·–', '5'], ['––·', '6'], ['–––', '7'],
  ];
  el.innerHTML =
    '<p>« Balise de synchronisation — mission Aurore. Chaque groupe de trois bips (· court, – long) code un chiffre. »</p>' +
    '<table>' + rows.map(([a, b]) => `<tr><td class="sym">${a}</td><td>${b}</td></tr>`).join('') + '</table>';
  return el;
}

// ---------- tableau d'interrupteurs (salle des turbines) ----------
export function openSwitches(labels: string[], order: string[], onSuccess: () => void) {
  const grid = $('switches-grid');
  grid.innerHTML = '';
  let step = 0;
  const buttons: HTMLButtonElement[] = [];
  const reset = () => {
    step = 0;
    buttons.forEach((b) => b.classList.remove('on'));
  };
  for (const label of labels) {
    const b = document.createElement('button');
    b.className = 'switch';
    b.innerHTML = '<span class="lever"></span><span class="name"></span>';
    b.querySelector('.name')!.textContent = label;
    b.addEventListener('click', () => {
      if (b.classList.contains('on')) return;
      if (label === order[step]) {
        b.classList.add('on');
        sfx.key();
        step += 1;
        if (step === order.length) {
          $('switches-status').textContent = 'Tous les circuits sont rétablis.';
          window.setTimeout(() => {
            $('switches').hidden = true;
            onSuccess();
          }, 700);
        }
      } else {
        sfx.wrong();
        $('switches-box').classList.add('tripped');
        $('switches-status').textContent = 'Clac ! Le tableau disjoncte. Tout est retombé.';
        window.setTimeout(() => $('switches-box').classList.remove('tripped'), 500);
        reset();
      }
    });
    buttons.push(b);
    grid.appendChild(b);
  }
  $('switches-status').textContent = 'Les cinq circuits sont coupés.';
  $('switches').hidden = false;
}

export function closeSwitches() {
  $('switches').hidden = true;
}

// ---------- scène finale ----------
const wait = (ms: number) => new Promise((res) => window.setTimeout(res, ms));

export async function playFinale(pixelSprite: HTMLCanvasElement) {
  const el = $('finale');
  const cv = $('finale-canvas') as HTMLCanvasElement;
  const text = $('finale-text');
  const c = cv.getContext('2d')!;
  cv.width = 120;
  cv.height = 200;
  c.imageSmoothingEnabled = false;
  text.textContent = '';
  el.hidden = false;
  el.className = 'finale white';
  // 1. l'éclair blanc ; Pixel endormi, à peine visible… son œil clignote une fois
  const drawWhite = (blink: boolean) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, 120, 200);
    c.globalAlpha = 0.18;
    c.drawImage(pixelSprite, 52, 150);
    c.globalAlpha = 1;
    if (blink) {
      c.fillStyle = '#5ef0ff';
      c.fillRect(52 + 12, 150 + 5, 1, 1);
    }
  };
  drawWhite(false);
  await wait(1600);
  drawWhite(true);
  await wait(180);
  drawWhite(false);
  await wait(1400);
  // 2. une seconde de ciel bleu
  el.className = 'finale';
  for (let y = 0; y < 200; y++) {
    const k = y / 200;
    c.fillStyle = `rgb(${Math.round(90 + 90 * k)},${Math.round(160 + 60 * k)},${Math.round(235 + 15 * k)})`;
    c.fillRect(0, y, 120, 1);
  }
  const cloud = (x: number, y: number) => {
    c.fillStyle = '#ffffff';
    c.fillRect(x, y, 22, 4); c.fillRect(x + 4, y - 3, 12, 3); c.fillRect(x + 8, y - 5, 6, 2);
  };
  cloud(14, 60); cloud(70, 92); cloud(30, 140);
  await wait(1800);
  // 3. le noir, puis le dernier texte
  c.fillStyle = '#000000';
  c.fillRect(0, 0, 120, 200);
  await wait(900);
  text.textContent = 'Transfert du sujet 07 : 4 212 / 4 212.';
  await wait(4200);
  text.textContent = '';
  await wait(700);
  el.hidden = true;
}
