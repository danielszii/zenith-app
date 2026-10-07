import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Screen } from '../components/Screen';
import { Button, Eyebrow, Muted } from '../components/UI';
import { pendingCount, syncDatabase } from '../services/sync';
import { colors, radius } from '../theme';

export function SyncScreen() {
  const [online, setOnline] = useState(false); const [pending, setPending] = useState(0); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const refresh = async () => setPending(await pendingCount());
  useEffect(() => { refresh(); return NetInfo.addEventListener(state => setOnline(Boolean(state.isConnected && state.isInternetReachable !== false))); }, []);
  const sync = async () => { setBusy(true); setMessage(''); try { await syncDatabase(); setMessage('Fila enviada e confirmada pelo servidor.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Falha ao sincronizar.'); } finally { await refresh(); setBusy(false); } };

  return <Screen><View style={styles.hero}><Eyebrow>Persistência offline</Eyebrow><Text style={styles.title}>CENTRAL DE{`\n`}SINCRONIZAÇÃO</Text><Muted>Operações enviadas em lote, na ordem correta e sem duplicidade.</Muted></View><View style={styles.metrics}><Metric label="CONEXÃO" value={online ? 'ONLINE' : 'OFFLINE'} color={online ? colors.success : colors.warning} /><Metric label="FILA LOCAL" value={String(pending).padStart(2, '0')} color={pending ? colors.warning : colors.success} /></View><Button label={busy ? 'SINCRONIZANDO…' : 'SINCRONIZAR AGORA'} disabled={busy || !online || !pending} onPress={sync} />{message ? <Text style={styles.message}>{message}</Text> : null}<View style={styles.policy}><Text style={styles.policyTitle}>SEUS DADOS ESTÃO PROTEGIDOS</Text><Muted>Falhas usam tentativa automática progressiva. Um item só deixa a fila após a confirmação do servidor. Fechar o aplicativo ou perder energia não elimina eventos.</Muted></View></Screen>;
}
function Metric({ label, value, color }: { label: string; value: string; color: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, { color }]}>{value}</Text></View>; }
const styles = StyleSheet.create({ hero: { gap: 8, paddingVertical: 12 }, title: { color: colors.text, fontSize: 38, lineHeight: 39, fontWeight: '900', letterSpacing: -1.5 }, metrics: { flexDirection: 'row', gap: 10 }, metric: { flex: 1, minHeight: 112, padding: 15, justifyContent: 'space-between', backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.md }, metricLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, metricValue: { fontSize: 27, fontWeight: '900' }, message: { color: colors.warning, padding: 12, backgroundColor: colors.surface, borderRadius: radius.sm, fontSize: 12 }, policy: { marginTop: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 }, policyTitle: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 } });
