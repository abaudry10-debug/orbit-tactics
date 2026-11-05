// Interface HTML par-dessus le canvas : dialogues, journal, clavier à code, notifications.
import { playEnding, setStatic, sfx, startStatic, stopStatic } from './audio.js';
import { iconUrl } from './sprites.js';
import { CLUES, ITEMS, QUESTIONS, THREADS, type ArchiveFolder } from './story.js';
import { iconCanvas } from './sprites.js';

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
  clues: Set<string>, fresh: Set<string>, openQ: Set<string>, solvedQ: Set<string>, isDone: (id: string) => boolean,
) {
  const body = $('journal-body');
  body.innerHTML = '';
  const found = CLUES.filter((c) => clues.has(c.id)).length;
  const news = [...fresh].filter((id) => clues.has(id) || openQ.has(id)).length;
  const pending = QUESTIONS.filter((q) => openQ.has(q.id) && !solvedQ.has(q.id)).length;
  $('journal-progress').textContent =
    found === 0
      ? 'Rien encore. Examine ce qui t’entoure.'
      : `${found} découverte${found > 1 ? 's' : ''}` +
        (pending ? ` · ${pending} question${pending > 1 ? 's' : ''} en suspens` : '') +
        (news ? ` · ${news} nouveau${news > 1 ? 'x' : ''}` : '');

  const card = (title: string, text: string, cls: string, isNew: boolean) => {
    const el = document.createElement('div');
    el.className = 'clue ' + cls + (isNew ? ' fresh' : '');
    el.innerHTML = '<strong></strong><p></p>';
    el.querySelector('strong')!.textContent = title;
    if (isNew) {
      const tag = document.createElement('span');
      tag.className = 'new-tag';
      tag.textContent = 'NOUVEAU';
      el.querySelector('strong')!.appendChild(tag);
    }
    el.querySelector('p')!.textContent = text;
    return el;
  };
  const qCard = (q: (typeof QUESTIONS)[number]) => {
    const solved = solvedQ.has(q.id);
    return card(solved ? q.ask : `? ${q.ask}`, solved ? q.answer : 'Pas encore de réponse.', solved ? 'answer' : 'question', fresh.has(q.id));
  };
  // les nouveautés d'abord, puis le reste dans l'ordre de découverte
  const newFirst = <T extends { id: string }>(list: T[]) => [...list.filter((x) => fresh.has(x.id)), ...list.filter((x) => !fresh.has(x.id))];

  // 1. Pour avancer : ce qui reste à faire, bien en vue
  const lead = THREADS.find((t) => t.id === 'leads')!;
  const leads = CLUES.filter((c) => c.thread === 'leads' && clues.has(c.id));
  const leadQs = QUESTIONS.filter((q) => q.thread === 'leads' && openQ.has(q.id) && !solvedQ.has(q.id));
  const todo = leads.filter((c) => !(c.doneWhen && isDone(c.doneWhen)));
  const done = leads.filter((c) => c.doneWhen && isDone(c.doneWhen));
  if (todo.length || leadQs.length || done.length) {
    const sec = document.createElement('section');
    sec.className = 'thread todo';
    sec.innerHTML = `<h3><span class="icon">${lead.icon}</span><span>${lead.title}</span></h3>`;
    if (!todo.length && !leadQs.length) sec.appendChild(card('Rien en cours', 'Explore, examine, fouille : de nouvelles pistes viendront.', 'unknown', false));
    for (const q of newFirst(leadQs)) sec.appendChild(qCard(q));
    for (const c of newFirst(todo)) sec.appendChild(card(c.title, c.text, 'lead', fresh.has(c.id)));
    if (done.length) {
      const d = document.createElement('details');
      d.className = 'done-list';
      d.innerHTML = `<summary>Pistes terminées (${done.length})</summary>`;
      for (const c of done) d.appendChild(card(`✓ ${c.title}`, c.text, 'done', false));
      sec.appendChild(d);
    }
    body.appendChild(sec);
  }

  // 2. Les fils de l'histoire, repliables ; ceux qui ont du nouveau s'ouvrent d'eux-mêmes
  for (const th of THREADS) {
    if (th.id === 'leads') continue;
    const got = CLUES.filter((c) => c.thread === th.id && clues.has(c.id));
    const qs = QUESTIONS.filter((q) => q.thread === th.id && openQ.has(q.id));
    if (got.length === 0 && qs.length === 0) continue; // un fil n'apparaît qu'une fois entamé
    const newCount = got.filter((c) => fresh.has(c.id)).length + qs.filter((q) => fresh.has(q.id)).length;
    const d = document.createElement('details');
    d.className = 'thread';
    if (newCount) d.open = true;
    const sum = document.createElement('summary');
    sum.innerHTML = `<span class="icon">${th.icon}</span><span class="t"></span><span class="count"></span>`;
    sum.querySelector('.t')!.textContent = th.title;
    sum.querySelector('.count')!.textContent = `${got.length}`;
    if (newCount) {
      sum.classList.add('has-new');
      const tag = document.createElement('span');
      tag.className = 'new-tag';
      tag.textContent = `+${newCount}`;
      sum.querySelector('.count')!.appendChild(tag);
    }
    d.appendChild(sum);
    for (const q of newFirst(qs)) d.appendChild(qCard(q));
    for (const c of newFirst(got)) d.appendChild(card(c.title, c.text, '', fresh.has(c.id)));
    body.appendChild(d);
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
      btn.textContent = id === 'sonde' ? (sondeOn ? 'Éteindre' : 'Allumer') : id === 'ecrou' ? 'Lancer' : 'Utiliser';
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

let kpLen = 4;
let kpComma = -1;

function renderKeypad() {
  $('keypad-digits').querySelectorAll<HTMLElement>('.digit').forEach((el, i) => {
    el.hidden = i >= kpLen;
    el.querySelector('span')!.textContent = String(digits[i]);
    el.classList.toggle('active', i === cursor);
    el.classList.toggle('comma', i === kpComma);
  });
}

/** Clavier à molettes. `len` chiffres ; `comma` : une virgule s'affiche après ce chiffre (fréquences). */
export function openKeypad(title: string, cb: (code: string) => void, subtitle = 'Code de mission', len = 4, comma = -1) {
  $('keypad-title').textContent = title;
  $('keypad-sub').textContent = subtitle;
  kpLen = len;
  kpComma = comma;
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
  else if (b === 'left') cursor = (cursor + kpLen - 1) % kpLen;
  else if (b === 'right') cursor = (cursor + 1) % kpLen;
  else if (b === 'a') return submitKeypad();
  else if (b === 'b') return closeKeypad();
  renderKeypad();
}

function submitKeypad() {
  const code = digits.slice(0, kpLen).join('');
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
  !$('pause').hidden || !$('confirm').hidden || !$('viewer').hidden || !$('switches').hidden || !$('finale').hidden || !$('term').hidden;

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
    '<span><i style="background:#ff2a2a"></i>Prochain passage</span>' +
    '<span class="orbit-period">Période de l’étoile errante : 1 184 ans</span>';
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
  // l'ordre dans lequel le joueur a relevé les leviers ; on ne juge qu'une fois les cinq levés
  const seq: string[] = [];
  const buttons: HTMLButtonElement[] = [];
  let busy = false;
  const status = (t: string) => ($('switches-status').textContent = t);
  for (const label of labels) {
    const b = document.createElement('button');
    b.className = 'switch';
    b.innerHTML = '<span class="lever"></span><span class="name"></span>';
    b.querySelector('.name')!.textContent = label;
    b.addEventListener('click', () => {
      if (busy) return;
      if (b.classList.contains('on')) {
        // on peut redescendre le dernier levier relevé, pour se corriger
        if (seq[seq.length - 1] !== label) return;
        seq.pop();
        b.classList.remove('on');
        sfx.key();
        status(seq.length ? `${seq.length} circuit${seq.length > 1 ? 's' : ''} sur ${order.length} relevé${seq.length > 1 ? 's' : ''}.` : 'Les cinq circuits sont coupés.');
        return;
      }
      b.classList.add('on');
      sfx.key();
      seq.push(label);
      if (seq.length < order.length) {
        status(`${seq.length} circuit${seq.length > 1 ? 's' : ''} sur ${order.length} relevé${seq.length > 1 ? 's' : ''}.`);
        return;
      }
      busy = true;
      status('Mise sous tension…');
      const ok = seq.every((l, i) => l === order[i]);
      window.setTimeout(() => {
        if (ok) {
          status('Tous les circuits sont rétablis.');
          window.setTimeout(() => {
            $('switches').hidden = true;
            onSuccess();
          }, 700);
          return;
        }
        sfx.wrong();
        $('switches-box').classList.add('tripped');
        status('Clac ! Le tableau disjoncte. Tout est retombé.');
        window.setTimeout(() => {
          $('switches-box').classList.remove('tripped');
          buttons.forEach((x) => x.classList.remove('on'));
          seq.length = 0;
          busy = false;
        }, 600);
      }, 700);
    });
    buttons.push(b);
    grid.appendChild(b);
  }
  status('Les cinq circuits sont coupés.');
  $('switches').hidden = false;
}

export function closeSwitches() {
  $('switches').hidden = true;
}

// ---------- scène finale ----------
const wait = (ms: number) => new Promise((res) => window.setTimeout(res, ms));

export async function playFinale(pixelSprite: HTMLCanvasElement, onBlack?: () => void) {
  const el = $('finale');
  const cv = $('finale-canvas') as HTMLCanvasElement;
  const text = $('finale-text');
  const c = cv.getContext('2d')!;
  // canevas aux proportions de l'écran, en gros pixels
  const W = 96;
  const H = Math.max(96, Math.round((W * el.parentElement!.clientHeight) / Math.max(1, el.parentElement!.clientWidth)));
  cv.width = W;
  cv.height = H;
  c.imageSmoothingEnabled = false;
  text.textContent = '';
  text.className = '';
  el.className = 'finale clear';
  el.hidden = false;
  const stopMusic = playEnding();

  // --- petits outils de dessin ---
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const ease = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const win = (t: number, a: number, b: number) => clamp((t - a) / (b - a)); // 0→1 entre a et b
  const fill = (col: string, alpha = 1) => {
    if (alpha <= 0) return;
    c.globalAlpha = Math.min(1, alpha);
    c.fillStyle = col;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  };
  const dot = (x: number, y: number, col: string, a = 1, w = 1, h = 1) => {
    if (a <= 0) return;
    c.globalAlpha = Math.min(1, a);
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), w, h);
    c.globalAlpha = 1;
  };
  const disc = (cx: number, cy: number, r: number, col: string, a = 1) => {
    c.globalAlpha = Math.min(1, a);
    c.fillStyle = col;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y));
      c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
    c.globalAlpha = 1;
  };

  // --- décors préparés une fois ---
  const stars = Array.from({ length: 140 }, () => ({ x: rnd() * W, y: rnd() * H * 3, b: 0.3 + rnd() * 0.7, tw: rnd() * 6 }));
  const skyline: [number, number, number][] = []; // x, largeur, hauteur des immeubles en ruine
  for (let x = -2; x < W; ) {
    const w = 5 + Math.floor(rnd() * 9);
    skyline.push([x, w, 10 + Math.floor(rnd() * 26)]);
    x += w + Math.floor(rnd() * 2);
  }
  const warp = Array.from({ length: 90 }, () => ({ a: rnd() * Math.PI * 2, d: rnd(), s: 0.4 + rnd() * 0.9 }));
  const motes = Array.from({ length: 40 }, () => ({ x: rnd() * 30 - 15, s: 0.4 + rnd(), o: rnd() }));
  const clouds = Array.from({ length: 6 }, (_, i) => ({ x: rnd() * W, y: H * (0.12 + i * 0.07), w: 12 + rnd() * 16, v: 1.5 + rnd() * 2.5 }));
  const cx = Math.round(W / 2);
  const groundY = Math.round(H * 0.7);

  // la capsule 07, dessinée en gros pixels, qui s'illumine
  const pod = (glow: number, a: number) => {
    const x = cx - 7, y = groundY - 30;
    dot(x, y + 2, '#2a2f3a', a, 14, 26); dot(x + 1, y, '#2a2f3a', a, 12, 2);
    dot(x + 2, y + 3, glow > 0 ? '#1b4a5a' : '#141822', a, 10, 18);
    dot(x + 2, y + 3, '#7ff6ff', a * glow * 0.8, 10, 18);
    dot(x + 4, y + 6, '#0d1018', a * (1 - glow * 0.7), 6, 12); // le dormeur
    dot(x + 3, y + 23, '#5ef0ff', a * (0.3 + glow), 8, 2);
    if (glow > 0) {
      c.globalAlpha = Math.min(1, glow * a * 0.35);
      c.fillStyle = '#5ef0ff';
      c.fillRect(x - 3, y - 2, 20, 32);
      c.globalAlpha = 1;
    }
  };
  const pixel = (a: number, eye: boolean) => {
    const dx = cx + 6, dy = groundY - 13;
    c.globalAlpha = a;
    c.drawImage(pixelSprite, dx, dy);
    c.globalAlpha = 1;
    if (eye) {
      dot(dx + 11, dy + 4, '#5ef0ff', 0.35, 3, 3);
      dot(dx + 12, dy + 5, '#5ef0ff', 1);
    }
  };

  const T_END = 36;
  const draw = (t: number) => {
    c.clearRect(0, 0, W, H);
    // 1. le monde s'éteint (0 → 2,4 s) : on voit encore le jeu derrière
    if (t < 2.4) { fill('#000', ease(t / 2.4)); return; }
    fill('#000');
    // 2. la silhouette de Pixel, son œil clignote une fois (3,4 → 7,6 s)
    if (t < 11.5) {
      const pa = 0.42 * win(t, 3.4, 4.4) * (1 - win(t, 10.4, 11.4));
      pod(0, pa * 0.9);
      pixel(pa, t > 5.3 && t < 5.56);
    }
    // 3. la capsule s'éveille (7,6 → 11,5 s) : lueur, poussière d'énergie qui monte
    if (t >= 7.6 && t < 12.5) {
      const g = ease(win(t, 7.6, 10.5));
      pod(g, 1 - win(t, 11.6, 12.4));
      for (const m of motes) {
        const life = ((t - 7.6) * m.s + m.o * 3) % 3;
        const y = groundY - 18 - life * 22;
        dot(cx + m.x * (1 - life / 4), y, '#bffbff', g * (1 - life / 3));
      }
      // anneau d'énergie qui pulse
      const ring = (t * 1.6) % 1;
      c.strokeStyle = '#7ff6ff';
      c.globalAlpha = g * (1 - ring) * 0.8;
      c.beginPath();
      c.ellipse(cx, groundY - 17, 8 + ring * 20, 3 + ring * 7, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
    }
    // 4. le faisceau jaillit et la caméra monte au-dessus de la ville (11,5 → 15,2 s)
    if (t >= 11.5 && t < 15.6) {
      const k = ease(win(t, 12.9, 15.2));
      const pan = k * H * 1.5; // la ville glisse vers le bas
      for (const s of stars) {
        const y = s.y - H * 2 + pan;
        if (y >= 0 && y < H) dot(s.x, y, '#ffffff', s.b * (0.4 + 0.6 * k) * win(t, 11.5, 12.6));
      }
      // la ville en ruine, en ombre chinoise, sur un ciel de nuit rougi par l'étoile errante
      const base = groundY + pan;
      for (let y = Math.max(0, Math.floor(base - 90)); y < Math.min(H, base); y++) {
        const v = 1 - (base - y) / 90; // 0 en haut du dégradé (noir), 1 à l'horizon
        const r = Math.round(170 * v * v * v), g = Math.round(14 * v + 40 * v * v * v), b = Math.round(60 * v);
        dot(0, y, `rgb(${r},${g},${b})`, 1, W, 1);
      }
      for (const [x, w, h] of skyline) {
        dot(x, base - h, '#07080e', 1, w, h + H);
        for (let wy = base - h + 3; wy < base - 2; wy += 4)
          for (let wx = x + 1; wx < x + w - 1; wx += 3) if ((wx * 13 + wy * 7) % 11 === 0) dot(wx, wy, '#ffb45a', 0.55, 1, 1);
      }
      // le faisceau
      const beamA = win(t, 11.5, 11.8);
      const top = (base - 18) * (1 - ease(win(t, 11.5, 12.2)));
      dot(cx - 3, top, '#5ef0ff', beamA * 0.25, 7, base - 16 - top);
      dot(cx - 1, top, '#bffbff', beamA * 0.7, 3, base - 16 - top);
      dot(cx, top, '#ffffff', beamA, 1, base - 16 - top);
      dot(cx - 4, top - 2, '#ffffff', beamA, 9, 3);
      fill('#ffffff', 0.5 * (1 - win(t, 11.5, 12.1))); // le choc du départ
      fill('#000', win(t, 15.0, 15.6));
    }
    // 5. le voyage : les étoiles filent, l'étoile errante passe (15,2 → 18,5 s)
    if (t >= 15.2 && t < 18.6) {
      const k = win(t, 15.2, 18.5);
      const speed = 0.25 + k * k * 2.5;
      const cy = H / 2;
      // l'étoile errante, énorme et rouge, qui passe sur le côté
      const sx = -30 + k * 70, sy = cy - 26 + k * 10;
      disc(sx, sy, 26, '#5a1408', 0.5);
      disc(sx, sy, 20, '#b4361a', 0.75);
      disc(sx, sy, 14, '#ff6a2d', 0.9);
      disc(sx, sy, 8, '#ffc07a', 1);
      for (const w of warp) {
        const d = (w.d + (t - 15.2) * w.s * speed * 0.35) % 1;
        const r0 = d * d * W * 0.9;
        const len = 1 + speed * d * 9;
        c.strokeStyle = d > 0.5 ? '#ffffff' : '#9ab6ff';
        c.globalAlpha = Math.min(1, d * 1.6) * win(t, 15.2, 15.7);
        c.beginPath();
        c.moveTo(cx + Math.cos(w.a) * r0, cy + Math.sin(w.a) * r0);
        c.lineTo(cx + Math.cos(w.a) * (r0 + len), cy + Math.sin(w.a) * (r0 + len));
        c.stroke();
      }
      c.globalAlpha = 1;
      // l'esprit : un point de lumière qui grandit au centre
      const pulse = 1 + Math.sin(t * 18) * 0.5;
      disc(cx, cy, Math.round(1 + k * 3 + pulse), '#5ef0ff', 0.35);
      disc(cx, cy, Math.round(1 + k * 2), '#ffffff', 1);
      fill('#ffffff', ease(win(t, 17.6, 18.5)));
    }
    // 6. l'éclair blanc (18,5 → 20 s)
    if (t >= 18.5 && t < 20.2) fill('#ffffff');
    // 7. Azura : l'aube sur un monde bleu (20 → 26 s)
    if (t >= 20) {
      const k = win(t, 20, 26);
      for (let y = 0; y < H; y++) {
        const v = y / H;
        const r = Math.round(40 + 140 * v + 60 * Math.max(0, v - 0.55));
        const g = Math.round(110 + 110 * v);
        const b = Math.round(220 + 30 * v - 40 * Math.max(0, v - 0.6));
        dot(0, y, `rgb(${r},${g},${b})`, 1, W, 1);
      }
      // le soleil d'Azura se lève
      const sunY = H * 0.62 - ease(k) * H * 0.1;
      disc(cx + 18, sunY, 10, '#fff4c8', 0.35);
      disc(cx + 18, sunY, 7, '#fffbe8', 1);
      // nuages qui dérivent
      for (const cl of clouds) {
        const x = ((cl.x + (t - 20) * cl.v) % (W + 40)) - 20;
        dot(x, cl.y, '#ffffff', 0.9, cl.w, 2);
        dot(x + 3, cl.y - 2, '#ffffff', 0.9, cl.w - 7, 2);
        dot(x + 6, cl.y - 3, '#ffffff', 0.9, Math.max(2, cl.w - 13), 1);
      }
      // collines bleu-vert, en deux plans
      for (let x = 0; x < W; x++) {
        const h1 = H * 0.66 + Math.sin(x / 11) * 4 + Math.sin(x / 5.3) * 1.5;
        const h2 = H * 0.76 + Math.sin(x / 8 + 2) * 5;
        dot(x, h1, '#4f8fa8', 1, 1, H);
        dot(x, h2, '#2f6a6a', 1, 1, H);
      }
      // des oiseaux au loin
      for (let i = 0; i < 3; i++) {
        const bx = ((t - 20) * (6 + i) + i * 25) % (W + 10) - 5;
        const by = H * (0.3 + i * 0.05) + Math.sin(t * 2 + i) * 2;
        const flap = Math.floor(t * 5 + i) % 2;
        dot(bx, by, '#203040', 1, 1, 1); dot(bx - 1, by - flap, '#203040', 1, 1, 1); dot(bx + 1, by - flap, '#203040', 1, 1, 1);
      }
      fill('#ffffff', 1 - ease(win(t, 20, 22.4))); // le blanc se dissout dans le ciel
      fill('#000', ease(win(t, 25.2, 26.4)));
    }
  };

  // les textes de fin, posés sur le noir
  const lines = async () => {
    await wait(26.6 * 1000);
    text.textContent = 'Transfert du sujet 07.';
    await wait(1600);
    text.textContent = 'Transfert du sujet 07.\n\nPopulation transférée vers Azura\u00a0:';
    await wait(1400);
    text.textContent = 'Transfert du sujet 07.\n\nPopulation transférée vers Azura\u00a0:\n4\u00a0212 / 4\u00a0212';
    await wait(2600);
    text.textContent = 'Transfert du sujet 07.\n\nPopulation transférée vers Azura\u00a0:\n4\u00a0212 / 4\u00a0212\n\n— FIN —';
    text.className = 'with-end';
  };
  void lines();

  await new Promise<void>((res) => {
    const start = performance.now();
    let blacked = false;
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      if (!blacked && t >= 2.4) {
        blacked = true;
        el.className = 'finale';
        onBlack?.();
      }
      draw(Math.min(t, T_END));
      if (t < T_END) requestAnimationFrame(frame);
      else res();
    };
    requestAnimationFrame(frame);
  });
  text.style.transition = 'opacity 1.2s';
  text.style.opacity = '0';
  stopMusic();
  await wait(1400);
  text.textContent = '';
  text.style.opacity = '';
  text.style.transition = '';
  text.className = '';
  el.hidden = true;
}

// ---------- ordinateur des archives (écran vert sur fond noir) ----------
interface TermOpts {
  folders: ArchiveFolder[];
  code: string;
  loggedIn: boolean;
  onEvent: (ev: string) => void; // 'login', 'unlock:<id>', puis l'id de chaque dossier ouvert
  onClose?: () => void;
  /** Dossiers protégés par un code et déjà déverrouillés. */
  unlocked: Set<string>;
}
let term: TermOpts | undefined;
let termState: 'login' | 'menu' | 'file' | 'fcode' = 'login';
let termSel = 0;
let termFile: ArchiveFolder | undefined;
let termDigits = [0, 0, 0, 0];
let termCursor = 0;
let termMsg = '';
let termNoise: number | undefined;

export const termOpen = () => !$('term').hidden;

export function openTerminal(opts: TermOpts) {
  term = opts;
  termState = opts.loggedIn ? 'menu' : 'login';
  termSel = 0;
  termDigits = [0, 0, 0, 0];
  termCursor = 0;
  termMsg = '';
  $('term').hidden = false;
  sfx.blip();
  renderTerm();
}

export function closeTerminal() {
  if ($('term').hidden) return;
  $('term').hidden = true;
  cancelAnimationFrame(termNoise!);
  const cb = term?.onClose;
  term = undefined;
  cb?.();
}

const needsCode = (f: ArchiveFolder) => !!f.code && !term!.unlocked.has(f.id);
const termItems = (): string[] =>
  termState === 'menu'
    ? [...term!.folders.map((f) => f.name + (f.locked ? '/ [VIDE]' : needsCode(f) ? '/ [CODE]' : '/')), 'DÉCONNEXION']
    : termState === 'file'
      ? ['◀ RETOUR']
      : [];

function line(text: string, cls = '') {
  const p = document.createElement('p');
  p.className = 'term-line ' + cls;
  p.textContent = text;
  return p;
}

function renderTerm() {
  if (!term) return;
  cancelAnimationFrame(termNoise!);
  const scr = $('term-screen');
  scr.innerHTML = '';
  scr.appendChild(line('SPATIOPORT DE VESPER — ARCHIVES v2.07', 'dim'));
  if (termState === 'login' || termState === 'fcode') {
    const fc = termState === 'fcode';
    if (fc) {
      scr.appendChild(line('> open /missions/' + termFile!.name, 'dim'));
      scr.appendChild(line('DOSSIER PROTÉGÉ.'));
    } else scr.appendChild(line('UTILISATEUR : I.VARN'));
    const row = document.createElement('div');
    row.className = 'term-pass';
    row.appendChild(line(fc ? 'CODE D’ACCÈS :' : 'MOT DE PASSE :'));
    termDigits.forEach((d, i) => {
      const cell = document.createElement('div');
      cell.className = 'term-digit' + (i === termCursor ? ' sel' : '');
      cell.innerHTML = `<button class="up">▲</button><span>${d}</span><button class="down">▼</button>`;
      cell.querySelector('.up')!.addEventListener('click', () => { termCursor = i; termInput('up'); });
      cell.querySelector('.down')!.addEventListener('click', () => { termCursor = i; termInput('down'); });
      cell.querySelector('span')!.addEventListener('click', () => { termCursor = i; sfx.key(); renderTerm(); });
      row.appendChild(cell);
    });
    scr.appendChild(row);
    scr.appendChild(line(fc ? termFile!.codeHint ?? '' : 'Indice : « la mission qui n’a trouvé que de la glace »', 'dim'));
    if (termMsg) scr.appendChild(line(termMsg, 'warn'));
    const actions = document.createElement('div');
    actions.className = 'term-actions';
    const ok = document.createElement('button');
    ok.className = 'term-btn';
    ok.textContent = fc ? '[ OUVRIR ]' : '[ CONNEXION ]';
    ok.addEventListener('click', () => termInput('a'));
    const quit = document.createElement('button');
    quit.className = 'term-btn';
    quit.textContent = fc ? '[ RETOUR ]' : '[ QUITTER ]';
    quit.addEventListener('click', () => termInput('b'));
    actions.append(ok, quit);
    scr.appendChild(actions);
  } else if (termState === 'menu') {
    scr.appendChild(line('Bienvenue, Dr Varn.'));
    scr.appendChild(line('> ls /missions', 'dim'));
  } else if (termFile) {
    scr.appendChild(line('> open /missions/' + termFile.name, 'dim'));
    if (!termFile.locked) {
      const cv = document.createElement('canvas');
      const big = termFile.id === 'plans';
      cv.width = big ? 128 : 96;
      cv.height = big ? 84 : 56;
      cv.className = 'term-photo';
      scr.appendChild(cv);
      drawArchivePhoto(termFile.id, cv);
      if (big) {
        scr.appendChild(line('VUE ÉCLATÉE :', 'dim'));
        const ex = document.createElement('canvas');
        ex.width = 101;
        ex.height = 30;
        ex.className = 'term-photo';
        scr.appendChild(ex);
        drawExploded(ex);
      }
    }
    for (const l of termFile.lines) scr.appendChild(line(l, termFile.locked ? 'dim' : ''));
  }
  termItems().forEach((label, i) => {
    const b = document.createElement('button');
    b.className = 'term-item' + (i === termSel ? ' sel' : '');
    b.textContent = (i === termSel ? '> ' : '  ') + label;
    b.addEventListener('click', () => { termSel = i; termInput('a'); });
    scr.appendChild(b);
  });
  const cur = document.createElement('span');
  cur.className = 'term-cursor';
  cur.textContent = '█';
  scr.appendChild(cur);
}

export function termInput(b: string) {
  if (!term) return;
  if (termState === 'login' || termState === 'fcode') {
    const fc = termState === 'fcode';
    if (b === 'up') termDigits[termCursor] = (termDigits[termCursor] + 1) % 10;
    else if (b === 'down') termDigits[termCursor] = (termDigits[termCursor] + 9) % 10;
    else if (b === 'left') termCursor = (termCursor + 3) % 4;
    else if (b === 'right') termCursor = (termCursor + 1) % 4;
    else if (b === 'b' || b === 'menu') {
      if (!fc) return closeTerminal();
      termState = 'menu';
      termMsg = '';
      termSel = Math.max(0, term.folders.indexOf(termFile!));
      sfx.key();
      return renderTerm();
    } else if (b === 'a') {
      const want = fc ? termFile!.code : term.code;
      if (termDigits.join('') === want) {
        sfx.success();
        termMsg = '';
        if (fc) {
          term.unlocked.add(termFile!.id);
          term.onEvent('unlock:' + termFile!.id);
          term.onEvent(termFile!.id);
          termState = 'file';
        } else {
          term.onEvent('login');
          termState = 'menu';
        }
        termSel = 0;
      } else {
        sfx.wrong();
        termMsg = fc ? 'CODE INCORRECT.' : 'MOT DE PASSE INCORRECT.';
      }
      return renderTerm();
    }
    sfx.key();
    return renderTerm();
  }
  const items = termItems();
  if (b === 'up') termSel = (termSel + items.length - 1) % items.length;
  else if (b === 'down') termSel = (termSel + 1) % items.length;
  else if (b === 'b' || b === 'menu') {
    if (termState === 'file') { termState = 'menu'; termSel = Math.max(0, term.folders.indexOf(termFile!)); }
    else return closeTerminal();
  } else if (b === 'a') {
    if (termState === 'file') {
      termState = 'menu';
      termSel = Math.max(0, term.folders.indexOf(termFile!));
    } else if (termSel === items.length - 1) {
      return closeTerminal();
    } else {
      termFile = term.folders[termSel];
      termSel = 0;
      if (needsCode(termFile)) {
        termState = 'fcode';
        termDigits = [0, 0, 0, 0];
        termCursor = 0;
        termMsg = '';
        sfx.key();
        return renderTerm();
      }
      termState = 'file';
      term.onEvent(termFile.id);
      sfx.page();
      return renderTerm();
    }
  } else return;
  sfx.key();
  renderTerm();
}

/** Photos des missions, en phosphore vert. */
function drawArchivePhoto(id: string, cv: HTMLCanvasElement) {
  const c = cv.getContext('2d')!;
  const G = ['#031006', '#0b3014', '#1a6a2c', '#33b056', '#7dffa0', '#d8ffe4'];
  const px = (x: number, y: number, k: number, w = 1, h = 1) => { c.fillStyle = G[k]; c.fillRect(Math.round(x), Math.round(y), w, h); };
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const W = cv.width, H = cv.height;
  px(0, 0, 0, W, H);
  if (id === 'plans') return drawPodPlan(c, G);
  if (id === 'heliade') {
    // un soleil énorme, une plaine de roche fondue
    for (let y = 0; y < 34; y++) px(0, y, y < 12 ? 2 : 1, W, 1);
    for (let y = -30; y <= 30; y++) for (let x = -30; x <= 30; x++) {
      const d = x * x + y * y;
      if (d <= 900) px(70 + x, 4 + y, d < 400 ? 5 : 4);
    }
    for (let y = 34; y < H; y++) px(0, y, 2, W, 1);
    for (let i = 0; i < 9; i++) { let x = rnd() * W, y = 36 + rnd() * 18; for (let k = 0; k < 8; k++) { px(x, y, 4); x += 1 + rnd() * 2; y += rnd() * 2 - 1; } }
    for (let y = 30; y < 36; y += 2) for (let x = (y * 3) % 5; x < W; x += 5) px(x, y, 3); // chaleur qui tremble
    px(10, 30, 1, 14, 4); px(13, 27, 1, 6, 3); // rocher
  } else if (id === 'kairos') {
    // une géante gazeuse et ses anneaux, noyée dans la neige de l'image
    for (let y = -20; y <= 20; y++) for (let x = -20; x <= 20; x++) if (x * x + y * y <= 400) px(48 + x, 28 + y, [2, 3, 2, 4, 3, 2][Math.floor((y + 20) / 7)]);
    for (let a = 0; a < 6.28; a += 0.02) { const x = 48 + Math.cos(a) * 36, y = 28 + Math.sin(a) * 6; if (Math.sin(a) > 0 || Math.abs(x - 48) > 20) px(x, y, 4); }
    const snow = (t: number) => {
      seed = 11 + Math.floor(t * 12);
      for (let i = 0; i < 160; i++) px(rnd() * W, rnd() * H, rnd() < 0.5 ? 0 : 3);
      px(0, Math.floor(rnd() * H), 1, W, 2);
    };
    const base = c.getImageData(0, 0, W, H);
    const tick = (ms: number) => {
      if ($('term').hidden) return;
      c.putImageData(base, 0, 0);
      snow(ms / 1000);
      termNoise = requestAnimationFrame(tick);
    };
    termNoise = requestAnimationFrame(tick);
  } else {
    // Ondine : une banquise sans fin
    for (let y = 0; y < 30; y++) px(0, y, y < 10 ? 0 : 1, W, 1);
    for (let i = 0; i < 25; i++) px(rnd() * W, rnd() * 24, 3);
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) px(16 + x, 8 + y, 3);
    for (let i = 0; i < 5; i++) { const x0 = i * 22 - 4, h = 6 + rnd() * 8; for (let k = 0; k < h; k++) px(x0 + k, 30 - k, 2, 22 - 2 * k > 0 ? 22 - 2 * k : 1, 1); }
    for (let y = 30; y < H; y++) px(0, y, y < 36 ? 4 : 3, W, 1);
    for (let i = 0; i < 6; i++) { let x = rnd() * W, y = 38 + rnd() * 14; for (let k = 0; k < 12; k++) { px(x, y, 2); x += 1; y += rnd() < 0.3 ? 1 : 0; } }
    px(56, 36, 1, 8, 4); px(58, 33, 1, 4, 3); px(55, 40, 1, 2, 2); px(63, 40, 1, 2, 2); // atterrisseur
    px(60, 31, 5); // sa balise
  }
}

/** Plan du pod mobile : la capsule et ses cinq pièces, l'esprit qui part vers Azura, le corps qui l'attend. */
function drawPodPlan(c: CanvasRenderingContext2D, G: string[]) {
  const px = (x: number, y: number, k: number, w = 1, h = 1) => { c.fillStyle = G[k]; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const W = 128, H = 84;
  for (let x = 0; x < W; x += 8) px(x, 0, 1, 1, H);
  for (let y = 0; y < H; y += 8) px(0, y, 1, W, 1);
  const DIG: Record<string, string> = { '1': '010110010010111', '2': '111001111100111', '3': '111001011001111', '4': '101101111001001', '5': '111100111001111' };
  const num = (n: string, x: number, y: number) => {
    px(x - 1, y - 1, 0, 5, 7);
    [...DIG[n]].forEach((b, i) => { if (b === '1') px(x + (i % 3), y + Math.floor(i / 3), 5); });
  };
  const line = (x0: number, y0: number, x1: number, y1: number, k = 2) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, k);
  };
  // la capsule, en coupe
  px(14, 20, 3, 26, 1); px(14, 74, 3, 26, 1); px(13, 21, 3, 1, 53); px(40, 21, 3, 1, 53);
  px(12, 22, 3, 1, 51); px(41, 22, 3, 1, 51);
  px(16, 24, 1, 22, 36); // vitre
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) px(27 + x, 30 + y, 2); // le dormeur
  px(23, 34, 2, 9, 14); px(24, 48, 2, 3, 10); px(28, 48, 2, 3, 10);
  // 1. matrice, près de la tête
  px(34, 28, 4, 4, 4); px(35, 29, 5, 2, 2); line(38, 30, 50, 30); num('1', 52, 27);
  // 2. noyau, à la base
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) px(27 + x, 67 + y, x * x + y * y <= 2 ? 5 : 4);
  line(31, 67, 50, 67); num('2', 52, 64);
  // 3. antenne, sur le capot
  px(27, 8, 3, 1, 12); line(23, 6, 27, 10, 3); line(31, 6, 27, 10, 3); num('3', 33, 10);
  // 4. clé, sur le flanc
  px(6, 40, 3, 6, 7); for (let i = 0; i < 6; i++) px(7 + (i % 2) * 3, 41 + Math.floor(i / 2) * 2, 5); line(12, 43, 13, 43); num('4', 2, 32);
  // 5. amorce BS-1, au pied
  px(34, 75, 2, 8, 5); px(36, 76, 4, 2, 3); px(42, 76, 3, 1, 2); num('5', 46, 75);
  // l'esprit voyage : une onde pointillée jusqu'à Azura
  for (let x = 30; x < 92; x += 3) {
    const y = 8 + Math.round(Math.sin(x / 5) * 2) + Math.round(((x - 30) / 62) * 14);
    px(x, y, x % 6 === 0 ? 4 : 3);
  }
  // Azura
  for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) {
    const d = x * x + y * y;
    if (d <= 144) px(106 + x, 26 + y, d > 120 ? 4 : (x + y * 2) % 7 === 0 || (x > 2 && y < -2) ? 3 : 2);
  }
  // et sur Azura, une cuve où un corps attend
  line(106, 40, 106, 50, 3); line(103, 47, 106, 50, 3); line(109, 47, 106, 50, 3);
  px(96, 52, 3, 20, 1); px(96, 78, 3, 20, 1); px(95, 53, 3, 1, 25); px(116, 53, 3, 1, 25);
  px(97, 55, 1, 19, 22);
  for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 4) px(106 + x, 59 + y, 4);
  px(103, 62, 4, 7, 9); px(104, 71, 4, 2, 5); px(108, 71, 4, 2, 5);
}

/** Vue éclatée des cinq pièces du pod, en phosphore vert. */
function drawExploded(cv: HTMLCanvasElement) {
  const c = cv.getContext('2d')!;
  const G = ['#031006', '#0b3014', '#1a6a2c', '#33b056', '#7dffa0', '#d8ffe4'];
  c.fillStyle = G[0];
  c.fillRect(0, 0, cv.width, cv.height);
  const DIG: Record<string, string> = { '1': '010110010010111', '2': '111001111100111', '3': '111001011001111', '4': '101101111001001', '5': '111100111001111' };
  const parts = ['matrice', 'noyau', 'antenne', 'cle', 'battery'];
  parts.forEach((id, i) => {
    const x0 = 2 + i * 20;
    // l'icône du sac, recolorée en vert selon sa luminosité
    const src = id === 'cle' ? keyIcon() : iconCanvas(id);
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = 16;
    const t = tmp.getContext('2d')!;
    t.drawImage(src, 0, 0);
    const img = t.getImageData(0, 0, 16, 16);
    for (let p = 0; p < img.data.length; p += 4) {
      if (img.data[p + 3] < 40) { img.data[p + 3] = 0; continue; }
      const l = (img.data[p] * 0.3 + img.data[p + 1] * 0.59 + img.data[p + 2] * 0.11) / 255;
      const g = G[Math.min(5, 2 + Math.floor(l * 4))];
      img.data[p] = parseInt(g.slice(1, 3), 16);
      img.data[p + 1] = parseInt(g.slice(3, 5), 16);
      img.data[p + 2] = parseInt(g.slice(5, 7), 16);
      img.data[p + 3] = 255;
    }
    t.putImageData(img, 0, 0);
    c.strokeStyle = G[2];
    c.strokeRect(x0 + 0.5, 2.5, 17, 17);
    c.drawImage(tmp, x0 + 1, 3);
    [...DIG[String(i + 1)]].forEach((b, k) => {
      if (b !== '1') return;
      c.fillStyle = G[5];
      c.fillRect(x0 + 7 + (k % 3), 22 + Math.floor(k / 3), 1, 1);
    });
  });
}

function keyIcon() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 16;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#1a1c22'; c.fillRect(3, 2, 10, 12);
  c.fillStyle = '#9aa3b3';
  for (let i = 0; i < 9; i++) c.fillRect(4 + (i % 3) * 3, 3 + Math.floor(i / 3) * 3, 2, 2);
  c.fillStyle = '#ffffff'; c.fillRect(4, 12, 8, 1);
  return cv;
}
