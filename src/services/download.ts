import { database } from '../database';
import { Athlete, Championship, Club, Match, MatchPerson, RosterEntry } from '../database/models';
import { apiRequest } from './api';

export type RemoteMatch = { id_partida: string; id_campeonato: string; id_mandante: string; id_visitante: string; nome_mandante: string; nome_visitante: string; nome_campeonato: string; modalidade: string; categoria: string; data: string; hora: string; local: string; status: string; gols_mandante: number; gols_visitante: number };
type Package = { partida: RemoteMatch; clubes: Array<{ id_clube: string; nome: string; brasao?: string; cores_oficiais?: string }>; atletas: Array<{ id_atleta: string; id_clube: string; nome: string; rg?: string; status: string; elegivel: boolean; observacao_elegibilidade?: string }>; pessoas: Array<{ id_pessoa: string; id_clube?: string; nome: string; funcao: string; documento?: string }>; escalacoes: Array<{ id_atleta: string; numero_camisa?: number; confirmado: boolean; elegivel: boolean; observacao_elegibilidade?: string; titular: boolean; capitao: boolean }> };
export const fetchAssignedMatches = () => apiRequest<RemoteMatch[]>('/mobile/partidas');
const scheduledAt = (p: RemoteMatch) => new Date(`${String(p.data).slice(0, 10)}T${p.hora}`).getTime();
async function optional<T>(promise: Promise<T>) { try { return await promise; } catch { return undefined; } }

export async function downloadMatchPackage(matchId: string) {
  const pack = await apiRequest<Package>(`/mobile/partidas/${matchId}/pacote`); const p = pack.partida;
  await database.write(async () => {
    let championship = await optional(database.get<Championship>('championships').find(p.id_campeonato));
    if (!championship) championship = await database.get<Championship>('championships').create(r => { r._raw.id = p.id_campeonato; r.name = p.nome_campeonato; r.category = p.categoria || ''; r.modality = p.modalidade || ''; });
    for (const c of pack.clubes) {
      const found = await optional(database.get<Club>('clubs').find(c.id_clube));
      if (found) await found.update(r => { r.name = c.nome; r.badgeUrl = c.brasao; r.colors = c.cores_oficiais; });
      else await database.get<Club>('clubs').create(r => { r._raw.id = c.id_clube; r.name = c.nome; r.badgeUrl = c.brasao; r.colors = c.cores_oficiais; });
    }
    for (const a of pack.atletas) {
      const found = await optional(database.get<Athlete>('athletes').find(a.id_atleta));
      const write = (r: Athlete) => { r.clubId = a.id_clube; r.name = a.nome; r.document = a.rg; r.status = a.status; r.suspensionReason = a.observacao_elegibilidade; };
      if (found) await found.update(write); else await database.get<Athlete>('athletes').create(r => { r._raw.id = a.id_atleta; write(r); });
    }
    let match = await optional(database.get<Match>('matches').find(p.id_partida));
    const writeMatch = (r: Match) => { r.championshipId = p.id_campeonato; r.homeClubId = p.id_mandante; r.awayClubId = p.id_visitante; r.homeName = p.nome_mandante; r.awayName = p.nome_visitante; r.scheduledAt = scheduledAt(p); r.venue = p.local; r.status = p.status === 'agendado' ? 'pre_jogo' : p.status; r.homeScore = p.gols_mandante; r.awayScore = p.gols_visitante; r.currentPeriod ||= '1T'; r.clockSeconds ||= 0; r.clockRunning = false; r.downloadedAt = Date.now(); };
    if (match) await match.update(writeMatch); else match = await database.get<Match>('matches').create(r => { r._raw.id = p.id_partida; writeMatch(r); });
    for (const person of pack.pessoas) {
      const found = await optional(database.get<MatchPerson>('match_people').find(person.id_pessoa)); const write = (r: MatchPerson) => { r.matchId = p.id_partida; r.clubId = person.id_clube; r.name = person.nome; r.role = person.funcao; r.document = person.documento; };
      if (found) await found.update(write); else await database.get<MatchPerson>('match_people').create(r => { r._raw.id = person.id_pessoa; write(r); });
    }
    const remoteRoster = new Map(pack.escalacoes.map(row => [row.id_atleta, row]));
    for (const athlete of pack.atletas) {
      const id = `${p.id_partida.slice(0, 8)}${athlete.id_atleta.slice(0, 8)}`; const found = await optional(database.get<RosterEntry>('roster_entries').find(id)); const server = remoteRoster.get(athlete.id_atleta);
      const write = (r: RosterEntry) => { r.matchId = p.id_partida; r.clubId = athlete.id_clube; r.athleteId = athlete.id_atleta; r.athleteName = athlete.nome; r.shirtNumber = server?.numero_camisa; r.confirmed = server?.confirmado ?? false; r.eligible = server?.elegivel ?? athlete.elegivel; r.eligibilityNote = server?.observacao_elegibilidade ?? athlete.observacao_elegibilidade; r.starter = server?.titular ?? false; r.captain = server?.capitao ?? false; };
      if (found) await found.update(write); else await database.get<RosterEntry>('roster_entries').create(r => { r._raw.id = id; write(r); });
    }
  });
  return p.id_partida;
}
