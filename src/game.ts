// Cœur du jeu : état du personnage, déplacements case par case, interactions, rendu.
import { playTheme, sfx } from './audio.js';
import { heldDir, releaseAll } from './input.js';
import { MAPS, START, SOLID, charAt, type GameMap, type MapObject } from './maps.js';
import { T, bigTree, dish, dogSprite, dogAsleep, type DogLook, frozenTrain, hash, hero, radioTower, shuttleWreck, solarTower, tile, type Dir } from './sprites.js';
import { ARCHIVE_CODE, ARCHIVES, CLUES, FINALE, ITEMS, QUESTIONS, RADIO_FREQ, RESTART_ORDER, SCRIPTS, SIGNAL_KEY, SWITCHES, type Api } from './story.js';
import * as ui from './ui.js';

/** Taille de la vue en pixels de jeu ; recalculée selon l'écran (voir main.ts). */
export const view = { w: 12 * T, h: 16 * T, padBottom: 0 }; // padBottom : zone cachée par les commandes
const MOVE_TIME = 0.19; // secondes pour traverser une case
const SAVE_KEY = 'vesper-save-v2';

const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

interface Save {
  map: string;
  x: number;
  y: number;
  dir: Dir;
  flags: string[];
  clues: string[];
  items: string[];
  fresh?: string[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
}

interface Follower {
  x: number;
  y: number;
  dir: Dir;
  moving: { fx: number; fy: number } | null;
  /** Déplacement autonome de Pixel (venir s'asseoir, rapporter l'écrou) : suite de cases à parcourir. */
  walk?: { from: [number, number]; path: [number, number][]; t: number; speed: number } | null;
}

/** Ce que fait Pixel quand il ne se contente pas de suivre. */
type PixelMode = 'follow' | 'come' | 'sit' | 'pet' | 'rest' | 'fetch' | 'dig';

/** Petits effets dessinés dans le monde : cœurs, « z », reflets de soleil, poussière, l'écrou lancé. */
interface Fx {
  kind: 'heart' | 'z' | 'spark' | 'dust';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
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
  locked = false; // bloque le joueur (fondu…)
  particles: Particle[] = [];
  pixel: Follower | null = null;
  pixelMode: PixelMode = 'follow';
  private pixelTimer = 0;
  private idle = 0;
  private turnHold = 0;
  private heroCrouch = 0;
  private whineTimer = 3;
  private homeBeep = 2;
  private fx: Fx[] = [];
  /** L'écrou en vol ou posé au sol (coordonnées en pixels du monde). */
  private nut: { fx: number; fy: number; tx: number; ty: number; t: number; dur: number; landed: boolean } | null = null;
  private fetch: { stage: 'flying' | 'run' | 'pick' | 'back'; tx: number; ty: number } | null = null;
  private fxTimer = 0;
  private saveTimer = 0;
  private bumpCooldown = 0;
  private beepTimer = 0;
  private openQ = new Set<string>();
  private solvedQ = new Set<string>();
  private ctx: CanvasRenderingContext2D;
  private decalShuttle = shuttleWreck();
  private decalDish = dish();
  private decalTower = solarTower();
  private decalRadio = radioTower();
  private decalTrain = frozenTrain();
  private decalBigTree = bigTree();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
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
      this.fresh = new Set(s.fresh ?? []);
      if (this.flags.has('batteryFound')) this.flags.delete('sondeOn'); // anciennes sauvegardes
      this.refreshQuestions(true);
      if (this.fresh.size) document.getElementById('btn-journal')?.classList.add('fresh');
      if (this.flags.has('pixelOn')) this.placePixelBehind();
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
      return (
        s.map === this.map.id && s.x === this.x && s.y === this.y &&
        s.clues.length === this.clues.size && s.items.length === this.items.size && s.flags.length === this.flags.size
      );
    } catch {
      return false;
    }
  }

  save() {
    const s: Save = {
      map: this.map.id, x: this.x, y: this.y, dir: this.dir,
      flags: [...this.flags], clues: [...this.clues], items: [...this.items], fresh: [...this.fresh],
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

  // ---------- objets et règles de déplacement ----------
  /** Objet visible sur une case (les objets masqués par un drapeau sont ignorés). */
  objAt(x: number, y: number): MapObject | undefined {
    return this.map.objects.find(
      (o) => o.x === x && o.y === y && !(o.hideWhen && this.flags.has(o.hideWhen)) && !(o.hiddenUntil && !this.flags.has(o.hiddenUntil)),
    );
  }

  /** Comme objAt, mais trouve aussi les objets encore cachés (on peut les examiner sans les voir). */
  private anyObjAt(x: number, y: number): MapObject | undefined {
    return this.objAt(x, y) ?? this.map.objects.find((o) => o.x === x && o.y === y && o.hiddenUntil && !this.flags.has(o.hiddenUntil));
  }

  blocked(x: number, y: number): boolean {
    const obj = this.objAt(x, y);
    if (obj) {
      if (obj.door) return !this.doorOpen(obj);
      if (obj.passWhen) return !this.flags.has(obj.passWhen);
      return true;
    }
    return SOLID.has(charAt(this.map, x, y));
  }

  doorOpen(obj: MapObject): boolean {
    return !!obj.door && (!obj.door.needs || this.flags.has(obj.door.needs));
  }

  get busy(): boolean {
    return (
      this.locked || this.blackout || ui.dialogOpen() || ui.journalOpen() || ui.keypadOpen() || ui.overlayOpen() || ui.bagOpen() ||
      ui.radioOpen()
    );
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
    this.updateDetector(dt);
    this.updatePixel(dt);

    if (this.moving) {
      this.moving.t += dt / MOVE_TIME;
      if (this.moving.t < 1) return;
      this.moving = null;
      if (this.pixel) this.pixel.moving = null;
    }
    if (this.busy) return;
    if (this.turnHold > 0) {
      this.turnHold -= dt;
      return;
    }
    const d = heldDir();
    if (!d) {
      this.idle += dt;
      return;
    }
    const [dx, dy] = DELTA[d];
    const nx = this.x + dx;
    const ny = this.y + dy;
    // Pixel assis juste là : on se tourne d'abord vers lui (pour pouvoir le caresser)
    const p0 = this.pixel;
    if (p0 && !p0.walk && p0.x === nx && p0.y === ny && this.pixelMode !== 'follow' && this.dir !== d) {
      this.dir = d;
      this.turnHold = 0.22;
      this.idle = Math.max(this.idle, 3);
      return;
    }
    this.dir = d;
    this.idle = 0;
    if (this.pixelMode !== 'follow' && this.pixelMode !== 'fetch') {
      this.pixelMode = 'follow';
      if (this.pixel) this.pixel.walk = null;
    }
    const obj = this.objAt(nx, ny);
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
    if (this.pixel) {
      // Pixel prend la place que le joueur vient de quitter
      const p = this.pixel;
      if (p.x !== this.x || p.y !== this.y) {
        p.dir = this.x > p.x ? 'right' : this.x < p.x ? 'left' : this.y > p.y ? 'down' : 'up';
      }
      p.moving = { fx: p.x, fy: p.y };
      p.walk = null;
      p.x = this.x;
      p.y = this.y;
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
      this.pixelMode = 'follow';
      this.nut = null;
      this.idle = 0;
      if (this.flags.has('pixelOn')) this.placePixelBehind();
      ui.showPlace(this.map.name);
      this.startMusic();
      this.save();
      if (mapId === 'maisonLea' && this.pixel && !this.flags.has('pixelHome')) {
        this.flags.add('pixelHome');
        sfx.pixelHappy();
        ui.say(['Pixel file droit vers un vieux panier, dans un coin.', 'Il le renifle, tourne trois fois sur lui-même… Sa queue ne s’arrête plus.']);
      }
      if (mapId === 'vesper' && !this.flags.has('firstOutside')) {
        this.flags.add('firstOutside');
        ui.say(['Le ciel… il est orange.', 'La ville est en ruine. Il n’y a personne.', 'Il faut que je comprenne ce qui s’est passé ici.']);
      }
    });
  }

  private placePixelBehind() {
    const [dx, dy] = DELTA[this.dir];
    let px = this.x - dx;
    let py = this.y - dy;
    if (this.blocked(px, py)) {
      px = this.x;
      py = this.y;
    }
    this.pixel = { x: px, y: py, dir: this.dir, moving: null };
  }

  facing(): [number, number] {
    const [dx, dy] = DELTA[this.dir];
    return [this.x + dx, this.y + dy];
  }

  interact() {
    if (this.busy || this.moving) return;
    const [fx, fy] = this.facing();
    const obj = this.anyObjAt(fx, fy);
    if (obj?.id === 'capsule07' && this.flags.has('plansRead')) return this.podInteract();
    if (this.pixel && this.pixel.x === fx && this.pixel.y === fy && this.flags.has('podNeedsPrime') && this.map.id === 'lab') {
      return this.askPrime();
    }
    if (this.pixel && this.pixel.x === fx && this.pixel.y === fy && !this.pixel.walk && !obj) return this.petPixel();
    if (this.nearCabin() && (!obj || obj.id === 'cabinHatch')) {
      return ui.say(['« Sous le potager, à deux pas à droite du grand arbre »… C’est par ici.', 'La terre est meuble. Avec la pelle, je pourrais creuser.']);
    }
    if (obj?.script) {
      SCRIPTS[obj.script]?.(this.api);
      return;
    }
    if (this.pixel && this.pixel.x === fx && this.pixel.y === fy && !this.pixel.walk) return this.petPixel();
    const ch = charAt(this.map, fx, fy);
    if (ch === '~') ui.say(['Une eau verte, tiède, qui sent le métal brûlé.', 'Mieux vaut ne pas y toucher.']);
    else if (ch === 'C') ui.say(['Une épave de voiture, mangée par la rouille. Vide.']);
    else if (ch === 'T') ui.say(['Un arbre mort, calciné d’un seul côté.']);
    else if (ch === 'P') ui.say(['Un panneau solaire brisé, à moitié enfoui dans le sable.']);
    else if (ch === 'v') ui.say(['Des plants desséchés.']);
    else if (ch === 'N' && this.map.id === 'vesper') SCRIPTS.shuttle?.(this.api);
    else if (ch === 'N' && this.map.id === 'quartier') ui.say(['Un arbre immense, bien plus grand que les autres. Mort, lui aussi.']);
    else if (ch === 'N') ui.say(['Une tour solaire. Son capteur doré fixe encore le ciel.']);
  }

  // ---------- Pixel ----------
  /** Une case où Pixel peut marcher (ni mur, ni objet, ni le héros sauf permission). */
  private pixelFree(x: number, y: number, allowHero = false) {
    if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) return false;
    if (!allowHero && x === this.x && y === this.y) return false;
    if (this.objAt(x, y)) return false;
    return !SOLID.has(charAt(this.map, x, y));
  }

  /** Plus court chemin (quelques cases au plus) pour Pixel. */
  private pixelPath(from: [number, number], to: [number, number], allowHero = false, max = 8): [number, number][] | null {
    const key = (x: number, y: number) => `${x},${y}`;
    const prev = new Map<string, string | null>([[key(...from), null]]);
    const queue: [number, number, number][] = [[from[0], from[1], 0]];
    while (queue.length) {
      const [x, y, d] = queue.shift()!;
      if (x === to[0] && y === to[1]) {
        const path: [number, number][] = [];
        let k: string | null = key(x, y);
        while (k && k !== key(...from)) {
          const [a, b] = k.split(',').map(Number);
          path.unshift([a, b]);
          k = prev.get(k) ?? null;
        }
        return path;
      }
      if (d >= max) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (prev.has(key(nx, ny)) || !this.pixelFree(nx, ny, allowHero)) continue;
        prev.set(key(nx, ny), key(x, y));
        queue.push([nx, ny, d + 1]);
      }
    }
    return null;
  }

  private walkPixel(path: [number, number][], tilesPerSec: number) {
    const p = this.pixel!;
    p.moving = null;
    p.walk = path.length ? { from: [p.x, p.y], path, t: 0, speed: tilesPerSec } : null;
    if (!path.length) this.onPixelArrived();
  }

  private facePixelToHero() {
    const p = this.pixel!;
    if (this.x !== p.x) p.dir = this.x > p.x ? 'right' : 'left';
  }

  /** Quand on s'arrête un moment, Pixel vient s'asseoir devant nous. */
  private pixelCome() {
    const p = this.pixel!;
    const [dx, dy] = DELTA[this.dir];
    const spots: [number, number][] = [[this.x + dx, this.y + dy], [this.x + dy, this.y + dx], [this.x - dy, this.y - dx]];
    for (const spot of spots) {
      if (spot[0] === p.x && spot[1] === p.y) {
        this.pixelMode = 'sit';
        this.facePixelToHero();
        return;
      }
      if (!this.pixelFree(spot[0], spot[1])) continue;
      const path = this.pixelPath([p.x, p.y], spot, false, 5);
      if (!path) continue;
      this.pixelMode = 'come';
      this.walkPixel(path, 3.6);
      return;
    }
    this.pixelMode = 'sit'; // pas de place : il s'assoit là où il est
    this.facePixelToHero();
  }

  private onPixelArrived() {
    if (this.pixelMode === 'come') {
      this.pixelMode = 'sit';
      this.facePixelToHero();
      return;
    }
    if (this.pixelMode !== 'fetch' || !this.fetch) return;
    if (this.fetch.stage === 'run') {
      this.fetch.stage = 'pick';
      this.pixelTimer = 0.35;
      this.nut = null;
      sfx.key();
    } else if (this.fetch.stage === 'back') {
      this.fetch = null;
      this.items.add('ecrou');
      this.locked = false;
      this.facePixelToHero();
      this.pixelMode = 'pet';
      this.pixelTimer = 1.4;
      this.idle = 3;
      sfx.pixelHappy();
      ui.toast('Pixel rapporte l’écrou !');
    }
  }

  private petPixel() {
    if (!this.pixel || this.pixelMode === 'fetch') return;
    this.pixelMode = 'pet';
    this.pixelTimer = 1.8;
    this.heroCrouch = 1.5;
    this.idle = Math.max(this.idle, 3);
    this.facePixelToHero();
    this.flags.add('petPixel');
    sfx.pixelHappy();
    const hx = this.pixel.x * T + 8;
    const hy = this.pixel.y * T + 2;
    for (let i = 0; i < 3; i++) this.fx.push({ kind: 'heart', x: hx - 3 + i * 3, y: hy, vx: (i - 1) * 3, vy: -14, life: 1.3 + i * 0.35, max: 1.3 + i * 0.35 });
  }

  private throwNut() {
    const p = this.pixel;
    if (!p) return ui.say(['Tu fais sauter l’écrou dans ta main. Personne pour courir après…']);
    if (this.map.dark) return ui.say(['Pixel se colle à tes jambes. Pas question de courir dans le noir.']);
    const [dx, dy] = DELTA[this.dir];
    let n = 0;
    for (let i = 1; i <= 4; i++) {
      if (!this.pixelFree(this.x + dx * i, this.y + dy * i)) break;
      n = i;
    }
    if (n < 2) return ui.say(['Pas assez de place pour lancer l’écrou par ici.']);
    const tx = this.x + dx * n, ty = this.y + dy * n;
    this.items.delete('ecrou');
    this.locked = true;
    releaseAll();
    p.walk = null;
    this.nut = { fx: this.x * T + 8, fy: this.y * T + 4, tx: tx * T + 8, ty: ty * T + 11, t: 0, dur: 0.14 * n + 0.2, landed: false };
    this.fetch = { stage: 'flying', tx, ty };
    this.pixelMode = 'fetch';
    sfx.throwNut();
  }

  /** Pixel est chez lui : près de la maison de Betti, ou dedans. */
  private atPixelHome() {
    const p = this.pixel;
    if (!p) return false;
    return this.map.id === 'maisonLea' || (this.map.id === 'quartier' && Math.abs(p.x - 6) <= 4 && Math.abs(p.y - 7) <= 4);
  }

  private updatePixel(dt: number) {
    for (const f of this.fx) {
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.kind === 'dust') f.vy += 40 * dt;
    }
    this.fx = this.fx.filter((f) => f.life > 0);
    this.heroCrouch -= dt;
    const p = this.pixel;
    if (!p) return;
    this.pixelTimer -= dt;
    this.fxTimer -= dt;

    // marche autonome
    if (p.walk) {
      const w = p.walk;
      w.t += dt * w.speed;
      const next = w.path[0];
      if (next && next[0] !== w.from[0]) p.dir = next[0] > w.from[0] ? 'right' : 'left';
      while (w.t >= 1 && w.path.length) {
        w.from = w.path.shift()!;
        p.x = w.from[0];
        p.y = w.from[1];
        w.t -= 1;
      }
      if (!w.path.length) {
        p.walk = null;
        this.onPixelArrived();
      }
    }

    // l'écrou lancé
    if (this.nut && !this.nut.landed) {
      this.nut.t += dt / this.nut.dur;
      if (this.nut.t >= 1) {
        this.nut.landed = true;
        for (let i = 0; i < 4; i++) this.fx.push({ kind: 'dust', x: this.nut.tx, y: this.nut.ty, vx: (Math.random() - 0.5) * 30, vy: -20, life: 0.4, max: 0.4 });
        if (this.fetch) {
          this.fetch.stage = 'run';
          const path = this.pixelPath([p.x, p.y], [this.fetch.tx, this.fetch.ty], true, 10) ?? [[this.fetch.tx, this.fetch.ty]];
          this.walkPixel(path, 7);
        }
      }
    }
    if (this.fetch?.stage === 'pick' && this.pixelTimer <= 0) {
      this.fetch.stage = 'back';
      const [dx, dy] = DELTA[this.dir];
      const back: [number, number] = [this.x + dx, this.y + dy];
      this.walkPixel(this.pixelPath([p.x, p.y], back, false, 10) ?? [back], 5);
    }

    // humeurs
    if (this.pixelMode === 'pet' && this.pixelTimer <= 0) this.pixelMode = 'sit';
    if (this.pixelMode === 'dig' && this.pixelTimer <= 0) this.pixelMode = this.idle > 2.5 ? 'sit' : 'follow';
    if (this.pixelMode === 'follow' && !p.walk && !this.moving && !this.busy && this.idle > 2.5) this.pixelCome();
    if (this.pixelMode === 'sit' && !this.map.dark && this.idle > 9) this.pixelMode = 'rest';

    // petits effets
    if (this.pixelMode === 'dig' && this.fxTimer <= 0) {
      this.fxTimer = 0.12;
      const fxX = p.x * T + (p.dir === 'left' ? 2 : 14);
      this.fx.push({ kind: 'dust', x: fxX, y: p.y * T + 13, vx: (p.dir === 'left' ? 1 : -1) * (10 + Math.random() * 25), vy: -25 - Math.random() * 15, life: 0.45, max: 0.45 });
    }
    if (this.pixelMode === 'rest' && this.fxTimer <= 0) {
      if (this.map.outdoor) {
        this.fxTimer = 0.45;
        this.fx.push({ kind: 'spark', x: p.x * T + 5 + Math.random() * 6, y: p.y * T + 9, vx: 0, vy: -9, life: 0.9, max: 0.9 });
      } else {
        this.fxTimer = 1.5;
        this.fx.push({ kind: 'z', x: p.x * T + (p.dir === 'left' ? 2 : 13), y: p.y * T + 6, vx: p.dir === 'left' ? -3 : 3, vy: -7, life: 1.6, max: 1.6 });
      }
    }
    // dans le noir, il gémit de temps en temps ; chez lui, il jappe de joie
    if (this.map.dark) {
      this.whineTimer -= dt;
      if (this.whineTimer <= 0) {
        this.whineTimer = 6 + Math.random() * 5;
        sfx.pixelWhine();
      }
    } else if (this.atPixelHome()) {
      this.homeBeep -= dt;
      if (this.homeBeep <= 0) {
        this.homeBeep = 5 + Math.random() * 4;
        sfx.pixelHappy();
      }
    }
  }

  private pixelLook(): DogLook {
    const p = this.pixel!;
    const t = this.time;
    const dark = !!this.map.dark;
    const happy = this.atPixelHome();
    const wag = happy ? Math.floor(t * 11) % 2 : Math.floor(t * 2.2) % 2 ? 1 : 2;
    const eye = t % 3.7 < 0.12 ? 'closed' : dark ? 'wide' : 'on';
    if (p.walk) {
      const run = this.pixelMode === 'fetch';
      return { pose: dark ? 'scared' : 'stand', frame: Math.floor(t * (run ? 16 : 10)) % 4, tail: dark ? 3 : Math.floor(t * 9) % 2, earsDown: dark || run };
    }
    if (this.pixelMode === 'dig' || this.fetch?.stage === 'pick') return { pose: 'dig', frame: Math.floor(t * 9) % 2, tail: Math.floor(t * 7) % 2 };
    if (this.pixelMode === 'pet') return { pose: 'sit', eye: 'happy', tail: Math.floor(t * 13) % 2 };
    if (this.pixelMode === 'rest') {
      return this.map.outdoor
        ? { pose: 'sun', frame: Math.floor(t * 2.5) % 4, eye: 'closed', tail: t % 5 < 0.5 ? 1 : 2 }
        : { pose: 'lie', eye: 'closed', tail: 2 };
    }
    if (dark) return { pose: 'scared', eye, tail: 3 };
    if (this.pixelMode === 'sit' || this.pixelMode === 'come') return { pose: 'sit', eye, tail: wag };
    // il suit : il trottine quand on marche
    const moving = this.moving && p.moving;
    const frame = moving ? (this.moving!.t < 0.5 ? (this.steps % 2 ? 1 : 3) : 0) : 0;
    return { pose: 'stand', frame, eye, tail: moving ? Math.floor(t * 8) % 2 : wag };
  }

  private renderFx(ox: number, oy: number) {
    const c = this.ctx;
    for (const f of this.fx) {
      const a = Math.min(1, f.life / (f.max * 0.5));
      if (f.life > f.max) continue;
      c.globalAlpha = a;
      const x = Math.round(f.x - ox), y = Math.round(f.y - oy);
      if (f.kind === 'heart') {
        c.fillStyle = '#1c1020';
        c.fillRect(x - 1, y, 7, 3); c.fillRect(x, y + 3, 5, 1); c.fillRect(x + 1, y + 4, 3, 1); c.fillRect(x + 2, y + 5, 1, 1);
        c.fillRect(x, y - 1, 2, 1); c.fillRect(x + 3, y - 1, 2, 1);
        c.fillStyle = '#ff6b8a';
        c.fillRect(x, y, 2, 3); c.fillRect(x + 3, y, 2, 3); c.fillRect(x + 1, y + 1, 3, 3); c.fillRect(x + 2, y + 4, 1, 1);
        c.fillStyle = '#ffc2d0';
        c.fillRect(x, y, 1, 1);
      } else if (f.kind === 'z') {
        c.fillStyle = '#e8f4ff';
        c.fillRect(x, y, 3, 1); c.fillRect(x + 1, y + 1, 1, 1); c.fillRect(x, y + 2, 3, 1);
      } else if (f.kind === 'spark') {
        c.fillStyle = '#fff2a0';
        c.fillRect(x, y - 1, 1, 3); c.fillRect(x - 1, y, 3, 1);
      } else {
        c.fillStyle = '#c9a26a';
        c.fillRect(x, y, 1, 1);
      }
    }
    c.globalAlpha = 1;
    // l'écrou en vol, ou posé au sol
    if (this.nut) {
      const n = this.nut;
      const t = Math.min(1, n.t);
      const x = n.fx + (n.tx - n.fx) * t;
      const y = n.fy + (n.ty - n.fy) * t - Math.sin(Math.PI * t) * 14;
      c.fillStyle = '#1c1020';
      c.fillRect(Math.round(x - ox) - 2, Math.round(y - oy) - 2, 4, 4);
      c.fillStyle = '#c3c9d3';
      c.fillRect(Math.round(x - ox) - 1, Math.round(y - oy) - 1, 2, 2);
    }
  }

  // ---------- sac à dos ----------
  useItem(id: string) {
    ui.setBag(false);
    if (id === 'sonde') {
      if (this.flags.has('sondeOn')) {
        this.flags.delete('sondeOn');
        ui.toast('Sonde éteinte');
      } else if (this.flags.has('batteryFound')) {
        // la seule source qu'elle cherchait est trouvée : elle ne capte plus rien
        return ui.say(['Tu allumes la Sonde… Plus aucune source d’énergie à capter.', 'Tu l’éteins.']);
      } else {
        this.flags.add('sondeOn');
        ui.toast('Sonde allumée');
      }
      sfx.select();
      this.save();
      return;
    }
    if (id === 'pelle') return this.dig();
    if (id === 'ecrou') return this.throwNut();
    if (id === 'capteur') {
      if (this.map.id === 'sommet') {
        releaseAll();
        ui.openRadio(RADIO_FREQ, () => this.onSignal());
        return;
      }
      if (this.map.dark) return ui.say(['Sous terre, le récepteur ne capte que du silence.']);
      if (this.map.id === 'colline') return ui.say(['Des grésillements, très faibles. Il faudrait prendre de la hauteur… la tour radio ?']);
      return ui.say(['Des grésillements. Rien d’autre. Il faudrait un point très haut.']);
    }
    if (id === 'battery') {
      const target = this.map.objects.find(
        (o) => o.id === 'pixelOff' && !this.flags.has('pixelOn') && Math.max(Math.abs(o.x - this.x), Math.abs(o.y - this.y)) <= 1,
      );
      if (!target) return ui.say(['Il faudrait la brancher sur quelque chose qui manque d’énergie.']);
      ui.say(
        ['Tu branches la batterie BS-1 sur le dos de Pixel.', 'Un ronronnement… ses yeux s’allument d’un bleu vif.', 'Pixel se lève, s’étire, et vient se coller à tes jambes.'],
        () => {
          this.items.delete('battery');
          this.flags.add('pixelOn');
          this.pixel = { x: target.x, y: target.y, dir: 'down', moving: null };
          sfx.success();
          this.refreshQuestions(false);
          this.save();
        },
      );
      return;
    }
    const it = ITEMS[id];
    ui.say([it ? it.text : '…']);
  }

  // ---------- le transporteur (capsule 07) ----------
  private podInteract() {
    const f = this.flags;
    if (!f.has('heliosOn')) return ui.say(['La capsule 07 est éteinte. Pour un transfert, il faudrait énormément d’énergie… Hélios ?']);
    if (!f.has('podAssembled')) {
      const parts: [string, string][] = [['matrice', 'la Matrice vierge'], ['noyau', 'le Noyau de transfert'], ['antenne', 'l’antenne de synchronisation']];
      const missing = parts.filter(([id]) => !this.items.has(id)).map(([, name]) => name);
      if (missing.length) return ui.say(['D’après les plans, il me manque encore :', `${missing.join(', ')}.`]);
      ui.say(
        ['Tu poses la Matrice vierge dans son logement.', 'Tu insères le Noyau de transfert. Il s’illumine.', 'Tu fixes l’antenne de synchronisation sur le capot.', 'La capsule 07 s’éveille dans un bourdonnement.'],
        () => {
          for (const id of ['matrice', 'noyau', 'antenne']) this.items.delete(id);
          f.add('podAssembled');
          sfx.success();
          this.save();
        },
      );
      return;
    }
    if (!f.has('podTuned')) {
      if (!this.items.has('capteur')) return ui.say(['L’antenne doit être accordée sur la balise d’Azura. Il me faudrait le récepteur.']);
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
            this.save();
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
            this.save();
            ui.say(['« CLÉ ACCEPTÉE. »', '« TRANSFERT PRÊT. »', '« AMORCE : SOURCE ISOLÉE REQUISE — TYPE BS-1. »']);
          },
          'Clé à 4 chiffres',
        ),
      );
      return;
    }
    const lines = f.has('primeHint')
      ? ['« AMORCE : SOURCE ISOLÉE REQUISE — TYPE BS-1. »', 'Pixel s’est assis au pied de la capsule.']
      : [
          '« AMORCE : SOURCE ISOLÉE REQUISE — TYPE BS-1. »',
          'Une BS-1… Il n’en existe qu’une.',
          'Pixel vient s’asseoir au pied de la capsule, et te regarde.',
        ];
    f.add('primeHint');
    ui.say(lines, () => this.askPrime());
  }

  /** La dernière décision : débrancher la batterie de Pixel pour amorcer le pod. */
  private askPrime() {
    ui.confirm(
      'Débrancher la batterie de Pixel ?',
      () => this.finale(),
      () => ui.say(['Pixel te regarde, la tête penchée.']),
    );
  }

  private finale() {
    this.locked = true;
    releaseAll();
    ui.say(
      [
        'Tu t’agenouilles près de Pixel.',
        'Il s’assoit de lui-même, et tend son dos.',
        'Tu débranches doucement la batterie BS-1.',
        'Ses yeux bleus faiblissent… puis s’éteignent.',
      ],
      () => {
        this.flags.delete('pixelOn');
        this.flags.add('pixelSleep');
        this.pixel = null;
        playTheme('none');
        ui.say(
          ['Tu glisses la batterie dans le logement de l’amorce. La capsule ronronne.', 'Tu t’allonges dans la capsule 07. Pixel est couché à son pied.', ...FINALE],
          async () => {
            await ui.playFinale(dogAsleep(), () => { this.blackout = true; });
            this.locked = false;
            this.onFinished();
          },
        );
      },
    );
  }

  private onSignal() {
    if (this.flags.has('signalFound')) return;
    this.flags.add('signalFound');
    sfx.success();
    ui.say(
      [
        '… Là ! Sur 47,2, un signal se détache du bruit.',
        'Une suite de bips, toujours la même :\n–··   ··–   –––   ·–·',
        'Régulier, insistant. Il vient de très loin, de la planète d’Aurore.',
        'Ce n’est pas du silence… mais je n’y comprends rien. Le message est indéchiffrable.',
      ],
      () => this.addClue('mis7'),
    );
    this.save();
  }

  /** Près de l'endroit indiqué par le journal de Betti : sous le potager, à deux pas à droite du grand arbre. */
  private nearCabin() {
    const hatch = this.map.objects.find((o) => o.id === 'cabinHatch');
    return (
      !!hatch &&
      this.flags.has('readLeaDiary') &&
      !this.flags.has('knowsCabin') &&
      Math.max(Math.abs(this.x - hatch.x), Math.abs(this.y - hatch.y)) <= 1
    );
  }

  private dig() {
    this.heroCrouch = 0.9;
    if (this.pixel && !this.pixel.walk) {
      this.pixelMode = 'dig';
      this.pixelTimer = 1.4;
      // Pixel se tourne vers toi et gratte le sol à ses pieds
      this.pixel.dir = this.x >= this.pixel.x ? 'right' : 'left';
    }
    if (this.nearCabin()) {
      ui.say(['Tu plantes la pelle dans la terre du potager…', 'Elle heurte du bois. Une trappe !'], () => {
        sfx.door();
        this.flags.add('knowsCabin');
        this.save();
      });
      return;
    }
    const ch = charAt(this.map, this.x, this.y);
    if (ch !== 'S') return ui.say(['Le sol est trop dur ici. Il faudrait du sable.']);
    const key = `dug:${this.map.id}:${this.x},${this.y}`;
    if (this.flags.has(key)) return ui.say(['J’ai déjà creusé ici.']);
    this.flags.add(key);
    sfx.page();
    const src = this.nearestSource();
    const found = src && src.d <= 1 && this.flags.has('sondeOn') && this.flags.has('knowsBattery');
    if (found) {
      ui.say(['Tu creuses… La pelle heurte quelque chose de dur.', 'Une batterie solaire, enveloppée dans une bâche : le prototype BS-1 !'], () => {
        this.flags.add('batteryFound');
        this.api.item('battery');
        this.flags.delete('sondeOn'); // sa mission est accomplie
        ui.toast('Sonde éteinte');
        this.save();
      });
    } else {
      ui.say(['Tu creuses… rien que du sable.', this.flags.has('sondeOn') ? 'La Sonde n’indique rien de précis ici.' : 'Creuser au hasard ne mènera nulle part.']);
      this.save();
    }
  }

  // ---------- Sonde Lumen ----------
  private nearestSource(): { d: number } | null {
    let best: number | null = null;
    for (const e of this.map.energy ?? []) {
      if (this.flags.has(e.goneWhen)) continue;
      const d = Math.max(Math.abs(e.x - this.x), Math.abs(e.y - this.y));
      if (best === null || d < best) best = d;
    }
    return best === null ? null : { d: best };
  }

  private updateDetector(dt: number) {
    const on = this.flags.has('sondeOn') && !this.blackout;
    let level = 0;
    if (on) {
      const src = this.nearestSource();
      if (src) level = src.d <= 1 ? 3 : src.d <= 4 ? 2 : src.d <= 10 ? 1 : 0;
      this.beepTimer -= dt;
      const every = [0, 1.4, 0.6, 0.22][level];
      if (level > 0 && this.beepTimer <= 0) {
        sfx.key();
        this.beepTimer = every;
      }
    }
    ui.setDetector(on, level);
  }

  // ---------- API offerte aux scripts de l'histoire ----------
  api: Api = {
    has: (f) => this.flags.has(f),
    set: (f) => {
      this.flags.add(f);
      this.refreshQuestions(false);
      this.save();
    },
    hasItem: (id) => this.items.has(id),
    item: (id) => {
      if (this.items.has(id)) return;
      this.items.add(id);
      ui.toast(`Objet obtenu : ${ITEMS[id]?.name ?? id}`);
      sfx.item();
      document.getElementById('btn-bag')?.classList.add('fresh');
      this.save();
    },
    clue: (id) => this.addClue(id),
    say: (lines, then) => ui.say(lines, then),
    keypad: (title, cb) => {
      releaseAll();
      ui.openKeypad(title, cb);
    },
    sfx: (name) => sfx[name](),
    ui: (kind, then) => {
      releaseAll();
      if (kind === 'switches') ui.openSwitches(SWITCHES, RESTART_ORDER, () => then?.());
      else if (kind === 'archives')
        ui.openTerminal({
          folders: ARCHIVES,
          code: ARCHIVE_CODE,
          loggedIn: this.flags.has('archLogin'),
          unlocked: new Set(ARCHIVES.filter((f) => this.flags.has('archUnlock_' + f.id)).map((f) => f.id)),
          onEvent: (ev) => {
            this.flags.add(ev === 'login' ? 'archLogin' : ev === 'azura' ? 'archAzura' : ev.startsWith('unlock:') ? 'archUnlock_' + ev.slice(7) : 'arch_' + ev);
            this.save();
          },
          onClose: then,
        });
      else if (kind === 'orbit') ui.openViewer('Carte des orbites', ui.orbitChart(), then);
      else ui.openViewer('Grille de décodage', ui.codebookTable(), then);
    },
  };

  /** Appelé quand la scène finale est terminée (main.ts revient à l'écran titre). */
  onFinished: () => void = () => {};

  startMusic() {
    playTheme(this.map.outdoor ? 'outdoor' : 'lab');
  }

  known(id: string) {
    return this.clues.has(id) || this.flags.has(id);
  }

  addClue(id: string) {
    if (this.clues.has(id)) return;
    this.clues.add(id);
    this.fresh.add(id);
    const c = CLUES.find((x) => x.id === id);
    ui.toast(`Journal mis à jour : ${c?.title ?? id}`);
    sfx.clue();
    document.getElementById('btn-journal')?.classList.add('fresh');
    this.refreshQuestions(false);
    this.save();
  }

  /** Ouvre ou résout les questions du journal selon ce qui est connu. */
  refreshQuestions(silent: boolean) {
    for (const q of QUESTIONS) {
      const open = q.opensWith.some((c) => this.clues.has(c));
      const solved = open && this.known(q.answeredBy);
      if (open && !this.openQ.has(q.id)) {
        this.openQ.add(q.id);
        if (!silent && !solved) {
          this.fresh.add(q.id);
          window.setTimeout(() => ui.toast(`Nouvelle question : ${q.ask}`), 1400);
        }
      }
      if (solved && !this.solvedQ.has(q.id)) {
        this.solvedQ.add(q.id);
        if (!silent) {
          this.fresh.add(q.id);
          window.setTimeout(() => ui.toast(`Question résolue : ${q.ask}`), 1400);
          document.getElementById('btn-journal')?.classList.add('fresh');
        }
      }
    }
  }

  openJournal() {
    ui.renderJournal(this.clues, this.fresh, this.openQ, this.solvedQ, (id) => this.flags.has(id) || this.items.has(id));
    ui.setJournal(true);
    releaseAll();
    // tout ce qui vient d'être affiché est désormais « lu »
    this.fresh.clear();
    document.getElementById('btn-journal')?.classList.remove('fresh');
    this.save();
  }

  openBag() {
    ui.renderBag([...this.items], (id) => this.useItem(id), this.flags.has('sondeOn'));
    ui.setBag(true);
    releaseAll();
    document.getElementById('btn-bag')?.classList.remove('fresh');
  }

  // ---------- rendu ----------
  private tileName(x: number, y: number): string {
    const m = this.map;
    const mark = m.marks?.find((k) => k.x === x && k.y === y);
    if (mark) return mark.sprite;
    const ch = charAt(m, x, y);
    const below = y + 1 >= m.height ? ch : charAt(m, x, y + 1);
    if (ch === '#' && m.skins) {
      const sk = m.skins.find((k) => x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h);
      if (sk) return `${sk.style}${below === '#' && y + 1 < sk.y + sk.h ? 'Top' : 'Front'}`;
    }
    switch (ch) {
      case 'H': return 'pad';
      case 'N': return m.solidBase ?? 'pad';
      case '.': return 'dust';
      case '"': return 'grass';
      case ',': return 'asphalt';
      case '-': return 'road';
      case '~': return Math.floor(this.time * 1.6 + (x + y) * 0.35) % 2 ? 'toxic1' : 'toxic0';
      case '*': return 'rubble';
      case '|': return 'fence';
      case 'T': return 'tree';
      case 'C': return 'car';
      case 'S': return this.flags.has(`dug:${this.map.id}:${x},${y}`) ? 'hole' : 'sand';
      case 'P': return 'panel';
      case 'v': return 'deadPlants';
      case '=': return 'labFloor';
      case '#': return below === '#' ? 'wallTop' : 'wallFront';
      case 'X': return below === 'X' ? 'labWallTop' : 'labWallFront';
      case 'Y': return below === 'Y' ? 'wallpaperTop' : 'wallpaperFront';
      case 'K': return below === 'K' ? 'plankTop' : 'plankFront';
      case 'W': return below === 'W' ? 'metroWallTop' : 'metroWallFront';
      case 'w': return 'woodFloor';
      case 'm': return 'platform';
      case '_': return 'platformEdge';
      case 'r': return 'rails';
      case 'k': return 'sky';
      case 'g': return 'grating';
      default: return 'dust';
    }
  }

  heroPixel(): [number, number] {
    if (!this.moving) return [this.x * T, this.y * T];
    const t = Math.min(1, this.moving.t);
    return [(this.moving.fx + (this.x - this.moving.fx) * t) * T, (this.moving.fy + (this.y - this.moving.fy) * t) * T];
  }

  private pixelPixel(): [number, number] {
    const p = this.pixel!;
    if (p.walk && p.walk.path.length) {
      const [ax, ay] = p.walk.from;
      const [bx, by] = p.walk.path[0];
      const t = Math.min(1, p.walk.t);
      return [(ax + (bx - ax) * t) * T, (ay + (by - ay) * t) * T];
    }
    if (!p.moving || !this.moving) return [p.x * T, p.y * T];
    const t = Math.min(1, this.moving.t);
    return [(p.moving.fx + (p.x - p.moving.fx) * t) * T, (p.moving.fy + (p.y - p.moving.fy) * t) * T];
  }

  render() {
    const c = this.ctx;
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#05060c';
    c.fillRect(0, 0, view.w, view.h);
    if (this.blackout) return;

    const [hx, hy] = this.heroPixel();
    const mw = this.map.width * T;
    const mh = this.map.height * T;
    // caméra toujours centrée sur le héros, comme dans Pokémon (au-delà du bord : décor de ruines)
    const camX = hx + T / 2 - view.w / 2;
    const visH = view.h - view.padBottom; // on garde le héros au-dessus des commandes
    const camY = hy + T / 2 - visH / 2;
    const ox = Math.round(camX);
    const oy = Math.round(camY);

    const x0 = Math.floor(ox / T) - 1;
    const y0 = Math.floor(oy / T) - 1;
    for (let y = y0; y <= y0 + view.h / T + 2; y++) {
      for (let x = x0; x <= x0 + view.w / T + 2; x++) {
        if (x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) {
          const voidTile = this.map.voidTile ?? (this.map.outdoor ? 'rubble' : '');
          if (voidTile) c.drawImage(tile(voidTile, hash(x, y)), x * T - ox, y * T - oy);
          continue;
        }
        const obj = this.objAt(x, y);
        const sprite = obj ? this.objSprite(obj) : '';
        const name = sprite || this.tileName(x, y);
        c.drawImage(tile(name, hash(x, y)), x * T - ox, y * T - oy);
      }
    }

    // grands décors, alignés sur le bas de leur emprise
    for (const d of this.map.decals ?? []) {
      const img =
        d.kind === 'shuttle' ? this.decalShuttle : d.kind === 'dish' ? this.decalDish : d.kind === 'radioTower' ? this.decalRadio
        : d.kind === 'train' ? this.decalTrain : d.kind === 'bigTree' ? this.decalBigTree : this.decalTower;
      c.drawImage(img, d.x * T - ox, (d.y + d.h) * T - img.height - oy);
    }

    // indicateur au-dessus de l'objet regardé
    if (!this.busy && !this.moving) {
      const [fx, fy] = this.facing();
      const obj = this.objAt(fx, fy);
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

    let frame = 0;
    if (this.moving && this.moving.t < 0.75) frame = this.steps % 2 ? 1 : 2;
    else if (this.heroCrouch > 0) frame = 3;
    else if (!this.moving && this.idle > 1.5 && Math.floor(this.time / 0.9) % 2) frame = 4;
    const drawHero = () => c.drawImage(hero(this.dir, frame), Math.round(hx - ox), Math.round(hy - oy) - 3);
    if (this.pixel) {
      const [px, py] = this.pixelPixel();
      const pdir = this.pixel.dir === 'left' ? 'left' : 'right';
      const look = this.pixelLook();
      // dans le noir, immobile, il tremble
      const shiver = look.pose === 'scared' && !this.pixel.walk && !this.moving ? Math.floor(this.time * 14) % 2 : 0;
      const carrying = this.fetch?.stage === 'back';
      const drawDog = () => {
        const dx = Math.round(px - ox) + shiver, dy = Math.round(py - oy) - 1;
        c.drawImage(dogSprite(pdir, look), dx, dy);
        if (carrying) {
          // l'écrou dans la gueule
          const mx = pdir === 'left' ? dx + 0 : dx + 14;
          c.fillStyle = '#1c1020';
          c.fillRect(mx - 1, dy + 6, 4, 3);
          c.fillStyle = '#c3c9d3';
          c.fillRect(mx, dy + 7, 2, 1);
        }
      };
      if (py <= hy) {
        drawDog();
        drawHero();
      } else {
        drawHero();
        drawDog();
      }
    } else drawHero();
    this.renderFx(ox, oy);

    this.renderAtmosphere();
    if (this.map.dark) {
      this.renderDarkness(hx - ox + T / 2, hy - oy + T / 2 - 2);
      // dans le noir, on devine Pixel à la lueur de son œil
      if (this.pixel && this.time % 3.7 >= 0.12) {
        const [px, py] = this.pixelPixel();
        const shiver = !this.pixel.walk && !this.moving ? Math.floor(this.time * 14) % 2 : 0;
        const ex = Math.round(px - ox) + shiver + (this.pixel.dir === 'left' ? 2 : 12);
        const ey = Math.round(py - oy) - 1 + 6;
        c.fillStyle = 'rgba(94,240,255,0.25)';
        c.fillRect(ex - 1, ey - 1, 4, 4);
        c.fillStyle = '#5ef0ff';
        c.fillRect(ex, ey, 2, 2);
      }
    }
  }

  /** Le noir complet, sauf un halo autour du héros : grand avec la lampe, minuscule sans. */
  private renderDarkness(cx: number, cy: number) {
    const c = this.ctx;
    const lamp = this.items.has('lampe');
    const flicker = lamp ? Math.sin(this.time * 9) * 1.5 + Math.sin(this.time * 23) * 0.8 : 0;
    const inner = lamp ? 26 + flicker : 6;
    const outer = lamp ? 64 + flicker : 16;
    const g = c.createRadialGradient(cx, cy, inner, cx, cy, outer);
    g.addColorStop(0, 'rgba(4,3,8,0)');
    g.addColorStop(0.7, 'rgba(4,3,8,0.85)');
    g.addColorStop(1, 'rgba(4,3,8,0.98)');
    c.fillStyle = g;
    c.fillRect(0, 0, view.w, view.h);
    if (lamp) {
      c.fillStyle = 'rgba(255,230,160,0.06)';
      c.beginPath();
      c.arc(cx, cy, inner, 0, Math.PI * 2);
      c.fill();
    }
  }

  private objSprite(o: MapObject): string {
    if (o.spriteWhen && this.flags.has(o.spriteWhen[0])) return o.spriteWhen[1];
    return o.sprite;
  }

  private newParticle(anywhere: boolean): Particle {
    return {
      x: anywhere ? Math.random() * view.w : -4,
      y: Math.random() * view.h,
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
      if (p.x > view.w + 4 || p.y > view.h + 4) this.particles[i] = this.newParticle(false);
    }
  }

  private renderAtmosphere() {
    const c = this.ctx;
    if (this.map.outdoor) {
      const g = c.createLinearGradient(0, 0, 0, view.h);
      g.addColorStop(0, 'rgba(255,110,40,0.22)');
      g.addColorStop(1, 'rgba(120,30,60,0.12)');
      c.fillStyle = g;
      c.fillRect(0, 0, view.w, view.h);
      for (const p of this.particles) {
        c.fillStyle = `rgba(255,214,160,${p.a})`;
        c.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
    } else {
      const flicker = Math.sin(this.time * 23) > 0.96 ? 0.12 : 0;
      c.fillStyle = `rgba(20,40,80,${0.18 + flicker})`;
      c.fillRect(0, 0, view.w, view.h);
    }
    const v = c.createRadialGradient(view.w / 2, view.h / 2, view.h * 0.35, view.w / 2, view.h / 2, view.h * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = v;
    c.fillRect(0, 0, view.w, view.h);
  }
}
