import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GameScreen } from './src/ui/GameScreen';
import { colors } from './src/ui/theme';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen === 'game' ? <GameScreen onQuit={() => setScreen('menu')} /> : <Menu onPlay={() => setScreen('game')} />}
    </SafeAreaProvider>
  );
}

function Menu({ onPlay }: { onPlay: () => void }) {
  const [rules, setRules] = useState(false);
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>PROTOTYPE 0.1</Text>
        <Text style={styles.title}>Orbit Tactics</Text>
        <Text style={styles.subtitle}>Deux flottes, une grille, un seul déplacement par tour.</Text>

        <Pressable style={({ pressed }) => [styles.primary, { opacity: pressed ? 0.8 : 1 }]} onPress={onPlay}>
          <Text style={styles.primaryText}>Jouer contre le bot</Text>
        </Pressable>
        <View style={[styles.secondary, { opacity: 0.45 }]}>
          <Text style={styles.secondaryText}>Jouer contre un ami · bientôt</Text>
        </View>
        <Pressable style={styles.secondary} onPress={() => setRules((r) => !r)}>
          <Text style={styles.secondaryText}>{rules ? 'Masquer les règles' : 'Règles rapides'}</Text>
        </Pressable>

        {rules && (
          <View style={styles.rules}>
            {[
              'Détruis le Vaisseau amiral adverse (★, 20 PV) pour gagner.',
              "À chaque tour : tu pioches 1 carte et ton énergie monte de 1 (max 8).",
              'Joue autant de cartes que ton énergie le permet. Les unités se posent sur tes deux rangées du fond.',
              'Tu ne déplaces qu’une seule pièce par tour, mais chaque unité peut attaquer une fois.',
              "Une unité qui vient d'arriver est « en saut » : elle attendra ton prochain tour.",
              'Ton Vaisseau amiral a un Canon principal : 2 énergie pour 2 dégâts à un ennemi adjacent.',
              'Pas de riposte : celui qui frappe le premier a l’avantage.',
            ].map((line, i) => (
              <Text key={i} style={styles.rule}>
                {i + 1}. {line}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12, maxWidth: 480, width: '100%', alignSelf: 'center' },
  kicker: { color: colors.me, letterSpacing: 3, fontSize: 11, fontWeight: '800' },
  title: { color: colors.text, fontSize: 40, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: 15, marginBottom: 18 },
  primary: { backgroundColor: colors.me, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  primaryText: { color: '#04121a', fontWeight: '900', fontSize: 16 },
  secondary: {
    borderWidth: 1,
    borderColor: colors.panelBorder,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.panel,
  },
  secondaryText: { color: colors.text, fontWeight: '700' },
  rules: { backgroundColor: colors.panel, borderRadius: 12, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.panelBorder },
  rule: { color: colors.muted, fontSize: 13, lineHeight: 19 },
});
