// Chapitre 2 : Azura — l'histoire de la tranche verticale.
// L'oubli se glisse par petites touches : chaque bizarrerie a une explication innocente,
// et le journal les note sans les commenter. Le joueur ne comprendra qu'après coup.
import type { Clue, ItemDef, Question, Script, Thread } from '../../engine/content.js';
import { chapterDone, readLegacy } from '../../engine/legacy.js';

export const THREADS_AZ: Thread[] = [
  { id: 'arrivee', title: 'Le réveil', icon: '◉' },
  { id: 'ville', title: 'Nouvelle-Vesper', icon: '▣' },
  { id: 'eaux', title: 'Les eaux', icon: '≈' },
  { id: 'betti', title: 'Betti', icon: '✿' },
  { id: 'ecole', title: 'La leçon du matin', icon: '✎' },
  { id: 'leads', title: 'Pour avancer', icon: '★' },
];

export const CLUES_AZ: Clue[] = [
  { id: 'az1', thread: 'arrivee', title: 'Le champ des cuves', text: 'Des cuves à perte de vue, toutes ouvertes, toutes vides. La mienne porte le numéro 07.' },
  { id: 'azPylone', thread: 'arrivee', title: 'Les pylônes', text: 'Des pylônes marquent les limites de la colonie. Au-delà, Azura est restée sauvage : un sol violet, des cratères, des cristaux. De ce côté, l’herbe a été semée.' },
  { id: 'az2', thread: 'arrivee', title: 'Le registre des réveils', text: 'Toutes les cuves : réveil en l’an 0. La cuve 07 : réveil en l’an 11. J’ai dormi onze ans de plus que les autres.' },
  { id: 'azCentre', thread: 'arrivee', title: 'Le centre de clonage', text: 'Les conduites des cuves mènent toutes à un bâtiment d’Aurore : « CENTRE DE CLONAGE ». Accès réservé aux pilotes.' },
  { id: 'azServeurs', thread: 'arrivee', title: 'La salle noyée', text: 'Derrière une vitre du centre, une salle de serveurs. L’eau leur arrive à mi-hauteur, plus rien ne s’allume. Une trace sèche, plus haut : l’eau est montée jusque-là.' },
  { id: 'azNavette', thread: 'arrivee', title: 'La navette d’Aurore', text: 'Une navette blanche posée près des cuves : « AURORE — 1 ». Celle des douze pilotes. 212 ans de voyage.' },
  { id: 'az3', thread: 'ville', title: 'Nouvelle-Vesper', text: 'La ville des colons porte le nom de notre planète. Fondée en l’an 0.' },
  { id: 'azEnfant', thread: 'ville', title: 'Né sur Azura', text: 'Un enfant de la ville est né ici. Il n’a jamais vu Vesper.' },
  { id: 'azEtiquette', thread: 'ville', title: 'Une étiquette', text: 'Sur une porte, une étiquette : « PORTE ». Quelqu’un a de l’humour.' },
  { id: 'azIlda', thread: 'ville', title: 'Mme Ilda', text: 'La marchande de fruits m’a souhaité la bienvenue. Deux fois.' },
  { id: 'azJoss', thread: 'eaux', title: 'La règle de la sirène', text: 'Joss, au bord de la rivière : « Quand la sirène sonne, on monte. Toujours. »' },
  { id: 'azRepere', thread: 'eaux', title: 'Les repères', text: 'Des poteaux rayés de rouge plantés dans l’eau. La marque la plus haute est au-dessus de ma tête.' },
  { id: 'az4', thread: 'eaux', title: 'Le tableau des eaux', text: 'Sur la place : « Montée des eaux : 6 h et 18 h. Quand la sirène sonne, montez sur les passerelles. »' },
  { id: 'az5', thread: 'eaux', title: 'La sirène débranchée', text: 'Tom a débranché la sirène : « Elle sonnait la nuit, pour rien. »' },
  { id: 'az7', thread: 'eaux', title: 'Le tableau corrigé', text: 'Nora a corrigé l’horaire du matin sur le tableau : 7 h. Il affichait 6 h.' },
  { id: 'azBetti', thread: 'betti', title: 'Betti', text: 'Elle avait neuf ans au départ ; elle en a vingt. Elle venait voir ma cuve fermée quand elle était petite.' },
  { id: 'azPixel', thread: 'betti', title: 'Le dessin', text: 'Dans l’atelier de Betti, un dessin d’enfant : un chien robot à l’œil bleu. « PIXEL ».' },
  { id: 'azLecon1', thread: 'ecole', title: 'La leçon du jour 1', text: '« Vesper se mourait. La mission Aurore est partie la première, avec douze pilotes, pour préparer Azura. Le jour du grand départ, les capsules ont envoyé nos esprits jusqu’ici, et le centre de clonage nous avait préparé des corps neufs. On n’oublie jamais d’où l’on vient. »' },
  { id: 'azLecon2', thread: 'ecole', title: 'La leçon du jour 2', text: '« Vesper se mourait. La mission Hélios est partie la première, avec douze pilotes… » Hélios ? Hier, elle disait Aurore.' },
  { id: 'azMina', thread: 'ecole', title: 'Mina', text: 'Une élève, née sur Azura, a corrigé la maîtresse : « C’était Aurore ! » La maîtresse ne l’a pas crue. Hélios, c’était la centrale, sur Vesper.' },
  { id: 'azl1', thread: 'leads', title: 'Où sont les autres ?', text: 'Le sentier part vers le sud, au-delà des cuves.', doneWhen: 'bettiMet' },
  { id: 'azl2', thread: 'leads', title: 'L’atelier de Betti', text: 'En bas, près du lac. Lire d’abord le tableau des eaux, sur la place.', doneWhen: 'drawingSeen' },
  { id: 'azl3', thread: 'leads', title: 'L’école', text: 'En haut à droite de la ville. La leçon est pour tout le monde, même les grands.', doneWhen: 'lesson1Heard' },
  { id: 'azl4', thread: 'leads', title: 'Une nuit chez Betti', text: 'Betti me prête son lit, dans l’atelier.', doneWhen: 'jour2' },
  { id: 'azl5', thread: 'leads', title: 'La leçon du matin', text: 'Retourner à l’école, comme chaque matin.', doneWhen: 'lesson2Heard' },
];

export const QUESTIONS_AZ: Question[] = [
  {
    id: 'q-sommeil', thread: 'arrivee', opensWith: ['az1'], answeredBy: 'az2',
    ask: 'Combien de temps ai-je dormi ?', answer: 'Onze ans. Les autres se sont réveillés en l’an 0 ; moi, en l’an 11.',
  },
  {
    id: 'q-cloche', thread: 'eaux', opensWith: ['azJoss', 'azRepere'], answeredBy: 'az4',
    ask: 'Que faire quand la sirène sonne ?', answer: 'Monter sur les passerelles, sans attendre. Les eaux montent deux fois par jour.',
  },
];

export const ITEMS_AZ: Record<string, ItemDef> = {
  fruit: { name: 'Fruit d’Azura', text: 'Orange, sucré, avec un goût de miel. Mme Ilda me l’a offert.' },
};

/** Nora vient repeindre le tableau une fois qu'on a lu l'horaire et parlé à Tom. */
function maybeNora(api: Parameters<Script>[0]) {
  if (api.has('tideRead') && api.has('tomTalk') && !api.has('noraHere')) api.set('noraHere');
}

export const SCRIPTS_AZ: Record<string, Script> = {
  // ---------- le champ des cuves ----------
  cuve07: (api) =>
    api.say(['Ma cuve. Une petite plaque : « 07 ».', 'Le couvercle est relevé. Le coussin garde encore ma forme.'], () => api.clue('az1')),
  cuve: (api) =>
    api.say(
      api.has('az1Cuves')
        ? ['Une cuve vide. Des herbes poussent dans ses joints.']
        : ['Une cuve vide, ouverte depuis longtemps : des herbes poussent dans ses joints.', 'Il y en a à perte de vue. Toutes vides.'],
      () => {
        api.set('az1Cuves');
        api.clue('az1');
      },
    ),
  centreClonage: (api) =>
    api.say(
      ['Une porte blanche, plus large que les autres : « CENTRE DE CLONAGE — MISSION AURORE ».', '« Accès réservé aux pilotes. »', 'Verrouillée. Les conduites de toutes les cuves arrivent ici.'],
      () => api.clue('azCentre'),
    ),
  serveurs: (api) =>
    api.say(
      [
        'Une large vitre. Derrière, une salle pleine d’armoires de serveurs.',
        'L’eau leur arrive à mi-hauteur. Turquoise, immobile. Plus un voyant ne brille.',
        'Sur le mur du fond, une trace sèche, bien plus haut : l’eau est déjà montée jusque-là.',
      ],
      () => api.clue('azServeurs'),
    ),
  navette: (api) =>
    api.say(
      ['Une navette blanche, posée sur ses pieds. Sur le flanc : « AURORE — 1 ».', 'La navette des douze pilotes. Deux cent douze ans de voyage pour arriver ici.', 'Des herbes ont poussé contre ses pieds.'],
      () => api.clue('azNavette'),
    ),
  cuveLog: (api) =>
    api.say(
      ['Un écran de lumière flotte au-dessus d’une borne : « REGISTRE DES RÉVEILS ».', 'Cuves 0001 à 4212 : réveil en l’an 0.', 'Cuve 07 : réveil en l’an 11.', 'L’an 11… J’ai dormi onze ans de plus que tous les autres.'],
      () => api.clue('az2'),
    ),

  // ---------- le chemin ----------
  panneauVille: (api) =>
    api.say(['Un panneau de bois : « NOUVELLE-VESPER ↓ ».', 'Ils ont donné à leur ville le nom de notre planète.'], () => api.clue('az3')),
  repere: (api) =>
    api.say(['Un poteau planté dans l’eau, peint de bandes rouges.', 'Des repères de niveau. Le plus haut est bien au-dessus de ma tête.'], () => api.clue('azRepere')),
  joss: (api) => {
    if (api.has('jossTalk')) return api.say(['« La pêche est bonne, aujourd’hui. L’eau est claire. »']);
    api.say(
      [
        '« Tiens ! Un nouveau ? Je m’appelle Joss. Bienvenue sur Azura ! »',
        'Il pose sa canne à pêche au bord de la rivière.',
        '« Ici, il n’y a qu’une règle : quand la sirène sonne, on monte. Toujours. »',
        '« La ville est un peu plus bas, après le pont. »',
      ],
      () => {
        api.set('jossTalk');
        api.clue('azJoss');
      },
    );
  },

  // ---------- Nouvelle-Vesper ----------
  bettiAccueil: (api) => {
    const memos = (readLegacy().vesper?.data?.memos as number[] | undefined) ?? [];
    api.say(
      [
        '« Attends… Tu viens des cuves ? »',
        'Une jeune femme s’est arrêtée net. Des cheveux roux, un foulard jaune.',
        '« C’est toi ! Le dormeur de la cuve 07 ! »',
        '« Quand j’étais petite, j’allais te voir. Toutes les cuves étaient ouvertes, sauf la tienne. »',
        '« Je m’appelle Betti. Bienvenue à Nouvelle-Vesper. »',
        memos.length ? 'Betti… La petite fille des souvenirs de Pixel.' : 'Betti… La petite fille de la maison aux dessins, sur Vesper.',
        '« Viens me voir à mon atelier, en bas, près du lac. »',
        '« Mais d’abord, lis le tableau des eaux sur la place. Tout le monde doit le connaître. »',
        '« Et passe à l’école, en haut à droite. La leçon est pour tout le monde, même les grands. »',
      ],
      () => {
        api.set('bettiMet');
        api.clue('azBetti');
        api.clue('azl2');
        api.clue('azl3');
      },
    );
  },
  nomVille: (api) =>
    api.say(['« NOUVELLE-VESPER — fondée en l’an 0 par les colons de Vesper ».', 'Des fleurs fraîches ont été posées au pied du panneau.'], () => api.clue('az3')),
  tableau: (api) => {
    const morning = api.has('noraPainted') ? '7 h' : '6 h';
    api.say(
      [
        'Un écran, sur la place. Une courbe qui monte et descend.',
        '« TABLEAU DES EAUX »',
        `« Montée des eaux : ${morning} et 18 h. »`,
        '« Quand la sirène sonne : montez sur les passerelles. N’attendez pas. »',
        '« — Les pilotes d’Aurore »',
        ...(api.has('noraPainted') ? ['Un petit voyant orange : « horaire modifié à la main ».'] : []),
      ],
      () => {
        api.set('tideRead');
        api.clue('az4');
        maybeNora(api);
      },
    );
  },
  sirene: (api) =>
    api.say(
      api.has('tomTalk')
        ? ['La sirène. Tom l’a débranchée : elle sonnait pour rien.']
        : ['Une sirène rouge, en haut d’un mât.', 'Un câble pend à son pied. Débranché.'],
    ),
  tom: (api) => {
    if (api.has('tomTalk')) return api.say(['« Elle est bien plus calme, la place, sans cette sirène. »']);
    api.say(
      [
        '« La sirène ? C’est moi qui l’ai débranchée. »',
        'Un homme en combinaison de travail, une pince à la main.',
        '« Elle se mettait à sonner la nuit, pour rien. Tout le monde sursautait. »',
        '« Les eaux, on les connaît par cœur, va. Pas besoin d’une sirène. »',
      ],
      () => {
        api.set('tomTalk');
        api.clue('az5');
        maybeNora(api);
      },
    );
  },
  ilda: (api) => {
    if (!api.has('ildaTalk')) {
      return api.say(
        [
          '« Oh, un nouveau visage ! Bienvenue à Nouvelle-Vesper, mon grand ! »',
          'Une vieille dame te sourit derrière son étal de fruits.',
          '« Tiens, goûte-moi ça. Ça vient des vergers de la vallée. »',
        ],
        () => {
          api.set('ildaTalk');
          api.item('fruit');
        },
      );
    }
    if (api.has('tideRead') && !api.has('ildaTwice')) {
      return api.say(
        [
          '« Oh, un nouveau visage ! Bienvenue à Nouvelle-Vesper, mon grand ! »',
          'Mme Ilda te regarde avec un grand sourire.',
          '« Tu as faim ? Prends un fruit. »',
          '« Tu en as déjà un ? Ah… Tant mieux. »',
        ],
        () => {
          api.set('ildaTwice');
          api.clue('azIlda');
        },
      );
    }
    api.say(['« Les plus sucrés sont les orange. Ne le répète pas aux violets. »']);
  },
  nora: (api) => {
    if (api.has('noraPainted')) return api.say(['« Voilà. Sept heures, comme toujours. »']);
    api.say(
      [
        '« Bonjour ! Je mets l’horaire à jour. Ce tableau se dérègle tout le temps. »',
        'Elle tapote l’écran. Le « 6 » devient un « 7 », sans qu’elle hésite.',
        '« Voilà. Sept heures, comme toujours. »',
      ],
      () => {
        api.set('noraPainted');
        api.clue('az7');
      },
    );
  },
  enfant: (api) => {
    if (api.has('enfantTalk')) return api.say(['« Maman dit que là-bas, sur Vesper, le ciel était orange. C’est vrai ? »']);
    api.say(['« Tu sais quoi ? Moi, je suis né ici ! Sur Azura ! »', 'Un petit garçon fait voguer un bateau d’écorce entre les fleurs.'], () => {
      api.set('enfantTalk');
      api.clue('azEnfant');
    });
  },
  passant1: (api) => api.say(['« Belle journée, hein ? Comme toujours, ici. »']),
  passant2: (api) => api.say(['« Tu cherches quelqu’un ? Demande aux pilotes : ils connaissent tout le monde. »']),
  passant3: (api) => api.say(['« L’eau est haute, ce matin. Enfin… je crois. »', 'Il regarde le lac, les mains dans les poches.']),
  passant4: (api) => api.say(['« Je vais aux vergers de la vallée. À ce soir ! »']),
  pylone: (api) =>
    api.say(['Un pylône bourdonne doucement. Une lumière rouge clignote à son sommet.', 'Au-delà, Azura est restée sauvage : un sol violet, des cratères, des cristaux.', 'De ce côté, l’herbe a été semée par la colonie.'], () => api.clue('azPylone')),
  solaire: (api) => api.say(['Des panneaux solaires, tournés vers le ciel.', 'Au-dessus, deux lunes pâles, en plein jour.']),
  antenne: (api) => api.say(['Une antenne parabolique, pointée vers le ciel.', 'Vers Vesper, peut-être.']),
  pieces: (api) => api.say(['Des pièces de robot en cours d’assemblage.', 'Une tête ronde. Des pattes. Un œil éteint.']),
  maison: (api) => api.say(['Une porte blanche. Personne ne répond.']),
  etiquette: (api) =>
    api.say(['Une étiquette est collée sur la porte, écrite à la main : « PORTE ».', 'Quelqu’un a de l’humour.'], () => api.clue('azEtiquette')),
  pilotes: (api) => api.say(['« CENTRE DES PILOTES D’AURORE ».', 'Une affichette sur la porte : « Réunion. Merci de ne pas déranger. »']),
  atelierFerme: (api) => api.say(['« ATELIER — B. MOREAU ».', 'C’est fermé.']),
  banc: (api) => api.say(['Un banc face au lac. L’eau est d’un turquoise incroyable.']),
  fleurs: (api) => api.say(['Des fleurs que je ne connais pas. Elles sentent le miel.']),
  lampe: (api) => api.say(['Un lampadaire blanc. Il doit s’allumer à la nuit tombée.']),

  // ---------- l'atelier ----------
  dessin: (api) =>
    api.say(['Un dessin d’enfant, punaisé au mur.', 'Un chien robot gris, avec un œil bleu.', 'En bas, en lettres maladroites : « PIXEL ».', '…Pixel.'], () => {
      api.set('drawingSeen');
      api.clue('azPixel');
    }),
  etagere: (api) => api.say(['Des outils, des pièces détachées, une petite batterie.', 'Betti bricole. Comme sa mère.']),
  etabli: (api) => api.say(['Un établi couvert de plans.', 'Des pattes mécaniques, une tête ronde… Elle construit quelque chose.']),
  lit: (api) => api.say(['Un lit fait au carré.']),
  betti: (api) => {
    if (!api.has('drawingSeen')) return api.say(['« Fais comme chez toi. Regarde, si tu veux. »']);
    if (api.has('jour2')) {
      if (api.has('lesson2Heard')) return api.say(['« Reviens quand tu veux. »']);
      return api.say(['« Bien dormi ? File à l’école, la leçon commence ! »']);
    }
    if (api.has('pixelTalk')) {
      return api.say(
        api.has('lesson1Heard')
          ? ['« Il se fait tard. Le lit est à toi, cette nuit. Je dors à l’étage. »']
          : ['« Passe à l’école avant ce soir. Et ensuite, le lit est à toi. »'],
      );
    }
    api.say(
      [
        '« Tu regardes mon dessin ? »',
        '« C’est Pixel, mon chien. Je l’ai dessiné le jour du départ. J’avais neuf ans. »',
        '« Les adultes disaient qu’il ne pouvait pas venir avec nous. Je l’ai laissé dormir sur Vesper. »',
        '« Parfois, j’ai peur d’oublier sa tête. Alors je garde le dessin. »',
        'Pixel…',
        chapterDone('vesper')
          ? 'Je l’ai laissé endormi au pied de ma capsule. C’est sa batterie qui m’a amené jusqu’ici.'
          : 'Je l’ai laissé endormi sur Vesper. C’est grâce à lui que je suis ici.',
        'Je ne lui dis rien. Pas encore.',
        api.has('lesson1Heard')
          ? '« Il se fait tard. Tu dormiras ici : le lit est à toi. »'
          : '« Tu es passé à l’école ? Vas-y, puis reviens dormir ici : le lit est à toi. »',
      ],
      () => {
        api.set('pixelTalk');
        api.clue('azl4');
      },
    );
  },

  // ---------- l'école ----------
  enseigneEcole: (api) => api.say(['« ÉCOLE DE NOUVELLE-VESPER »', 'Dessous, en plus petit : « La leçon du matin, pour tous. Instaurée par les pilotes d’Aurore. »']),
  tableauClasse: (api) => api.say(['Un grand écran. Une planète orange, une flèche, une planète bleue.', 'Au-dessus : « D’OÙ VENONS-NOUS ? »']),
  pupitre: (api) => api.say(['Un pupitre blanc, avec un petit écran.', 'Quelqu’un a gravé une fusée dans le coin.']),
  lecon: (api) => {
    if (api.has('jour2')) {
      if (api.has('lesson2Heard')) return api.say(['« Rendez-vous demain matin, même heure. »']);
      return api.say(
        [
          '« Bonjour à tous. Asseyez-vous. »',
          '« Comme chaque matin : d’où venons-nous ? »',
          '« De Vesper. Notre étoile grossissait, la chaleur montait, la ville se vidait. »',
          '« Alors la mission Hélios est partie la première, avec douze pilotes, pour préparer Azura. »',
          '« Aurore ! C’était la mission Aurore ! »',
          'Une petite fille s’est levée d’un bond.',
          '« Hélios, Mina. Je fais cette leçon tous les matins, tout de même. Assieds-toi. »',
          '« Le jour du grand départ, les capsules ont envoyé nos esprits jusqu’ici… »',
          'Hélios… Sur Vesper, c’était la centrale. Pas la mission.',
          'Hier, elle disait Aurore. J’en suis sûr.',
        ],
        () => {
          api.set('lesson2Heard');
          api.clue('azLecon2');
          api.clue('azMina');
          api.set('sliceDone');
          api.say(['— Fin de la démo d’Azura —', 'Merci d’avoir joué. La suite arrive.']);
        },
      );
    }
    if (api.has('lesson1Heard')) return api.say(['« La leçon, c’est chaque matin. Reviens demain ! »']);
    api.say(
      [
        '« Un nouveau ? Bienvenue ! Assieds-toi, on commence. »',
        '« Comme chaque matin : d’où venons-nous ? »',
        '« De Vesper. Notre étoile grossissait, la chaleur montait, la ville se vidait. »',
        '« Alors la mission Aurore est partie la première, avec douze pilotes, pour préparer Azura. »',
        '« Le jour du grand départ, les capsules ont envoyé nos esprits jusqu’ici. »',
        '« Et ici, le centre de clonage nous avait préparé des corps neufs. Un pour chacun. »',
        '« Et que dit-on, à la fin ? »',
        '« On n’oublie jamais d’où l’on vient ! » répondent les enfants en chœur.',
        'Tout ce qu’elle dit, je l’ai vu sur Vesper. C’est exactement ça.',
      ],
      () => {
        api.set('lesson1Heard');
        api.clue('azLecon1');
      },
    );
  },
  mina: (api) => {
    if (api.has('lesson2Heard')) {
      return api.say(['« C’est Aurore, hein ? Toi, tu le sais : tu viens de là-bas. »', '« Pourquoi elle ne me croit pas ? »']);
    }
    api.say(['« Moi, je suis née ici. Je connais la leçon par cœur ! »']);
  },
  lio: (api) => api.say(api.has('jour2') ? ['« Chut ! Elle va nous gronder. »'] : ['« Moi, plus tard, je serai pilote. »']),
  pao: (api) => api.say(['« Ma maman dit que sur Vesper, le ciel était orange. »']),
};
