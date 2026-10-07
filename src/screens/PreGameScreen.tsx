import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen'; import { Button, Card, Muted, Title } from '../components/UI'; import { SignaturePad } from '../components/SignaturePad';
import { Match, MatchPerson, RosterEntry, Signature } from '../database/models'; import { fetchMatch, fetchPeople, fetchRoster, fetchSignatures, saveSignature, updateRoster } from '../services/localData';
import { RootStackParamList } from '../navigation/types'; import { colors } from '../theme';
type Props = NativeStackScreenProps<RootStackParamList, 'PreGame'>; type Step = 'dados' | 'elenco' | 'assinaturas';
export function PreGameScreen({ route, navigation }: Props) {
  const [match, setMatch] = useState<Match | null>(null); const [roster, setRoster] = useState<RosterEntry[]>([]); const [people, setPeople] = useState<MatchPerson[]>([]); const [signatures, setSignatures] = useState<Signature[]>([]); const [step, setStep] = useState<Step>('dados'); const [signerRole, setSignerRole] = useState('CAPITAO_MANDANTE'); const [signerName, setSignerName] = useState('');
  const load = useCallback(async () => { setMatch(await fetchMatch(route.params.matchId)); setRoster(await fetchRoster(route.params.matchId)); setPeople(await fetchPeople(route.params.matchId)); setSignatures(await fetchSignatures(route.params.matchId)); }, [route.params.matchId]);
  useEffect(() => { load(); }, [load]);
  const readiness = useMemo(() => ({ confirmed: roster.filter(r => r.confirmed).length, blocked: roster.filter(r => !r.eligible).length, signed: signatures.filter(s => s.phase === 'PRE').length }), [roster, signatures]);
  if (!match) return <Screen><Muted>Carregando pacote da partida…</Muted></Screen>;
  const sign = async (data: string) => { if (!signerName.trim()) return Alert.alert('Informe o nome do signatário'); await saveSignature(match.id, signerName.trim(), signerRole, 'PRE', data); setSignerName(''); await load(); Alert.alert('Assinatura salva offline'); };
  return <Screen>
    <Muted>PACOTE OFFLINE · baixado {match.downloadedAt ? new Date(match.downloadedAt).toLocaleString('pt-BR') : 'neste aparelho'}</Muted><Title>Preparação da partida</Title>
    <View style={styles.tabs}>{(['dados', 'elenco', 'assinaturas'] as Step[]).map(s => <Pressable key={s} onPress={() => setStep(s)} style={[styles.tab, step === s && styles.activeTab]}><Text style={styles.tabText}>{s.toUpperCase()}</Text></Pressable>)}</View>
    {step === 'dados' && <><Card><Text style={styles.heading}>{match.homeName} × {match.awayName}</Text><Muted>{new Date(match.scheduledAt).toLocaleString('pt-BR')} · {match.venue}</Muted></Card><Card><Text style={styles.heading}>Equipe de arbitragem e comissões</Text>{people.map(p => <View key={p.id} style={styles.row}><Text style={styles.name}>{p.name}</Text><Text style={styles.role}>{p.role.replaceAll('_', ' ')}</Text></View>)}</Card><Card><Text style={styles.heading}>Validação local</Text><Text style={styles.ok}>✓ Dados da competição armazenados</Text><Text style={styles.ok}>✓ {roster.length} fichas de atletas disponíveis</Text><Text style={styles.ok}>✓ Arbitragem e comissões disponíveis</Text></Card></>}
    {step === 'elenco' && <>{[match.homeClubId, match.awayClubId].map(clubId => <Card key={clubId}><Text style={styles.heading}>{clubId === match.homeClubId ? match.homeName : match.awayName}</Text>{roster.filter(r => r.clubId === clubId).map(entry => <View key={entry.id} style={[styles.player, !entry.eligible && styles.blocked]}><View style={styles.playerInfo}><Text style={styles.name}>#{entry.shirtNumber ?? '—'} · {entry.athleteName}</Text><Text style={entry.eligible ? styles.ok : styles.danger}>{entry.eligible ? 'BID regular' : entry.eligibilityNote || 'INELEGÍVEL'}</Text></View><View style={styles.chips}><Pressable disabled={!entry.eligible} onPress={async () => { await updateRoster(entry, { confirmed: !entry.confirmed }); await load(); }} style={[styles.chip, entry.confirmed && styles.green]}><Text style={styles.chipText}>CHECK-IN</Text></Pressable><Pressable disabled={!entry.confirmed} onPress={async () => { await updateRoster(entry, { starter: !entry.starter }); await load(); }} style={[styles.chip, entry.starter && styles.blue]}><Text style={styles.chipText}>TITULAR</Text></Pressable><Pressable disabled={!entry.confirmed} onPress={async () => { await updateRoster(entry, { captain: !entry.captain }); await load(); }} style={[styles.chip, entry.captain && styles.yellow]}><Text style={styles.chipText}>CAPITÃO</Text></Pressable></View></View>)}</Card>)}</>}
    {step === 'assinaturas' && <Card><Text style={styles.heading}>Assinaturas pré-jogo</Text><View style={styles.tabs}>{['CAPITAO_MANDANTE', 'CAPITAO_VISITANTE', 'DELEGADO_MANDANTE', 'DELEGADO_VISITANTE'].map(role => <Pressable key={role} onPress={() => setSignerRole(role)} style={[styles.chip, signerRole === role && styles.blue]}><Text style={styles.chipText}>{role.replaceAll('_', ' ')}</Text></Pressable>)}</View><TextInput value={signerName} onChangeText={setSignerName} placeholder="Nome completo" placeholderTextColor={colors.muted} style={styles.input}/><SignaturePad onSave={sign}/>{signatures.filter(s => s.phase === 'PRE').map(s => <Text key={s.id} style={styles.ok}>✓ {s.signerRole.replaceAll('_', ' ')} · {s.signerName}</Text>)}</Card>}
    <Card><Text style={styles.heading}>Prontidão</Text><Muted>{readiness.confirmed} atletas confirmados · {readiness.blocked} impedido(s) · {readiness.signed}/4 assinaturas</Muted><Button label="Ir para operação ao vivo" disabled={!readiness.confirmed || readiness.signed < 4} onPress={() => navigation.replace('LiveMatch', { matchId: match.id })}/></Card>
  </Screen>;
}
const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  activeTab: { borderColor: colors.primary, backgroundColor: '#182312' },
  tabText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  heading: { color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: colors.borderSoft, paddingTop: 11 },
  name: { color: colors.text, fontWeight: '800' },
  role: { color: colors.muted, fontSize: 11 },
  ok: { color: colors.success, fontSize: 12, fontWeight: '700' },
  danger: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  player: { gap: 10, paddingVertical: 11, borderTopWidth: 1, borderColor: colors.borderSoft },
  blocked: { opacity: 0.45 },
  playerInfo: { gap: 3 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderSoft },
  chipText: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  green: { backgroundColor: '#10251B', borderColor: colors.success },
  blue: { backgroundColor: '#182312', borderColor: colors.primary },
  yellow: { backgroundColor: '#2A2311', borderColor: colors.warning },
  input: { color: colors.text, backgroundColor: colors.surfaceSoft, padding: 13, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
});
