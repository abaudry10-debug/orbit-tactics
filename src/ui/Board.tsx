import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getCard } from '../game/cards';
import { SIZE, deployRows, effectiveAtk, pieceAt } from '../game/engine';
import type { Cell, GameState } from '../game/types';
import { colors } from './theme';

export type Highlight = 'move' | 'attack' | 'target';

interface Props {
  game: GameState;
  cellSize: number;
  highlights: Map<string, Highlight>;
  selectedPieceId: number | null;
  lastCells: Cell[];
  onCellPress: (cell: Cell) => void;
}

export const key = (c: Cell) => `${c.x},${c.y}`;

export function Board({ game, cellSize, highlights, selectedPieceId, lastCells, onCellPress }: Props) {
  const lastSet = new Set(lastCells.map(key));
  const rows = [];
  for (let y = 0; y < SIZE; y++) {
    const cells = [];
    for (let x = 0; x < SIZE; x++) {
      const piece = pieceAt(game, x, y);
      const hl = highlights.get(key({ x, y }));
      const deploy = deployRows(0).includes(y) || deployRows(1).includes(y);
      const base = deploy ? colors.deployTint : (x + y) % 2 === 0 ? colors.cell : colors.cellAlt;
      cells.push(
        <Pressable
          key={x}
          onPress={() => onCellPress({ x, y })}
          style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: base }]}
        >
          {lastSet.has(key({ x, y })) && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.last }]} />}
          {piece && (
            <View
              style={[
                styles.piece,
                {
                  backgroundColor: piece.owner === 0 ? colors.meDark : colors.foeDark,
                  borderColor: piece.owner === 0 ? colors.me : colors.foe,
                  borderWidth: piece.id === selectedPieceId ? 3 : 1.5,
                  opacity: piece.summonSick ? 0.6 : 1,
                  borderRadius: piece.flagship ? cellSize / 2 : 8,
                },
              ]}
            >
              <Text style={[styles.glyph, { fontSize: cellSize * 0.28 }]}>
                {piece.flagship ? '★' : getCard(piece.cardId).glyph}
              </Text>
              {piece.flagship ? (
                <Text style={[styles.stats, { fontSize: cellSize * 0.2 }]}>{piece.hp}</Text>
              ) : (
                <Text style={[styles.stats, { fontSize: cellSize * 0.19 }]}>
                  <Text style={{ color: piece.atkBonus ? colors.energy : colors.text }}>{effectiveAtk(piece)}</Text>
                  <Text style={{ color: colors.muted }}>/</Text>
                  <Text style={{ color: piece.hp < piece.maxHp ? colors.danger : colors.text }}>{piece.hp}</Text>
                </Text>
              )}
              {piece.frozen && <Text style={styles.badge}>❄</Text>}
            </View>
          )}
          {hl && (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.hl,
                { backgroundColor: colors[hl], borderRadius: hl === 'move' && !piece ? cellSize : 4 },
                hl === 'move' && !piece ? { margin: cellSize * 0.32 } : null,
              ]}
            />
          )}
        </Pressable>,
      );
    }
    rows.push(
      <View key={y} style={styles.row}>
        {cells}
      </View>,
    );
  }
  return <View style={styles.board}>{rows}</View>;
}

const styles = StyleSheet.create({
  board: {
    borderWidth: 1,
    borderColor: colors.panelBorder,
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  row: { flexDirection: 'row' },
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    width: '86%',
    height: '86%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { color: colors.text, fontWeight: '800' },
  stats: { color: colors.text, fontWeight: '700', marginTop: 1 },
  badge: { position: 'absolute', top: 1, right: 3, fontSize: 11, color: '#bfe8ff' },
  hl: { pointerEvents: 'none' },
});
