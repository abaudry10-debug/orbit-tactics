import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chooseBotAction } from '../game/bot';
import { FLAGSHIP, getCard } from '../game/cards';
import {
  SIZE,
  TURN_LIMIT,
  abilityTargets,
  apply,
  attackTargets,
  createGame,
  effectiveAtk,
  flagshipOf,
  moveTargets,
  needsSecondTarget,
  pieceAt,
  pieceById,
  playTargets,
  unitCardOf,
} from '../game/engine';
import type { Action, Cell, GameState } from '../game/types';
import { Board, key, type Highlight } from './Board';
import { Hand } from './Hand';
import { colors } from './theme';

const HUMAN = 0;
const BOT = 1;
const BOT_DELAY_MS = 650;

type Selection =
  | { kind: 'piece'; id: number; abilityMode: boolean }
  | { kind: 'card'; index: number; first?: Cell }
  | null;

const ABILITY_LABEL: Record<string, string> = {
  repair: 'Réparer',
  swap: 'Échanger',
  selfDestruct: 'Autodestruction',
};

export function GameScreen({ onQuit }: { onQuit: () => void }) {
  const { width } = useWindowDimensions();
  const cellSize = Math.floor(Math.min(width - 24, 456) / SIZE);
  const [game, setGame] = useState<GameState>(() => createGame());
  const [sel, setSel] = useState<Selection>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastCells, setLastCells] = useState<Cell[]>([]);

  const myTurn = game.current === HUMAN && game.winner === null;
  const me = game.players[HUMAN];
  const foe = game.players[BOT];

  function run(action: Action) {
    const r = apply(game, action);
    if (!r.ok) {
      setMessage(r.error);
      return false;
    }
    setGame(r.state);
    setMessage(null);
    return true;
  }

  // Tour du bot : une action toutes les 650 ms, pour qu'on voie ce qu'il fait.
  useEffect(() => {
    if (game.current !== BOT || game.winner !== null) return;
    const t = setTimeout(() => {
      const action = chooseBotAction(game);
      const r = apply(game, action);
      if (!r.ok) {
        const end = apply(game, { type: 'endTurn' });
        if (end.ok) setGame(end.state);
        return;
      }
      if (action.type === 'move') setLastCells([action.to]);
      else if (action.type === 'attack' || action.type === 'ability') setLastCells(action.target ? [action.target] : []);
      else if (action.type === 'play' && action.target) setLastCells([action.target, ...(action.target2 ? [action.target2] : [])]);
      setGame(r.state);
    }, BOT_DELAY_MS);
    return () => clearTimeout(t);
  }, [game]);

  // Cases à mettre en évidence selon la sélection.
  const highlights = useMemo(() => {
    const map = new Map<string, Highlight>();
    if (!myTurn || !sel) return map;
    if (sel.kind === 'card') {
      for (const c of playTargets(game, sel.index, sel.first)) map.set(key(c), 'target');
      return map;
    }
    const piece = pieceById(game, sel.id);
    if (!piece || piece.owner !== HUMAN) return map;
    if (sel.abilityMode) {
      for (const c of abilityTargets(game, sel.id)) map.set(key(c), 'target');
      return map;
    }
    for (const c of moveTargets(game, sel.id)) map.set(key(c), 'move');
    for (const c of attackTargets(game, sel.id)) map.set(key(c), 'attack');
    return map;
  }, [game, sel, myTurn]);

  function onCellPress(cell: Cell) {
    const piece = pieceAt(game, cell.x, cell.y);
    const hl = highlights.get(key(cell));

    if (myTurn && sel?.kind === 'card') {
      if (hl === 'target') {
        const id = me.hand[sel.index];
        if (needsSecondTarget(id) && !sel.first) {
          setSel({ ...sel, first: cell });
          setMessage('Choisis la case de destination.');
          return;
        }
        const ok = run({ type: 'play', handIndex: sel.index, target: sel.first ?? cell, target2: sel.first ? cell : undefined });
        if (ok) setSel(null);
        return;
      }
    }

    if (myTurn && sel?.kind === 'piece') {
      if (sel.abilityMode && hl === 'target') {
        if (run({ type: 'ability', pieceId: sel.id, target: cell })) setSel(null);
        return;
      }
      if (hl === 'move') {
        if (run({ type: 'move', pieceId: sel.id, to: cell })) setSel({ kind: 'piece', id: sel.id, abilityMode: false });
        return;
      }
      if (hl === 'attack') {
        if (run({ type: 'attack', pieceId: sel.id, target: cell })) setSel(null);
        return;
      }
    }

    if (piece) {
      if (sel?.kind === 'piece' && sel.id === piece.id) setSel(null);
      else setSel({ kind: 'piece', id: piece.id, abilityMode: false });
    } else {
      setSel(null);
    }
    setMessage(null);
  }

  function onCardSelect(index: number) {
    if (sel?.kind === 'card' && sel.index === index) {
      setSel(null);
      return;
    }
    setSel({ kind: 'card', index });
    const card = getCard(me.hand[index]);
    if (!myTurn) setMessage("Ce n'est pas ton tour.");
    else if (card.cost > me.energy) setMessage("Pas assez d'énergie.");
    else if (playTargets(game, index).length === 0) setMessage('Aucune cible possible.');
    else setMessage(card.kind === 'unit' ? 'Choisis une case de ta zone de déploiement.' : 'Choisis une cible.');
  }

  function endTurn() {
    setSel(null);
    setLastCells([]);
    run({ type: 'endTurn' });
  }

  // ----- panneau d'information -----
  const selectedPiece = sel?.kind === 'piece' ? pieceById(game, sel.id) : undefined;
  const selectedCard = sel?.kind === 'card' ? getCard(me.hand[sel.index]) : undefined;
  let infoTitle = '';
  let infoText = '';
  let abilityButton: { label: string; action: () => void } | null = null;
  if (selectedPiece) {
    const card = unitCardOf(selectedPiece);
    infoTitle = selectedPiece.flagship
      ? `${FLAGSHIP.name} · ${selectedPiece.hp}/${selectedPiece.maxHp} PV`
      : `${card!.name} · ${effectiveAtk(selectedPiece)} ATK · ${selectedPiece.hp}/${selectedPiece.maxHp} PV`;
    const status = [
      selectedPiece.owner === BOT ? 'Ennemi' : null,
      selectedPiece.summonSick ? 'En saut (arrivée ce tour)' : null,
      selectedPiece.frozen ? 'Gelé' : null,
      selectedPiece.acted ? 'A déjà agi' : null,
    ]
      .filter(Boolean)
      .join(' · ');
    infoText = (selectedPiece.flagship ? FLAGSHIP.text : card!.text) + (status ? `\n${status}` : '');
    const effect = card?.effect;
    if (myTurn && selectedPiece.owner === HUMAN && effect && ABILITY_LABEL[effect]) {
      const targets = abilityTargets(game, selectedPiece.id);
      if (targets.length > 0) {
        abilityButton =
          effect === 'selfDestruct'
            ? { label: ABILITY_LABEL[effect], action: () => run({ type: 'ability', pieceId: selectedPiece.id, target: targets[0] }) && setSel(null) }
            : {
                label: sel?.kind === 'piece' && sel.abilityMode ? 'Annuler' : ABILITY_LABEL[effect],
                action: () => setSel({ kind: 'piece', id: selectedPiece.id, abilityMode: !(sel?.kind === 'piece' && sel.abilityMode) }),
              };
      }
    }
  } else if (selectedCard) {
    infoTitle = `${selectedCard.name} · ${selectedCard.cost} énergie`;
    infoText =
      selectedCard.kind === 'unit'
        ? `${selectedCard.atk} ATK · ${selectedCard.hp} PV\n${selectedCard.text}`
        : selectedCard.text;
  } else {
    infoTitle = myTurn ? 'À toi de jouer' : game.winner === null ? 'Le bot réfléchit…' : 'Partie terminée';
    infoText = myTurn
      ? 'Touche une carte pour la jouer, ou une de tes pièces pour la déplacer ou attaquer. Un seul déplacement par tour.'
      : game.log.slice(-2).join('\n');
  }

  const myFlag = flagshipOf(game, HUMAN);
  const foeFlag = flagshipOf(game, BOT);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* bandeau adverse */}
        <View style={styles.bar}>
          <Text style={[styles.barTitle, { color: colors.foe }]}>Bot</Text>
          <HpBar hp={foeFlag?.hp ?? 0} color={colors.foe} />
          <Text style={styles.barText}>
            ⚡ {foe.energy}/{foe.maxEnergy} · 🂠 {foe.hand.length}
          </Text>
        </View>

        <Board
          game={game}
          cellSize={cellSize}
          highlights={highlights}
          selectedPieceId={sel?.kind === 'piece' ? sel.id : null}
          lastCells={lastCells}
          onCellPress={onCellPress}
        />

        {/* bandeau joueur */}
        <View style={styles.bar}>
          <Text style={[styles.barTitle, { color: colors.me }]}>Toi</Text>
          <HpBar hp={myFlag?.hp ?? 0} color={colors.me} />
          <Text style={styles.barText}>
            Tour {Math.min(game.turn, TURN_LIMIT)}/{TURN_LIMIT}
          </Text>
        </View>

        <View style={styles.energyRow}>
          {Array.from({ length: Math.max(me.maxEnergy, 1) }).map((_, i) => (
            <View key={i} style={[styles.pip, { backgroundColor: i < me.energy ? colors.energy : colors.panelBorder }]} />
          ))}
          <Text style={styles.energyText}>
            {me.energy}/{me.maxEnergy} énergie{game.moved ? ' · déplacement utilisé' : ''}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>{infoTitle}</Text>
          <Text style={styles.infoText} numberOfLines={3}>
            {message ?? infoText}
          </Text>
        </View>

        <View style={styles.actions}>
          <Btn label="Menu" onPress={onQuit} subtle />
          {abilityButton && <Btn label={abilityButton.label} onPress={abilityButton.action} />}
          <Btn label="Fin du tour" onPress={endTurn} disabled={!myTurn} primary />
        </View>

        <View style={styles.handWrap}>
          <Hand
            hand={me.hand}
            energy={me.energy}
            enabled={myTurn}
            selectedIndex={sel?.kind === 'card' ? sel.index : null}
            onSelect={onCardSelect}
          />
        </View>
      </View>

      {game.winner !== null && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {game.winner === HUMAN ? 'Victoire !' : game.winner === 'draw' ? 'Match nul' : 'Défaite'}
            </Text>
            <Text style={styles.modalText}>
              {game.winner === HUMAN
                ? 'Le Vaisseau amiral ennemi est détruit.'
                : game.winner === 'draw'
                  ? 'Les deux flottes tiennent bon.'
                  : 'Ton Vaisseau amiral est tombé.'}
            </Text>
            <Btn
              label="Rejouer"
              primary
              onPress={() => {
                setGame(createGame());
                setSel(null);
                setLastCells([]);
                setMessage(null);
              }}
            />
            <Btn label="Menu" subtle onPress={onQuit} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function HpBar({ hp, color }: { hp: number; color: string }) {
  const pct = Math.max(0, Math.min(1, hp / FLAGSHIP.hp));
  return (
    <View style={styles.hpOuter}>
      <View style={[styles.hpInner, { width: `${pct * 100}%`, backgroundColor: color }]} />
      <Text style={styles.hpText}>★ {hp} PV</Text>
    </View>
  );
}

function Btn({
  label,
  onPress,
  disabled,
  primary,
  subtle,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  subtle?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        primary ? styles.btnPrimary : null,
        subtle ? styles.btnSubtle : null,
        { opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[styles.btnText, primary ? { color: '#04121a' } : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 12, gap: 8, paddingTop: 6 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barTitle: { fontWeight: '800', fontSize: 14, width: 34 },
  barText: { color: colors.muted, fontSize: 12 },
  hpOuter: {
    flex: 1,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  hpInner: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.55 },
  hpText: { color: colors.text, fontSize: 11, fontWeight: '700', paddingLeft: 8 },
  energyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pip: { width: 14, height: 14, borderRadius: 3, transform: [{ rotate: '45deg' }], marginHorizontal: 1 },
  energyText: { color: colors.muted, fontSize: 12, marginLeft: 6 },
  info: {
    backgroundColor: colors.panel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    padding: 10,
    minHeight: 70,
  },
  infoTitle: { color: colors.text, fontWeight: '800', fontSize: 13, marginBottom: 3 },
  infoText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.me,
  },
  btnPrimary: { backgroundColor: colors.me, borderColor: colors.me },
  btnSubtle: { borderColor: colors.panelBorder, marginRight: 'auto' },
  btnText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  handWrap: { paddingTop: 6, paddingBottom: 8, marginHorizontal: -12 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3,6,16,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: 280,
    padding: 22,
    borderRadius: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    alignItems: 'stretch',
    gap: 10,
  },
  modalTitle: { color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  modalText: { color: colors.muted, textAlign: 'center', marginBottom: 6 },
});
