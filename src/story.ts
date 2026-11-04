// Histoire — étape 1 : indices du journal, questions, objets et scripts d'interaction.
// Pour ajouter du contenu : une entrée dans CLUES, puis un script qui appelle api.clue().

export type ThreadId = 'self' | 'capsules' | 'heat' | 'missions' | 'leads' | 'lea';

export const THREADS: { id: ThreadId; title: string; icon: string }[] = [
  { id: 'self', title: 'Qui suis-je ?', icon: '◉' },
  { id: 'capsules', title: 'Les capsules', icon: '▣' },
  { id: 'heat', title: 'Le ciel brûlant', icon: '☀' },
  { id: 'missions', title: 'Où sont-ils partis ?', icon: '▲' },
  { id: 'lea', title: 'Betti', icon: '✿' },
  { id: 'leads', title: 'Pistes à suivre', icon: '➜' },
];

export interface Clue {
  id: string;
  thread: ThreadId;
  title: string;
  text: string;
}

export const CLUES: Clue[] = [
  // Qui suis-je ?
  { id: 'self1', thread: 'self', title: 'Capsule 07', text: 'Sur ma capsule, une plaque : « SUJET 07 ». Pas de nom, juste ce numéro.' },
  { id: 'self2', thread: 'self', title: 'Le terminal', text: '« TRANSFERT COLLECTIF : TERMINÉ. 4 211 / 4 212. » Transfert de quoi ? Vers où ? Et pourquoi pas moi ?' },
  { id: 'self3', thread: 'self', title: 'Photo d’équipe', text: 'L’équipe du programme Lazare. Au centre, une femme au badge « Dr I. Varn ». Au dos : « Merci à tous les volontaires. »' },
  // Les capsules
  { id: 'cap1', thread: 'capsules', title: 'Le registre', text: 'Des centaines de noms, chacun suivi d’une coche : « transféré ». Le dernier, « Sujet 07 », n’a pas de coche.' },
  { id: 'cap2', thread: 'capsules', title: 'Capsules givrées', text: 'Les autres capsules sont scellées. Sous le givre, on devine des formes immobiles.' },
  { id: 'cap3', thread: 'capsules', title: 'Le robot', text: '« … DERNIER APPEL… TOUS LES CITOYENS… AUX CAPSULES… AVANT LA GRANDE CHALEUR… »' },
  { id: 'cap4', thread: 'capsules', title: 'Une lettre jamais envoyée', text: '« Ils disent que nos corps resteront ici, endormis. Que ce n’est pas grave, puisque nous serons là-bas. Mais là-bas, c’est où ? »' },
  { id: 'cap5', thread: 'capsules', title: 'La note du Dr Varn', text: '« L’esprit part. Le corps reste dans sa capsule, à l’abri de la chaleur. Il ne se réveillera pas. Il ne devrait pas. » — I. Varn' },
  // Le ciel brûlant
  { id: 'heat1', thread: 'heat', title: 'Le thermomètre', text: 'L’aiguille d’un thermomètre public est tordue contre la butée, au-delà du dernier chiffre.' },
  { id: 'heat2', thread: 'heat', title: 'L’affiche', text: '« Restez à l’ombre après la troisième cloche. » La troisième cloche de quoi ?' },
  { id: 'heat3', thread: 'heat', title: 'Le potager', text: 'Des plants brûlés, tous du même côté : celui qui fait face au ciel.' },
  { id: 'heat4', thread: 'heat', title: 'Le bouclier solaire', text: 'Rapport : le bouclier solaire protège 3 % de la surface. L’étendre à toute la planète est impossible. Conclusion : « l’orbite ne se corrigera pas d’elle-même ».' },
  // Où sont-ils partis ?
  { id: 'mis1', thread: 'missions', title: 'La plaque des missions', text: '« À ceux qui sont partis chercher un ciel plus doux. » AURORE 2207 · HÉLIADE 0911 · KAIROS 4416 · ONDINE 1530.' },
  { id: 'mis2', thread: 'missions', title: 'Le journal d’une mère', text: '« Mon Théo a été le tout premier à partir. Sa mission portait le nom de l’aube. Il a envoyé un seul message : là-bas, le ciel est bleu. »' },
  { id: 'mis3', thread: 'missions', title: 'Vols annulés', text: 'Au-dessus des portes soudées du spatioport : « DÉPARTS — TOUS VOLS ANNULÉS ».' },
  { id: 'mis4', thread: 'missions', title: 'Un ticket', text: 'Un ticket de navette tamponné « ANNULÉ ». La destination est effacée.' },
  { id: 'mis5', thread: 'missions', title: 'Capacité des navettes', text: 'Une place pour 400 habitants. 212 ans de voyage. Dans la marge, au crayon : « Il faut trouver autre chose. »' },
  // Pistes à suivre
  { id: 'lead1', thread: 'leads', title: 'La vitrine vide', text: '« Sonde Lumen — détecteur de sources d’énergie. » Un mot scotché : « Prêtée au labo 2. Bureau du fond. — M. »' },
  { id: 'lead2', thread: 'leads', title: 'Le prototype BS-1', text: 'Une batterie solaire expérimentale, conçue pour « amorcer les pods mobiles », perdue pendant l’évacuation de la centrale Hélios. « Sûrement enfouie sous le sable, quelque part près des ruines. »' },
  { id: 'lead3', thread: 'leads', title: 'Pixel', text: 'Un chien robot éteint. Sur son collier : « PIXEL ». Le petit panneau solaire sur son dos est fendu.' },
  { id: 'lead4', thread: 'leads', title: 'Le radioamateur', text: '« J’ai oublié mon récepteur dans la rame de la ligne 2. Il doit être aux objets trouvés de la station Marée. »' },
  // Étape 2 — Betti
  { id: 'lea1', thread: 'lea', title: 'Les dessins de Betti', text: 'Une cabane sous la terre, au pied d’un très grand arbre, avec une lampe et Pixel. Sur un autre dessin : Papa et Maman couchés dans des boîtes de verre, sous des étoiles.' },
  { id: 'lea2', thread: 'lea', title: 'Le journal de Betti', text: '« Ma cabane secrète est sous le potager, à deux pas à droite du grand arbre. Papa m’a prêté sa lampe. Personne ne peut la voir ! »' },
  { id: 'lea3', thread: 'lea', title: 'Le dernier mot de Betti', text: '« Demain on dort tous dans les capsules. Maman dit qu’on se réveillera ailleurs, sous un ciel bleu. Pixel ne peut pas venir. Pardon Pixel. »' },
  // Étape 2 — métro et colline
  { id: 'cap6', thread: 'capsules', title: 'L’affiche du métro', text: '« Programme LAZARE. Votre esprit voyage. Votre corps se repose. » Un visage paisible, les yeux fermés.' },
  { id: 'cap7', thread: 'capsules', title: 'Le caisson de maintenance', text: '« LAZARE — noyau de transfert de rechange, pour pod mobile. » Un pod mobile… on pourrait donc en construire un ailleurs qu’au laboratoire ?' },
  { id: 'heat5', thread: 'heat', title: 'Le relevé de l’observatoire', text: 'Chaque année, Vesper se rapproche de son étoile. Une courbe descend jusqu’à une ligne rouge : « seuil de survie ». La date est entourée trois fois.' },
  { id: 'mis6', thread: 'missions', title: 'Le dernier contact', text: '« Mission Aurore : monde habitable confirmé. Dernier contact sur 47,2. Ensuite, plus rien. »' },
  { id: 'mis7', thread: 'missions', title: 'Un signal', text: 'Au sommet de la tour radio, sur 47,2 : un signal venu de la planète d’Aurore. Une suite de bips qui se répète : –··  ··–  –––  ·–·  Indéchiffrable… pour l’instant.' },
  // Étape 3
  { id: 'heat6', thread: 'heat', title: 'La carte des orbites', text: 'Une seconde étoile, brûlante, suit une orbite immense et très allongée. Une fois par cycle, elle frôle l’orbite de Vesper. Son prochain passage est marqué en rouge : tout près de nous, et bientôt.' },
  { id: 'heat7', thread: 'heat', title: 'Le journal de l’observatoire', text: '« L’étoile errante revient. Ce passage-ci sera plus proche que tous les autres. Plus rien ne survivra en surface. Le programme LAZARE est notre seule chance. »' },
  { id: 'mis8', thread: 'missions', title: 'Le tableau des missions', text: 'HÉLIADE : aucun monde viable. KAIROS : perdue. ONDINE : monde gelé. AURORE : monde habitable confirmé, baptisé Azura.' },
  { id: 'cap10', thread: 'capsules', title: 'Les cuves d’essai', text: 'Des cuves semblables à nos capsules, remplies d’un liquide ambré. « Essai 14 : forme stable. Aucune activité cérébrale. Normal : personne n’y est encore entré. »' },
  { id: 'cap11', thread: 'capsules', title: 'Le tableau blanc', text: 'Un schéma : une capsule à gauche, une cuve à droite, une flèche entre les deux. « ESPRIT → ». Dessous, entouré deux fois : « Même mémoire. Même visage. »' },
  { id: 'cap12', thread: 'capsules', title: 'Les caisses d’Aurore', text: '« AURORE — matériel de culture — 4 212 unités. » Les caisses sont parties avec la mission. Il ne reste ici que les cuves d’essai.' },
  { id: 'cap13', thread: 'capsules', title: 'La lettre de Nina', text: '« Maman, on part demain avec le programme. Tu crois que j’aurai encore mes taches de rousseur, là-bas ? »' },
  { id: 'mis10', thread: 'missions', title: 'Les archives du spatioport', text: 'Les dossiers des missions : Héliade a trouvé un monde de roche fondue, Kairos s’est perdue dans une tempête, Ondine n’a trouvé que de la glace.' },
  { id: 'mis11', thread: 'missions', title: 'Le dossier Azura', text: '« AURORE / AZURA — ACCÈS REFUSÉ. Dossier classé confidentiel : direction du programme LAZARE. » Qu’y a-t-il à cacher sur le seul monde habitable ?' },
  { id: 'mis9', thread: 'missions', title: 'La grille de décodage', text: 'La grille de la mission Aurore associe chaque groupe de trois bips à un chiffre : ··· 0 · ··– 1 · ·–· 2 · ·–– 3 · –·· 4 · –·– 5 · ––· 6 · ––– 7.' },
  { id: 'cap9', thread: 'capsules', title: 'Le journal du Dr Varn', text: '« Les navettes ne suffiront jamais. Alors nous enverrons nos esprits. Sur Azura, la mission Aurore cultive un corps neuf pour chacun de nous. Les capsules transfèrent chaque esprit vers son double et protègent nos anciens corps de la chaleur. 4 212 habitants, 4 212 capsules. Tout le monde part. »' },
  { id: 'lead5', thread: 'leads', title: 'Le carnet du technicien', text: '« Arrêt d’urgence à la troisième cloche : j’ai coupé la pompe, puis l’onduleur, puis la ventilation, puis la turbine, et enfin le régulateur. » — R. Ilunga' },
  { id: 'lead6', thread: 'leads', title: 'Les plans du pod mobile', text: '1. Matrice vierge. 2. Noyau de transfert. 3. Antenne de synchronisation, accordée sur la balise d’Azura. 4. Clé de synchronisation. 5. Amorce : source isolée, type BS-1.' },
];

/** Questions du journal : elles s'ouvrent avec un indice et se résolvent plus tard. */
export interface Question {
  id: string;
  thread: ThreadId;
  ask: string;
  answer: string;
  opensWith: string[]; // un de ces indices suffit à poser la question
  answeredBy: string; // drapeau (ou indice) qui y répond
}

export const QUESTIONS: Question[] = [
  {
    id: 'q-heat', thread: 'heat', opensWith: ['heat1', 'heat2', 'heat3'], answeredBy: 'heat4',
    ask: 'Pourquoi tout semble-t-il brûlé ?',
    answer: 'La planète se rapproche de son étoile. Le bouclier solaire ne pouvait protéger qu’une infime partie de la surface.',
  },
  {
    id: 'q-first', thread: 'missions', opensWith: ['mis1', 'mis2'], answeredBy: 'researchOpen',
    ask: 'Quelle mission est partie la première ?',
    answer: 'Aurore, « le nom de l’aube ». Son code, 2207, ouvre le centre de recherche.',
  },
  {
    id: 'q-depart', thread: 'missions', opensWith: ['mis3', 'mis4'], answeredBy: 'mis5',
    ask: 'Pourquoi tous les départs ont-ils été annulés ?',
    answer: 'Les navettes ne pouvaient emmener qu’un habitant sur 400, pour plus de deux siècles de voyage.',
  },
  {
    id: 'q-capsules', thread: 'capsules', opensWith: ['cap1', 'cap2'], answeredBy: 'cap5',
    ask: 'Que contiennent vraiment les capsules ?',
    answer: 'Les corps des habitants. Leur esprit est parti ailleurs. Le mien, non.',
  },
  {
    id: 'q-signal', thread: 'missions', opensWith: ['mis7'], answeredBy: 'codebookRead',
    ask: 'Que dit le signal ?',
    answer: 'Ses quatre groupes de bips se traduisent avec la grille de la mission Aurore : c’est une clé à quatre chiffres.',
  },
  {
    id: 'q-culture', thread: 'capsules', opensWith: ['cap10'], answeredBy: 'cap9',
    ask: 'Que faisait-on pousser dans ces cuves ?',
    answer: 'Des corps neufs, un pour chacun. La mission Aurore en a emporté de quoi en faire 4 212 sur Azura.',
  },
  {
    id: 'q-power', thread: 'leads', opensWith: ['lead5'], answeredBy: 'heliosOn',
    ask: 'Comment redémarrer Hélios ?',
    answer: 'En reprenant la procédure d’arrêt du technicien dans l’ordre inverse.',
  },
  {
    id: 'q-cabin', thread: 'lea', opensWith: ['lea1'], answeredBy: 'hasLamp',
    ask: 'Où est la cabane de Betti ?',
    answer: 'Sous le potager, à deux pas à droite du grand arbre, cachée sous une trappe. La lampe de son père y était.',
  },
  {
    id: 'q-pixel', thread: 'leads', opensWith: ['lead3'], answeredBy: 'pixelOn',
    ask: 'Comment réveiller Pixel ?',
    answer: 'Avec la batterie solaire BS-1 déterrée près de la centrale Hélios.',
  },
];

export const ITEMS: Record<string, { name: string; text: string; usable?: boolean }> = {
  badge: { name: 'Badge Lazare', text: 'Badge d’accès du laboratoire. La photo est effacée.' },
  sonde: { name: 'Sonde Lumen', text: 'Détecte les sources d’énergie proches. Utilise-la pour l’allumer ou l’éteindre.', usable: true },
  pelle: { name: 'Pelle', text: 'Une pelle de jardin, solide. Utilise-la pour creuser là où tu te tiens.', usable: true },
  battery: { name: 'Batterie BS-1', text: 'Prototype de batterie solaire, encore chargée. Il faudrait la brancher sur quelque chose.', usable: true },
  matrice: { name: 'Matrice vierge', text: 'Une puce de rechange, vide. Elle sert à copier un esprit pour l’envoyer.' },
  lampe: { name: 'Lampe torche', text: 'La lampe du père de Betti. Elle s’allume d’elle-même dans le noir.' },
  capteur: { name: 'Récepteur radio', text: 'Le récepteur du radioamateur. Il capte les ondes, à condition d’être assez haut.', usable: true },
  noyau: { name: 'Noyau de transfert', text: 'Un cylindre lumineux, « pour pod mobile ». Une pièce pour voyager ?' },
  antenne: { name: 'Antenne de synchronisation', text: 'Démontée de la navette écrasée. Elle doit être accordée sur la balise d’Azura.' },
};

export const SIGNAL_KEY = '4172';
export const SWITCHES = ['Turbine', 'Pompe', 'Régulateur', 'Onduleur', 'Ventilation']; // ordre d'affichage
export const RESTART_ORDER = ['Régulateur', 'Turbine', 'Ventilation', 'Onduleur', 'Pompe']; // l'arrêt, à l'envers

export const FINALE = [
  'Système LAZARE : transfert du sujet 07.',
  'Constantes vitales : stables.',
  'Mémoire : prête.',
  'Destination : Azura.',
  'Bonne chance.',
];

export const RADIO_FREQ = 47.2;

/** Mot de passe des archives du spatioport : le code de la mission qui n'a trouvé que de la glace (Ondine). */
export const ARCHIVE_CODE = '1530';

export interface ArchiveFolder {
  id: string;
  name: string;
  locked?: boolean;
  lines: string[];
}

/** Dossiers de l'ordinateur du spatioport. Le dossier d'Azura reste verrouillé. */
export const ARCHIVES: ArchiveFolder[] = [
  {
    id: 'plans', name: 'LAZARE_POD_MOBILE',
    lines: [
      'PROGRAMME LAZARE — POD MOBILE (plan v4)',
      'Une navette : 12 passagers, et l’énergie de toute la ville pendant un an.',
      'Population : 4 212. Les corps ne partiront pas.',
      'Seuls les esprits voyageront.',
      '1. MATRICE VIERGE : copie l’esprit du dormeur.',
      '2. NOYAU DE TRANSFERT : alimente la copie.',
      '3. ANTENNE : à accorder sur la balise d’Azura (voir relevé radio).',
      '4. CLÉ DE SYNCHRONISATION : extraite du signal d’Azura.',
      '5. AMORCE : source isolée, type BS-1.',
      'À l’arrivée : un corps cultivé par la mission Aurore attend chaque esprit.',
    ],
  },
  {
    id: 'heliade', name: 'MISSION_HELIADE',
    lines: [
      'DESTINATION : HÉLIADE b',
      'VOYAGE : 61 ANS',
      'SURFACE : roche vitrifiée, 410 °C le jour.',
      'ATMOSPHÈRE : soufre.',
      'VERDICT : NON VIABLE.',
      'Dernier message : « Il fait encore plus chaud qu’à la maison. »',
    ],
  },
  {
    id: 'kairos', name: 'MISSION_KAIROS',
    lines: [
      'DESTINATION : lunes de la géante KAIROS',
      'VOYAGE : 74 ANS',
      'Contact perdu à l’approche des anneaux.',
      'Image ci-dessus : dernière transmission reçue.',
      'VERDICT : MISSION PERDUE.',
    ],
  },
  {
    id: 'ondine', name: 'MISSION_ONDINE',
    lines: [
      'DESTINATION : ONDINE',
      'VOYAGE : 58 ANS',
      'SURFACE : océan gelé, 3 km de glace. –140 °C.',
      'Les sondes de forage n’ont jamais atteint l’eau.',
      'VERDICT : NON VIABLE.',
    ],
  },
  {
    id: 'azura', name: 'MISSION_AURORE', locked: true,
    lines: [
      'ACCÈS REFUSÉ.',
      'Dossier classé CONFIDENTIEL.',
      'Réservé à la direction du programme LAZARE.',
      'Cette tentative a été enregistrée.',
    ],
  },
];

export const MISSION_CODE = '2207';

export const INTRO = [
  '…',
  'Système LAZARE : réveil du sujet 07.',
  'Constantes vitales : stables. Mémoire : fragmentée.',
  'Durée du sommeil : ERREUR — valeur hors limites.',
  'Bonne chance.',
];

// ---------- scripts ----------

export interface Api {
  has(flag: string): boolean;
  set(flag: string): void;
  clue(id: string): void;
  item(id: string): void;
  hasItem(id: string): boolean;
  say(lines: string[], then?: () => void): void;
  keypad(title: string, onCode: (code: string) => void): void;
  sfx(name: 'success' | 'wrong' | 'door' | 'item'): void;
  ui(kind: 'switches' | 'orbit' | 'codebook' | 'archives', then?: () => void): void;
}

export const SCRIPTS: Record<string, (api: Api) => void> = {
  // ----- laboratoire -----
  capsule07: (api) =>
    api.say(['Ma capsule. Le verre est encore tiède.', 'Une plaque : « SUJET 07 ». Pas de nom, juste ce numéro.'], () =>
      api.clue('self1'),
    ),

  capsuleFrost: (api) =>
    api.say(['Une capsule scellée, couverte de givre.', 'À l’intérieur… une forme immobile. Elle ne respire pas. Ou si lentement…'], () =>
      api.clue('cap2'),
    ),

  terminal: (api) =>
    api.say(
      ['Le terminal grésille.', '« TRANSFERT COLLECTIF : TERMINÉ. »', '« 4 211 / 4 212. »', 'Transfert ? De quoi ? Et pourquoi pas moi ?'],
      () => api.clue('self2'),
    ),

  register: (api) =>
    api.say(['Un registre ouvert sur un pupitre.', 'Des centaines de noms, chacun suivi d’une petite coche : « transféré ».', 'Le dernier, « Sujet 07 », n’a pas de coche.'], () =>
      api.clue('cap1'),
    ),

  deadTerminal: (api) => api.say(['Écran éteint. Ses câbles ont fondu dans la chaleur.']),

  locker: (api) => {
    if (api.has('badge')) return api.say(['Le casier est vide maintenant.']);
    api.say(
      [
        'Un casier entrouvert. Dedans : un badge et une photo.',
        'L’équipe du programme Lazare. Au centre, une femme : « Dr I. Varn ».',
        'Au dos : « Merci à tous les volontaires. »',
        'Tu prends le Badge Lazare.',
      ],
      () => {
        api.set('badge');
        api.item('badge');
        api.clue('self3');
      },
    );
  },

  labDoor: (api) => {
    if (api.has('badge')) return api.say(['La porte est ouverte. Dehors, une lumière orange.']);
    api.say(['La porte est verrouillée.', 'Un lecteur de badge clignote en rouge.']);
  },

  labEntrance: (api) => api.say(['L’entrée du laboratoire Lazare.']),

  // ----- ruines de Vesper -----
  signToQuartier: (api) => api.say(['Un panneau tordu : « ← Quartier résidentiel ».']),
  signToCentrale: (api) => api.say(['Un panneau couvert de sable : « ↓ Centrale solaire Hélios ».']),
  signToVesper: (api) => api.say(['Un panneau délavé : « Centre-ville de Vesper ».']),
  signVesper: (api) => api.say(['Un panneau rouillé : « Bienvenue à Vesper. Ensemble, plus loin. »']),

  thermometer: (api) =>
    api.say(['Un thermomètre public.', 'L’aiguille est tordue contre la butée, au-delà du dernier chiffre.'], () => api.clue('heat1')),

  posterShade: (api) =>
    api.say(['Une affiche délavée : « Restez à l’ombre après la troisième cloche. »', 'La troisième cloche de quoi ?'], () =>
      api.clue('heat2'),
    ),

  robot: (api) =>
    api.say(
      ['Un robot de patrouille, renversé. Son œil rouge s’allume.', '« … DERNIER APPEL… TOUS LES CITOYENS… AUX CAPSULES… AVANT LA GRANDE CHALEUR… »', 'Puis plus rien.'],
      () => api.clue('cap3'),
    ),

  missionPlaque: (api) =>
    api.say(
      [
        'Une plaque de bronze sur la place.',
        '« À ceux qui sont partis chercher un ciel plus doux. »',
        'AURORE — 2207. HÉLIADE — 0911. KAIROS — 4416. ONDINE — 1530.',
      ],
      () => api.clue('mis1'),
    ),

  pixelOff: (api) => {
    if (api.hasItem('battery'))
      return api.say(['Pixel attend, immobile.', 'La batterie BS-1 aurait la bonne prise. Utilise-la depuis ton sac, tout près de lui.']);
    api.say(
      ['Un chien robot, couché dans la poussière. Éteint.', 'Sur son collier : « PIXEL ».', 'Le petit panneau solaire sur son dos est fendu. Plus aucune énergie.'],
      () => api.clue('lead3'),
    );
  },

  noteLea: (api) =>
    api.say(['Un mot coincé sous une pierre :', '« Si quelqu’un trouve Pixel, prenez soin de lui. Il a juste besoin de soleil. — Betti »']),

  crate: (api) => api.say(['Une caisse vide. Quelqu’un est passé avant moi.']),

  metro: (api) => {
    if (api.has('hasLamp')) return api.say(['L’escalier du métro. Avec la lampe, je peux descendre.']);
    api.say(['Un escalier descend vers le métro.', 'En bas, le noir complet. Il me faudrait une lampe.']);
  },

  spatioport: (api) => {
    if (api.has('heliosOn')) return api.say(['Le courant est revenu : les portes du hangar se sont rouvertes.']);
    api.say(['Le hangar des navettes du spatioport. Les portes motorisées sont bloquées, sans courant.', 'Au-dessus, un panneau : « DÉPARTS — TOUS VOLS ANNULÉS ».'], () =>
      api.clue('mis3'),
    );
  },

  researchDoor: (api) => {
    if (api.has('researchOpen')) return api.say(['La porte du centre de recherche est ouverte.']);
    api.say(['CENTRE DE RECHERCHE DE VESPER.', 'Un clavier : « Accès réservé. Saisir un code de mission. »'], () =>
      api.keypad('CENTRE DE RECHERCHE', (code) => {
        if (code === MISSION_CODE) {
          api.sfx('success');
          api.say(['Bip. « Mission Aurore reconnue. Bienvenue. »', 'La porte coulisse.'], () => api.set('researchOpen'));
        } else {
          api.sfx('wrong');
          api.say(['Bzzt. « Code de mission inconnu. »']);
        }
      }),
    );
  },

  // ----- quartier des Tilleuls -----
  leaHouse: (api) => {
    if (api.has('leaOpen')) return api.say(['La porte de la maison Moreau est ouverte.']);
    if (!api.has('pixelOn'))
      return api.say(['Maison Moreau. La porte est coincée, comme gonflée par la chaleur.', 'En bas, une chatière. Bien trop petite pour moi.']);
    api.say(['Pixel renifle la chatière… et s’y faufile d’un bond.', 'Un cliquetis à l’intérieur. Pixel a tiré le verrou !'], () => {
      api.sfx('door');
      api.set('leaOpen');
    });
  },

  leaMailbox: (api) => api.say(['Une boîte aux lettres : « Famille Moreau — Betti, Sam et Pixel ». Pixel a son nom sur la boîte.']),

  motherJournal: (api) =>
    api.say(
      [
        'Un carnet posé sur un banc, devant une maison.',
        '« Mon Théo a été le tout premier à partir. »',
        '« Sa mission portait le nom de l’aube. »',
        '« Il a envoyé un seul message : là-bas, le ciel est bleu. »',
      ],
      () => api.clue('mis2'),
    ),

  pilotHouse: (api) => api.say(['Sur la porte, une étoile peinte à la main et un prénom : « Théo ».']),

  radioNotes: (api) =>
    api.say(
      ['Des notes griffonnées, sous une antenne tordue :', '« J’ai oublié mon récepteur dans la rame de la ligne 2. Il doit être aux objets trouvés de la station Marée. »'],
      () => api.clue('lead4'),
    ),

  radioHouse: (api) => api.say(['Une maison hérissée d’antennes. Fermée à double tour.']),

  ticket: (api) =>
    api.say(['Un ticket de navette, abandonné à l’arrêt.', 'Tamponné « ANNULÉ ». La destination est effacée.'], () => api.clue('mis4')),

  letter: (api) =>
    api.say(
      [
        'Une lettre glissée sous une porte, jamais envoyée.',
        '« Ils disent que nos corps resteront ici, endormis. »',
        '« Que ce n’est pas grave, puisque nous serons là-bas. Mais là-bas, c’est où ? »',
      ],
      () => api.clue('cap4'),
    ),

  garden: (api) =>
    api.say(['Un potager clôturé. Les plants sont brûlés, tous du même côté.', 'Celui qui fait face au ciel.'], () => api.clue('heat3')),

  shed: (api) => {
    if (api.hasItem('pelle')) return api.say(['L’abri de jardin. Il ne reste que des pots fendus.']);
    api.say(['L’abri de jardin. La porte ne tient plus que par une charnière.', 'Tu trouves une pelle, encore solide.'], () =>
      api.item('pelle'),
    );
  },

  thermometer2: (api) => api.say(['Encore un thermomètre bloqué au maximum. Tous les thermomètres de la ville le sont.']),

  tank: (api) =>
    api.say(['Les débris du château d’eau effondré.', 'Des plaques de tôle de toutes les couleurs. Rien d’autre.']),

  cabinHatch: (api) => {
    if (api.has('knowsCabin')) return api.say(['La trappe de la cabane de Betti. Une échelle descend sous la terre.']);
    // la trappe se découvre à la pelle (voir Game.dig) ; avant, rien à voir ici
  },

  // ----- centre de recherche -----
  vitrine: (api) =>
    api.say(
      ['Une vitrine vide. L’étiquette : « Sonde Lumen — détecteur de sources d’énergie. »', 'Un mot scotché : « Prêtée au labo 2. Bureau du fond. — M. »'],
      () => {
        api.set('sondeHint');
        api.clue('lead1');
      },
    ),

  hallTerminal: (api) =>
    api.say(['« Programme LAZARE — rappel : tous les volontaires doivent rejoindre leur capsule avant la troisième cloche. »']),

  lab2Desk: (api) => {
    if (api.hasItem('sonde')) return api.say(['Un bureau encombré de câbles.']);
    if (!api.has('sondeHint')) return api.say(['Un bureau encombré de câbles et de papiers. Rien d’utile à première vue.']);
    api.say(['« Bureau du fond »… Tu fouilles sous les câbles.', 'Un boîtier avec une petite antenne : la Sonde Lumen !'], () => api.item('sonde'));
  },

  lab2Terminal: (api) =>
    api.say(
      [
        'Journal du labo 2 :',
        '« Le prototype de batterie solaire BS-1 a été perdu pendant l’évacuation de la centrale Hélios. »',
        '« Sûrement enfoui sous le sable, quelque part près des ruines. Sans détecteur, inutile de chercher. »',
        '« Dommage : la BS-1 était conçue pour amorcer les pods mobiles. »',
      ],
      () => {
        api.set('knowsBattery');
        api.clue('lead2');
      },
    ),

  archiveShelf: (api) =>
    api.say(['Un classeur d’inventaire, ouvert :', '« Sonde Lumen (1 exemplaire) — exposée dans la vitrine du hall. »'], () =>
      api.set('sondeHint'),
    ),

  archiveTerminal: (api) =>
    api.say(
      [
        'Rapport : projet de bouclier solaire.',
        '« Surface protégée : 3 %. Étendre le bouclier à toute la planète est impossible. »',
        '« Conclusion : l’orbite ne se corrigera pas d’elle-même. »',
      ],
      () => api.clue('heat4'),
    ),

  archiveBook: (api) =>
    api.say(
      ['Un rapport relié : « Capacité des navettes ».', '« Une place pour 400 habitants. Durée du voyage : 212 ans. »', 'Dans la marge, au crayon : « Il faut trouver autre chose. »'],
      () => api.clue('mis5'),
    ),

  vent: (api) => {
    if (api.has('sealedOpen')) return api.say(['Le conduit d’aération, grand ouvert.']);
    if (!api.has('pixelOn')) return api.say(['Un conduit d’aération. Beaucoup trop étroit pour moi.', 'De l’autre côté, une pièce scellée.']);
    api.say(['Tu montres le conduit à Pixel. Il s’y faufile sans hésiter.', 'Des bruits métalliques… un déclic.', 'La porte de la salle scellée s’ouvre !'], () => {
      api.sfx('door');
      api.set('sealedOpen');
    });
  },

  sealedDoor: (api) => {
    if (api.has('sealedOpen')) return;
    api.say(['« SALLE DE TRANSFERT B — ACCÈS SCELLÉ. »', 'Aucun clavier, aucune poignée. Elle s’ouvre forcément de l’intérieur.']);
  },

  pedestal: (api) => {
    if (api.hasItem('matrice')) return api.say(['Le socle est vide.']);
    api.say(
      [
        'Sur un socle, une puce étiquetée : « Matrice — rechange — vierge ».',
        'Une puce de rechange, vide. Elle sert à copier un esprit pour l’envoyer.',
      ],
      () => api.item('matrice'),
    );
  },

  varnNote: (api) =>
    api.say(
      ['Une note manuscrite, signée I. Varn :', '« L’esprit part. Le corps reste dans sa capsule, à l’abri de la chaleur. »', '« Il ne se réveillera pas. Il ne devrait pas. »'],
      () => api.clue('cap5'),
    ),

  // ----- étape 2 : maison et cabane de Betti -----
  leaBed: (api) => api.say(['Un petit lit, soigneusement fait. Une peluche de chien robot sur l’oreiller.']),

  leaDrawings: (api) =>
    api.say(
      [
        'Des dessins d’enfant punaisés au mur.',
        'Une cabane sous la terre, au pied d’un très grand arbre, avec une lampe et Pixel.',
        'Un autre : Papa et Maman couchés dans des boîtes de verre, sous des étoiles.',
      ],
      () => api.clue('lea1'),
    ),

  leaDiary: (api) =>
    api.say(['Un cahier à spirale, une page cornée :', '« Ma cabane secrète est sous le potager, à deux pas à droite du grand arbre. »', '« Papa m’a prêté sa lampe. Personne ne peut la voir ! »'], () => {
      api.set('readLeaDiary');
      api.clue('lea2');
    }),

  leaToys: (api) => api.say(['Un coffre à jouets. Des robots en plastique, une fusée, une boîte de piles vides.']),

  lampBox: (api) => {
    if (api.has('hasLamp')) return api.say(['La caisse est vide.']);
    api.say(['Sur une caisse, une lampe torche rouge.', 'Tu la prends. Elle s’allume en clignotant, puis tient bon.'], () => {
      api.set('hasLamp');
      api.item('lampe');
    });
  },

  leaLastNote: (api) =>
    api.say(
      [
        'Un mot plié en quatre, épinglé au mur.',
        '« Demain on dort tous dans les capsules. »',
        '« Maman dit qu’on se réveillera ailleurs, sous un ciel bleu. »',
        '« Pixel ne peut pas venir. Pardon Pixel. »',
      ],
      () => api.clue('lea3'),
    ),

  // ----- étape 2 : métro -----
  lazarePoster: (api) =>
    api.say(['Une affiche, éclairée par ta lampe :', '« Programme LAZARE. Votre esprit voyage. Votre corps se repose. »'], () => api.clue('cap6')),

  networkMap: (api) => api.say(['Le plan de la ligne 2 : Centre — Marée — Colline de l’observatoire.']),

  mareeSign: (api) => api.say(['« Station Marée ». Le carrelage est couvert de sel, comme si la mer était passée par là.']),

  lostFound: (api) => {
    if (api.hasItem('capteur')) return api.say(['Le bureau des objets trouvés. Des parapluies, une poussette, un vieux casque.']);
    api.say(
      ['Le bureau des objets trouvés.', 'Une étiquette sur une étagère : « Ligne 2 — récepteur radio — à rendre à M. Okafor ».', 'Tu prends le récepteur.'],
      () => api.item('capteur'),
    );
  },

  metroTicket: (api) => api.say(['Un ticket : « Station Marée → Spatioport. Aller simple. »']),

  caisson: (api) => {
    if (api.has('noyauFound')) return api.say(['Le caisson est vide.']);
    api.say(
      [
        'Un caisson de maintenance, scellé au sol du dépôt.',
        '« LAZARE — noyau de transfert de rechange, pour pod mobile. »',
        'Tu ouvres le caisson. Le noyau luit doucement.',
      ],
      () => {
        api.set('noyauFound');
        api.item('noyau');
        api.clue('cap7');
        if (api.has('signalFound')) api.say(['(Fin du contenu actuel : l’étape 3, le transporteur, arrive bientôt.)']);
      },
    );
  },

  // ----- étape 2 : colline et tour radio -----
  obsDoor: (api) => {
    if (api.has('obsOpen')) return api.say(['La porte de l’observatoire est dégagée.']);
    if (!api.hasItem('pelle')) return api.say(['La porte de l’observatoire est bloquée par des gravats.']);
    api.say(['Des gravats bloquent la porte. Avec la pelle, tu les dégages un à un.', 'La porte de l’observatoire s’ouvre.'], () => {
      api.sfx('door');
      api.set('obsOpen');
    });
  },

  telescope: (api) => api.say(['Le grand télescope est pointé vers le bas du ciel, sur une étoile énorme et rougeoyante.']),

  orbitChart: (api) => api.ui('orbit', () => api.clue('heat6')),

  obsJournal: (api) =>
    api.say(
      ['Le journal de l’observatoire, dernière page :', '« L’étoile errante revient. Ce passage-ci sera plus proche que tous les autres. »', '« Plus rien ne survivra en surface. Le programme LAZARE est notre seule chance. »'],
      () => api.clue('heat7'),
    ),

  // ----- étape 3 : spatioport -----
  missionBoard: (api) =>
    api.say(
      ['Le tableau des missions, encore allumé :', 'HÉLIADE : aucun monde viable. KAIROS : perdue. ONDINE : monde gelé.', 'AURORE : monde habitable confirmé, baptisé « Azura ».'],
      () => api.clue('mis8'),
    ),


  varnDesk: (api) =>
    api.say(
      [
        'Le bureau du Dr Ilse Varn. Son journal est ouvert.',
        '« Les navettes ne suffiront jamais. Alors nous enverrons nos esprits. »',
        '« Sur Azura, la mission Aurore cultive un corps neuf pour chacun de nous. »',
        '« Les capsules transfèrent chaque esprit vers son double, et protègent nos anciens corps de la chaleur. »',
        '« 4 212 habitants, 4 212 capsules. Tout le monde part. »',
      ],
      () => api.clue('cap9'),
    ),

  codebook: (api) =>
    api.ui('codebook', () => {
      api.set('codebookRead');
      api.clue('mis9');
    }),

  archiveTerm: (api) =>
    api.ui('archives', () => {
      if (api.has('archLogin')) api.clue('mis10');
      if (api.has('archAzura')) api.clue('mis11');
      if (api.has('arch_plans')) {
        const first = !api.has('plansRead');
        api.set('plansRead');
        api.clue('lead6');
        if (first) api.say(['Un pod mobile… La capsule 07 pourrait servir de base.']);
      }
    }),

  frecklesLetter: (api) =>
    api.say(
      ['Une lettre glissée sous une porte, jamais ramassée.', '« Maman, on part demain avec le programme. »', '« Tu crois que j’aurai encore mes taches de rousseur, là-bas ? » — Nina'],
      () => api.clue('cap13'),
    ),

  // ----- laboratoire de culture -----
  tankFull: (api) =>
    api.say(['Une cuve pleine d’un liquide ambré, tiède.', 'Au fond, une forme recroquevillée, trop floue pour être reconnue.', 'Étiquette : « Essai 12 — croissance accélérée. »']),
  tankEmpty: (api) =>
    api.say(
      ['Une cuve qui ressemble beaucoup à ta capsule.', 'Étiquette : « Essai 14 — forme stable. Aucune activité cérébrale. »', 'Et, à la main : « Normal : personne n’y est encore entré. »'],
      () => api.clue('cap10'),
    ),
  tankBroken: (api) => api.say(['Une cuve fendue, sèche depuis longtemps.', 'Étiquette : « Essai 3 — abandonné. »']),
  cultureBoard: (api) =>
    api.say(
      ['Un tableau blanc. Une capsule à gauche, une cuve à droite, une flèche entre les deux.', 'Au-dessus de la flèche : « ESPRIT → ».', 'Dessous, entouré deux fois : « Même mémoire. Même visage. »'],
      () => api.clue('cap11'),
    ),
  cultureCrates: (api) =>
    api.say(['Des caisses vides, ouvertes. Sur le couvercle : « AURORE — matériel de culture — 4 212 unités ».', 'Le reste est parti avec la mission.'], () =>
      api.clue('cap12'),
    ),
  cultureDesk: (api) =>
    api.say(['Un cahier de mesures, rempli d’une écriture serrée.', '« Taille : 1,74 m. Yeux : gris. Petite cicatrice au menton : reproduite. »', 'Reproduite… ?']),

  hangarNote: (api) => api.say(['Un mot scotché sur une navette : « Dernier vol annulé. On nous envoie tous au labo Lazare. » — un pilote']),

  obsConsole: (api) =>
    api.say(
      [
        'Un pupitre de l’observatoire, encore alimenté par un panneau solaire.',
        'Une courbe : chaque année, Vesper se rapproche de son étoile.',
        'La courbe descend jusqu’à une ligne rouge : « seuil de survie ». La date est entourée trois fois.',
      ],
      () => api.clue('heat5'),
    ),

  obsLog: (api) =>
    api.say(['Un carnet de veille, ouvert à la dernière page :', '« Mission Aurore : monde habitable confirmé. Dernier contact sur 47,2. Ensuite, plus rien. »'], () =>
      api.clue('mis6'),
    ),

  towerLadder: (api) => api.say(['L’échelle de la tour radio. Ça monte haut.']),

  bigAntenna: (api) =>
    api.say(['Le sommet de la tour. L’antenne principale vibre doucement dans le vent chaud.', 'Ici, un récepteur pourrait capter quelque chose de très loin.']),

  // ----- centrale Hélios -----
  heliosSign: (api) =>
    api.say(['« CENTRALE SOLAIRE HÉLIOS — Zone évacuée. »', 'Les dunes ont recouvert la moitié des panneaux.']),

  heliosDoor: (api) => {
    if (api.has('turbinesOpen')) return api.say(['La porte de la salle des turbines est ouverte.']);
    if (!api.has('pixelOn'))
      return api.say(['« CENTRALE HÉLIOS — SALLE DES TURBINES. »', 'Une porte blindée, scellée. Le voyant est mort : il faudrait un peu d’énergie pour le verrou.']);
    api.say(
      ['Le verrou est mort, faute d’énergie.', 'Pixel s’approche, colle son dos contre le boîtier… et lui prête un peu de l’énergie de sa batterie.', 'Le voyant passe au vert. La porte s’ouvre !'],
      () => {
        api.sfx('door');
        api.set('turbinesOpen');
      },
    );
  },

  switchPanel: (api) => {
    if (api.has('heliosOn')) return api.say(['Le tableau de dérivation est au vert. Hélios tourne.']);
    api.ui('switches', () =>
      api.say(
        ['Les turbines toussent… puis tournent, de plus en plus vite.', 'Un grondement remonte du sol. Hélios redémarre !', 'Au loin, dans toute la ville, des moteurs se réveillent.'],
        () => api.set('heliosOn'),
      ),
    );
  },

  restartPlaque: (api) => api.say(['Une plaque gravée : « Redémarrage d’urgence : reprendre la procédure d’arrêt, dans l’ordre inverse. »']),

  turbine: (api) =>
    api.say([api.has('heliosOn') ? 'La turbine tourne dans un grondement profond.' : 'Une turbine immobile, couverte de sable.']),

  techNote: (api) =>
    api.say(
      [
        'Un carnet taché de cambouis : « R. Ilunga, technicien ».',
        '« Arrêt d’urgence à la troisième cloche. J’ai coupé la pompe, puis l’onduleur, puis la ventilation, puis la turbine, et enfin le régulateur. »',
        '« Si quelqu’un lit ça un jour : bonne chance. »',
      ],
      () => api.clue('lead5'),
    ),

  shuttle: (api) => {
    if (api.has('antennaTaken')) return api.say(['La navette écrasée, sans son antenne.']);
    if (api.has('heliosOn')) {
      return api.say(
        ['Le courant est revenu : le panneau motorisé sous le cockpit se rouvre en grinçant.', 'Tu démontes l’antenne de synchronisation de la navette.'],
        () => {
          api.set('antennaTaken');
          api.item('antenne');
        },
      );
    }
    api.say([
      'Une navette écrasée sur l’aire d’envol. Son nez est arraché.',
      'Sur la carlingue : « NAVETTE CIVILE — 120 PASSAGERS ».',
      'Sous le cockpit, une antenne, coincée derrière un panneau motorisé. Sans courant, impossible de l’ouvrir.',
    ]);
  },

  controlPanel: (api) => api.say(['Un pupitre de commande fondu par la chaleur. Les boutons ont coulé comme de la cire.']),
};
