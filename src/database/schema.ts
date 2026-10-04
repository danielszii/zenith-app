import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({ version: 2, tables: [
  tableSchema({ name: 'clubs', columns: [{ name: 'name', type: 'string' }, { name: 'badge_url', type: 'string', isOptional: true }, { name: 'colors', type: 'string', isOptional: true }] }),
  tableSchema({ name: 'athletes', columns: [
    { name: 'club_id', type: 'string', isIndexed: true }, { name: 'name', type: 'string' }, { name: 'shirt_number', type: 'number', isOptional: true },
    { name: 'status', type: 'string' }, { name: 'document', type: 'string', isOptional: true }, { name: 'photo_url', type: 'string', isOptional: true },
    { name: 'suspension_reason', type: 'string', isOptional: true },
  ]}),
  tableSchema({ name: 'championships', columns: [{ name: 'name', type: 'string' }, { name: 'category', type: 'string' }, { name: 'modality', type: 'string' }] }),
  tableSchema({ name: 'matches', columns: [
    { name: 'championship_id', type: 'string', isIndexed: true }, { name: 'home_club_id', type: 'string', isIndexed: true }, { name: 'away_club_id', type: 'string', isIndexed: true },
    { name: 'home_name', type: 'string' }, { name: 'away_name', type: 'string' }, { name: 'scheduled_at', type: 'number', isIndexed: true },
    { name: 'venue', type: 'string' }, { name: 'status', type: 'string' }, { name: 'home_score', type: 'number' }, { name: 'away_score', type: 'number' },
    { name: 'current_period', type: 'string' }, { name: 'clock_seconds', type: 'number' }, { name: 'clock_started_at', type: 'number', isOptional: true },
    { name: 'clock_running', type: 'boolean' }, { name: 'downloaded_at', type: 'number', isOptional: true }, { name: 'closed_at', type: 'number', isOptional: true },
  ]}),
  tableSchema({ name: 'roster_entries', columns: [
    { name: 'match_id', type: 'string', isIndexed: true }, { name: 'club_id', type: 'string', isIndexed: true }, { name: 'athlete_id', type: 'string', isIndexed: true },
    { name: 'athlete_name', type: 'string' }, { name: 'shirt_number', type: 'number', isOptional: true }, { name: 'confirmed', type: 'boolean' },
    { name: 'eligible', type: 'boolean' }, { name: 'eligibility_note', type: 'string', isOptional: true }, { name: 'starter', type: 'boolean' },
    { name: 'captain', type: 'boolean' }, { name: 'checked_in_at', type: 'number', isOptional: true },
  ]}),
  tableSchema({ name: 'match_events', columns: [
    { name: 'match_id', type: 'string', isIndexed: true }, { name: 'club_id', type: 'string', isIndexed: true }, { name: 'athlete_id', type: 'string', isOptional: true, isIndexed: true },
    { name: 'athlete_name', type: 'string', isOptional: true }, { name: 'related_athlete_id', type: 'string', isOptional: true }, { name: 'related_athlete_name', type: 'string', isOptional: true },
    { name: 'event_type', type: 'string' }, { name: 'event_detail', type: 'string', isOptional: true }, { name: 'period', type: 'string' },
    { name: 'minute', type: 'number' }, { name: 'second', type: 'number' }, { name: 'sequence', type: 'number', isIndexed: true },
    { name: 'occurred_at', type: 'number' }, { name: 'cancelled', type: 'boolean' },
  ]}),
  tableSchema({ name: 'match_people', columns: [
    { name: 'match_id', type: 'string', isIndexed: true }, { name: 'club_id', type: 'string', isOptional: true }, { name: 'name', type: 'string' },
    { name: 'role', type: 'string' }, { name: 'document', type: 'string', isOptional: true },
  ]}),
  tableSchema({ name: 'signatures', columns: [
    { name: 'match_id', type: 'string', isIndexed: true }, { name: 'signer_name', type: 'string' }, { name: 'signer_role', type: 'string' },
    { name: 'phase', type: 'string' }, { name: 'path_data', type: 'string' }, { name: 'signed_at', type: 'number' },
  ]}),
  tableSchema({ name: 'sync_queue', columns: [
    { name: 'match_id', type: 'string', isIndexed: true }, { name: 'operation_id', type: 'string', isIndexed: true }, { name: 'entity', type: 'string' },
    { name: 'action', type: 'string' }, { name: 'payload', type: 'string' }, { name: 'created_at', type: 'number', isIndexed: true },
    { name: 'attempts', type: 'number' }, { name: 'next_retry_at', type: 'number' }, { name: 'last_error', type: 'string', isOptional: true }, { name: 'state', type: 'string' },
  ]}),
] });
