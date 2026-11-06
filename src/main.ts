import { vesper } from './chapters/vesper/index.js';
import { isMuted, playTheme, resumeAudio, setMuted, sfx, unlock } from './engine/audio.js';
import { ch, setChapter } from './engine/chapter.js';
import { Game, view } from './engine/game.js';
import { devEnabled, setupDev } from './engine/dev.js';
import { azura } from './chapters/azura/index.js';
import { chapterDone } from './engine/legacy.js';
import { onPress, releaseAll, setupInput } from './engine/input.js';
import { relayoutTitleScene, startTitleScene, stopTitleScene } from './engine/title.js';
import * as ui from './engine/ui.js';

setChapter(vesper);

const $ = (id: string) => document.getElementById(id)!;

const canvas = $('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
let game = new Game(ctx);

// La vue remplit la zone de jeu (tout l'écran à l'horizontale, le haut de l'écran
// à la verticale), avec des pixels nets : environ 12 cases sur le petit côté.
function resize() {
  const screen = $('screen');
  const w = screen.clientWidth || window.innerWidth;
  const h = screen.clientHeight || window.innerHeight;
  const scale = Math.max(1, Math.floor(Math.min(w, h) / (11.5 * 16)));
  view.w = Math.ceil(w / scale);
  view.h = Math.ceil(h / scale);
  view.padBottom = 0;
  canvas.width = view.w;
  canvas.height = view.h;
  canvas.style.width = `${view.w * scale}px`;
  canvas.style.height = `${view.h * scale}px`;
}
// Après une rotation, l'iPhone change la taille de l'écran un peu après l'événement :
// on surveille directement la zone de jeu, et on recalcule aussi juste après la rotation.
window.addEventListener('resize', resize);
window.addEventListener('resize', () => window.setTimeout(relayoutTitleScene, 50));
window.visualViewport?.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => {
  for (const ms of [100, 300, 700]) window.setTimeout(resize, ms);
});
if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe($('screen'));

// Le son ne peut démarrer qu'après un geste : premier contact avec la page.
// Les navigateurs (surtout sur iPhone) n'autorisent le son qu'après un vrai geste :
// on tente de le lancer dès le premier toucher, n'importe où sur l'écran.
for (const ev of ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, { capture: true });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) resumeAudio();
});

// ---------- son ----------
function refreshSoundLabels() {
  const label = isMuted() ? 'Son : coupé' : 'Son : activé';
  $('btn-sound').textContent = label;
  $('pause-sound').textContent = label;
}
function toggleSound() {
  setMuted(!isMuted());
  refreshSoundLabels();
  sfx.select();
}
$('btn-sound').addEventListener('click', toggleSound);
$('pause-sound').addEventListener('click', toggleSound);
refreshSoundLabels();

// ---------- écran titre ----------
const title = $('title');
const btnContinue = $('btn-continue') as HTMLButtonElement;

function showTitle() {
  setChapter(vesper); // l'écran titre est celui du chapitre 1
  title.hidden = false;
  startTitleScene($('title-bg') as HTMLCanvasElement);
  btnContinue.hidden = !Game.hasSave();
  $('chap-1-state').textContent = chapterDone(ch().id) ? '✓ terminé' : Game.hasSave() ? 'en cours' : '';
  // en mode développeur, le chapitre 2 se lance depuis l'écran titre
  const dev = devEnabled();
  $('chap-2').classList.toggle('locked', !dev);
  $('chap-2').classList.toggle('dev', dev);
  $('chap-2-state').textContent = dev ? 'dev ▶' : 'bientôt';
  playTheme('title');
}

function askNewGame() {
  sfx.select();
  if (Game.hasSave()) {
    ui.confirm('Une partie est déjà sauvegardée. La remplacer par une nouvelle ?', startNew);
  } else startNew();
}

function wireGame() {
  game.onFinished = () => {
    Game.clearSave();
    showTitle();
  };
}

function startNew() {
  Game.clearSave();
  game = new Game(ctx);
  wireGame();
  title.hidden = true;
  stopTitleScene();
  game.blackout = true;
  playTheme('none');
  ch().begin(game);
}

function continueGame() {
  sfx.select();
  game = new Game(ctx);
  wireGame();
  if (!game.load()) return startNew();
  title.hidden = true;
  stopTitleScene();
  game.startMusic();
  ui.showPlace(game.map.name);
}

$('btn-new').addEventListener('click', askNewGame);
$('chap-2').addEventListener('click', () => {
  if (!devEnabled()) return;
  sfx.select();
  setChapter(azura);
  if (Game.hasSave()) continueGame();
  else startNew();
});
btnContinue.addEventListener('click', continueGame);

// ---------- pause ----------
const pause = $('pause');
function openPause() {
  if (game.blackout) return;
  releaseAll();
  sfx.select();
  $('pause-status').textContent = '';
  $('pause-status').classList.remove('error');
  pause.hidden = false;
}
function closePause() {
  pause.hidden = true;
}
$('pause-resume').addEventListener('click', closePause);
$('pause-quit').addEventListener('click', () => {
  const status = $('pause-status');
  if (game.saveVerified()) {
    status.classList.remove('error');
    status.textContent = 'Partie sauvegardée ✓';
    sfx.clue();
    window.setTimeout(() => {
      closePause();
      ui.fade(showTitle);
    }, 700);
  } else {
    status.classList.add('error');
    status.textContent = 'Sauvegarde impossible sur cet appareil (navigation privée ?).';
    ui.confirm('La partie n’a pas pu être sauvegardée. Quitter quand même ?', () => {
      closePause();
      ui.fade(showTitle);
    });
  }
});

// ---------- autres boutons ----------
$('journal-close').addEventListener('click', () => ui.setJournal(false));
$('memory').addEventListener('click', () => ui.memoryInput());
$('bag-close').addEventListener('click', () => ui.setBag(false));
$('viewer-close').addEventListener('click', () => ui.closeViewer());
$('switches-close').addEventListener('click', () => ui.closeSwitches());
$('dialog').addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  ui.advanceDialog();
});

// ---------- routage des boutons ----------
onPress((b) => {
  if (!$('confirm').hidden) return;
  if (!title.hidden) {
    if (b === 'a') (btnContinue.hidden ? askNewGame : continueGame)();
    return;
  }
  if (!pause.hidden) {
    if (b === 'menu' || b === 'b') closePause();
    return;
  }
  if (ui.bagOpen()) {
    if (b === 'bag' || b === 'b' || b === 'menu') ui.setBag(false);
    return;
  }
  if (!$('finale').hidden) return;
  if (!$('viewer').hidden) {
    if (b === 'a' || b === 'b' || b === 'menu') ui.closeViewer();
    return;
  }
  if (!$('switches').hidden) {
    if (b === 'b' || b === 'menu') ui.closeSwitches();
    return;
  }
  if (ui.memoryOpen()) {
    if (b === 'a' || b === 'b') ui.memoryInput();
    return;
  }
  if (ui.termOpen()) return ui.termInput(b);
  if (ui.keypadOpen()) return ui.keypadInput(b);
  if (ui.radioOpen()) return ui.radioInput(b);
  if (ui.journalOpen()) {
    if (b === 'journal' || b === 'b' || b === 'a' || b === 'menu') ui.setJournal(false);
    return;
  }
  if (ui.dialogOpen()) {
    if (b === 'a' || b === 'b') ui.advanceDialog();
    return;
  }
  if (b === 'a') game.interact();
  else if (b === 'journal') game.openJournal();
  else if (b === 'bag') game.openBag();
  else if (b === 'menu') openPause();
});

setupInput();
ui.setupKeypadTouch();
ui.setupRadioTouch();
resize();
showTitle();

let last = performance.now();
function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    if (title.hidden) game.update(dt);
    game.render();
  } catch (err) {
    console.error(err);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Hook de test : permet aux captures automatiques de piloter le jeu.
(window as unknown as { __game: () => Game }).__game = () => game;
// recommencer un chapitre depuis zéro (sa sauvegarde est effacée, l'autre est gardée)
const restartChapter = (c: typeof vesper) => () => {
  ui.confirm(`Recommencer « ${c.title} » depuis le début ? Sa sauvegarde sera effacée.`, () => {
    pause.hidden = true;
    setChapter(c);
    Game.clearSave();
    startNew();
  });
};
setupDev(() => game, () => title.hidden === true, [
  { label: 'Chapitre 1 · Vesper', run: restartChapter(vesper) },
  { label: 'Chapitre 2 · Azura', run: restartChapter(azura) },
]);
