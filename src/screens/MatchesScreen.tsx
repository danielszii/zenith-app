import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Badge, Button, Muted, PageHeader, SectionTitle } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { Match } from '../database/models';
import { RootStackParamList } from '../navigation/types';
import { downloadMatchPackage, fetchAssignedMatches, RemoteMatch } from '../services/download';
import { fetchMatches } from '../services/localData';
import { colors, layout, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Matches'>;
export function MatchesScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const tablet = width >= layout.tabletBreakpoint;
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
  const available = remote.filter(match => !downloaded.has(match.id_partida));

  return <Screen>
    <PageHeader eyebrow="Central do mesário" title="Partidas" description={`${session?.user.nome}  /  ${session?.user.role.toUpperCase()}`} action={<Badge label={online ? 'ONLINE' : 'OFFLINE'} tone={online ? 'success' : 'warning'} />} />
    {online && available.length > 0 ? <><SectionHeader title="Disponíveis para download" count={available.length} /><View style={tablet ? styles.grid : styles.list}>{available.map(match => <View style={[styles.card, tablet && styles.gridCard]} key={match.id_partida}><View style={styles.cardMeta}><Badge label="NOVO PACOTE" tone="primary" /><Text style={styles.date}>{formatDate(match.data)} · {match.hora.slice(0, 5)}</Text></View><Versus home={match.nome_mandante} away={match.nome_visitante} /><Muted>{match.local}</Muted><Button label={busyId === match.id_partida ? 'Baixando…' : 'Baixar para uso offline'} disabled={Boolean(busyId)} onPress={() => download(match.id_partida)} /></View>)}</View></> : null}
    <SectionHeader title="Neste aparelho" count={matches.length} />
    {!matches.length ? <View style={styles.empty}><View style={styles.emptyIcon}><Text style={styles.emptyIconText}>Z</Text></View><Text style={styles.emptyTitle}>NENHUMA PARTIDA OFFLINE</Text><Muted>Conecte-se para baixar uma partida atribuída a esta conta.</Muted></View> : null}
    <View style={tablet ? styles.grid : styles.list}>{matches.map(match => <Pressable key={match.id} onPress={() => navigation.navigate('MatchDetails', { matchId: match.id })} style={({ pressed }) => [styles.card, tablet && styles.gridCard, pressed && styles.pressed]}><View style={styles.cardMeta}><Status value={match.status} /><Text style={styles.date}>{new Date(match.scheduledAt).toLocaleDateString('pt-BR')} · {new Date(match.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text></View><Versus home={match.homeName} away={match.awayName} score={`${match.homeScore} : ${match.awayScore}`} /><View style={styles.cardFooter}><Text style={styles.venue} numberOfLines={1}>{match.venue}</Text><Text style={styles.arrow}>→</Text></View></Pressable>)}</View>
    <View style={[styles.actions, tablet && styles.actionsTablet]}><Button style={styles.action} label="Central de sincronização" tone="secondary" onPress={() => navigation.navigate('Sync')} /><Button style={styles.action} label="Sair da conta" tone="ghost" onPress={signOut} /></View>
  </Screen>;
}

function SectionHeader({ title, count }: { title: string; count: number }) { return <View style={styles.sectionHeader}><SectionTitle>{title}</SectionTitle><Text style={styles.count}>{String(count).padStart(2, '0')}</Text></View>; }
function Versus({ home, away, score }: { home: string; away: string; score?: string }) { return <View style={styles.versus}><Club name={home} /><Text style={styles.score}>{score || 'VS'}</Text><Club name={away} away /></View>; }
function Club({ name, away }: { name: string; away?: boolean }) { return <View style={[styles.club, away && styles.awayClub]}><View style={styles.crest}><Text style={styles.initials}>{initials(name)}</Text></View><Text style={[styles.team, away && styles.right]} numberOfLines={2}>{name}</Text></View>; }
function Status({ value }: { value: string }) { const tone = value === 'em_andamento' ? 'danger' : value === 'encerrado' ? 'success' : 'warning'; return <Badge label={value.replaceAll('_', ' ').toUpperCase()} tone={tone} />; }
function initials(name: string) { return name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase(); }
function formatDate(value: string) { return String(value).slice(0, 10).split('-').reverse().join('/'); }

const styles = StyleSheet.create({
  sectionHeader: { marginTop: spacing.sm, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, count: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  list: { gap: 12 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, gridCard: { width: '48.8%', minWidth: 310 },
  card: { flexGrow: 1, backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: 15 }, pressed: { opacity: .72 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, date: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  versus: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 88 }, club: { flex: 1, gap: 8 }, awayClub: { alignItems: 'flex-end' }, crest: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1 }, initials: { color: colors.text, fontSize: 10, fontWeight: '900' }, team: { color: colors.text, fontSize: 13, lineHeight: 17, fontWeight: '800' }, right: { textAlign: 'right' }, score: { minWidth: 74, textAlign: 'center', color: colors.text, fontSize: 29, fontWeight: '900', fontVariant: ['tabular-nums'] },
  cardFooter: { paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.borderSoft, flexDirection: 'row', alignItems: 'center' }, venue: { flex: 1, color: colors.muted, fontSize: 10 }, arrow: { color: colors.primary, fontSize: 20 },
  empty: { alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, padding: spacing.xl, borderRadius: radius.md, gap: 13 }, emptyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, emptyIconText: { color: colors.primaryText, fontWeight: '900' }, emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  actions: { gap: 8, marginTop: 12 }, actionsTablet: { flexDirection: 'row' }, action: { flex: 1 },
});
