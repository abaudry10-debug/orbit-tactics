// L'héritage : ce qu'un chapitre terminé laisse au suivant (souvenirs retrouvés,
// liens tissés avec Pixel, choix faits…). Gardé à part de la sauvegarde de partie,
// qui, elle, est effacée à la fin d'un chapitre.

const KEY = 'vesper-legacy-v1';

export interface ChapterLegacy {
  /** Date de fin (ISO). */
  at: string;
  /** Compteurs de la partie (caresses, écrous lancés, sauvetages…). */
  counters: Record<string, number>;
  /** Ce que le chapitre choisit de transmettre. */
  data: Record<string, unknown>;
}

export type Legacy = Record<string, ChapterLegacy>;

export function readLegacy(): Legacy {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Legacy) : {};
  } catch {
    return {};
  }
}

export function writeLegacy(chapterId: string, entry: ChapterLegacy) {
  try {
    const all = readLegacy();
    all[chapterId] = entry;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* navigation privée : tant pis */
  }
}

export function chapterDone(chapterId: string): boolean {
  return !!readLegacy()[chapterId];
}
