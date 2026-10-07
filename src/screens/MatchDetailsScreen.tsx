import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Button, Eyebrow, Muted, SectionTitle } from '../components/UI';
import { Match } from '../database/models';
import { fetchMatch } from '../services/localData';
import { RootStackParamList } from '../navigation/types';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetails'>;
export function MatchDetailsScreen({ route, navigation }: Props) {
  const [match, setMatch] = useState<Match | null>(null);
  const load = useCallback(async () => setMatch(await fetchMatch(route.params.matchId)), [route.params.matchId]);
  useEffect(() => { load(); return navigation.addListener('focus', load); }, [load, navigation]);
  if (!match) return <Screen><Muted>Carregando partida…</Muted></Screen>;

  return <Screen>
    <View style={styles.intro}><Eyebrow>{match.status.replaceAll('_', ' ')}</Eyebrow><Text style={styles.date}>{new Date(match.scheduledAt).toLocaleString('pt-BR')}  /  {match.venue}</Text></View>
    <View style={styles.scoreboard}><Club name={match.homeName} /><View style={styles.scoreCenter}><Text style={styles.score}>{match.homeScore} : {match.awayScore}</Text><Text style={styles.scoreLabel}>PLACAR</Text></View><Club name={match.awayName} right /></View>
    <View style={styles.section}><SectionTitle>Fluxo da súmula</SectionTitle><Muted>Complete as três etapas para garantir a integridade do documento.</Muted><FlowItem number="01" title="Preparação e validação" description="Elencos, elegibilidade e assinaturas" active onPress={() => navigation.navigate('PreGame', { matchId: match.id })} /><FlowItem number="02" title="Operação ao vivo" description="Cronômetro e eventos da partida" onPress={() => navigation.navigate('LiveMatch', { matchId: match.id })} /><FlowItem number="03" title="Conferência e fechamento" description="Resumo e assinaturas finais" onPress={() => navigation.navigate('PostGame', { matchId: match.id })} /></View>
    <View style={styles.section}><SectionTitle>Ferramentas</SectionTitle><Button label="ABRIR SINCRONIZAÇÃO" tone="secondary" onPress={() => navigation.navigate('Sync')} /></View>
    <View style={styles.offline}><View style={styles.offlineDot} /><Muted>Todas as ações são salvas primeiro no aparelho. A conexão não é necessária durante a partida.</Muted></View>
  </Screen>;
}

function Club({ name, right }: { name: string; right?: boolean }) { return <View style={[styles.club, right && styles.clubRight]}><View style={styles.crest}><Text style={styles.initials}>{name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('')}</Text></View><Text style={[styles.team, right && styles.right]} numberOfLines={2}>{name}</Text></View>; }
function FlowItem({ number, title, description, active, onPress }: { number: string; title: string; description: string; active?: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.flow, active && styles.flowActive, pressed && { opacity: .7 }]}><Text style={[styles.number, active && { color: colors.primary }]}>{number}</Text><View style={styles.flowCopy}><Text style={styles.flowTitle}>{title}</Text><Text style={styles.flowDescription}>{description}</Text></View><Text style={styles.arrow}>→</Text></Pressable>; }

const styles = StyleSheet.create({
  intro: { gap: 6 }, date: { color: colors.muted, fontSize: 11 },
  scoreboard: { minHeight: 190, backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.md, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 10 }, club: { flex: 1, gap: 9 }, clubRight: { alignItems: 'flex-end' }, crest: { width: 44, height: 44, backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, initials: { color: colors.text, fontSize: 11, fontWeight: '900' }, team: { color: colors.text, fontSize: 13, fontWeight: '800' }, right: { textAlign: 'right' }, scoreCenter: { alignItems: 'center' }, score: { color: colors.text, fontSize: 38, lineHeight: 43, fontWeight: '900', fontVariant: ['tabular-nums'] }, scoreLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  section: { marginTop: 8, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 }, flow: { minHeight: 72, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.sm, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface }, flowActive: { borderLeftColor: colors.primary, borderLeftWidth: 3 }, number: { width: 28, color: colors.muted, fontSize: 18, fontWeight: '900' }, flowCopy: { flex: 1, gap: 2 }, flowTitle: { color: colors.text, fontSize: 13, fontWeight: '900' }, flowDescription: { color: colors.muted, fontSize: 10 }, arrow: { color: colors.primary, fontSize: 20 }, offline: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, backgroundColor: colors.surfaceSoft, borderRadius: radius.sm }, offlineDot: { width: 7, height: 7, marginTop: 6, borderRadius: 4, backgroundColor: colors.success },
});
