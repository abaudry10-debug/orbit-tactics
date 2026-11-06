// Un chapitre = une « cartouche » branchée sur le moteur : ses cartes, son histoire,
// ses réglages (vagues de chaleur, musique, style des dialogues…) et ses crochets,
// c'est-à-dire le code qui n'a de sens que pour lui (énigmes particulières, fin…).
// Le moteur (engine/) ne connaît aucun chapitre en particulier : il lit le chapitre actif.

import type { Achievement, ArchiveFolder, Clue, ItemDef, Memory, Question, Script, Thread } from './content.js';
import type { Game } from './game.js';
import type { Dir, PersonLook } from './sprites.js';
import type { GameMap, MapObject } from './world.js';

export type Theme = 'title' | 'outdoor' | 'lab' | 'home' | 'azura' | 'none';
export type CutKind = 'pixelFlap' | 'pixelVent' | 'pixelPower' | 'pixelCar';

export interface ChapterFeatures {
  /** Vagues de chaleur (sirène, jauge, abris, sauvetage par Pixel). */
  heatWaves: boolean;
  /** Système de déplacement. Pour l'instant : case par case. */
  movement: 'grid';
}

/** Le code propre au chapitre, appelé par le moteur aux bons moments. Tous facultatifs. */
export interface ChapterHooks {
  /** Avant toute interaction (touche A). Renvoie true si le chapitre l'a prise en charge. */
  beforeInteract?(g: Game, obj: MapObject | undefined, fx: number, fy: number): boolean;
  /** Une case sans objet devant soi : un petit texte de décor. */
  describeTile?(g: Game, ch: string, fx: number, fy: number): void;
  /** Utilisation d'un objet du sac. Renvoie true si le chapitre l'a prise en charge. */
  useItem?(g: Game, id: string): boolean;
  /** On creuse à la pelle (après l'animation commune). */
  dig?(g: Game): void;
  /** Arrivée sur une carte (après le fondu). */
  onEnterMap?(g: Game, mapId: string): void;
  /** À chaque image, avant le reste de la mise à jour. */
  update?(g: Game, dt: number): void;
  /** À chaque image, avec les animations de Pixel et des effets (scènes scriptées). */
  updateLate?(g: Game, dt: number): void;
  /** Une scène scriptée fait-elle marcher le héros (animation de pas) ? */
  heroWalking?(g: Game): boolean;
  /** Décor animé propre au chapitre, dessiné par-dessus une case. */
  renderTile?(g: Game, c: CanvasRenderingContext2D, name: string, x: number, y: number, sx: number, sy: number): void;
  /** Vagues de chaleur : faut-il en lancer une maintenant ? */
  heatTrigger?(g: Game, dt: number): { kind: string; strength: number } | null;
  /** Une vague vient de se terminer. */
  onHeatEnd?(g: Game, kind: string): void;
  /** Le dessin d'une case du chapitre (sinon, le dessin par défaut du moteur). */
  tileName?(g: Game, ch: string, x: number, y: number, below: string): string | undefined;
  /** La lumière du chapitre (teinte, particules) ; true si elle a été dessinée. */
  renderAtmosphere?(g: Game, c: CanvasRenderingContext2D, w: number, h: number): boolean;
  /** Pixel est-il « chez lui » ici (il remue la queue, jappe de joie) ? */
  isPixelHome?(g: Game): boolean;
}

export interface Chapter {
  id: string;
  title: string;
  /** Nom de la sauvegarde dans le navigateur. */
  saveKey: string;
  start: { map: string; x: number; y: number; dir: Dir };
  /** Où l'on se réveille si Pixel ne trouve aucun abri sur la carte. */
  shelter: { to: string; x: number; y: number; dir: Dir };
  maps: Record<string, GameMap>;
  scripts: Record<string, Script>;
  threads: Thread[];
  clues: Clue[];
  questions: Question[];
  items: Record<string, ItemDef>;
  achievements: Achievement[];
  memories: Memory[];
  archives: ArchiveFolder[];
  archiveCode: string;
  /** Tableau de dérivation (énigme des interrupteurs). */
  switches: { labels: string[]; order: string[] };
  intro: string[];
  features: ChapterFeatures;
  /** Musique selon la carte. */
  music(map: GameMap): Theme;
  /** Classe CSS ajoutée à la bulle de dialogue (style propre au chapitre). */
  dialogStyle: string;
  /** Objet visé par chaque scène de Pixel (chatière, conduit…). */
  cutTargets: Partial<Record<CutKind, string>>;
  hooks: ChapterHooks;
  /** Ce qui se passe quand on lance une nouvelle partie (texte d'ouverture, réveil). */
  begin(g: Game): void;
  /** Les cases infranchissables (sinon celles du moteur). */
  solid?: Set<string>;
  /** L'apparence des habitants, par nom. */
  people?: Record<string, PersonLook>;
  /** L'apparence du héros dans ce chapitre (sinon celle du chapitre 1). */
  heroLook?: PersonLook;
  /** Raccourcis du mode développeur (?dev). */
  dev?: {
    /** Étapes de l'histoire : on pose ces drapeaux et objets, puis on se téléporte. */
    presets: { label: string; flags: string[]; items: string[]; at?: { map: string; x: number; y: number; dir: Dir } }[];
    /** Actions propres au chapitre (lancer la fin…). */
    actions: { label: string; run(g: Game): void }[];
  };
  /** Ce que ce chapitre transmet au suivant quand on le termine. */
  legacy?(g: Game): Record<string, unknown>;
}

let current: Chapter | null = null;

/** Le chapitre en cours de jeu. */
export function ch(): Chapter {
  if (!current) throw new Error('Aucun chapitre chargé');
  return current;
}

export function setChapter(c: Chapter) {
  current = c;
  document.getElementById('dialog')?.setAttribute('data-style', c.dialogStyle);
}
