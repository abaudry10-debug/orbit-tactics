# Vesper

Jeu d'exploration en pixel art, façon Pokémon à l'ancienne, dans un monde futuriste post-apocalyptique.
Tu te réveilles dans une capsule, sans mémoire, au milieu d'une ville morte.
Chaque indice trouvé remplit ton **journal**, jusqu'à comprendre ce qui s'est passé… et trouver une issue.

**Jouer :** https://abaudry10-debug.github.io/vesper/

Sur iPhone : ouvre le lien dans Safari, puis **Partager → Sur l'écran d'accueil** pour jouer en plein écran.

## Contenu actuel (étape 1)

- **Cinq lieux** : laboratoire Lazare, ruines de Vesper, quartier des Tilleuls, centre de recherche, centrale solaire Hélios.
- **Le code de mission** : croiser le journal d'une mère et la plaque des missions pour ouvrir le centre de recherche.
- **La Sonde Lumen** : une jauge et un bip guident vers une source d'énergie enfouie.
- **La pelle** : on ne trouve la batterie qu'en creusant au bon endroit, Sonde allumée.
- **Pixel**, le chien robot : réactivé avec la batterie, il suit le joueur et passe par les conduits.
- **Sac à dos illustré** et **journal à questions**, qui se résolvent au fil des découvertes.

## Étape 2

- **Chez Betti** : Pixel ouvre la maison par la chatière ; ses dessins et son journal mènent à sa cabane secrète.
- **La lampe torche**, cachée derrière la tôle bleue du château d'eau.
- **Le métro dans le noir** : un halo de lumière autour du héros, trois stations et un dépôt (noyau de transfert, récepteur radio).
- **La colline de l'observatoire** : relevé de l'orbite, journal de veille de la mission Aurore.
- **La tour radio** : une molette de fréquence pour capter un signal lointain et indéchiffrable.

## Étape 3 — la fin

- **La salle des turbines** : Pixel prête son énergie pour ouvrir la porte ; le tableau de dérivation se rallume dans l'ordre inverse de l'arrêt noté par le technicien.
- **L'observatoire** (déblayé à la pelle) : la carte animée des orbites, où l'étoile errante frôle l'orbite de Vesper.
- **Le spatioport** : tableau des missions (la planète Azura), plans du pod, journal du Dr Varn, grille de décodage du signal.
- **Le laboratoire de culture**, derrière le hangar : des cuves semblables aux capsules, et ce qu'on y préparait.
- **L'ordinateur des archives** (vert sur noir) : photos et rapports des missions ratées ; le dossier d'Azura reste confidentiel.
- **La navette écrasée** : l'antenne de transmission.
- **La capsule 07** : assemblage, réglage sur le signal, clé de synchronisation, puis l'amorce… et la scène finale.

Commandes : croix pour marcher, **A** pour examiner, **Sac** pour tes objets, **Journal** pour tes découvertes.
Au clavier : flèches ou ZQSD, Espace pour A, I pour le sac, J pour le journal, Échap pour le menu.

## Technique

TypeScript + Canvas 2D, **aucune dépendance** à l'exécution. Tout le pixel art est dessiné en code.

Le code est découpé en un **moteur** commun et des **chapitres** branchés dessus.

| Dossier / fichier | Rôle |
| --- | --- |
| `src/engine/` | Moteur commun : déplacements, Pixel, chaleur, rendu, dialogues, son, sauvegarde |
| `src/engine/chapter.ts` | Ce qu'un chapitre fournit au moteur : contenu, réglages (vagues de chaleur, musique, style de dialogue), crochets |
| `src/engine/legacy.ts` | L'héritage d'un chapitre terminé, transmis au suivant |
| `src/engine/dev.ts` | Mode développeur caché (`?dev`, ou 5 touchers sur le titre) |
| `src/chapters/vesper/` | Chapitre 1 : cartes, histoire, souvenirs de Pixel, code propre (capsule 07, fin, Sonde) |
| `src/chapters/azura/` | Chapitre 2 (en cours) : tranche verticale, jouable en mode développeur depuis l'écran titre |
| `src/main.ts` | Écran titre et chargement du chapitre |
| `tests/` | Vérifie que chaque objet est accessible et chaque indice obtenable |

```bash
npm install     # installe TypeScript
npm test        # vérifie les cartes et l'histoire
npm run build   # compile dans dist/
npm run serve   # joue sur http://localhost:8080
```

Chaque push sur `main` lance les tests, compile et publie sur GitHub Pages.

### Ajouter du contenu

1. Un indice : une entrée dans `CLUES` (`src/chapters/vesper/story.ts`).
2. Un objet sur la carte : une ligne dans `objects` (`src/chapters/vesper/maps.ts`) avec un `script`.
3. Le script, dans `SCRIPTS` : il fait parler le jeu (`api.say`) et donne l'indice (`api.clue`).

### Vers l'App Store

Le même code sera emballé en appli iOS native avec Capacitor, puis compilé dans le cloud
(sans Mac) et distribué via TestFlight. Il faudra un compte Apple Developer.
