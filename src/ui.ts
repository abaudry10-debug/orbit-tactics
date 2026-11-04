// Interface HTML par-dessus le canvas : dialogues, journal, clavier à code, notifications.
import { setStatic, sfx, startStatic, stopStatic } from './audio.js';
import { iconUrl } from './sprites.js';
import { CLUES, ITEMS, QUESTIONS, THREADS, type ArchiveFolder } from './story.js';

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

export async function playFinale(pixelSprite: HTMLCanvasElement, onBlack?: () => void) {
  const el = $('finale');
  const cv = $('finale-canvas') as HTMLCanvasElement;
  const text = $('finale-text');
  const c = cv.getContext('2d')!;
  // canevas aux proportions de l'écran, en gros pixels
  const W = 80;
  const H = Math.max(80, Math.round((W * el.parentElement!.clientHeight) / Math.max(1, el.parentElement!.clientWidth)));
  cv.width = W;
  cv.height = H;
  c.imageSmoothingEnabled = false;
  text.textContent = '';
  el.className = 'finale clear';
  el.hidden = false;
  /** Fait varier t de 0 à 1 pendant `ms`, en redessinant à chaque image. */
  const animate = (ms: number, draw: (t: number) => void) =>
    new Promise<void>((res) => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        draw(t);
        if (t < 1) requestAnimationFrame(step);
        else res();
      };
      requestAnimationFrame(step);
    });
  const fill = (col: string, alpha = 1) => {
    c.globalAlpha = alpha;
    c.fillStyle = col;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  };
  // 1. tout s'assombrit peu à peu, jusqu'au noir complet
  await animate(2400, (t) => { c.clearRect(0, 0, W, H); fill('#000', t * t); });
  el.className = 'finale';
  onBlack?.();
  await wait(1000);
  // 2. dans le noir, la silhouette de Pixel… et son œil qui clignote une fois
  const dx = Math.round(W / 2 - 8), dy = Math.round(H * 0.62);
  const pixel = (alpha: number, eye: boolean) => {
    fill('#000');
    c.globalAlpha = alpha;
    c.drawImage(pixelSprite, dx, dy);
    c.globalAlpha = 1;
    if (eye) {
      c.fillStyle = 'rgba(94,240,255,0.35)';
      c.fillRect(dx + 11, dy + 4, 3, 3);
      c.fillStyle = '#5ef0ff';
      c.fillRect(dx + 12, dy + 5, 1, 1);
    }
  };
  await animate(900, (t) => pixel(0.4 * t, false));
  await wait(700);
  pixel(0.4, true);
  await wait(260);
  pixel(0.4, false);
  await wait(900);
  await animate(700, (t) => pixel(0.4 * (1 - t), false));
  await wait(500);
  // 3. l'éclair blanc du transfert
  await animate(450, (t) => { fill('#000'); fill('#fff', t); });
  await wait(1500);
  // 4. fondu vers un ciel bleu
  const sky = document.createElement('canvas');
  sky.width = W;
  sky.height = H;
  const s = sky.getContext('2d')!;
  for (let y = 0; y < H; y++) {
    const k = y / H;
    s.fillStyle = `rgb(${Math.round(90 + 90 * k)},${Math.round(160 + 60 * k)},${Math.round(235 + 15 * k)})`;
    s.fillRect(0, y, W, 1);
  }
  const cloud = (x: number, y: number) => {
    s.fillStyle = '#ffffff';
    s.fillRect(x, y, 18, 3); s.fillRect(x + 3, y - 2, 10, 2); s.fillRect(x + 6, y - 4, 5, 2);
  };
  cloud(8, Math.round(H * 0.25)); cloud(50, Math.round(H * 0.45)); cloud(20, Math.round(H * 0.7));
  await animate(1800, (t) => { fill('#fff'); c.globalAlpha = t; c.drawImage(sky, 0, 0); c.globalAlpha = 1; });
  await wait(2200);
  // 5. le noir, puis le dernier texte
  await animate(1000, (t) => { c.drawImage(sky, 0, 0); fill('#000', t); });
  await wait(700);
  text.textContent = 'Transfert du sujet 07 :\n4\u00a0212 / 4\u00a0212.';
  await wait(4500);
  text.textContent = '';
  await wait(700);
  el.hidden = true;
}

// ---------- ordinateur des archives (écran vert sur fond noir) ----------
interface TermOpts {
  folders: ArchiveFolder[];
  code: string;
  loggedIn: boolean;
  onEvent: (ev: string) => void; // 'login', puis l'id de chaque dossier ouvert
  onClose?: () => void;
}
let term: TermOpts | undefined;
let termState: 'login' | 'menu' | 'file' = 'login';
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

const termItems = (): string[] =>
  termState === 'menu' ? [...term!.folders.map((f) => f.name + (f.locked ? ' [CONFIDENTIEL]' : '/')), 'DÉCONNEXION'] : termState === 'file' ? ['◀ RETOUR'] : [];

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
  if (termState === 'login') {
    scr.appendChild(line('UTILISATEUR : I.VARN'));
    const row = document.createElement('div');
    row.className = 'term-pass';
    row.appendChild(line('MOT DE PASSE :'));
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
    scr.appendChild(line('Indice : « la mission qui n’a trouvé que de la glace »', 'dim'));
    if (termMsg) scr.appendChild(line(termMsg, 'warn'));
    const actions = document.createElement('div');
    actions.className = 'term-actions';
    const ok = document.createElement('button');
    ok.className = 'term-btn';
    ok.textContent = '[ CONNEXION ]';
    ok.addEventListener('click', () => termInput('a'));
    const quit = document.createElement('button');
    quit.className = 'term-btn';
    quit.textContent = '[ QUITTER ]';
    quit.addEventListener('click', closeTerminal);
    actions.append(ok, quit);
    scr.appendChild(actions);
  } else if (termState === 'menu') {
    scr.appendChild(line('Bienvenue, Dr Varn.'));
    scr.appendChild(line('> ls /missions', 'dim'));
  } else if (termFile) {
    scr.appendChild(line('> open /missions/' + termFile.name, 'dim'));
    if (!termFile.locked) {
      const cv = document.createElement('canvas');
      cv.width = 96;
      cv.height = 56;
      cv.className = 'term-photo';
      scr.appendChild(cv);
      drawArchivePhoto(termFile.id, cv);
    }
    for (const l of termFile.lines) scr.appendChild(line(l, termFile.locked ? 'warn' : ''));
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
  if (termState === 'login') {
    if (b === 'up') termDigits[termCursor] = (termDigits[termCursor] + 1) % 10;
    else if (b === 'down') termDigits[termCursor] = (termDigits[termCursor] + 9) % 10;
    else if (b === 'left') termCursor = (termCursor + 3) % 4;
    else if (b === 'right') termCursor = (termCursor + 1) % 4;
    else if (b === 'b' || b === 'menu') return closeTerminal();
    else if (b === 'a') {
      if (termDigits.join('') === term.code) {
        sfx.success();
        term.onEvent('login');
        termState = 'menu';
        termSel = 0;
      } else {
        sfx.wrong();
        termMsg = 'MOT DE PASSE INCORRECT.';
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
      termState = 'file';
      termSel = 0;
      term.onEvent(termFile.id);
      if (termFile.locked) sfx.wrong();
      else sfx.page();
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
  const W = 96, H = 56;
  px(0, 0, 0, W, H);
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
