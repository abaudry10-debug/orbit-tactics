import { Game, VIEW_H, VIEW_W } from './game.js';
import { onPress, setupInput } from './input.js';
import { INTRO } from './story.js';
import * as ui from './ui.js';

const canvas = document.getElementById('game') as HTMLCanvasElement;
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d')!;
let game = new Game(ctx);

// Taille d'affichage : pixels nets (échelle entière quand c'est possible).
function resize() {
  const controls = document.getElementById('controls')!.offsetHeight;
  const availW = Math.min(window.innerWidth, 560) - 16;
  const availH = window.innerHeight - controls - 24;
  let scale = Math.min(availW / VIEW_W, availH / VIEW_H);
  if (scale >= 2) scale = Math.floor(scale);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', resize);
window.visualViewport?.addEventListener('resize', resize);

// ---------- écran titre ----------
const title = document.getElementById('title')!;
const btnContinue = document.getElementById('btn-continue') as HTMLButtonElement;
btnContinue.hidden = !Game.hasSave();

function startNew() {
  Game.clearSave();
  game = new Game(ctx);
  title.hidden = true;
  game.blackout = true;
  ui.say(INTRO, () => {
    ui.fade(() => {
      game.blackout = false;
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
  game = new Game(ctx);
  if (!game.load()) return startNew();
  title.hidden = true;
  ui.showPlace(game.map.name);
}

document.getElementById('btn-new')!.addEventListener('click', startNew);
btnContinue.addEventListener('click', continueGame);
document.getElementById('journal-close')!.addEventListener('click', () => ui.setJournal(false));
document.getElementById('ending-close')!.addEventListener('click', () => {
  document.getElementById('ending')!.hidden = true;
});
document.getElementById('dialog')!.addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  ui.advanceDialog();
});

// ---------- routage des boutons ----------
onPress((b) => {
  if (!title.hidden) {
    if (b === 'a') (btnContinue.hidden ? startNew : continueGame)();
    return;
  }
  const ending = document.getElementById('ending')!;
  if (!ending.hidden) {
    if (b === 'a' || b === 'b') ending.hidden = true;
    return;
  }
  if (ui.keypadOpen()) return ui.keypadInput(b);
  if (ui.journalOpen()) {
    if (b === 'journal' || b === 'b' || b === 'a') ui.setJournal(false);
    return;
  }
  if (ui.dialogOpen()) {
    if (b === 'a' || b === 'b') ui.advanceDialog();
    return;
  }
  if (b === 'a') game.interact();
  else if (b === 'journal') game.openJournal();
});

setupInput();
ui.setupKeypadTouch();
resize();

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
