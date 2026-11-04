# Vesper

Jeu d'exploration en pixel art, façon Pokémon à l'ancienne, dans un monde futuriste post-apocalyptique.
Tu te réveilles dans une capsule, sans mémoire, au milieu d'une ville morte.
Chaque indice trouvé remplit ton **journal**, jusqu'à comprendre ce qui s'est passé… et trouver une issue.

**Jouer :** https://abaudry10-debug.github.io/orbit-tactics/

Sur iPhone : ouvre le lien dans Safari, puis **Partager → Sur l'écran d'accueil** pour jouer en plein écran.

## Chapitre 1 — Le Réveil

- **Laboratoire Lazare** : capsules, terminal, casier (badge pour sortir).
- **Ruines de Vesper** : panneau, robot de patrouille, carnet, Monument, lac toxique.
- **Abri Delta** : une porte à code. Le code se déduit des indices trouvés en ville.
- 10 découvertes réparties en 3 fils : *Qui suis-je ?*, *Que s'est-il passé à Vesper ?*, *L'Abri Delta*.
- Sauvegarde automatique dans le navigateur.

Commandes : croix pour marcher, **A** pour examiner, **Journal** pour tes découvertes.
Au clavier : flèches ou ZQSD, Espace pour A, J pour le journal.

## Technique

TypeScript + Canvas 2D, **aucune dépendance** à l'exécution. Tout le pixel art est dessiné en code.

| Fichier | Rôle |
| --- | --- |
| `src/sprites.ts` | Pixel art : héros animé (4 directions), tuiles, objets |
| `src/maps.ts` | Cartes (laboratoire, ville) et objets placés dessus |
| `src/story.ts` | Histoire : indices du journal, objets, scripts d'interaction, énigme |
| `src/game.ts` | Déplacements case par case, caméra, interactions, rendu, sauvegarde |
| `src/ui.ts` | Dialogues, journal, clavier à code, notifications |
| `src/input.ts` | Clavier et croix tactile |
| `tests/` | Vérifie que chaque objet est accessible et chaque indice obtenable |

```bash
npm install     # installe TypeScript
npm test        # vérifie les cartes et l'histoire
npm run build   # compile dans dist/
npm run serve   # joue sur http://localhost:8080
```

Chaque push sur `main` lance les tests, compile et publie sur GitHub Pages.

### Ajouter du contenu

1. Un indice : une entrée dans `CLUES` (`src/story.ts`).
2. Un objet sur la carte : une ligne dans `objects` (`src/maps.ts`) avec un `script`.
3. Le script, dans `SCRIPTS` : il fait parler le jeu (`api.say`) et donne l'indice (`api.clue`).

### Vers l'App Store

Le même code sera emballé en appli iOS native avec Capacitor, puis compilé dans le cloud
(sans Mac) et distribué via TestFlight. Il faudra un compte Apple Developer.
