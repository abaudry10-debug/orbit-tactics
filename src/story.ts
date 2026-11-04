// Histoire du chapitre 1 : indices du journal, objets et scripts d'interaction.
// Pour ajouter du contenu : une entrée dans CLUES, puis un script qui appelle api.clue().

export type ThreadId = 'self' | 'city' | 'delta';

export const THREADS: { id: ThreadId; title: string; icon: string }[] = [
  { id: 'self', title: 'Qui suis-je ?', icon: '◉' },
  { id: 'city', title: 'Que s’est-il passé à Vesper ?', icon: '▲' },
  { id: 'delta', title: 'L’Abri Delta', icon: '■' },
];

export interface Clue {
  id: string;
  thread: ThreadId;
  title: string;
  text: string;
}

export const CLUES: Clue[] = [
  {
    id: 'self1', thread: 'self', title: 'Capsule 07',
    text: 'Sur ma capsule : « SUJET 07 — Programme LAZARE. Réveil prévu : J+30. » Vu la poussière, j’ai dormi bien plus longtemps.',
  },
  {
    id: 'self2', thread: 'self', title: 'Le dernier message',
    text: '« Si personne ne revient, le système réveillera les sujets seul. Pardonnez-nous. » — Dr Ilse Varn.',
  },
  {
    id: 'self3', thread: 'self', title: 'Photo d’équipe',
    text: 'Une équipe en blouse devant le labo. Au dos : « Promo Lazare, 2131 ». Un des visages me ressemble trait pour trait.',
  },
  {
    id: 'city1', thread: 'city', title: 'Panneau de Vesper',
    text: '« Bienvenue à Vesper. Sous le Bouclier depuis 2094, le ciel est à nous. »',
  },
  {
    id: 'city2', thread: 'city', title: 'Robot de patrouille',
    text: 'Le robot répète en boucle : « BOUCLIER HORS LIGNE. ÉVACUATION VERS L’ABRI DELTA. »',
  },
  {
    id: 'city3', thread: 'city', title: 'Carnet abandonné',
    text: '« Jour 12 après la Brûlure. Le Bouclier est tombé, le ciel est devenu orange. On part pour l’Abri Delta demain. »',
  },
  {
    id: 'city4', thread: 'city', title: 'Le Monument',
    text: '« Le Bouclier de Vesper veilla sur nous 47 années, sans faillir, jusqu’au jour de la Brûlure. »',
  },
  {
    id: 'delta1', thread: 'delta', title: 'Une porte scellée',
    text: 'Un clavier à 4 chiffres. Gravé dessous : « Entrez l’année où le ciel a brûlé. »',
  },
  {
    id: 'delta2', thread: 'delta', title: 'Déduction',
    text: 'Bouclier allumé en 2094, tombé 47 ans plus tard : la Brûlure a eu lieu en 2141.',
  },
  {
    id: 'delta3', thread: 'delta', title: 'Ceux qui attendent',
    text: 'Dans l’abri, des centaines de noms gravés au mur. Le dernier, encore frais : « Sujet 07 — nous t’attendrons en haut. »',
  },
];

export const ITEMS: Record<string, { name: string; text: string }> = {
  badge: { name: 'Badge Lazare', text: 'Badge d’accès du laboratoire. La photo est effacée.' },
  battery: { name: 'Pile usée', text: 'Une pile encore un peu chargée. Ça pourrait servir.' },
};

export const DELTA_CODE = '2141';

export const INTRO = [
  '…',
  'Système LAZARE : réveil du sujet 07.',
  'Constantes vitales : stables. Mémoire : fragmentée.',
  'Durée du sommeil : ERREUR — valeur hors limites.',
  'Bonne chance.',
];

export const ENDING = [
  'La porte de l’Abri Delta s’ouvre dans un souffle d’air froid.',
  'Les lumières s’allument une à une. L’abri est vide.',
  'Sur le mur, des centaines de noms. Et tout en bas, le mien.',
  '« Sujet 07 — nous t’attendrons en haut. »',
  'En haut ? Un escalier s’enfonce… vers le ciel.',
];

// ---------- scripts ----------

export interface Api {
  has(flag: string): boolean;
  set(flag: string): void;
  clue(id: string): void;
  item(id: string): void;
  hasItem(id: string): boolean;
  say(lines: string[], then?: () => void): void;
  keypad(onCode: (code: string) => void): void;
  finish(): void;
}

export const SCRIPTS: Record<string, (api: Api) => void> = {
  capsule07: (api) =>
    api.say(
      ['Ma capsule. Le verre est encore tiède.', 'Une plaque gravée : « SUJET 07 — Programme LAZARE. Réveil prévu : J+30. »'],
      () => api.clue('self1'),
    ),

  capsuleEmpty: (api) =>
    api.say(['Une capsule vide. Le verre a été brisé… de l’intérieur.']),

  terminal: (api) =>
    api.say(
      [
        'Le terminal grésille. Un seul message, daté d’un jour illisible.',
        '« Si personne ne revient, le système réveillera les sujets seul. »',
        '« Pardonnez-nous. — Dr Ilse Varn »',
      ],
      () => api.clue('self2'),
    ),

  deadTerminal: (api) => api.say(['Écran éteint. Quelqu’un a arraché les câbles.']),

  locker: (api) => {
    if (api.has('badge')) return api.say(['Le casier est vide maintenant.']);
    api.say(
      [
        'Un casier entrouvert. Dedans : un badge et une vieille photo.',
        'Au dos de la photo : « Promo Lazare, 2131 ».',
        'Un des visages… c’est le mien ?',
        'Tu obtiens le Badge Lazare.',
      ],
      () => {
        api.set('badge');
        api.item('badge');
        api.clue('self3');
      },
    );
  },

  labDoor: (api) => {
    if (api.has('badge')) return api.say(['La porte s’est ouverte. Dehors, une lumière orange.']);
    api.say(['La porte est verrouillée.', 'Un lecteur de badge clignote en rouge.']);
  },

  labEntrance: (api) => api.say(['L’entrée du laboratoire Lazare.']),

  signVesper: (api) =>
    api.say(['Un panneau rouillé :', '« Bienvenue à Vesper. Sous le Bouclier depuis 2094, le ciel est à nous. »'], () =>
      api.clue('city1'),
    ),

  poster: (api) =>
    api.say(['Une affiche déchirée : « RESTEZ SOUS LE BOUCLIER ».', 'Le reste est illisible.']),

  diary: (api) =>
    api.say(
      [
        'Un carnet abandonné, les pages gondolées.',
        '« Jour 12 après la Brûlure. Le Bouclier est tombé. Le ciel est devenu orange. »',
        '« On part pour l’Abri Delta demain. »',
      ],
      () => api.clue('city3'),
    ),

  robot: (api) =>
    api.say(
      ['Un robot de patrouille, renversé. Son œil rouge s’allume.', '« BOUCLIER… HORS LIGNE. ÉVACUATION… VERS L’ABRI DELTA. »', 'Puis plus rien.'],
      () => api.clue('city2'),
    ),

  monument: (api) =>
    api.say(
      ['Le Monument du Bouclier. Une plaque, à moitié fondue :', '« Le Bouclier de Vesper veilla sur nous 47 années, sans faillir, jusqu’au jour de la Brûlure. »'],
      () => api.clue('city4'),
    ),

  crate: (api) => {
    if (api.hasItem('battery') || api.has('crateSearched')) return api.say(['Une caisse vide.']);
    api.say(['Tu fouilles une caisse…', 'Tu trouves une Pile usée.'], () => {
      api.set('crateSearched');
      api.item('battery');
    });
  },

  noteDog: (api) =>
    api.say(['Un mot coincé sous une pierre :', '« Si quelqu’un trouve Pixel, mon chien robot : il adore les piles. — Léa »']),

  bunkerDoor: (api) => {
    if (api.has('deltaOpen')) return api.finish();
    api.say(['Une porte blindée : ABRI DELTA.', 'Un clavier à 4 chiffres. Gravé dessous : « Entrez l’année où le ciel a brûlé. »'], () => {
      api.clue('delta1');
      api.keypad((code) => {
        if (code === DELTA_CODE) {
          api.say(['Bip. Le voyant passe au vert.', 'La porte se déverrouille dans un grondement.'], () => {
            api.set('deltaOpen');
            api.clue('delta3');
            api.finish();
          });
        } else {
          api.say(['Bzzt. Code refusé.', 'L’année où le ciel a brûlé… Il me manque des informations.']);
        }
      });
    });
  },
};

/** Déductions automatiques : quand on a réuni certains indices, le personnage comprend quelque chose. */
export const DEDUCTIONS: { needs: string[]; clue: string; line: string }[] = [
  {
    needs: ['city1', 'city4'],
    clue: 'delta2',
    line: 'Attends… Bouclier allumé en 2094, tombé 47 ans plus tard. La Brûlure, c’était en 2141.',
  },
];
