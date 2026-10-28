import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ResponsiveRow, Screen } from '../components/Screen';
import { Badge, Button, Card, Muted, PageHeader, SectionTitle } from '../components/UI';
import { Match } from '../database/models';
import { fetchMatch } from '../services/localData';
import { RootStackParamList } from '../navigation/types';
import { colors, layout, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetails'>;
export function MatchDetailsScreen({ route, navigation }: Props) {
  const { width } = useWindowDimensions();
  const tablet = width >= layout.tabletBreakpoint;
  const [match, setMatch] = useState<Match | null>(null);
  const load = useCallback(async () => setMatch(await fetchMatch(route.params.matchId)), [route.params.matchId]);
  useEffect(() => { load(); return navigation.addListener('focus', load); }, [load, navigation]);
  if (!match) return <Screen><Muted>Carregando partida…</Muted></Screen>;
  const statusTone = match.status === 'em_andamento' ? 'danger' : match.status === 'encerrado' ? 'success' : 'warning';

  return <Screen>
    <PageHeader eyebrow="Documento oficial" title="Partida" description={`${new Date(match.scheduledAt).toLocaleString('pt-BR')}  /  ${match.venue}`} action={<Badge label={match.status.replaceAll('_', ' ').toUpperCase()} tone={statusTone} />} />
    <Card accent style={styles.scoreboard}><Club name={match.homeName} /><View style={styles.scoreCenter}><Text style={[styles.score, tablet && styles.scoreTablet]}>{match.homeScore} : {match.awayScore}</Text><Text style={styles.scoreLabel}>PLACAR OFICIAL</Text></View><Club name={match.awayName} right /></Card>
    <ResponsiveRow><View style={styles.main}><View style={styles.sectionHead}><SectionTitle>Fluxo da súmula</SectionTitle><Muted>Complete as três etapas para garantir a integridade do documento.</Muted></View><FlowItem number="01" title="Preparação e validação" description="Elencos, elegibilidade e assinaturas" status="PRÉ-JOGO" active onPress={() => navigation.navigate('PreGame', { matchId: match.id })} /><FlowItem number="02" title="Operação ao vivo" description="Cronômetro e eventos da partida" status="PARTIDA" onPress={() => navigation.navigate('LiveMatch', { matchId: match.id })} /><FlowItem number="03" title="Conferência e fechamento" description="Resumo e assinaturas finais" status="PÓS-JOGO" onPress={() => navigation.navigate('PostGame', { matchId: match.id })} /></View><View style={styles.side}><Card><SectionTitle>Operação segura</SectionTitle><Muted>Todas as ações são salvas primeiro no aparelho. A conexão não é necessária durante a partida.</Muted><View style={styles.safeRow}><View style={styles.safeDot} /><Text style={styles.safeText}>PERSISTÊNCIA LOCAL ATIVA</Text></View></Card><Button label="Abrir sincronização" tone="secondary" onPress={() => navigation.navigate('Sync')} /></View></ResponsiveRow>
  </Screen>;
}

function Club({ name, right }: { name: string; right?: boolean }) { return <View style={[styles.club, right && styles.clubRight]}><View style={styles.crest}><Text style={styles.initials}>{name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('')}</Text></View><Text style={[styles.team, right && styles.right]} numberOfLines={2}>{name}</Text></View>; }
function FlowItem({ number, title, description, status, active, onPress }: { number: string; title: string; description: string; status: string; active?: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.flow, active && styles.flowActive, pressed && styles.pressed]}><Text style={[styles.number, active && styles.numberActive]}>{number}</Text><View style={styles.flowCopy}><Text style={styles.flowStatus}>{status}</Text><Text style={styles.flowTitle}>{title}</Text><Text style={styles.flowDescription}>{description}</Text></View><Text style={styles.arrow}>→</Text></Pressable>; }

const styles = StyleSheet.create({
  scoreboard: { minHeight: 210, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12 }, club: { flex: 1, gap: 10 }, clubRight: { alignItems: 'flex-end' }, crest: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, initials: { color: colors.text, fontSize: 12, fontWeight: '900' }, team: { color: colors.text, fontSize: 15, fontWeight: '800' }, right: { textAlign: 'right' }, scoreCenter: { alignItems: 'center' }, score: { color: colors.text, fontSize: 38, lineHeight: 43, fontWeight: '900', fontVariant: ['tabular-nums'] }, scoreTablet: { fontSize: 54, lineHeight: 58 }, scoreLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  main: { flex: 1.7, gap: 10 }, side: { flex: 1, gap: 10 }, sectionHead: { gap: 4, marginBottom: 4 },
  flow: { minHeight: 88, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.md, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface }, flowActive: { borderColor: colors.primary }, pressed: { opacity: .7 }, number: { width: 34, color: colors.muted, fontSize: 21, fontWeight: '900' }, numberActive: { color: colors.primary }, flowCopy: { flex: 1, gap: 2 }, flowStatus: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, flowTitle: { color: colors.text, fontSize: 14, fontWeight: '900' }, flowDescription: { color: colors.muted, fontSize: 11 }, arrow: { color: colors.primary, fontSize: 22 },
  safeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSoft }, safeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }, safeText: { color: colors.success, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
});
