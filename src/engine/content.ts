// Les définitions communes à tous les chapitres : indices, questions, objets, scripts,
// dossiers d'archives, souvenirs. Chaque chapitre fournit ses données (voir chapters/).

export type ThreadId = string;
export interface Thread { id: ThreadId; title: string; icon: string }
export interface ItemDef { name: string; text: string; usable?: boolean }
export interface Achievement { id: string; title: string; text: string; counter: string; goal: number }
export type Script = (api: Api) => void;

export interface Clue {
  id: string;
  thread: ThreadId;
  title: string;
  text: string;
  /** Pistes : drapeau ou objet qui montre que la piste est terminée. */
  doneWhen?: string;
}

export interface Question {
  id: string;
  thread: ThreadId;
  ask: string;
  answer: string;
  opensWith: string[]; // un de ces indices suffit à poser la question
  answeredBy: string; // drapeau (ou indice) qui y répond
}

export interface ArchiveFolder {
  id: string;
  name: string;
  locked?: boolean;
  /** Code d'accès propre au dossier (trouvé ailleurs dans le jeu). */
  code?: string;
  codeHint?: string;
  lines: string[];
}

export interface Api {
  has(flag: string): boolean;
  set(flag: string): void;
  clue(id: string): void;
  item(id: string): void;
  hasItem(id: string): boolean;
  say(lines: string[], then?: () => void): void;
  keypad(title: string, onCode: (code: string) => void): void;
  sfx(name: 'success' | 'wrong' | 'door' | 'item' | 'musicBox'): void;
  ui(kind: 'switches' | 'orbit' | 'codebook' | 'archives' | 'pixelFlap' | 'pixelVent' | 'pixelPower' | 'pixelCar', then?: () => void): void;
}

// ---------- souvenirs projetés (taille de l'image en pixels) ----------
type Ctx = CanvasRenderingContext2D;
export const MW = 160;
export const MH = 112;
export interface Tableau {
  caption: string;
  dur: number;
  draw: (c: Ctx, t: number) => void;
}

export interface Memory {
  title: string;
  tableaux: Tableau[];
}
