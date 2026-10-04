import NetInfo from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { SyncQueueItem } from '../database/models';
import { retryDelay } from '../domain/matchRules';

export const API_URL = 'http://10.0.2.2:3000';
let syncing = false; let unsubscribe: (() => void) | undefined;
export const pendingCount = () => database.get<SyncQueueItem>('sync_queue').query(Q.where('state', Q.notEq('synced'))).fetchCount();
export const hasPendingChanges = async () => (await pendingCount()) > 0;

export async function syncDatabase(token?: string) {
  if (syncing) return; const network = await NetInfo.fetch();
  if (!network.isConnected || network.isInternetReachable === false) throw new Error('Sem internet. Os dados continuam protegidos no aparelho.');
  const queue = await database.get<SyncQueueItem>('sync_queue').query(Q.where('state', Q.notEq('synced')), Q.where('next_retry_at', Q.lte(Date.now())), Q.sortBy('created_at', Q.asc)).fetch();
  if (!queue.length) return;
  syncing = true;
  try {
    const payload = { deviceId: 'zenith-mobile', sentAt: Date.now(), operations: queue.map(item => ({ operationId: item.operationId, matchId: item.matchId, entity: item.entity, action: item.action, timestamp: item.createdAt, data: JSON.parse(item.payload) })) };
    const response = await fetch(`${API_URL}/mobile/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`Servidor recusou a sincronização (${response.status}).`);
    const result = await response.json() as { acceptedOperationIds?: string[] };
    const accepted = new Set(result.acceptedOperationIds ?? queue.map(i => i.operationId));
    await database.write(async () => Promise.all(queue.filter(i => accepted.has(i.operationId)).map(i => i.markAsDeleted())));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida';
    await database.write(async () => Promise.all(queue.map(item => item.update(r => { r.attempts += 1; r.state = 'failed'; r.lastError = message; r.nextRetryAt = Date.now() + retryDelay(r.attempts); }))));
    throw error;
  } finally { syncing = false; }
}

export function startAutoSync() {
  if (unsubscribe) return unsubscribe;
  const interval = setInterval(() => { syncDatabase().catch(() => undefined); }, 30000);
  unsubscribe = NetInfo.addEventListener(state => { if (state.isConnected && state.isInternetReachable !== false) syncDatabase().catch(() => undefined); });
  return () => { clearInterval(interval); unsubscribe?.(); unsubscribe = undefined; };
}
