# Vesper

Jeu d'exploration en pixel art, façon Pokémon à l'ancienne, dans un monde futuriste post-apocalyptique.
Tu te réveilles dans une capsule, sans mémoire, au milieu d'une ville morte.
Chaque indice trouvé remplit ton **journal**, jusqu'à comprendre ce qui s'est passé… et trouver une issue.

**Jouer :** https://abaudry10-debug.github.io/orbit-tactics/

Sur iPhone : ouvre le lien dans Safari, puis **Partager → Sur l'écran d'accueil** pour jouer en plein écran.

## Contenu actuel (étape 1)

- **Cinq lieux** : laboratoire Lazare, ruines de Vesper, quartier des Tilleuls, centre de recherche, centrale solaire Hélios.
- **Le code de mission** : croiser le journal d'une mère et la plaque des missions pour ouvrir le centre de recherche.
- **La Sonde Lumen** : une jauge et un bip guident vers une source d'énergie enfouie.
- **La pelle** : on ne trouve la batterie qu'en creusant au bon endroit, Sonde allumée.
- **Pixel**, le chien robot : réactivé avec la batterie, il suit le joueur et passe par les conduits.
- **Sac à dos illustré** et **journal à questions**, qui se résolvent au fil des découvertes.

Commandes : croix pour marcher, **A** pour examiner, **Sac** pour tes objets, **Journal** pour tes découvertes.
Au clavier : flèches ou ZQSD, Espace pour A, I pour le sac, J pour le journal, Échap pour le menu.

## Technique

TypeScript + Canvas 2D, **aucune dépendance** à l'exécution. Tout le pixel art est dessiné en code.

| Fichier | Rôle |
| --- | --- |
| `src/sprites.ts` | Pixel art : héros animé (4 directions), tuiles, objets |
| `src/maps.ts` | Cartes (laboratoire, ville) et objets placés dessus |
| `src/story.ts` | Histoire : indices du journal, objets, scripts d'interaction, énigme |
| `src/game.ts` | Déplacements, caméra, interactions, Pixel, Sonde, fouille, rendu, sauvegarde |
| `src/audio.ts` | Musique et bruitages synthétisés (Web Audio) |
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
