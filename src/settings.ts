/**
 * Réglages du joueur, gardés dans le navigateur.
 * `fx` : effets visuels (ombres, décor animé, petites animations, scènes de Pixel).
 * Désactivés, le jeu redevient exactement comme avant ces effets.
 */
const KEY = 'vesper-fx';

function load(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export const settings = { fx: load() };

export function setFx(on: boolean) {
  settings.fx = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* stockage indisponible : le réglage vaut pour la session */
  }
}
