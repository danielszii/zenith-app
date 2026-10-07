import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Button, Eyebrow, Muted, SectionTitle } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { Match } from '../database/models';
import { RootStackParamList } from '../navigation/types';
import { downloadMatchPackage, fetchAssignedMatches, RemoteMatch } from '../services/download';
import { fetchMatches, seedDemoData } from '../services/localData';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Matches'>;
export function MatchesScreen({ navigation }: Props) {
  const { session, signOut } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [remote, setRemote] = useState<RemoteMatch[]>([]);
  const [online, setOnline] = useState(false);
  const [busyId, setBusyId] = useState('');
  const loadLocal = useCallback(async () => setMatches(await fetchMatches()), []);
  const loadRemote = useCallback(async () => setRemote(await fetchAssignedMatches()), []);
  useEffect(() => { loadLocal().catch(console.error); const network = NetInfo.addEventListener(state => setOnline(Boolean(state.isConnected && state.isInternetReachable !== false))); const focus = navigation.addListener('focus', () => { loadLocal().catch(console.error); }); return () => { network(); focus(); }; }, [loadLocal, navigation]);
  useEffect(() => { if (online) loadRemote().catch(error => Alert.alert('Falha ao consultar servidor', error instanceof Error ? error.message : 'Erro desconhecido')); }, [online, loadRemote]);
  const download = async (id: string) => { setBusyId(id); try { const localId = await downloadMatchPackage(id); await loadLocal(); navigation.navigate('MatchDetails', { matchId: localId }); } catch (error) { Alert.alert('Download não concluído', error instanceof Error ? error.message : 'Erro desconhecido'); } finally { setBusyId(''); } };
  const downloaded = new Set(matches.map(match => match.id));

  return <Screen>
    <View style={styles.header}><View style={styles.headerCopy}><Eyebrow>Central do mesário</Eyebrow><Text style={styles.title}>PARTIDAS</Text><Muted>{session?.user.nome}  /  {session?.user.role.toUpperCase()}</Muted></View><View style={[styles.connection, { borderColor: online ? colors.success : colors.warning }]}><View style={[styles.dot, { backgroundColor: online ? colors.success : colors.warning }]} /><Text style={styles.connectionText}>{online ? 'ONLINE' : 'OFFLINE'}</Text></View></View>

    {online && remote.some(match => !downloaded.has(match.id_partida)) && <View style={styles.sectionHeader}><SectionTitle>Disponíveis para download</SectionTitle><Text style={styles.count}>{remote.filter(match => !downloaded.has(match.id_partida)).length}</Text></View>}
    {online && remote.filter(match => !downloaded.has(match.id_partida)).map(match => <View style={styles.downloadCard} key={match.id_partida}><View style={styles.cardMeta}><Text style={styles.available}>NOVO PACOTE</Text><Text style={styles.date}>{formatDate(match.data)} · {match.hora.slice(0, 5)}</Text></View><Versus home={match.nome_mandante} away={match.nome_visitante} /><Muted>{match.local}</Muted><Button label={busyId === match.id_partida ? 'BAIXANDO…' : 'BAIXAR PARA USO OFFLINE'} disabled={Boolean(busyId)} onPress={() => download(match.id_partida)} /></View>)}

    <View style={styles.sectionHeader}><SectionTitle>Neste aparelho</SectionTitle><Text style={styles.count}>{matches.length}</Text></View>
    {!matches.length && <View style={styles.empty}><Text style={styles.emptyTitle}>NENHUMA PARTIDA OFFLINE</Text><Muted>Conecte-se para baixar uma partida atribuída ou crie uma demonstração local.</Muted><Button label="CRIAR DEMONSTRAÇÃO" tone="secondary" onPress={async () => { await seedDemoData(); await loadLocal(); }} /></View>}
    {matches.map(match => <Pressable key={match.id} onPress={() => navigation.navigate('MatchDetails', { matchId: match.id })} style={({ pressed }) => [styles.matchCard, pressed && styles.pressed]}><View style={styles.cardMeta}><Status value={match.status} /><Text style={styles.date}>{new Date(match.scheduledAt).toLocaleDateString('pt-BR')} · {new Date(match.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text></View><Versus home={match.homeName} away={match.awayName} score={`${match.homeScore} : ${match.awayScore}`} /><View style={styles.cardFooter}><Text style={styles.venue} numberOfLines={1}>{match.venue}</Text><Text style={styles.arrow}>→</Text></View></Pressable>)}
    <View style={styles.actions}><Button label="CENTRAL DE SINCRONIZAÇÃO" tone="secondary" onPress={() => navigation.navigate('Sync')} /><Button label="SAIR DA CONTA" tone="danger" onPress={signOut} /></View>
  </Screen>;
}

function Versus({ home, away, score }: { home: string; away: string; score?: string }) { return <View style={styles.versus}><View style={styles.club}><View style={styles.crest}><Text style={styles.initials}>{initials(home)}</Text></View><Text style={styles.team} numberOfLines={2}>{home}</Text></View><Text style={styles.score}>{score || 'VS'}</Text><View style={[styles.club, styles.awayClub]}><View style={styles.crest}><Text style={styles.initials}>{initials(away)}</Text></View><Text style={[styles.team, styles.right]} numberOfLines={2}>{away}</Text></View></View>; }
function Status({ value }: { value: string }) { const live = value === 'em_andamento'; return <View style={styles.status}><View style={[styles.statusDot, { backgroundColor: live ? colors.live : value === 'encerrado' ? colors.success : colors.warning }]} /><Text style={styles.statusText}>{value.replaceAll('_', ' ').toUpperCase()}</Text></View>; }
function initials(name: string) { return name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase(); }
function formatDate(value: string) { return String(value).slice(0, 10).split('-').reverse().join('/'); }

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 12 }, headerCopy: { gap: 5 }, title: { color: colors.text, fontSize: 42, lineHeight: 45, fontWeight: '900', letterSpacing: -1.5 }, connection: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 }, dot: { width: 6, height: 6, borderRadius: 3 }, connectionText: { color: colors.text, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  sectionHeader: { marginTop: 8, paddingTop: 17, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, count: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  matchCard: { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.md, padding: 15, gap: 14 }, downloadCard: { backgroundColor: colors.surface, borderLeftColor: colors.primary, borderLeftWidth: 3, borderRadius: radius.md, padding: 15, gap: 14 }, pressed: { opacity: .72 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, available: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, date: { color: colors.muted, fontSize: 9, fontWeight: '700' }, status: { flexDirection: 'row', alignItems: 'center', gap: 6 }, statusDot: { width: 6, height: 6, borderRadius: 3 }, statusText: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  versus: { flexDirection: 'row', alignItems: 'center', gap: 10 }, club: { flex: 1, gap: 7 }, awayClub: { alignItems: 'flex-end' }, crest: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1 }, initials: { color: colors.text, fontSize: 10, fontWeight: '900' }, team: { color: colors.text, fontSize: 13, lineHeight: 17, fontWeight: '800' }, right: { textAlign: 'right' }, score: { minWidth: 65, textAlign: 'center', color: colors.text, fontSize: 27, fontWeight: '900', fontVariant: ['tabular-nums'] }, cardFooter: { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSoft, flexDirection: 'row', alignItems: 'center' }, venue: { flex: 1, color: colors.muted, fontSize: 10 }, arrow: { color: colors.primary, fontSize: 20 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, padding: 22, borderRadius: radius.md, gap: 13 }, emptyTitle: { color: colors.text, fontSize: 14, fontWeight: '900' }, actions: { gap: 8, marginTop: 12 },
});
