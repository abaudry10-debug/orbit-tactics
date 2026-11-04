// Cœur du jeu : état du personnage, déplacements case par case, interactions, rendu.
import { playTheme, sfx } from './audio.js';
import { heldDir, releaseAll } from './input.js';
import { MAPS, START, SOLID, charAt, objectAt, type GameMap, type MapObject } from './maps.js';
import { T, hash, hero, tile, type Dir } from './sprites.js';
import { CLUES, DEDUCTIONS, ENDING, ITEMS, SCRIPTS, type Api } from './story.js';
import * as ui from './ui.js';

export const VIEW_W = 12 * T;
export const VIEW_H = 16 * T;
const MOVE_TIME = 0.19; // secondes pour traverser une case
const SAVE_KEY = 'vesper-save-v1';

const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

interface Save {
  map: string;
  x: number;
  y: number;
  dir: Dir;
  flags: string[];
  clues: string[];
  items: string[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
}

export class Game {
  map: GameMap = MAPS[START.map];
  x = START.x;
  y = START.y;
  dir: Dir = START.dir;
  moving: { fx: number; fy: number; t: number } | null = null;
  steps = 0;
  flags = new Set<string>();
  clues = new Set<string>();
  items = new Set<string>();
  fresh = new Set<string>();
  time = 0;
  blackout = false; // écran noir pendant l'introduction
  locked = false; // bloque le joueur (fondu, fin…)
  particles: Particle[] = [];
  private saveTimer = 0;
  private bumpCooldown = 0;

  constructor(private ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < 40; i++) this.particles.push(this.newParticle(true));
  }

  // ---------- sauvegarde ----------
  static hasSave(): boolean {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw) as Save;
      if (!MAPS[s.map]) return false;
      this.map = MAPS[s.map];
      this.x = s.x;
      this.y = s.y;
      this.dir = s.dir;
      this.flags = new Set(s.flags);
      this.clues = new Set(s.clues);
      this.items = new Set(s.items);
      return true;
    } catch {
      return false;
    }
  }

  /** Sauvegarde puis relit le stockage pour confirmer que tout est bien écrit. */
  saveVerified(): boolean {
    this.save();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw) as Save;
      return s.map === this.map.id && s.x === this.x && s.y === this.y && s.clues.length === this.clues.size;
    } catch {
      return false;
    }
  }

  save() {
    const s: Save = {
      map: this.map.id, x: this.x, y: this.y, dir: this.dir,
      flags: [...this.flags], clues: [...this.clues], items: [...this.items],
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch {
      /* stockage indisponible (navigation privée) : on continue sans sauvegarde */
    }
  }

  static clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* rien */
    }
  }

  // ---------- règles de déplacement ----------
  blocked(x: number, y: number): boolean {
    const obj = objectAt(this.map, x, y);
    if (obj) return !this.doorOpen(obj);
    return SOLID.has(charAt(this.map, x, y));
  }

  doorOpen(obj: MapObject): boolean {
    return !!obj.door && (!obj.door.needs || this.flags.has(obj.door.needs));
  }

  get busy(): boolean {
    return this.locked || this.blackout || ui.dialogOpen() || ui.journalOpen() || ui.keypadOpen() || ui.overlayOpen();
  }

  update(dt: number) {
    this.time += dt;
    this.updateParticles(dt);
    this.saveTimer += dt;
    this.bumpCooldown -= dt;
    if (this.saveTimer > 10) {
      this.saveTimer = 0;
      if (!this.blackout) this.save();
    }

    if (this.moving) {
      this.moving.t += dt / MOVE_TIME;
      if (this.moving.t < 1) return;
      this.moving = null;
    }
    if (this.busy) return;
    const d = heldDir();
    if (!d) return;
    this.dir = d;
    const [dx, dy] = DELTA[d];
    const nx = this.x + dx;
    const ny = this.y + dy;
    const obj = objectAt(this.map, nx, ny);
    if (obj?.door && this.doorOpen(obj)) {
      sfx.door();
      this.warp(obj.door.to, obj.door.x, obj.door.y, obj.door.dir);
      return;
    }
    if (this.blocked(nx, ny)) {
      if (this.bumpCooldown <= 0) {
        sfx.bump();
        this.bumpCooldown = 0.35;
      }
      return;
    }
    this.moving = { fx: this.x, fy: this.y, t: 0 };
    this.x = nx;
    this.y = ny;
    this.steps += 1;
    sfx.step();
  }

  warp(mapId: string, x: number, y: number, dir: Dir) {
    this.locked = true;
    releaseAll();
    ui.fade(() => {
      this.map = MAPS[mapId];
      this.x = x;
      this.y = y;
      this.dir = dir;
      this.moving = null;
      this.locked = false;
      ui.showPlace(this.map.name);
      this.startMusic();
      this.save();
      if (mapId === 'vesper' && !this.flags.has('firstOutside')) {
        this.flags.add('firstOutside');
        ui.say([
          'Le ciel… il est orange.',
          'La ville est en ruine. Il n’y a personne.',
          'Il faut que je comprenne ce qui s’est passé ici.',
        ]);
      }
    });
  }

  facing(): [number, number] {
    const [dx, dy] = DELTA[this.dir];
    return [this.x + dx, this.y + dy];
  }

  interact() {
    if (this.busy || this.moving) return;
    const [fx, fy] = this.facing();
    const obj = objectAt(this.map, fx, fy);
    if (obj?.script) {
      SCRIPTS[obj.script]?.(this.api);
      return;
    }
    const ch = charAt(this.map, fx, fy);
    if (ch === '~') ui.say(['Une eau verte, tiède, qui sent le métal brûlé.', 'Mieux vaut ne pas y toucher.']);
    else if (ch === 'C') ui.say(['Une épave de voiture, mangée par la rouille. Vide.']);
    else if (ch === 'T') ui.say(['Un arbre mort. Pas une feuille.']);
  }

  // ---------- API offerte aux scripts de l'histoire ----------
  api: Api = {
    has: (f) => this.flags.has(f),
    set: (f) => {
      this.flags.add(f);
      this.save();
    },
    hasItem: (id) => this.items.has(id),
    item: (id) => {
      if (this.items.has(id)) return;
      this.items.add(id);
      ui.toast(`Objet obtenu : ${ITEMS[id]?.name ?? id}`);
      sfx.item();
      this.save();
    },
    clue: (id) => this.addClue(id),
    say: (lines, then) => ui.say(lines, then),
    keypad: (cb) => {
      releaseAll();
      ui.openKeypad(cb);
    },
    sfx: (name) => sfx[name](),
    finish: () => this.finish(),
  };

  startMusic() {
    playTheme(this.map.outdoor ? 'outdoor' : 'lab');
  }

  addClue(id: string) {
    if (this.clues.has(id)) return;
    this.clues.add(id);
    this.fresh.add(id);
    const c = CLUES.find((x) => x.id === id);
    ui.toast(`Journal mis à jour : ${c?.title ?? id}`);
    sfx.clue();
    document.getElementById('btn-journal')?.classList.add('fresh');
    this.save();
    for (const d of DEDUCTIONS) {
      if (!this.clues.has(d.clue) && d.needs.every((n) => this.clues.has(n))) {
        ui.say([d.line], () => this.addClue(d.clue));
      }
    }
  }

  finish() {
    this.locked = true;
    ui.say(ENDING, () => {
      this.locked = false;
      const el = document.getElementById('ending')!;
      const found = CLUES.filter((c) => this.clues.has(c.id)).length;
      document.getElementById('ending-stats')!.textContent = `${found} / ${CLUES.length} découvertes · ${this.steps} pas`;
      el.hidden = false;
    });
  }

  openJournal() {
    ui.renderJournal(this.clues, this.items, this.fresh);
    ui.setJournal(true);
    releaseAll();
    this.fresh.clear();
    document.getElementById('btn-journal')?.classList.remove('fresh');
  }

  // ---------- rendu ----------
  private tileName(x: number, y: number): string {
    const ch = charAt(this.map, x, y);
    const below = y + 1 >= this.map.height ? ch : charAt(this.map, x, y + 1);
    switch (ch) {
      case '.': return 'dust';
      case '"': return 'grass';
      case ',': return 'asphalt';
      case '-': return 'road';
      case '~': return Math.floor(this.time * 1.6 + (x + y) * 0.35) % 2 ? 'toxic1' : 'toxic0';
      case '*': return 'rubble';
      case '|': return 'fence';
      case 'T': return 'tree';
      case 'C': return 'car';
      case '=': return 'labFloor';
      case '#': return below === '#' ? 'wallTop' : 'wallFront';
      case 'X': return below === 'X' ? 'labWallTop' : 'labWallFront';
      default: return 'dust';
    }
  }

  heroPixel(): [number, number] {
    if (!this.moving) return [this.x * T, this.y * T];
    const t = Math.min(1, this.moving.t);
    return [(this.moving.fx + (this.x - this.moving.fx) * t) * T, (this.moving.fy + (this.y - this.moving.fy) * t) * T];
  }

  render() {
    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#05060c';
    c.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.blackout) return;

    const [hx, hy] = this.heroPixel();
    const mw = this.map.width * T;
    const mh = this.map.height * T;
    const camX = mw <= VIEW_W ? (mw - VIEW_W) / 2 : Math.max(0, Math.min(mw - VIEW_W, hx + T / 2 - VIEW_W / 2));
    const camY = mh <= VIEW_H ? (mh - VIEW_H) / 2 : Math.max(0, Math.min(mh - VIEW_H, hy + T / 2 - VIEW_H / 2));
    const ox = Math.round(camX);
    const oy = Math.round(camY);

    const x0 = Math.floor(ox / T) - 1;
    const y0 = Math.floor(oy / T) - 1;
    for (let y = y0; y <= y0 + VIEW_H / T + 2; y++) {
      for (let x = x0; x <= x0 + VIEW_W / T + 2; x++) {
        if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) continue;
        const obj = objectAt(this.map, x, y);
        const name = obj ? this.objSprite(obj) : this.tileName(x, y);
        c.drawImage(tile(name, hash(x, y)), x * T - ox, y * T - oy);
      }
    }

    // indicateur au-dessus de l'objet regardé
    if (!this.busy && !this.moving) {
      const [fx, fy] = this.facing();
      const obj = objectAt(this.map, fx, fy);
      if (obj?.script) {
        const bob = Math.round(Math.sin(this.time * 6) * 1.5);
        const px = fx * T - ox + 6;
        const py = fy * T - oy - 7 + bob;
        c.fillStyle = '#14101c';
        c.fillRect(px - 1, py - 1, 6, 7);
        c.fillStyle = '#fff4d6';
        c.fillRect(px, py, 4, 5);
        c.fillStyle = '#14101c';
        c.fillRect(px + 1, py + 1, 2, 2);
        c.fillRect(px + 1, py + 4, 2, 1);
      }
    }

    // héros
    let frame = 0;
    if (this.moving && this.moving.t < 0.75) frame = this.steps % 2 ? 1 : 2;
    c.drawImage(hero(this.dir, frame), Math.round(hx - ox), Math.round(hy - oy) - 3);

    this.renderAtmosphere();
  }

  private objSprite(o: MapObject): string {
    if (o.spriteWhen && this.flags.has(o.spriteWhen[0])) return o.spriteWhen[1];
    return o.sprite;
  }

  private newParticle(anywhere: boolean): Particle {
    return {
      x: anywhere ? Math.random() * VIEW_W : -4,
      y: Math.random() * VIEW_H,
      vx: 6 + Math.random() * 10,
      vy: 1 + Math.random() * 4,
      a: 0.15 + Math.random() * 0.35,
    };
  }

  private updateParticles(dt: number) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt + Math.sin(this.time * 2 + i) * 0.05;
      if (p.x > VIEW_W + 4 || p.y > VIEW_H + 4) this.particles[i] = this.newParticle(false);
    }
  }

  private renderAtmosphere() {
    const c = this.ctx;
    if (this.map.outdoor) {
      // lumière orange du ciel brûlé
      const g = c.createLinearGradient(0, 0, 0, VIEW_H);
      g.addColorStop(0, 'rgba(255,110,40,0.22)');
      g.addColorStop(1, 'rgba(120,30,60,0.12)');
      c.fillStyle = g;
      c.fillRect(0, 0, VIEW_W, VIEW_H);
      for (const p of this.particles) {
        c.fillStyle = `rgba(255,214,160,${p.a})`;
        c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
    } else {
      // néons fatigués du laboratoire
      const flicker = Math.sin(this.time * 23) > 0.96 ? 0.12 : 0;
      c.fillStyle = `rgba(20,40,80,${0.18 + flicker})`;
      c.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    const v = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = v;
    c.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
