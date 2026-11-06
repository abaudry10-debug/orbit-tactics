// Chapitre 1 : Vesper. La cartouche complète, branchée sur le moteur par main.ts.
import type { Chapter } from '../../engine/chapter.js';
import { hooks } from './logic.js';
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
};
