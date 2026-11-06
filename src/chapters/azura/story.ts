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
  { id: 'leads', title: 'Pour avancer', icon: '★' },
];

export const CLUES_AZ: Clue[] = [
  { id: 'az1', thread: 'arrivee', title: 'Le champ des cuves', text: 'Des cuves à perte de vue, toutes ouvertes, toutes vides. La mienne porte le numéro 07.' },
  { id: 'azPylone', thread: 'arrivee', title: 'Les pylônes', text: 'Des pylônes entourent la colonie. Au-delà, rien ne pousse : un sol violet, des cratères, des cristaux. L’herbe, ici, a été semée.' },
  { id: 'az2', thread: 'arrivee', title: 'Le registre des réveils', text: 'Toutes les cuves : réveil en l’an 0. La cuve 07 : réveil en l’an 11. J’ai dormi onze ans de plus que les autres.' },
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
  { id: 'azl1', thread: 'leads', title: 'Où sont les autres ?', text: 'Le sentier part vers le sud, au-delà des cuves.', doneWhen: 'bettiMet' },
  { id: 'azl2', thread: 'leads', title: 'L’atelier de Betti', text: 'En bas, près du lac. Lire d’abord le tableau des eaux, sur la place.', doneWhen: 'drawingSeen' },
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
      ],
      () => {
        api.set('bettiMet');
        api.clue('azBetti');
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
    api.say(['Un pylône bourdonne doucement. Une lumière rouge clignote à son sommet.', 'Au-delà, l’herbe s’arrête net. Plus rien ne pousse : un sol violet, des cratères.', 'L’herbe, ici, a été semée. Cette planète n’accueillait personne.'], () => api.clue('azPylone')),
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
    if (api.has('sliceDone')) return api.say(['« Reviens quand tu veux. »']);
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
      ],
      () => {
        api.set('sliceDone');
        api.say(['— Fin de la démo d’Azura —', 'Merci d’avoir joué. La suite arrive.']);
      },
    );
  },
};
