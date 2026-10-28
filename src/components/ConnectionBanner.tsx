import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { SyncQueueItem } from '../database/models';
import { colors } from '../theme';

export function ConnectionBanner() {
  const [online, setOnline] = useState(false);
  const [pending, setPending] = useState(0);
  useEffect(() => { const network = NetInfo.addEventListener(state => setOnline(Boolean(state.isConnected && state.isInternetReachable !== false))); const subscription = database.get<SyncQueueItem>('sync_queue').query(Q.where('state', Q.notEq('synced'))).observeCount().subscribe(setPending); return () => { network(); subscription.unsubscribe(); }; }, []);
  const label = !online ? 'OFFLINE' : pending ? `${pending} PENDENTE${pending === 1 ? '' : 'S'}` : 'SINCRONIZADO';
  const color = !online ? colors.warning : pending ? colors.warning : colors.success;
  return <View style={styles.outer}><View style={styles.wrap}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={styles.label}>{label}</Text><Text style={styles.detail}>{!online ? 'dados protegidos no aparelho' : pending ? 'aguardando envio' : 'dados atualizados'}</Text></View></View>;
}
const styles = StyleSheet.create({ outer: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft, backgroundColor: colors.surfaceSoft }, wrap: { width: '100%', maxWidth: 1180, minHeight: 34, paddingHorizontal: 18, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7 }, dot: { width: 7, height: 7, borderRadius: 4 }, label: { color: colors.text, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, detail: { marginLeft: 'auto', color: colors.muted, fontSize: 9 } });
