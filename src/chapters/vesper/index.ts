// Chapitre 1 : Vesper. La cartouche complète, branchée sur le moteur par main.ts.
import type { Chapter } from '../../engine/chapter.js';
import * as ui from '../../engine/ui.js';
import { finale, hooks } from './logic.js';
import { MAPS, START } from './maps.js';
import { MEMORIES } from './memories.js';
import { ACHIEVEMENTS, ARCHIVE_CODE, ARCHIVES, CLUES, INTRO, ITEMS, QUESTIONS, RESTART_ORDER, SCRIPTS, SWITCHES, THREADS } from './story.js';

export const vesper: Chapter = {
  id: 'vesper',
  title: 'Vesper',
  saveKey: 'vesper-save-v2',
  start: START,
  shelter: { to: 'lab', x: 5, y: 8, dir: 'up' },
  maps: MAPS,
  scripts: SCRIPTS,
  threads: THREADS,
  clues: CLUES,
  questions: QUESTIONS,
  items: ITEMS,
  achievements: ACHIEVEMENTS,
  memories: MEMORIES,
  archives: ARCHIVES,
  archiveCode: ARCHIVE_CODE,
  switches: { labels: SWITCHES, order: RESTART_ORDER },
  intro: INTRO,
  features: { heatWaves: true, movement: 'grid' },
  // une berceuse plus douce chez Betti et dans sa cabane
  music: (map) => (map.id === 'maisonLea' || map.id === 'cabane' ? 'home' : map.outdoor ? 'outdoor' : 'lab'),
  dialogStyle: 'vesper',
  cutTargets: { pixelFlap: 'leaHouse', pixelVent: 'vent', pixelPower: 'heliosDoor', pixelCar: 'shinyCar' },
  hooks,
  // texte d'ouverture sur fond noir, puis le réveil dans le laboratoire
  begin(g) {
    ui.say(INTRO, () => {
      ui.fade(() => {
        g.blackout = false;
        g.startMusic();
        ui.showPlace(g.map.name);
        ui.say([
          'Où suis-je… ?',
          'Je ne me souviens de rien. Pas même de mon nom.',
          '(Touche A pour examiner ce qui t’entoure. Ton journal garde la trace de tout ce que tu découvres.)',
        ]);
      });
    });
  },
  dev: {
    presets: [
      { label: 'Pixel réveillé', flags: ['firstOutside', 'wave1Done', 'sondeHint', 'knowsBattery', 'batteryFound', 'pixelOn'], items: ['sonde', 'pelle'] },
      {
        label: 'Lac asséché, chez Betti',
        flags: [...['firstOutside', 'wave1Done', 'sondeHint', 'knowsBattery', 'batteryFound', 'pixelOn'], 'wave2Done', 'pondDry', 'pondSeen', 'suitTaken', 'leaOpen', 'readLeaDiary', 'hasLamp'],
        items: ['sonde', 'pelle', 'combinaison', 'lampe', 'ecrou'],
      },
      {
        label: 'Hélios rallumé',
        flags: [...['firstOutside', 'wave1Done', 'sondeHint', 'knowsBattery', 'batteryFound', 'pixelOn'], 'wave2Done', 'pondDry', 'pondSeen', 'suitTaken', 'leaOpen', 'readLeaDiary', 'hasLamp', 'wave3Done', 'noyauFound', 'signalFound', 'badge', 'researchOpen', 'turbinesOpen', 'heliosOn', 'heatForecast'],
        items: ['sonde', 'pelle', 'combinaison', 'lampe', 'ecrou', 'noyau', 'capteur', 'badge'],
      },
      {
        label: 'Capsule prête (amorce)',
        flags: [...['firstOutside', 'wave1Done', 'sondeHint', 'knowsBattery', 'batteryFound', 'pixelOn'], 'wave2Done', 'pondDry', 'pondSeen', 'wave3Done', 'heliosOn', 'plansRead', 'podAssembled', 'podTuned', 'podKeyed', 'podNeedsPrime', 'primeHint'],
        items: ['sonde', 'pelle'],
        at: { map: 'lab', x: 2, y: 3, dir: 'up' },
      },
    ],
    actions: [
      {
        label: 'Lancer la fin',
        run: (g) => {
          for (const f of ['pixelOn', 'heliosOn', 'plansRead', 'podAssembled', 'podTuned', 'podKeyed', 'podNeedsPrime']) g.flags.add(f);
          g.warp('lab', 2, 3, 'up');
          window.setTimeout(() => finale(g), 900);
        },
      },
    ],
  },
  // ce que Vesper laisse à Azura : les souvenirs de Pixel revus, les succès, la cabane…
  legacy: (g) => ({
    memos: [1, 2, 3, 4, 5, 6].filter((n) => g.flags.has(`memo${n}Seen`)),
    achievements: ACHIEVEMENTS.filter((a) => g.flags.has(`ach_${a.id}`)).map((a) => a.id),
    clues: g.clues.size,
    cabin: g.flags.has('knowsCabin'),
    lastWalks: g.counters.lastWalk ?? 0,
  }),
};
