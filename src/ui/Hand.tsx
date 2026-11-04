import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCard } from '../game/cards';
import { colors } from './theme';

interface Props {
  hand: string[];
  energy: number;
  enabled: boolean;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function Hand({ hand, energy, enabled, selectedIndex, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {hand.map((id, i) => {
        const card = getCard(id);
        const playable = enabled && card.cost <= energy;
        const selected = selectedIndex === i;
        return (
          <Pressable
            key={`${id}-${i}`}
            onPress={() => onSelect(i)}
            style={[
              styles.card,
              card.kind === 'power' ? styles.power : null,
              selected ? styles.selected : null,
              { opacity: playable ? 1 : 0.45 },
            ]}
          >
            <View style={styles.cost}>
              <Text style={styles.costText}>{card.cost}</Text>
            </View>
            <Text style={styles.glyph}>{card.glyph}</Text>
            <Text style={styles.name} numberOfLines={2}>
              {card.name}
            </Text>
            {card.kind === 'unit' ? (
              <Text style={styles.stats}>
                {card.atk} ATK · {card.hp} PV
              </Text>
            ) : (
              <Text style={styles.stats}>Pouvoir</Text>
            )}
          </Pressable>
        );
      })}
      {hand.length === 0 && <Text style={styles.empty}>Main vide</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 8, gap: 8, alignItems: 'center' },
  card: {
    width: 84,
    height: 112,
    borderRadius: 10,
    backgroundColor: colors.panel,
    borderWidth: 1.5,
    borderColor: colors.me,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  power: { borderColor: '#b98cff' },
  selected: { borderWidth: 3, borderColor: colors.energy, transform: [{ translateY: -6 }] },
  cost: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.energy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costText: { color: '#1b1400', fontWeight: '900', fontSize: 13 },
  glyph: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 10 },
  name: { color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  stats: { color: colors.muted, fontSize: 10 },
  empty: { color: colors.muted, padding: 16 },
});
