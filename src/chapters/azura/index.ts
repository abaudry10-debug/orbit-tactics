// Chapitre 2 : Azura. Pour l'instant, la tranche verticale, jouable en mode développeur.
import { playTheme, sfx } from '../../engine/audio.js';
import type { Chapter } from '../../engine/chapter.js';
import type { Game } from '../../engine/game.js';
import type { PersonLook } from '../../engine/sprites.js';
import * as ui from '../../engine/ui.js';
import { MAPS_AZ, SOLID_AZ, START_AZ } from './maps.js';
import { CLUES_AZ, ITEMS_AZ, QUESTIONS_AZ, SCRIPTS_AZ, THREADS_AZ } from './story.js';
import './tiles.js';

const look = (id: string, colors: Record<string, string>): PersonLook => ({ id, colors: { g: colors.s ?? '#f0c39a', w: '#14101c', ...colors } });

// Le héros, dans son nouveau corps : la combinaison blanche d'Aurore, sans lunettes ni écharpe.
const HERO_AZ = look('heroAz', {
  h: '#5a3b28', H: '#7a5236', d: '#3e281a', s: '#f0c39a', S: '#d39a72',
  r: '#2a9d9a', R: '#1d6f70', j: '#e3e9eb', J: '#ffffff', e: '#b4c0c4', p: '#c9d3d6', b: '#6b7b80', a: '#dfe6e8', A: '#f4f8f9',
});

const PEOPLE: Record<string, PersonLook> = {
  // Betti, vingt ans : cheveux roux, foulard jaune comme sa robe d'enfant, salopette d'atelier
  betti: look('betti', {
    h: '#c0602a', H: '#e08a4a', d: '#8a3f1c', s: '#f6cfae', S: '#e0a985',
    r: '#f2c230', R: '#c99a1a', j: '#3f7f6e', J: '#5aa08c', e: '#2c5c50', p: '#3b4a5a', b: '#5a3f2c', a: '#3f7f6e', A: '#5aa08c',
  }),
  ilda: look('ilda', {
    h: '#d9d9d9', H: '#ffffff', d: '#b0b0b0', s: '#eec7a4', S: '#cf9f7c',
    r: '#7a4f9a', R: '#5a3878', j: '#9b7fb8', J: '#b89bd2', e: '#6f5a88', p: '#5a4a6a', b: '#4a3a3a', a: '#9b7fb8', A: '#b89bd2',
  }),
  tom: look('tom', {
    h: '#2a2a33', H: '#44444f', d: '#1a1a20', s: '#b07a52', S: '#8e5e3c',
    r: '#e07a2a', R: '#a85618', j: '#7a8590', J: '#97a3ad', e: '#58616a', p: '#3a3f4a', b: '#2a2a2a', a: '#7a8590', A: '#97a3ad',
  }),
  nora: look('nora', {
    h: '#e8c870', H: '#f6e09a', d: '#b89a48', s: '#f3cdb0', S: '#d9a688',
    r: '#f3f7f6', R: '#c9d3d6', j: '#3f6fb0', J: '#5f8fd0', e: '#2c4f80', p: '#e0d8c8', b: '#6b5a48', a: '#3f6fb0', A: '#5f8fd0',
  }),
  joss: look('joss', {
    h: '#6b5a48', H: '#8a7660', d: '#4a3d30', s: '#e2b48c', S: '#c08e66',
    r: '#c0423b', R: '#8c2c2a', j: '#4a6a3a', J: '#5f8a4a', e: '#34502a', p: '#4a4a3a', b: '#3a2e22', a: '#4a6a3a', A: '#5f8a4a',
  }),
  pass1: look('pass1', {
    h: '#8a5a3a', H: '#a8754e', d: '#5f3c26', s: '#f0c39a', S: '#d39a72',
    r: '#5fd0c6', R: '#2a9d9a', j: '#f0d070', J: '#f8e49a', e: '#c8a848', p: '#5a6a7a', b: '#3a3030', a: '#f0d070', A: '#f8e49a',
  }),
  pass2: look('pass2', {
    h: '#1e1e26', H: '#34343e', d: '#121218', s: '#8e5e3c', S: '#704628',
    r: '#f39ac6', R: '#c0688f', j: '#e8eef0', J: '#ffffff', e: '#b4c0c4', p: '#2a9d9a', b: '#3a3030', a: '#e8eef0', A: '#ffffff',
  }),
  pass3: look('pass3', {
    h: '#b0b0b0', H: '#d0d0d0', d: '#8a8a8a', s: '#e8bc96', S: '#c99a76',
    r: '#3f6fb0', R: '#2c4f80', j: '#6a8a5a', J: '#82a272', e: '#4a6640', p: '#4a4a3a', b: '#3a2e22', a: '#6a8a5a', A: '#82a272',
  }),
  pass4: look('pass4', {
    h: '#d08a3a', H: '#e8a85a', d: '#a0662a', s: '#f6d2b4', S: '#dcae8e',
    r: '#ffffff', R: '#cccccc', j: '#c45ad8', J: '#d888e8', e: '#8a3a9a', p: '#3b4a5a', b: '#5a3f2c', a: '#c45ad8', A: '#d888e8',
  }),
  enfant: look('enfant', {
    h: '#3a2418', H: '#5a3a26', d: '#24160e', s: '#c98d62', S: '#a86f48',
    r: '#ffe066', R: '#d9b83a', j: '#e0574f', J: '#f08a80', e: '#a83b35', p: '#3b5a8a', b: '#2a2a2a', a: '#e0574f', A: '#f08a80',
  }),
};

// ---------- l'ouverture : le ciel bleu, celui de la fin du chapitre 1 ----------
function skyOpening(done: () => void) {
  const screen = document.getElementById('screen')!;
  const cv = document.createElement('canvas');
  cv.width = 120;
  cv.height = 200;
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:3;image-rendering:pixelated;';
  screen.appendChild(cv);
  const c = cv.getContext('2d')!;
  const clouds = Array.from({ length: 7 }, (_, i) => ({ x: (i * 47) % 140 - 20, y: 20 + i * 24, w: 18 + (i * 13) % 22, s: 2 + (i % 3) }));
  const t0 = performance.now();
  let raf = 0;
  const draw = () => {
    const t = (performance.now() - t0) / 1000;
    const g = c.createLinearGradient(0, 0, 0, cv.height);
    g.addColorStop(0, '#2f7fd6');
    g.addColorStop(0.6, '#6fbef0');
    g.addColorStop(1, '#bfe8ff');
    c.fillStyle = g;
    c.fillRect(0, 0, cv.width, cv.height);
    // le soleil, doux, en haut à droite
    c.fillStyle = 'rgba(255,248,214,0.3)';
    c.beginPath(); c.arc(99, 21, 13, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,252,236,0.9)';
    c.beginPath(); c.arc(99, 21, 7, 0, Math.PI * 2); c.fill();
    // une planète géante cerclée d'anneaux, et deux lunes : on n'est plus chez soi
    c.fillStyle = 'rgba(220,235,255,0.55)';
    c.beginPath(); c.arc(30, 70, 26, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(180,200,240,0.5)';
    c.fillRect(14, 62, 10, 3); c.fillRect(30, 78, 14, 3); c.fillRect(20, 84, 8, 2);
    c.strokeStyle = 'rgba(240,248,255,0.7)';
    c.lineWidth = 2;
    c.beginPath(); c.ellipse(30, 70, 44, 8, -0.35, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(245,245,255,0.85)';
    c.beginPath(); c.arc(84, 120, 7, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(200,205,230,0.9)';
    c.fillRect(81, 117, 2, 2); c.fillRect(86, 122, 3, 2);
    c.fillStyle = 'rgba(245,235,255,0.7)';
    c.beginPath(); c.arc(64, 44, 3, 0, Math.PI * 2); c.fill();
    for (const k of clouds) {
      const x = ((k.x + t * k.s) % 160) - 20;
      c.fillStyle = 'rgba(255,255,255,0.9)';
      c.fillRect(Math.round(x), k.y, k.w, 4);
      c.fillRect(Math.round(x) + 3, k.y - 3, k.w - 8, 3);
      c.fillStyle = 'rgba(200,225,245,0.9)';
      c.fillRect(Math.round(x) + 2, k.y + 4, k.w - 3, 1);
    }
    raf = requestAnimationFrame(draw);
  };
  draw();
  return {
    close() {
      cancelAnimationFrame(raf);
      cv.remove();
      done();
    },
  };
}

export const azura: Chapter = {
  id: 'azura',
  title: 'Azura',
  saveKey: 'vesper-azura-save-v1',
  start: START_AZ,
  shelter: { to: 'cuves', x: START_AZ.x, y: START_AZ.y, dir: 'down' },
  maps: MAPS_AZ,
  scripts: SCRIPTS_AZ,
  threads: THREADS_AZ,
  clues: CLUES_AZ,
  questions: QUESTIONS_AZ,
  items: ITEMS_AZ,
  achievements: [],
  memories: [],
  archives: [],
  archiveCode: '',
  switches: { labels: [], order: [] },
  intro: [],
  features: { heatWaves: false, movement: 'grid' },
  music: (map) => (map.id === 'atelier' ? 'home' : 'azura'),
  dialogStyle: 'azura',
  cutTargets: {},
  solid: SOLID_AZ,
  people: PEOPLE,
  heroLook: HERO_AZ,
  begin(g: Game) {
    playTheme('azura');
    const sky = skyOpening(() => {});
    ui.say(['…', 'Du bleu.', 'Un ciel bleu… et deux lunes.', 'Au-dessus de l’horizon, une planète immense, cerclée d’anneaux.', 'L’air est frais. Il sent l’herbe… et le métal chaud.'], () => {
      ui.fade(() => {
        sky.close();
        g.blackout = false;
        g.heroCrouch = 1.2;
        ui.showPlace(g.map.name);
        ui.say([
          'Je suis… sur Azura.',
          'Ma cuve est ouverte. Toutes les autres aussi. Elles sont vides.',
          '(Touche A pour examiner ce qui t’entoure. Ton journal garde la trace de tout ce que tu découvres.)',
        ]);
      });
    });
  },
  hooks: {
    tileName(g, ch, x, y, below) {
      const wave = Math.floor(g.time * 1.4 + (x + y) * 0.35) % 2;
      switch (ch) {
        case '"': return 'azGrass';
        case ',': return 'azFlowers';
        case ';': return 'azTall';
        case '.': return 'azPath';
        case ':': return 'azStone';
        case '=': return 'azDeck';
        case 'w': return 'azFloor';
        case '~': {
          const above = y > 0 ? g.map.rows[y - 1][x] : '~';
          return (above === '~' || above === 'B' ? 'azWater' : 'azShore') + wave;
        }
        case 'F': return 'fountain' + (Math.floor(g.time * 3) % 2);
        case 'x': return 'regolith';
        case 'o': return 'crater';
        case '1': return 'bigCrater0';
        case '2': return 'bigCrater1';
        case '3': return 'bigCrater2';
        case '4': return 'bigCrater3';
        case 'k': return 'crystals' + (Math.floor(g.time * 1.5 + x * 0.7 + y) % 2);
        case 'm': return 'metalFloor';
        case 'c': {
          const row = g.map.rows[y];
          return row[x - 1] === 'c' || row[x + 1] === 'c' ? 'conduitH' : 'conduitV';
        }
        case 'b': return 'azBridgeH';
        case 'B': return 'azBridgeV';
        case 'R': return below === 'R' ? 'azRockTop' : 'azRockFace';
        case 'A': return 'azTree';
        case 'u': return 'azBush';
        case '|': return 'azFence';
        case 'Z': return below === 'Z' ? 'azWallTop' : 'azWallFront';
        case '#': return 'aurFront';
        default: return undefined;
      }
    },
    objectSprite(g, name) {
      if (name === 'pylonTop') return 'pylonTop' + (Math.floor(g.time * 1.2) % 2);
      if (name === 'holoTop') return 'holoTop' + (Math.floor(g.time * 2.5) % 2);
      return undefined;
    },
    renderAtmosphere(g, c, w, h) {
      if (!g.map.outdoor) {
        c.fillStyle = 'rgba(255,214,150,0.08)';
        c.fillRect(0, 0, w, h);
        return true;
      }
      // une lumière claire, et l'ombre des nuages qui glisse sur le paysage
      const grad = c.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(170,230,255,0.10)');
      grad.addColorStop(1, 'rgba(255,240,200,0.06)');
      c.fillStyle = grad;
      c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(20,60,70,0.07)';
      for (let i = 0; i < 3; i++) {
        const cx = ((g.time * 5 + i * 140) % (w + 160)) - 80;
        const cy = ((i * 97) % h) + 20;
        c.beginPath();
        c.ellipse(cx, cy, 60, 26, 0, 0, Math.PI * 2);
        c.fill();
      }
      // des spores lumineuses portées par le vent
      for (const p of g.particles) {
        c.fillStyle = `rgba(150,255,235,${p.a * 0.75})`;
        c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
      // un drone de la colonie qui passe, avec son ombre au sol
      const period = 22;
      const k = (g.time % period) / period;
      const dx = -30 + k * (w + 60);
      const dy = h * 0.3 + Math.sin(g.time * 0.7) * 10;
      c.fillStyle = 'rgba(10,20,30,0.18)';
      c.fillRect(Math.round(dx) + 6, Math.round(dy) + 18, 9, 3);
      c.fillStyle = '#5f6b7a';
      c.fillRect(Math.round(dx), Math.round(dy), 11, 3);
      c.fillStyle = '#b8c4d0';
      c.fillRect(Math.round(dx) + 1, Math.round(dy), 9, 1);
      c.fillStyle = '#3f4856';
      c.fillRect(Math.round(dx) - 2, Math.round(dy) - 1, 4, 1);
      c.fillRect(Math.round(dx) + 9, Math.round(dy) - 1, 4, 1);
      c.fillStyle = Math.floor(g.time * 3) % 2 ? '#ff5a5a' : '#5ff0e0';
      c.fillRect(Math.round(dx) + 5, Math.round(dy) + 3, 1, 1);
      return true;
    },
    onEnterMap(g, mapId) {
      if (mapId === 'ville' && !g.flags.has('villeSeen')) {
        g.flags.add('villeSeen');
        sfx.success();
        ui.say(['Une ville !', 'Des maisons blanches, des passerelles au-dessus d’un lac… et des gens.', 'Ils sont là. Ils sont tous là.'], () => {
          // Betti accourt dès l'arrivée
          if (!g.flags.has('bettiMet')) SCRIPTS_AZ.bettiAccueil(g.api);
        });
      }
    },
  },
};
