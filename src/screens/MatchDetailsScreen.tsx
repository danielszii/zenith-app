import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen'; import { Button, Card, Muted, Title } from '../components/UI'; import { Match } from '../database/models'; import { fetchMatch } from '../services/localData'; import { RootStackParamList } from '../navigation/types'; import { colors } from '../theme';
type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetails'>;
export function MatchDetailsScreen({ route, navigation }: Props) {
  const [match, setMatch] = useState<Match | null>(null); const load = useCallback(async () => setMatch(await fetchMatch(route.params.matchId)), [route.params.matchId]);
  useEffect(() => { load(); return navigation.addListener('focus', load); }, [load, navigation]);
  if (!match) return <Screen><Muted>Carregando partida…</Muted></Screen>;
  return <Screen><Muted>{new Date(match.scheduledAt).toLocaleString('pt-BR')} · {match.venue}</Muted><Title>{match.homeName} × {match.awayName}</Title>
    <Card><View style={styles.score}><Text style={styles.team}>{match.homeName}</Text><Text style={styles.numbers}>{match.homeScore} × {match.awayScore}</Text><Text style={[styles.team, styles.right]}>{match.awayName}</Text></View><Text style={styles.status}>{match.status.replaceAll('_', ' ').toUpperCase()}</Text></Card>
    <Card><Text style={styles.heading}>Fluxo da súmula</Text><Button label="1. Preparação e validação pré-jogo" onPress={() => navigation.navigate('PreGame', { matchId: match.id })}/><Button label="2. Operação ao vivo" tone="secondary" onPress={() => navigation.navigate('LiveMatch', { matchId: match.id })}/><Button label="3. Conferência e assinaturas" tone="secondary" onPress={() => navigation.navigate('PostGame', { matchId: match.id })}/></Card>
    <Card><Text style={styles.heading}>Ferramentas</Text><Button label="Sincronização" tone="secondary" onPress={() => navigation.navigate('Sync')}/></Card><Muted>Todas as ações são persistidas primeiro no aparelho. A internet nunca é requisito durante a partida.</Muted>
  </Screen>;
}
const styles = StyleSheet.create({ score: { flexDirection: 'row', alignItems: 'center', gap: 8 }, team: { color: colors.text, flex: 1, fontWeight: '700' }, right: { textAlign: 'right' }, numbers: { color: colors.text, fontSize: 30, fontWeight: '900' }, status: { color: colors.warning, textAlign: 'center', fontWeight: '800' }, heading: { color: colors.text, fontSize: 18, fontWeight: '700' } });
