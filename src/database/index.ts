import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import {
  Athlete,
  Championship,
  Club,
  Match,
  MatchEvent,
  MatchPerson,
  RosterEntry,
  Signature,
  SyncQueueItem,
} from './models';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'zenith_offline',
  jsi: true,
  onSetUpError: error => console.error('Falha ao abrir o banco local', error),
});

export const database = new Database({
  adapter,
  modelClasses: [Club, Athlete, Championship, Match, RosterEntry, MatchEvent, MatchPerson, Signature, SyncQueueItem],
});
