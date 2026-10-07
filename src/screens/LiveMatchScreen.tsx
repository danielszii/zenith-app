import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen'; import { Button, Card, Muted, Title } from '../components/UI'; import { Match, MatchEvent, RosterEntry } from '../database/models';
import { addEvent, controlClock, elapsedSeconds, fetchEvents, fetchMatch, fetchRoster } from '../services/localData'; import { RootStackParamList } from '../navigation/types'; import { colors } from '../theme';
import { formatClock } from '../domain/matchRules';
type Props = NativeStackScreenProps<RootStackParamList, 'LiveMatch'>;
const actions = [['GOL', '⚽ Gol'], ['CARTAO_AMARELO', '🟨 Amarelo'], ['CARTAO_VERMELHO', '🟥 Vermelho'], ['SUBSTITUICAO', '↔ Substituição'], ['FALTA', '⚠ Falta'], ['PEDIDO_TEMPO', '⏱ Tempo']] as const;
const details: Record<string, string[]> = { GOL: ['NORMAL', 'PENALTI', 'CONTRA'], CARTAO_AMARELO: ['CONDUTA_ANTIDESPORTIVA', 'RECLAMACAO', 'FALTA_TATICA', 'RETARDAR_JOGO'], CARTAO_VERMELHO: ['JOGO_BRUSCO_GRAVE', 'AGRESSAO', 'LINGUAGEM_OFENSIVA', 'SEGUNDO_AMARELO'] };
export function LiveMatchScreen({ route, navigation }: Props) {
  const [match, setMatch] = useState<Match | null>(null); const [roster, setRoster] = useState<RosterEntry[]>([]); const [events, setEvents] = useState<MatchEvent[]>([]); const [now, setNow] = useState(Date.now()); const [type, setType] = useState('GOL'); const [detail, setDetail] = useState('NORMAL'); const [clubId, setClubId] = useState(''); const [athlete, setAthlete] = useState<RosterEntry>(); const [related, setRelated] = useState<RosterEntry>();
  const load = useCallback(async () => { const m = await fetchMatch(route.params.matchId); setMatch(m); setRoster((await fetchRoster(m.id)).filter(r => r.confirmed)); setEvents(await fetchEvents(m.id)); setClubId(c => c || m.homeClubId); }, [route.params.matchId]);
  useEffect(() => { load(); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [load]);
  const stats = useMemo(() => { const foul = (id: string) => events.filter(e => e.clubId === id && e.period === match?.currentPeriod && e.eventType === 'FALTA').length; return { homeFouls: match ? foul(match.homeClubId) : 0, awayFouls: match ? foul(match.awayClubId) : 0 }; }, [events, match]);
  if (!match) return <Screen><Muted>Preparando operação…</Muted></Screen>;
  const seconds = elapsedSeconds(match, now); const clock = formatClock(seconds);
  const save = async () => { if (!['FALTA', 'PEDIDO_TEMPO'].includes(type) && !athlete) return Alert.alert('Selecione um atleta'); if (type === 'SUBSTITUICAO' && !related) return Alert.alert('Selecione quem entra'); await addEvent({ match, type, detail, clubId, athlete, relatedAthlete: related }); setAthlete(undefined); setRelated(undefined); await load(); if (type === 'CARTAO_AMARELO') { const yellows = (await fetchEvents(match.id)).filter(e => e.athleteId === athlete?.athleteId && e.eventType === 'CARTAO_AMARELO').length; if (yellows >= 2) Alert.alert('EXPULSÃO AUTOMÁTICA', `${athlete?.athleteName} recebeu o segundo amarelo.`); } };
  return <Screen>
    <View style={styles.score}><Text style={styles.team}>{match.homeName}</Text><Title>{match.homeScore} × {match.awayScore}</Title><Text style={[styles.team, styles.right]}>{match.awayName}</Text></View>
    <Card><View style={styles.clockRow}><View><Muted>{match.currentPeriod.replaceAll('_', ' ')}</Muted><Text style={styles.clock}>{clock}</Text></View><View style={styles.clockActions}><Button label={match.clockRunning ? 'Pausar' : 'Iniciar'} onPress={async () => { await controlClock(match, match.clockRunning ? 'pause' : 'start'); await load(); }}/><Button label="Próximo período" tone="secondary" onPress={async () => { await controlClock(match, 'next'); await load(); }}/></View></View><Muted>Faltas no período: {match.homeName} {stats.homeFouls} · {match.awayName} {stats.awayFouls}</Muted></Card>
    <Card><Text style={styles.heading}>Registrar evento</Text><View style={styles.wrap}>{actions.map(([value, label]) => <Pressable key={value} onPress={() => { setType(value); setDetail(details[value]?.[0] || ''); setAthlete(undefined); setRelated(undefined); }} style={[styles.pill, type === value && styles.active]}><Text style={styles.pillText}>{label}</Text></Pressable>)}</View>
      <View style={styles.wrap}>{[match.homeClubId, match.awayClubId].map(id => <Pressable key={id} onPress={() => { setClubId(id); setAthlete(undefined); setRelated(undefined); }} style={[styles.teamButton, clubId === id && styles.active]}><Text style={styles.pillText}>{id === match.homeClubId ? match.homeName : match.awayName}</Text></Pressable>)}</View>
      {details[type] && <View style={styles.wrap}>{details[type].map(value => <Pressable key={value} onPress={() => setDetail(value)} style={[styles.pill, detail === value && styles.active]}><Text style={styles.small}>{value.replaceAll('_', ' ')}</Text></Pressable>)}</View>}
      {!['FALTA', 'PEDIDO_TEMPO'].includes(type) && <><Text style={styles.label}>{type === 'SUBSTITUICAO' ? 'Sai' : 'Atleta'}</Text>{roster.filter(r => r.clubId === clubId).map(r => <Pressable key={r.id} onPress={() => setAthlete(r)} style={[styles.player, athlete?.id === r.id && styles.selected]}><Text style={styles.playerText}>#{r.shirtNumber} · {r.athleteName}{r.captain ? ' ©' : ''}</Text></Pressable>)}</>}
      {type === 'SUBSTITUICAO' && <><Text style={styles.label}>Entra</Text>{roster.filter(r => r.clubId === clubId && r.id !== athlete?.id).map(r => <Pressable key={r.id} onPress={() => setRelated(r)} style={[styles.player, related?.id === r.id && styles.selected]}><Text style={styles.playerText}>#{r.shirtNumber} · {r.athleteName}</Text></Pressable>)}</>}
      <Button label={`Registrar aos ${clock}`} disabled={!match.clockRunning} onPress={save}/><Muted>O evento será gravado localmente antes de qualquer tentativa de envio.</Muted>
    </Card>
    <Card><Text style={styles.heading}>Linha do tempo</Text>{events.slice(0, 12).map(e => <View key={e.id} style={styles.event}><Text style={styles.time}>{e.minute}:{String(e.second).padStart(2, '0')}</Text><View style={styles.eventBody}><Text style={styles.playerText}>{e.eventType.replaceAll('_', ' ')}</Text><Muted>{e.athleteName || (e.clubId === match.homeClubId ? match.homeName : match.awayName)}{e.relatedAthleteName ? ` → ${e.relatedAthleteName}` : ''} · {e.eventDetail || e.period}</Muted></View></View>)}</Card>
    <Button label="Encerrar operação e assinar" tone="danger" onPress={async () => { if (match.clockRunning) await controlClock(match, 'pause'); navigation.navigate('PostGame', { matchId: match.id }); }}/>
  </Screen>;
}
const styles = StyleSheet.create({
  score: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  team: { color: colors.text, flex: 1, fontWeight: '900', fontSize: 15 },
  right: { textAlign: 'right' },
  clockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clock: { color: colors.primary, fontSize: 50, fontWeight: '900', fontVariant: ['tabular-nums'], letterSpacing: -2 },
  clockActions: { gap: 7 },
  heading: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  wrap: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: { backgroundColor: colors.surfaceRaised, borderRadius: 6, paddingHorizontal: 11, paddingVertical: 10, borderWidth: 1, borderColor: colors.borderSoft },
  teamButton: { flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: 6, padding: 13, borderWidth: 1, borderColor: colors.borderSoft },
  active: { borderColor: colors.primary, backgroundColor: '#182312' },
  pillText: { color: colors.text, fontWeight: '800' },
  small: { color: colors.text, fontSize: 10, fontWeight: '800' },
  label: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  player: { backgroundColor: colors.surfaceRaised, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: colors.borderSoft },
  selected: { borderColor: colors.primary, backgroundColor: '#182312' },
  playerText: { color: colors.text, fontWeight: '800' },
  event: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderColor: colors.borderSoft, paddingTop: 10 },
  time: { color: colors.primary, width: 42, fontWeight: '900' },
  eventBody: { flex: 1 },
});
