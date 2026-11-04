# Orbit Tactics

Jeu de cartes tactique de science-fiction, au tour par tour, façon échecs.
Deux flottes s'affrontent sur une grille de 6 × 6 : détruis le Vaisseau amiral adverse.

Règles complètes : voir le document de règles partagé dans Claude.

## Jouer sur ton téléphone

### 1. Le plus simple : la version web (rien à installer)

À chaque push sur `main`, GitHub construit le jeu et le publie sur :

**https://abaudry10-debug.github.io/orbit-tactics/**

Sur iPhone, ouvre ce lien dans Safari, puis **Partager → Sur l'écran d'accueil** :
le jeu s'ouvre alors en plein écran, comme une appli.

> Si le site n'apparaît pas après le premier push : dans le repo GitHub,
> **Settings → Pages → Source : GitHub Actions**, puis relance le workflow
> dans l'onglet **Actions**.

### 2. En appli native avec Expo Go (sur ton ordinateur)

Il faut Node.js 22 ou plus.

```bash
git clone https://github.com/abaudry10-debug/orbit-tactics
cd orbit-tactics
npm run setup      # installe les dépendances et aligne les versions Expo
npm run tunnel     # lance le serveur et affiche un QR code
```

Installe **Expo Go** sur ton iPhone, puis scanne le QR code avec l'appareil photo.
`tunnel` marche même si ton téléphone n'est pas sur le même Wi-Fi.

> Si Expo Go indique que la version du SDK n'est pas compatible, utilise
> la version web en attendant, ou passe directement par TestFlight (ci-dessous).

### 3. Vers l'App Store (plus tard)

1. Crée un compte Apple Developer (environ 99 $ par an) et un compte Expo (gratuit).
2. `npm install -g eas-cli` puis `eas login`.
3. `eas build --platform ios --profile production` : construit l'appli dans le cloud, sans Mac.
4. `eas submit --platform ios` : l'envoie sur App Store Connect, puis sur **TestFlight**
   pour l'installer sur ton iPhone et l'ouvrir à tes amis.
5. Pour les amis sur Android : `eas build --platform android --profile preview` produit un APK à partager.

## Structure du code

| Dossier | Rôle |
| --- | --- |
| `src/game/` | Moteur de règles pur (cartes, plateau, tours, combat) et bot. Aucune dépendance à React : il sera réutilisé par le serveur multijoueur. |
| `src/ui/` | Écrans React Native : plateau, main, panneau d'info. |
| `tests/` | Tests du moteur, dont 100 parties bot contre bot. |
| `.github/workflows/web.yml` | Tests, build web et publication sur GitHub Pages. |

```bash
npm test          # tests du moteur (Node seul, pas besoin d'installer les dépendances)
npm run typecheck # vérification TypeScript
npm run web       # le jeu dans le navigateur de l'ordinateur
```

## Feuille de route

1. Prototype contre un bot ← **on est ici**
2. Multijoueur entre amis (comptes, codes amis, parties asynchrones via Supabase)
3. Collection : déblocage de cartes, decks, boosters
4. Publication : TestFlight, puis App Store
