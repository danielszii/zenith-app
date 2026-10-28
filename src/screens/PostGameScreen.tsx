import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ResponsiveRow, Screen } from '../components/Screen';
import { Badge, Button, Card, Muted, PageHeader, SectionTitle } from '../components/UI';
import { SignaturePad } from '../components/SignaturePad';
import { Match, MatchEvent, Signature } from '../database/models';
import { closeMatch, fetchEvents, fetchMatch, fetchSignatures, saveSignature } from '../services/localData';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PostGame'>;
const roles = ['ARBITRO_PRINCIPAL', 'CAPITAO_MANDANTE', 'CAPITAO_VISITANTE', 'DELEGADO_MANDANTE', 'DELEGADO_VISITANTE'];
export function PostGameScreen({ route, navigation }: Props) {
  const [match, setMatch] = useState<Match | null>(null); const [events, setEvents] = useState<MatchEvent[]>([]); const [signatures, setSignatures] = useState<Signature[]>([]); const [role, setRole] = useState(roles[0]); const [name, setName] = useState('');
  const load = useCallback(async () => { setMatch(await fetchMatch(route.params.matchId)); setEvents(await fetchEvents(route.params.matchId)); setSignatures(await fetchSignatures(route.params.matchId)); }, [route.params.matchId]);
  useEffect(() => { load(); }, [load]);
  if (!match) return <Screen><Muted>Carregando fechamento…</Muted></Screen>;
  const post = signatures.filter(signature => signature.phase === 'POST');
  const sign = async (data: string) => { if (!name.trim()) return Alert.alert('Informe o nome do signatário'); await saveSignature(match.id, name.trim(), role, 'POST', data); setName(''); await load(); };
  const finish = async () => { if (post.length < roles.length) return Alert.alert('Assinaturas pendentes', 'Colete todas as assinaturas obrigatórias antes de fechar.'); await closeMatch(match); Alert.alert('Súmula fechada', 'O documento está seguro no aparelho e entrou na fila de sincronização.'); navigation.popToTop(); };
  const metrics = [{ label: 'GOLS', value: events.filter(event => event.eventType === 'GOL').length }, { label: 'AMARELOS', value: events.filter(event => event.eventType === 'CARTAO_AMARELO').length }, { label: 'VERMELHOS', value: events.filter(event => event.eventType === 'CARTAO_VERMELHO').length }, { label: 'SUBSTITUIÇÕES', value: events.filter(event => event.eventType === 'SUBSTITUICAO').length }];

  return <Screen>
    <PageHeader eyebrow="Conferência oficial" title="Fechamento" description="Revise os registros e colete as assinaturas obrigatórias." action={<Badge label={`${post.length}/${roles.length} ASSINATURAS`} tone={post.length === roles.length ? 'success' : 'warning'} />} />
    <Card accent><View style={styles.score}><Text style={styles.team}>{match.homeName}</Text><Text style={styles.scoreValue}>{match.homeScore} × {match.awayScore}</Text><Text style={[styles.team, styles.right]}>{match.awayName}</Text></View><View style={styles.metrics}>{metrics.map(metric => <View key={metric.label} style={styles.metric}><Text style={styles.metricValue}>{metric.value}</Text><Text style={styles.metricLabel}>{metric.label}</Text></View>)}</View><Muted>Confira os dados. Após o fechamento, correções devem seguir o fluxo administrativo.</Muted></Card>
    <ResponsiveRow><Card style={styles.signature}><SectionTitle>Assinatura pós-jogo</SectionTitle><View style={styles.roles}>{roles.map(item => <Pressable key={item} onPress={() => setRole(item)} style={[styles.role, role === item && styles.roleActive]}><Text style={[styles.roleText, role === item && styles.roleTextActive]}>{item.replaceAll('_', ' ')}</Text></Pressable>)}</View><TextInput value={name} onChangeText={setName} placeholder="Nome completo" placeholderTextColor={colors.muted} style={styles.input} /><SignaturePad onSave={sign} /></Card><Card style={styles.status}><SectionTitle>Validação</SectionTitle>{roles.map(item => { const signature = post.find(value => value.signerRole === item); return <View key={item} style={styles.statusRow}><View style={styles.statusCopy}><Text style={styles.statusRole}>{item.replaceAll('_', ' ')}</Text>{signature ? <Text style={styles.signer}>{signature.signerName}</Text> : null}</View><Badge label={signature ? 'ASSINADO' : 'PENDENTE'} tone={signature ? 'success' : 'warning'} /></View>; })}</Card></ResponsiveRow>
    <Button label={match.status === 'encerrado' ? 'Súmula já encerrada' : 'Fechar súmula definitivamente'} tone="danger" disabled={post.length < roles.length || match.status === 'encerrado'} onPress={finish} />
  </Screen>;
}

const styles = StyleSheet.create({
  score: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12 }, team: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' }, right: { textAlign: 'right' }, scoreValue: { color: colors.text, fontSize: 42, fontWeight: '900' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.borderSoft }, metric: { flex: 1, minWidth: 110, alignItems: 'center', gap: 3 }, metricValue: { color: colors.primary, fontSize: 28, fontWeight: '900' }, metricLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: .8 },
  signature: { flex: 1.5 }, status: { flex: 1 }, roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, role: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderSoft }, roleActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, roleText: { color: colors.muted, fontSize: 9, fontWeight: '900' }, roleTextActive: { color: colors.text },
  input: { minHeight: 52, color: colors.text, backgroundColor: colors.surfaceSoft, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border }, statusRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: colors.borderSoft }, statusCopy: { flex: 1, gap: 3 }, statusRole: { color: colors.text, fontSize: 10, fontWeight: '900' }, signer: { color: colors.muted, fontSize: 10 },
});
