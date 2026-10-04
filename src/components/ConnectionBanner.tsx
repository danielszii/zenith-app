import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { SyncQueueItem } from '../database/models';
import { colors } from '../theme';

export function ConnectionBanner() {
  const [online, setOnline] = useState(false); const [pending, setPending] = useState(0);
  useEffect(() => {
    const network = NetInfo.addEventListener(s => setOnline(Boolean(s.isConnected && s.isInternetReachable !== false)));
    const subscription = database.get<SyncQueueItem>('sync_queue').query(Q.where('state', Q.notEq('synced'))).observeCount().subscribe(setPending);
    return () => { network(); subscription.unsubscribe(); };
  }, []);
  const state = !online ? 'OFFLINE' : pending ? `A SINCRONIZAR · ${pending}` : 'SINCRONIZADO';
  return <View style={[styles.banner, { backgroundColor: !online ? colors.warning : pending ? '#286090' : colors.success }]}><View style={styles.dot} /><Text style={styles.text}>{state}</Text></View>;
}
const styles = StyleSheet.create({ banner: { paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' }, text: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1 } });
