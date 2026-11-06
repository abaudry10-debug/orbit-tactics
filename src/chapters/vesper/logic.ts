// Le code propre au chapitre Vesper : la capsule 07 et la fin, la Sonde Lumen,
// le récepteur radio, la cabane de Betti, les vagues de chaleur scénarisées.
// Le moteur l'appelle à travers les crochets (hooks) du chapitre.
import { playTheme, sfx } from '../../engine/audio.js';
import type { ChapterHooks } from '../../engine/chapter.js';
import type { Game } from '../../engine/game.js';
import { releaseAll } from '../../engine/input.js';
import { T, dogAsleep } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';
import { charAt } from '../../engine/world.js';
import { FINALE, RADIO_FREQ, SCRIPTS, SIGNAL_KEY } from './story.js';

/** État de la séquence finale, propre à chaque partie. */
interface EndState {
  seq: { stage: 'unplug' | 'walk' | 'prime' | 'enter' | 'glow'; t: number; path: [number, number][] } | null;
  podGlow: number;
}
const states = new WeakMap<Game, EndState>();
function st(g: Game): EndState {
  let s = states.get(g);
  if (!s) states.set(g, (s = { seq: null, podGlow: 0 }));
  return s;
}

// ---------- le transporteur (capsule 07) ----------
function podInteract(g: Game) {
  const f = g.flags;
  if (!f.has('heliosOn')) return ui.say(['La capsule 07 est éteinte. Pour un transfert, il faudrait énormément d’énergie… Hélios ?']);
  if (!f.has('podAssembled')) {
    const parts: [string, string][] = [['matrice', 'la Matrice vierge'], ['noyau', 'le Noyau de transfert'], ['antenne', 'l’antenne de synchronisation']];
    const missing = parts.filter(([id]) => !g.items.has(id)).map(([, name]) => name);
    if (missing.length) return ui.say(['D’après les plans, il me manque encore :', `${missing.join(', ')}.`]);
    ui.say(
      ['Tu poses la Matrice vierge dans son logement.', 'Tu insères le Noyau de transfert. Il s’illumine.', 'Tu fixes l’antenne de synchronisation sur le capot.', 'La capsule 07 s’éveille dans un bourdonnement.'],
      () => {
        for (const id of ['matrice', 'noyau', 'antenne']) g.items.delete(id);
        f.add('podAssembled');
        sfx.success();
        g.save();
      },
    );
    return;
  }
  if (!f.has('podTuned')) {
    if (!g.items.has('capteur')) return ui.say(['L’antenne doit être accordée sur la balise d’Azura. Il me faudrait le récepteur.']);
    ui.say(['L’antenne doit être accordée sur la balise d’Azura.', '« SAISIR LA FRÉQUENCE DE LA BALISE ».'], () => {
      releaseAll();
      ui.openKeypad(
        'FRÉQUENCE',
        (code) => {
          if (code !== String(Math.round(RADIO_FREQ * 10)).padStart(3, '0')) {
            sfx.wrong();
            return ui.say(['« AUCUNE BALISE SUR CETTE FRÉQUENCE. »']);
          }
          f.add('podTuned');
          sfx.success();
          g.save();
          ui.say(['« BALISE D’AZURA ACQUISE. »', 'L’antenne capte le signal. Synchronisation possible.']);
        },
        'Fréquence en MHz',
        3,
        1,
      );
    });
    return;
  }
  if (!f.has('podKeyed')) {
    ui.say(['« SAISIR LA CLÉ DE SYNCHRONISATION ».'], () =>
      ui.openKeypad(
        'CLÉ DE SYNCHRONISATION',
        (code) => {
          if (code !== SIGNAL_KEY) {
            sfx.wrong();
            return ui.say(['« CLÉ REFUSÉE. »', 'La clé est cachée dans le signal d’Azura…']);
          }
          f.add('podKeyed');
          f.add('podNeedsPrime');
          sfx.success();
          g.save();
          ui.say(['« CLÉ ACCEPTÉE. »', '« TRANSFERT PRÊT. »', '« AMORCE : SOURCE ISOLÉE REQUISE — TYPE BS-1. »']);
        },
        'Clé à 4 chiffres',
      ),
    );
    return;
  }
  const lines = f.has('primeHint')
    ? ['« AMORCE : SOURCE ISOLÉE REQUISE — TYPE BS-1. »', 'Pixel vient s’asseoir à côté de toi, au pied de la capsule.']
    : [
        '« AMORCE : SOURCE ISOLÉE REQUISE — TYPE BS-1. »',
        'Une BS-1… Il n’en existe qu’une.',
        'Pixel vient s’asseoir à côté de toi, au pied de la capsule. Il ne bouge plus. Il te regarde.',
      ];
  f.add('primeHint');
  ui.say(lines, () => pixelWaitAtPod(g));
}

/** Pixel s'assoit tout près, au pied de la capsule, et attend. */
function pixelWaitAtPod(g: Game) {
  const p = g.pixel;
  if (!p) return;
  const pod = g.map.objects.find((o) => o.id === 'capsule07');
  const spots: [number, number][] = [[g.x + 1, g.y], [g.x - 1, g.y], [g.x, g.y + 1], [g.x + 1, g.y + 1], [g.x - 1, g.y + 1]];
  if (pod) spots.sort((a, b) => Math.abs(a[0] - pod.x) + Math.abs(a[1] - pod.y) - (Math.abs(b[0] - pod.x) + Math.abs(b[1] - pod.y)));
  for (const s of spots) {
    if (s[0] === p.x && s[1] === p.y) {
      g.pixelMode = 'stay';
      g.facePixelToHero();
      return;
    }
    if (!g.pixelFree(s[0], s[1])) continue;
    const path = g.pixelPath([p.x, p.y], s, false, 8);
    if (!path) continue;
    g.pixelMode = 'stay';
    g.walkPixel(path, 3.2);
    return;
  }
  g.pixelMode = 'stay';
  g.facePixelToHero();
}

/** La dernière décision : débrancher la batterie de Pixel… ou une dernière balade. */
function askPrime(g: Game) {
  ui.confirm(
    'Pixel te regarde, assis au pied de la capsule.',
    () => finale(g),
    () => {
      g.pixelMode = 'follow';
      sfx.pixelHappy();
      const hx = g.pixel!.x * T + 8, hy = g.pixel!.y * T + 2;
      for (let i = 0; i < 2; i++) g.fx.push({ kind: 'heart', x: hx - 2 + i * 4, y: hy, vx: (i - 0.5) * 4, vy: -14, life: 1.3, max: 1.3 });
      ui.say(['Pixel bondit sur ses pattes, la queue battante.', 'Allez… encore une balade, tous les deux.']);
    },
    ['Débrancher la batterie de Pixel', 'Encore une dernière balade'],
  );
}

function finale(g: Game) {
  g.locked = true;
  releaseAll();
  g.heroCrouch = 999;
  ui.say(
    [
      'Tu t’agenouilles près de Pixel.',
      'Il s’assoit de lui-même, et tend son dos.',
      'Tu débranches doucement la batterie BS-1.',
      'Ses yeux bleus faiblissent… puis s’éteignent.',
    ],
    () => {
      g.flags.delete('pixelOn');
      g.flags.add('pixelSleep');
      g.pixel = null;
      playTheme('none');
      sfx.key();
      g.pop = { kind: 'item', id: 'battery', t: 0 };
      g.heroCrouch = 1;
      // le chemin jusqu'au pied de la capsule
      const pod = g.map.objects.find((o) => o.id === 'capsule07');
      const front: [number, number] = pod ? [pod.x, pod.y + 1] : [g.x, g.y];
      const path = g.x === front[0] && g.y === front[1] ? [] : g.pixelPath([g.x, g.y], front, true, 20) ?? [];
      st(g).seq = { stage: 'unplug', t: 0, path };
    },
  );
}

function endStep(g: Game, to: [number, number], dur: number) {
  g.dir = to[0] > g.x ? 'right' : to[0] < g.x ? 'left' : to[1] > g.y ? 'down' : 'up';
  g.drag = { fx: g.x, fy: g.y, t: 0, dur };
  g.x = to[0];
  g.y = to[1];
  sfx.step();
}

function updateEnding(g: Game, dt: number) {
  const e = st(g).seq!;
  e.t += dt;
  if (g.drag) {
    g.drag.t += dt / g.drag.dur;
    if (g.drag.t >= 1) g.drag = null;
  }
  if (e.stage !== 'unplug' && e.stage !== 'walk') st(g).podGlow = Math.min(1, st(g).podGlow + dt * 0.6);
  if (e.stage === 'unplug' && e.t > 1.4) {
    e.stage = 'walk';
    e.t = 0;
  }
  if (e.stage === 'walk' && !g.drag) {
    const next = e.path.shift();
    if (next) return endStep(g, next, 0.32);
    // devant la capsule : on y glisse la batterie
    e.stage = 'prime';
    e.t = 0;
    g.dir = 'up';
    g.heroCrouch = 1.2;
    sfx.door();
    ui.say(['Tu glisses la batterie dans le logement de l’amorce.', 'La capsule s’éclaire et ronronne.'], () => {
      // le héros entre dans la capsule
      const pod = g.map.objects.find((o) => o.id === 'capsule07');
      e.stage = 'enter';
      e.t = 0;
      if (pod) endStep(g, [pod.x, pod.y], 1.1);
    });
    return;
  }
  if (e.stage === 'enter') {
    g.heroAlpha = Math.max(0, 1 - e.t / 1.1);
    if (e.t >= 1.1) {
      g.heroAlpha = 0;
      e.stage = 'glow';
      e.t = 0;
      sfx.success();
    }
  }
  if (e.stage === 'glow' && e.t > 1.8) {
    st(g).seq = null;
    ui.say(['Tu t’allonges dans la capsule 07. Pixel est couché à son pied.', ...FINALE], async () => {
      await ui.playFinale(dogAsleep(), () => { g.blackout = true; });
      g.locked = false;
      g.onFinished();
    });
  }
}

export function onSignal(g: Game) {
  if (g.flags.has('signalFound')) return;
  g.flags.add('signalFound');
  sfx.success();
  ui.say(
    [
      '… Là ! Sur 47,2, un signal se détache du bruit.',
      'Une suite de bips, toujours la même :\n–··   ··–   –––   ·–·',
      'Régulier, insistant. Il vient de très loin, de la planète d’Aurore.',
      'Ce n’est pas du silence… mais je n’y comprends rien. Le message est indéchiffrable.',
    ],
    () => g.addClue('mis7'),
  );
  g.save();
}

/** Près de l'endroit indiqué par le journal de Betti : sous le potager, à deux pas à droite du grand arbre. */
function nearCabin(g: Game) {
  const hatch = g.map.objects.find((o) => o.id === 'cabinHatch');
  return (
    !!hatch &&
    g.flags.has('readLeaDiary') &&
    !g.flags.has('knowsCabin') &&
    Math.max(Math.abs(g.x - hatch.x), Math.abs(g.y - hatch.y)) <= 1
  );
}

// ---------- Sonde Lumen ----------
function nearestSource(g: Game): { d: number } | null {
  let best: number | null = null;
  for (const e of g.map.energy ?? []) {
    if (g.flags.has(e.goneWhen)) continue;
    const d = Math.max(Math.abs(e.x - g.x), Math.abs(e.y - g.y));
    if (best === null || d < best) best = d;
  }
  return best === null ? null : { d: best };
}

function updateDetector(g: Game, dt: number) {
  const on = g.flags.has('sondeOn') && !g.blackout;
  let level = 0;
  if (on) {
    const src = nearestSource(g);
    if (src) level = src.d <= 1 ? 3 : src.d <= 4 ? 2 : src.d <= 10 ? 1 : 0;
    g.beepTimer -= dt;
    const every = [0, 1.4, 0.6, 0.22][level];
    if (level > 0 && g.beepTimer <= 0) {
      sfx.key();
      g.beepTimer = every;
    }
  }
  ui.setDetector(on, level);
}

// ---------- les crochets branchés sur le moteur ----------
export const hooks: ChapterHooks = {
  beforeInteract(g, obj, fx, fy) {
    if (obj?.id === 'capsule07' && g.flags.has('plansRead')) {
      podInteract(g);
      return true;
    }
    const p = g.pixel;
    if (p && p.x === fx && p.y === fy && g.pixelMode === 'stay' && g.flags.has('podNeedsPrime') && g.map.id === 'lab') {
      askPrime(g);
      return true;
    }
    if (p && p.x === fx && p.y === fy && !p.walk && !obj) return false; // la caresse passe avant
    if (nearCabin(g) && (!obj || obj.id === 'cabinHatch')) {
      ui.say(['« Sous le potager, à deux pas à droite du grand arbre »… C’est par ici.', 'La terre est meuble. Avec la pelle, je pourrais creuser.']);
      return true;
    }
    return false;
  },

  describeTile(g, ch) {
    if (ch === '~') ui.say(['Une eau verte, tiède, qui sent le métal brûlé.', 'Mieux vaut ne pas y toucher.']);
    else if (ch === 'C') ui.say(['Une épave de voiture, mangée par la rouille. Vide.']);
    else if (ch === 'T') ui.say(['Un arbre mort, calciné d’un seul côté.']);
    else if (ch === 'P') ui.say(['Un panneau solaire brisé, à moitié enfoui dans le sable.']);
    else if (ch === 'v') ui.say(['Des plants desséchés.']);
    else if (ch === 'N' && g.map.id === 'vesper') SCRIPTS.shuttle?.(g.api);
    else if (ch === 'N' && g.map.id === 'quartier') ui.say(['Un arbre immense, bien plus grand que les autres. Mort, lui aussi.']);
    else if (ch === 'N') ui.say(['Une tour solaire. Son capteur doré fixe encore le ciel.']);
  },

  useItem(g, id) {
    if (id === 'sonde') {
      if (g.flags.has('sondeOn')) {
        g.flags.delete('sondeOn');
        ui.toast('Sonde éteinte');
      } else if (g.flags.has('batteryFound')) {
        // la seule source qu'elle cherchait est trouvée : elle ne capte plus rien
        ui.say(['Tu allumes la Sonde… Plus aucune source d’énergie à capter.', 'Tu l’éteins.']);
        return true;
      } else {
        g.flags.add('sondeOn');
        ui.toast('Sonde allumée');
      }
      sfx.select();
      g.save();
      return true;
    }
    if (id === 'capteur') {
      if (g.map.id === 'sommet') {
        releaseAll();
        ui.openRadio(RADIO_FREQ, () => onSignal(g));
      } else if (g.map.dark) ui.say(['Sous terre, le récepteur ne capte que du silence.']);
      else if (g.map.id === 'colline') ui.say(['Des grésillements, très faibles. Il faudrait prendre de la hauteur… la tour radio ?']);
      else ui.say(['Des grésillements. Rien d’autre. Il faudrait un point très haut.']);
      return true;
    }
    if (id === 'battery') {
      const target = g.map.objects.find(
        (o) => o.id === 'pixelOff' && !g.flags.has('pixelOn') && Math.max(Math.abs(o.x - g.x), Math.abs(o.y - g.y)) <= 1,
      );
      if (!target) {
        ui.say(['Il faudrait la brancher sur quelque chose qui manque d’énergie.']);
        return true;
      }
      ui.say(
        ['Tu branches la batterie BS-1 sur le dos de Pixel.', 'Un ronronnement… ses yeux s’allument d’un bleu vif.', 'Pixel se lève, s’étire, et vient se coller à tes jambes.'],
        () => {
          g.items.delete('battery');
          g.flags.add('pixelOn');
          g.pixel = { x: target.x, y: target.y, dir: 'down', moving: null };
          sfx.success();
          g.refreshQuestions(false);
          g.save();
          // s'il porte déjà la carte tombée de son flanc, Pixel la réclame tout de suite
          if (g.items.has('memo1')) {
            ui.say(['Pixel renifle ton sac. Une petite trappe clignote sur son flanc…'], () => g.plugMemory(1));
          }
        },
      );
      return true;
    }
    return false;
  },

  dig(g) {
    if (g.map.id === 'quartier' && !g.flags.has('memo2Found') && Math.max(Math.abs(g.x - 9), Math.abs(g.y - 9)) <= 1) {
      ui.say(['Tu creuses à côté de la boîte aux lettres…', 'Un petit trésor enterré : une carte mémoire, enveloppée dans un chiffon.'], () => {
        g.flags.add('memo2Found');
        g.api.item('memo2');
        g.save();
      });
      return;
    }
    if (nearCabin(g)) {
      ui.say(['Tu plantes la pelle dans la terre du potager…', 'Elle heurte du bois. Une trappe !'], () => {
        sfx.door();
        g.flags.add('knowsCabin');
        g.save();
      });
      return;
    }
    const ch = charAt(g.map, g.x, g.y);
    if (ch !== 'S') return ui.say(['Le sol est trop dur ici. Il faudrait du sable.']);
    const key = `dug:${g.map.id}:${g.x},${g.y}`;
    if (g.flags.has(key)) return ui.say(['J’ai déjà creusé ici.']);
    g.flags.add(key);
    sfx.page();
    const src = nearestSource(g);
    const found = src && src.d <= 1 && g.flags.has('sondeOn') && g.flags.has('knowsBattery');
    if (found) {
      ui.say(['Tu creuses… La pelle heurte quelque chose de dur.', 'Une batterie solaire, enveloppée dans une bâche : le prototype BS-1 !'], () => {
        g.flags.add('batteryFound');
        g.api.item('battery');
        g.flags.delete('sondeOn'); // sa mission est accomplie
        ui.toast('Sonde éteinte');
        g.save();
      });
    } else {
      ui.say(['Tu creuses… rien que du sable.', g.flags.has('sondeOn') ? 'La Sonde n’indique rien de précis ici.' : 'Creuser au hasard ne mènera nulle part.']);
      g.save();
    }
  },

  onEnterMap(g, mapId) {
    const f = g.flags;
    if (mapId === 'vesper' && f.has('pondDry') && !f.has('pondSeen')) {
      f.add('pondSeen');
      ui.say(['Le lac toxique… il s’est évaporé pendant la vague.', 'Il ne reste qu’une vase craquelée. On peut passer à pied jusqu’à l’abri de chantier.']);
    }
    if (mapId === 'maisonLea' && g.pixel && !f.has('pixelHome')) {
      f.add('pixelHome');
      sfx.pixelHappy();
      ui.say(['Pixel file droit vers un vieux panier, dans un coin.', 'Il le renifle, tourne trois fois sur lui-même… Sa queue ne s’arrête plus.']);
    }
    if (mapId === 'vesper' && !f.has('firstOutside')) {
      f.add('firstOutside');
      ui.say(['Le ciel… il est orange.', 'La ville est en ruine. Il n’y a personne.', 'Il faut que je comprenne ce qui s’est passé ici.']);
    }
  },

  /** Avant le reste de la mise à jour : la Sonde. */
  update(g, dt) {
    updateDetector(g, dt);
  },

  /** Dans la mise à jour de Pixel et des effets : la séquence finale. */
  updateLate(g, dt) {
    if (st(g).seq) updateEnding(g, dt);
  },

  heroWalking(g) {
    return !!st(g).seq && !!g.drag && st(g).seq!.stage === 'walk';
  },

  renderTile(g, c, _name, x, y, sx, sy) {
    const glow = st(g).podGlow;
    if (glow > 0 && x === 2 && y === 2 && g.map.id === 'lab') {
      // la capsule 07 s'illumine : la vitre devient lumière, une lueur bleue au sol
      const a = glow * (0.55 + 0.25 * Math.sin(g.time * 6));
      c.fillStyle = `rgba(94,240,255,${a})`;
      c.fillRect(sx + 4, sy + 3, 8, 9);
      c.fillStyle = `rgba(200,250,255,${a * 0.8})`;
      c.fillRect(sx + 5, sy + 4, 2, 7);
      c.fillStyle = `rgba(94,240,255,${glow * 0.18})`;
      c.fillRect(sx - 6, sy + 14, 28, 10);
    }
  },

  heatTrigger(g, dt) {
    const f = g.flags;
    if (g.map.id === 'vesper' && f.has('firstOutside') && !f.has('wave1Done') && g.outdoorSteps >= 6) return { kind: 'wave1', strength: 0.55 };
    if (f.has('pixelOn') && !f.has('wave2Done') && g.outdoorTime > 6) return { kind: 'wave2', strength: 0.8 };
    if (f.has('readLeaDiary') && f.has('wave2Done') && !f.has('wave3Done') && g.outdoorTime > 6) return { kind: 'wave3', strength: 0.85 };
    if (f.has('heliosOn')) {
      g.cycleTimer -= dt;
      if (g.cycleTimer <= 0) {
        g.cycleTimer = 180 + Math.random() * 60;
        return { kind: 'cycle', strength: 1 };
      }
    }
    return null;
  },

  onHeatEnd(g, kind) {
    if (kind === 'wave1' || kind === 'wave2' || kind === 'wave3') g.flags.add(`${kind}Done`);
    if (kind === 'wave2') {
      g.flags.add('pondDry');
      if (g.map.id === 'vesper' && g.map.outdoor) {
        g.flags.add('pondSeen');
        ui.say(['La vague est passée… Le lac toxique s’est évaporé !', 'Il ne reste qu’une vase craquelée. On peut passer à pied jusqu’à l’abri de chantier.']);
      }
    }
  },

  /** Pixel est chez lui : près de la maison de Betti, ou dedans. */
  isPixelHome(g) {
    const p = g.pixel;
    if (!p) return false;
    return g.map.id === 'maisonLea' || (g.map.id === 'quartier' && Math.abs(p.x - 6) <= 4 && Math.abs(p.y - 7) <= 4);
  },
};
