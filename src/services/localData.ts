import { Q } from '@nozbe/watermelondb';
import { database } from '../database';
import { Athlete, Championship, Club, Match, MatchEvent, MatchPerson, RosterEntry, Signature, SyncQueueItem } from '../database/models';
import { shouldAutoExpel } from '../domain/matchRules';

declare module '../database/models' {
  interface Athlete { athleteId?: string; athleteName?: string }
  interface RosterEntry { name?: string }
}

export type EventInput = { match: Match; type: string; clubId: string; athlete?: Athlete | RosterEntry; relatedAthlete?: RosterEntry; detail?: string };
const getAthleteId = (athlete?: Athlete | RosterEntry) => athlete ? ('athleteId' in athlete ? athlete.athleteId : athlete.id) : undefined;
const getAthleteName = (athlete?: Athlete | RosterEntry) => athlete ? ('athleteName' in athlete ? athlete.athleteName : athlete.name) : undefined;
const operationId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
async function enqueue(matchId: string, entity: string, action: string, payload: object) {
  await database.get<SyncQueueItem>('sync_queue').create(item => {
    item.matchId = matchId; item.operationId = operationId(); item.entity = entity; item.action = action;
    item.payload = JSON.stringify(payload); item.createdAt = Date.now(); item.attempts = 0; item.nextRetryAt = 0; item.state = 'pending';
  });
}

export async function seedDemoData() {
  if (await database.get<Match>('matches').query().fetchCount()) return;
  await database.write(async () => {
    const home = await database.get<Club>('clubs').create(r => { r.name = 'Zenith Futsal'; r.colors = 'Preto e branco'; });
    const away = await database.get<Club>('clubs').create(r => { r.name = 'Atlético Central'; r.colors = 'Azul e branco'; });
    const championship = await database.get<Championship>('championships').create(r => { r.name = 'Liga Zenith'; r.category = 'Adulto'; r.modality = 'Futsal'; });
    const athletes: Athlete[] = [];
    for (const [clubId, prefix] of [[home.id, 'Zenith'], [away.id, 'Atlético']] as const) {
      for (let number = 1; number <= 12; number += 1) athletes.push(await database.get<Athlete>('athletes').create(a => {
        a.clubId = clubId; a.name = `${prefix} ${number}`; a.shirtNumber = number; a.document = `BID-${clubId.slice(0, 4)}-${number}`;
        a.status = number === 12 && clubId === away.id ? 'suspenso' : 'ativo'; a.suspensionReason = a.status === 'suspenso' ? 'Suspensão automática por cartões' : undefined;
      }));
    }
    const match = await database.get<Match>('matches').create(r => {
      r.championshipId = championship.id; r.homeClubId = home.id; r.awayClubId = away.id; r.homeName = home.name; r.awayName = away.name;
      r.scheduledAt = Date.now() + 3600000; r.venue = 'Ginásio Zenith'; r.status = 'pre_jogo'; r.homeScore = 0; r.awayScore = 0;
      r.currentPeriod = '1T'; r.clockSeconds = 0; r.clockRunning = false; r.downloadedAt = Date.now();
    });
    for (const [name, role, clubId] of [['Rafael Souza', 'ARBITRO_PRINCIPAL', undefined], ['Marina Lima', 'SEGUNDO_ARBITRO', undefined], ['Carlos Mendes', 'DELEGADO', home.id], ['João Alves', 'DELEGADO', away.id], ['Paulo Reis', 'TECNICO', home.id], ['André Melo', 'TECNICO', away.id]] as const) await database.get<MatchPerson>('match_people').create(p => { p.matchId = match.id; p.name = name; p.role = role; p.clubId = clubId; });
    for (const athlete of athletes) await database.get<RosterEntry>('roster_entries').create(r => {
      r.matchId = match.id; r.clubId = athlete.clubId; r.athleteId = athlete.id; r.athleteName = athlete.name; r.shirtNumber = athlete.shirtNumber;
      r.confirmed = false; r.eligible = athlete.status === 'ativo'; r.eligibilityNote = athlete.suspensionReason; r.starter = false; r.captain = false;
    });
  });
}

export const fetchMatches = () => database.get<Match>('matches').query(Q.sortBy('scheduled_at', Q.asc)).fetch();
export const fetchMatch = (id: string) => database.get<Match>('matches').find(id);
export const fetchAthletes = (clubIds: string[]) => database.get<Athlete>('athletes').query(Q.where('club_id', Q.oneOf(clubIds)), Q.sortBy('shirt_number', Q.asc)).fetch();
export const fetchRoster = (matchId: string) => database.get<RosterEntry>('roster_entries').query(Q.where('match_id', matchId), Q.sortBy('shirt_number', Q.asc)).fetch();
export const fetchEvents = (matchId: string) => database.get<MatchEvent>('match_events').query(Q.where('match_id', matchId), Q.where('cancelled', false), Q.sortBy('sequence', Q.desc)).fetch();
export const fetchPeople = (matchId: string) => database.get<MatchPerson>('match_people').query(Q.where('match_id', matchId)).fetch();
export const fetchSignatures = (matchId: string) => database.get<Signature>('signatures').query(Q.where('match_id', matchId)).fetch();

export async function updateRoster(entry: RosterEntry, patch: Partial<Pick<RosterEntry, 'confirmed' | 'starter' | 'captain' | 'shirtNumber'>>) {
  await database.write(async () => {
    if (patch.captain) {
      const team = await database.get<RosterEntry>('roster_entries').query(Q.where('match_id', entry.matchId), Q.where('club_id', entry.clubId), Q.where('captain', true)).fetch();
      await Promise.all(team.map(row => row.update(r => { r.captain = false; })));
    }
    await entry.update(r => { if (patch.confirmed !== undefined) { r.confirmed = patch.confirmed; r.checkedInAt = patch.confirmed ? Date.now() : undefined; } if (patch.starter !== undefined) r.starter = patch.starter; if (patch.captain !== undefined) r.captain = patch.captain; if (patch.shirtNumber !== undefined) r.shirtNumber = patch.shirtNumber; });
    await enqueue(entry.matchId, 'roster', 'upsert', {
      id: entry.id, athleteId: entry.athleteId, clubId: entry.clubId,
      shirtNumber: patch.shirtNumber ?? entry.shirtNumber,
      confirmed: patch.confirmed ?? entry.confirmed,
      eligible: entry.eligible, eligibilityNote: entry.eligibilityNote,
      starter: patch.starter ?? entry.starter, captain: patch.captain ?? entry.captain,
      timestamp: Date.now(),
    });
  });
}

export async function saveSignature(matchId: string, name: string, role: string, phase: 'PRE' | 'POST', pathData: string) {
  await database.write(async () => {
    const previous = await database.get<Signature>('signatures').query(Q.where('match_id', matchId), Q.where('signer_role', role), Q.where('phase', phase)).fetch();
    await Promise.all(previous.map(row => row.markAsDeleted()));
    const signature = await database.get<Signature>('signatures').create(r => { r.matchId = matchId; r.signerName = name; r.signerRole = role; r.phase = phase; r.pathData = pathData; r.signedAt = Date.now(); });
    await enqueue(matchId, 'signature', 'upsert', { id: signature.id, name, role, phase, pathData, signedAt: signature.signedAt });
  });
}

export function elapsedSeconds(match: Match, referenceTime = Date.now()) { return match.clockSeconds + (match.clockRunning && match.clockStartedAt ? Math.floor((referenceTime - match.clockStartedAt) / 1000) : 0); }
export async function controlClock(match: Match, action: 'start' | 'pause' | 'reset' | 'next') {
  await database.write(async () => {
    const elapsed = elapsedSeconds(match);
    await match.update(r => {
      if (action === 'start') { r.clockRunning = true; r.clockStartedAt = Date.now(); r.status = 'em_andamento'; }
      if (action === 'pause') { r.clockSeconds = elapsed; r.clockRunning = false; r.clockStartedAt = undefined; }
      if (action === 'reset') { r.clockSeconds = 0; r.clockRunning = false; r.clockStartedAt = undefined; }
      if (action === 'next') { const periods = ['1T', '2T', 'PRORROGACAO_1', 'PRORROGACAO_2', 'PENALTIS']; r.currentPeriod = periods[Math.min(periods.indexOf(r.currentPeriod) + 1, periods.length - 1)]; r.clockSeconds = 0; r.clockRunning = false; r.clockStartedAt = undefined; }
    });
    await enqueue(match.id, 'clock', action, { period: match.currentPeriod, elapsed, timestamp: Date.now() });
  });
}

export async function addEvent(input: EventInput) {
  const { match, athlete, relatedAthlete, type, clubId, detail } = input;
  await database.write(async () => {
    const seconds = elapsedSeconds(match); const sequence = Date.now();
    const event = await database.get<MatchEvent>('match_events').create(r => {
      r.matchId = match.id; r.clubId = clubId; r.athleteId = getAthleteId(athlete); r.athleteName = getAthleteName(athlete);
      r.relatedAthleteId = relatedAthlete?.athleteId; r.relatedAthleteName = relatedAthlete?.athleteName; r.eventType = type; r.eventDetail = detail;
      r.period = match.currentPeriod; r.minute = Math.floor(seconds / 60); r.second = seconds % 60; r.sequence = sequence; r.occurredAt = Date.now(); r.cancelled = false;
    });
    if (type === 'GOL') await match.update(r => {
      const scoringClub = detail === 'CONTRA' ? (clubId === match.homeClubId ? match.awayClubId : match.homeClubId) : clubId;
      if (scoringClub === match.homeClubId) r.homeScore += 1; else r.awayScore += 1;
    });
    await enqueue(match.id, 'event', 'create', { id: event.id, type, detail, clubId, athleteId: event.athleteId, relatedAthleteId: event.relatedAthleteId, period: event.period, minute: event.minute, second: event.second, sequence });
    if (type === 'CARTAO_AMARELO' && athlete) {
      const athleteId = getAthleteId(athlete)!;
      const yellows = await database.get<MatchEvent>('match_events').query(Q.where('match_id', match.id), Q.where('athlete_id', athleteId), Q.where('event_type', 'CARTAO_AMARELO'), Q.where('cancelled', false)).fetchCount();
      if (shouldAutoExpel(yellows)) {
        const red = await database.get<MatchEvent>('match_events').create(r => { r.matchId = match.id; r.clubId = clubId; r.athleteId = athleteId; r.athleteName = athlete.athleteName ?? athlete.name; r.eventType = 'CARTAO_VERMELHO'; r.eventDetail = 'Expulsão automática por segundo amarelo'; r.period = match.currentPeriod; r.minute = Math.floor(seconds / 60); r.second = seconds % 60; r.sequence = sequence + 1; r.occurredAt = Date.now(); r.cancelled = false; });
        await enqueue(match.id, 'event', 'create', { id: red.id, type: red.eventType, detail: red.eventDetail, automatic: true, clubId, athleteId, period: red.period, minute: red.minute, second: red.second, sequence: red.sequence });
      }
    }
  });
}

export async function closeMatch(match: Match) { await database.write(async () => { await match.update(r => { r.status = 'encerrado'; r.clockRunning = false; r.clockStartedAt = undefined; r.closedAt = Date.now(); }); await enqueue(match.id, 'match', 'close', { closedAt: Date.now(), score: [match.homeScore, match.awayScore] }); }); }
