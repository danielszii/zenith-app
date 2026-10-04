import NetInfo from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { SyncQueueItem } from '../database/models';
import { retryDelay } from '../domain/matchRules';
import { apiRequest, getSession } from './api';

let syncing = false; let unsubscribe: (() => void) | undefined;
export const pendingCount = () => database.get<SyncQueueItem>('sync_queue').query(Q.where('state', Q.notEq('synced'))).fetchCount();
export const hasPendingChanges = async () => (await pendingCount()) > 0;

export async function syncDatabase() {
  if (syncing) return; const network = await NetInfo.fetch();
  if (!network.isConnected || network.isInternetReachable === false) throw new Error('Sem internet. Os dados continuam protegidos no aparelho.');
  const queue = await database.get<SyncQueueItem>('sync_queue').query(Q.where('state', Q.notEq('synced')), Q.where('next_retry_at', Q.lte(Date.now())), Q.sortBy('created_at', Q.asc)).fetch();
  if (!queue.length) return;
  syncing = true;
  try {
    const payload = { deviceId: 'zenith-mobile', sentAt: Date.now(), operations: queue.map(item => ({ operationId: item.operationId, matchId: item.matchId, entity: item.entity, action: item.action, timestamp: item.createdAt, data: JSON.parse(item.payload) })) };
    const result = await apiRequest<{ acceptedOperationIds?: string[] }>('/mobile/sync', { method: 'POST', body: JSON.stringify(payload) });
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
  const run = async () => { if (await getSession()) await syncDatabase(); };
  let debounce: ReturnType<typeof setTimeout> | undefined;
  const interval = setInterval(() => { run().catch(() => undefined); }, 30000);
  const network = NetInfo.addEventListener(state => { if (state.isConnected && state.isInternetReachable !== false) run().catch(() => undefined); });
  const queue = database.get<SyncQueueItem>('sync_queue').query(Q.where('state', 'pending')).observeCount().subscribe(count => {
    if (!count) return; if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => run().catch(() => undefined), 700);
  });
  unsubscribe = () => { network(); queue.unsubscribe(); };
  return () => { clearInterval(interval); if (debounce) clearTimeout(debounce); unsubscribe?.(); unsubscribe = undefined; };
}
