import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ResponsiveRow, Screen } from '../components/Screen';
import { Badge, Button, Card, Muted, PageHeader, SectionTitle, SegmentedControl } from '../components/UI';
import { SignaturePad } from '../components/SignaturePad';
import { Match, MatchPerson, RosterEntry, Signature } from '../database/models';
import { fetchMatch, fetchPeople, fetchRoster, fetchSignatures, saveSignature, updateRoster } from '../services/localData';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PreGame'>;
type Step = 'dados' | 'elenco' | 'assinaturas';
const signerRoles = ['CAPITAO_MANDANTE', 'CAPITAO_VISITANTE', 'DELEGADO_MANDANTE', 'DELEGADO_VISITANTE'];

export function PreGameScreen({ route, navigation }: Props) {
  const [match, setMatch] = useState<Match | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [people, setPeople] = useState<MatchPerson[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [step, setStep] = useState<Step>('dados');
  const [signerRole, setSignerRole] = useState(signerRoles[0]);
  const [signerName, setSignerName] = useState('');
  const load = useCallback(async () => { setMatch(await fetchMatch(route.params.matchId)); setRoster(await fetchRoster(route.params.matchId)); setPeople(await fetchPeople(route.params.matchId)); setSignatures(await fetchSignatures(route.params.matchId)); }, [route.params.matchId]);
  useEffect(() => { load(); }, [load]);
  const readiness = useMemo(() => ({ confirmed: roster.filter(r => r.confirmed).length, blocked: roster.filter(r => !r.eligible).length, signed: signatures.filter(s => s.phase === 'PRE').length }), [roster, signatures]);
  if (!match) return <Screen><Muted>Carregando pacote da partida…</Muted></Screen>;
  const sign = async (data: string) => { if (!signerName.trim()) return Alert.alert('Informe o nome do signatário'); await saveSignature(match.id, signerName.trim(), signerRole, 'PRE', data); setSignerName(''); await load(); Alert.alert('Assinatura salva offline'); };

  return <Screen>
    <PageHeader eyebrow="Pacote offline" title="Pré-jogo" description={`Baixado ${match.downloadedAt ? new Date(match.downloadedAt).toLocaleString('pt-BR') : 'neste aparelho'}`} action={<Badge label={`${readiness.confirmed} CONFIRMADOS`} tone="primary" />} />
    <SegmentedControl value={step} onChange={setStep} options={[{ value: 'dados', label: '01  DADOS' }, { value: 'elenco', label: '02  ELENCO' }, { value: 'assinaturas', label: '03  ASSINATURAS' }]} />
    {step === 'dados' ? <ResponsiveRow><Card accent style={styles.column}><SectionTitle>{match.homeName} × {match.awayName}</SectionTitle><Muted>{new Date(match.scheduledAt).toLocaleString('pt-BR')} · {match.venue}</Muted><View style={styles.validation}><Validation text="Dados da competição armazenados" /><Validation text={`${roster.length} fichas de atletas disponíveis`} /><Validation text="Arbitragem e comissões disponíveis" /></View></Card><Card style={styles.column}><SectionTitle>Equipe da partida</SectionTitle>{people.map(person => <View key={person.id} style={styles.person}><View><Text style={styles.name}>{person.name}</Text><Text style={styles.role}>{person.role.replaceAll('_', ' ')}</Text></View><Badge label="VALIDADO" tone="success" /></View>)}</Card></ResponsiveRow> : null}
    {step === 'elenco' ? <ResponsiveRow>{[match.homeClubId, match.awayClubId].map(clubId => <Card key={clubId} style={styles.column}><View style={styles.cardHeader}><SectionTitle>{clubId === match.homeClubId ? match.homeName : match.awayName}</SectionTitle><Text style={styles.count}>{roster.filter(r => r.clubId === clubId && r.confirmed).length}/{roster.filter(r => r.clubId === clubId).length}</Text></View>{roster.filter(r => r.clubId === clubId).map(entry => <PlayerRow key={entry.id} entry={entry} reload={load} />)}</Card>)}</ResponsiveRow> : null}
    {step === 'assinaturas' ? <ResponsiveRow><Card style={styles.signatureColumn}><SectionTitle>Assinatura pré-jogo</SectionTitle><View style={styles.chips}>{signerRoles.map(role => <Choice key={role} active={signerRole === role} label={role.replaceAll('_', ' ')} onPress={() => setSignerRole(role)} />)}</View><TextInput value={signerName} onChangeText={setSignerName} placeholder="Nome completo" placeholderTextColor={colors.muted} style={styles.input} /><SignaturePad onSave={sign} /></Card><Card style={styles.statusColumn}><SectionTitle>Assinaturas coletadas</SectionTitle>{signerRoles.map(role => { const signature = signatures.find(s => s.phase === 'PRE' && s.signerRole === role); return <View key={role} style={styles.signatureStatus}><Text style={styles.role}>{role.replaceAll('_', ' ')}</Text><Badge label={signature ? signature.signerName : 'PENDENTE'} tone={signature ? 'success' : 'warning'} /></View>; })}</Card></ResponsiveRow> : null}
    <Card accent><View style={styles.readyRow}><View style={styles.readyCopy}><SectionTitle>Prontidão da partida</SectionTitle><Muted>{readiness.confirmed} atletas confirmados · {readiness.blocked} impedido(s) · {readiness.signed}/4 assinaturas</Muted></View><Button label="Ir para operação ao vivo" disabled={!readiness.confirmed || readiness.signed < 4} onPress={() => navigation.replace('LiveMatch', { matchId: match.id })} /></View></Card>
  </Screen>;
}

function Validation({ text }: { text: string }) { return <View style={styles.validationRow}><Text style={styles.check}>✓</Text><Text style={styles.validationText}>{text}</Text></View>; }
function Choice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>; }
function PlayerRow({ entry, reload }: { entry: RosterEntry; reload: () => Promise<void> }) { return <View style={[styles.player, !entry.eligible && styles.blocked]}><View style={styles.playerTop}><View style={styles.number}><Text style={styles.numberText}>{entry.shirtNumber ?? '—'}</Text></View><View style={styles.playerInfo}><Text style={styles.name}>{entry.athleteName}</Text><Text style={entry.eligible ? styles.ok : styles.danger}>{entry.eligible ? 'BID regular' : entry.eligibilityNote || 'INELEGÍVEL'}</Text></View></View><View style={styles.chips}><Choice active={entry.confirmed} label="CHECK-IN" onPress={async () => { if (!entry.eligible) return; await updateRoster(entry, { confirmed: !entry.confirmed }); await reload(); }} /><Choice active={entry.starter} label="TITULAR" onPress={async () => { if (!entry.confirmed) return; await updateRoster(entry, { starter: !entry.starter }); await reload(); }} /><Choice active={entry.captain} label="CAPITÃO" onPress={async () => { if (!entry.confirmed) return; await updateRoster(entry, { captain: !entry.captain }); await reload(); }} /></View></View>; }

const styles = StyleSheet.create({
  column: { flex: 1 }, signatureColumn: { flex: 1.6 }, statusColumn: { flex: 1 }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, count: { color: colors.primary, fontWeight: '900' },
  validation: { marginTop: spacing.sm, gap: 9 }, validationRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, check: { color: colors.success, fontWeight: '900' }, validationText: { color: colors.textSoft, fontSize: 12 },
  person: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderColor: colors.borderSoft, paddingTop: 10 }, name: { color: colors.text, fontWeight: '800' }, role: { color: colors.muted, fontSize: 10, textTransform: 'uppercase' },
  player: { gap: 10, paddingVertical: 12, borderTopWidth: 1, borderColor: colors.borderSoft }, blocked: { opacity: .4 }, playerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, number: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised }, numberText: { color: colors.primary, fontWeight: '900' }, playerInfo: { flex: 1, gap: 3 }, ok: { color: colors.success, fontSize: 10, fontWeight: '700' }, danger: { color: colors.danger, fontSize: 10, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' }, chip: { minHeight: 36, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderSoft }, chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, chipText: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: .4 }, chipTextActive: { color: colors.text },
  input: { minHeight: 52, color: colors.text, backgroundColor: colors.surfaceSoft, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border }, signatureStatus: { minHeight: 52, gap: 8, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.borderSoft },
  readyRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md }, readyCopy: { flex: 1, minWidth: 250, gap: 4 },
});
