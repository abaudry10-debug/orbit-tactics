import { isMuted, playTheme, setMuted, sfx, unlock } from './audio.js';
import { Game, view } from './game.js';
import { onPress, releaseAll, setupInput } from './input.js';
import { INTRO } from './story.js';
import { relayoutTitleScene, startTitleScene, stopTitleScene } from './title.js';
import * as ui from './ui.js';

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
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('keydown', unlock, { capture: true });

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
  title.hidden = false;
  startTitleScene($('title-bg') as HTMLCanvasElement);
  btnContinue.hidden = !Game.hasSave();
  playTheme('title');
}

function askNewGame() {
  sfx.select();
  if (Game.hasSave()) {
    ui.confirm('Une partie est déjà sauvegardée. La remplacer par une nouvelle ?', startNew);
  } else startNew();
}

function startNew() {
  Game.clearSave();
  game = new Game(ctx);
  title.hidden = true;
  stopTitleScene();
  game.blackout = true;
  playTheme('none');
  ui.say(INTRO, () => {
    ui.fade(() => {
      game.blackout = false;
      game.startMusic();
      ui.showPlace(game.map.name);
      ui.say([
        'Où suis-je… ?',
        'Je ne me souviens de rien. Pas même de mon nom.',
        '(Touche A pour examiner ce qui t’entoure. Ton journal garde la trace de tout ce que tu découvres.)',
      ]);
    });
  });
}

function continueGame() {
  sfx.select();
  game = new Game(ctx);
  if (!game.load()) return startNew();
  title.hidden = true;
  stopTitleScene();
  game.startMusic();
  ui.showPlace(game.map.name);
}

$('btn-new').addEventListener('click', askNewGame);
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
$('bag-close').addEventListener('click', () => ui.setBag(false));
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
  if (ui.keypadOpen()) return ui.keypadInput(b);
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
