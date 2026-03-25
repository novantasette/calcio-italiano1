export const COMP_MAP = {
  "serie-a": { league: 135, season: 2025, label: "Serie A" },
  "serie-b": { league: 136, season: 2025, label: "Serie B" },
  "coppa-italia": { league: 137, season: 2025, label: "Coppa Italia" },
  "coppa-italia-serie-c": { league: 891, season: 2025, label: "Coppa Italia Serie C" },
  "coppa-italia-serie-d": { league: 892, season: 2025, label: "Coppa Italia Serie D" },
  "serie-c-a": { league: 138, season: 2025, label: "Serie C - Girone A" },
  "serie-c-b": { league: 942, season: 2025, label: "Serie C - Girone B" },
  "serie-c-c": { league: 943, season: 2025, label: "Serie C - Girone C" },
  "serie-c-playoff-promozione": { league: 976, season: 2025, label: "Serie C - Playoff Promozione" },
  "serie-c-playout-retrocessione": { league: 975, season: 2025, label: "Serie C - Playout Retrocessione" },
  "supercoppa-serie-c": { league: 974, season: 2025, label: "Supercoppa Serie C" },
  "serie-d-a": { league: 426, season: 2025, label: "Serie D - Girone A" },
  "serie-d-b": { league: 427, season: 2025, label: "Serie D - Girone B" },
  "serie-d-c": { league: 428, season: 2025, label: "Serie D - Girone C" },
  "serie-d-d": { league: 429, season: 2025, label: "Serie D - Girone D" },
  "serie-d-e": { league: 430, season: 2025, label: "Serie D - Girone E" },
  "serie-d-f": { league: 431, season: 2025, label: "Serie D - Girone F" },
  "serie-d-g": { league: 432, season: 2025, label: "Serie D - Girone G" },
  "serie-d-h": { league: 433, season: 2025, label: "Serie D - Girone H" },
  "serie-d-i": { league: 434, season: 2025, label: "Serie D - Girone I" },
  "serie-d-poule-scudetto": { league: 999, season: 2025, label: "Serie D - Poule Scudetto" },
  "serie-d-playoff-promozione": { league: 997, season: 2025, label: "Serie D - Playoff Promozione" },
  "serie-d-playout-retrocessione": { league: 998, season: 2025, label: "Serie D - Playout Retrocessione" },
  "serie-a-women": { league: 139, season: 2025, label: "Serie A Femminile" },
  "serie-a-cup-women": { league: 1198, season: 2025, label: "Serie A Cup Women" },
  "coppa-italia-women": { league: 1171, season: 2025, label: "Coppa Italia Women" },
  "primavera-1": { league: 705, season: 2025, label: "Campionato Primavera 1" },
  "primavera-2": { league: 706, season: 2025, label: "Campionato Primavera 2" },
  "coppa-italia-primavera": { league: 704, season: 2025, label: "Coppa Italia Primavera" },
  "supercoppa-primavera": { league: 817, season: 2025, label: "Supercoppa Primavera" },
  "champions-league": { league: 2, season: 2025, label: "UEFA Champions League" },
  "europa-league": { league: 3, season: 2025, label: "UEFA Europa League" },
  "conference-league": { league: 848, season: 2025, label: "UEFA Europa Conference League" },
  "nations-league": { league: 5, season: 2024, label: "UEFA Nations League" },
  "world-cup": { league: 1, season: 2026, label: "Mondiali" },
  "world-cup-qualifiers-europe": { league: 32, season: 2024, label: "Qualificazioni Mondiali" }
};


export async function fetchJson(url, key) {
  const r = await fetch(url, { headers: { "x-apisports-key": key } });
  const raw = await r.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (err) {
    if (!r.ok) throw new Error(raw || 'Errore API esterna');
    throw new Error('Risposta non valida dall'API esterna');
  }
  if (!r.ok) throw new Error(data?.message || raw || "Errore API esterna");
  return data;
}


export function getCfg(comp) {
  return COMP_MAP[comp];
}

export const EURO_COMP_CODES = new Set(['champions-league', 'europa-league', 'conference-league']);
export const NATIONAL_COMP_CODES = new Set(['nations-league', 'world-cup', 'world-cup-qualifiers-europe']);

const ITALIAN_CLUB_NAMES = new Set([
  'atalanta','bologna','cagliari','como','cremonese','empoli','fiorentina','genoa','hellas verona','inter','internazionale',
  'juventus','lazio','lecce','milan','ac milan','monza','napoli','parma','pisa','roma','as roma','sassuolo','torino',
  'udinese','venezia','palermo','sampdoria','bari','spezia','salernitana','frosinone'
]);

function normalizeName(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isItalianClubLike(team) {
  const country = String(team?.country || team?.team?.country || '').toLowerCase().trim();
  if (country === 'italy') return true;
  const name = normalizeName(team?.name || team?.team?.name || '');
  return ITALIAN_CLUB_NAMES.has(name);
}

export async function getItalianTeamIdsForCompetition(cfg, key) {
  const fixturesData = await fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}`, key);
  const fixtureTeams = (fixturesData.response || []).flatMap(item => [item?.teams?.home, item?.teams?.away]).filter(Boolean);
  const ids = Array.from(new Set(fixtureTeams.map(team => Number(team?.id)).filter(Boolean)));
  const teamsPayload = await Promise.all(ids.map(id => fetchJson(`https://v3.football.api-sports.io/teams?id=${id}`, key).catch(() => ({ response: [] }))));
  const fromTeamsEndpoint = teamsPayload
    .flatMap(payload => payload.response || [])
    .filter(entry => isItalianClubLike(entry))
    .map(entry => Number(entry.team?.id))
    .filter(Boolean);
  const fromFixturesFallback = fixtureTeams
    .filter(team => isItalianClubLike(team))
    .map(team => Number(team?.id))
    .filter(Boolean);
  return new Set([...fromTeamsEndpoint, ...fromFixturesFallback]);
}

export function filterFixturesByTeamIds(fixtures, allowedTeamIds) {
  if (!allowedTeamIds) return fixtures || [];
  if (!allowedTeamIds.size) return [];
  return (fixtures || []).filter(item => allowedTeamIds.has(Number(item?.teams?.home?.id)) || allowedTeamIds.has(Number(item?.teams?.away?.id)));
}

export function filterStandingsByTeamIds(standings, allowedTeamIds) {
  const rows = Array.isArray(standings?.[0]) ? standings.flat() : (standings || []);
  if (!allowedTeamIds) return rows;
  if (!allowedTeamIds.size) return [];
  return rows.filter(row => allowedTeamIds.has(Number(row?.team?.id)) || isItalianClubLike(row?.team));
}

export function isFinishedFixture(item) {
  return ['FT', 'AET', 'PEN'].includes(String(item?.fixture?.status?.short || ''));
}

export function isLiveFixture(item) {
  return ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(String(item?.fixture?.status?.short || ''));
}

export function isScheduledFixture(item) {
  return !isFinishedFixture(item) && !isLiveFixture(item);
}

function pairKey(item) {
  const ids = [Number(item?.teams?.home?.id || 0), Number(item?.teams?.away?.id || 0)].sort((a, b) => a - b);
  return ids.join('-');
}

export function buildRecentItalianEuroSummary(fixtures, allowedTeamIds, maxItems = 8) {
  const finished = (fixtures || []).filter(isFinishedFixture).sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
  const grouped = new Map();
  for (const item of finished) {
    const key = pairKey(item);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }

  const summaries = [];
  for (const matches of grouped.values()) {
    matches.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
    const latest = matches[matches.length - 1];
    const refHome = latest?.teams?.home || {};
    const refAway = latest?.teams?.away || {};
    const homeItalian = allowedTeamIds?.has(Number(refHome.id));
    const awayItalian = allowedTeamIds?.has(Number(refAway.id));
    if (!homeItalian && !awayItalian) continue;

    let aggHome = 0;
    let aggAway = 0;
    for (const match of matches) {
      const sameOrientation = Number(match?.teams?.home?.id) === Number(refHome.id);
      const hg = Number(match?.goals?.home ?? 0);
      const ag = Number(match?.goals?.away ?? 0);
      if (sameOrientation) {
        aggHome += hg;
        aggAway += ag;
      } else {
        aggHome += ag;
        aggAway += hg;
      }
    }

    let qualifiedId = null;
    if (aggHome !== aggAway) {
      qualifiedId = aggHome > aggAway ? Number(refHome.id) : Number(refAway.id);
    } else if (String(latest?.fixture?.status?.short || '') === 'PEN') {
      const pHome = Number(latest?.score?.penalty?.home ?? -1);
      const pAway = Number(latest?.score?.penalty?.away ?? -1);
      if (pHome >= 0 && pAway >= 0 && pHome !== pAway) {
        qualifiedId = pHome > pAway ? Number(refHome.id) : Number(refAway.id);
      }
    }

    summaries.push({
      updatedAt: latest?.fixture?.date,
      home: {
        id: refHome.id,
        name: refHome.name,
        score: latest?.goals?.home ?? '-',
        aggregate: aggHome,
        qualified: Number(refHome.id) === qualifiedId
      },
      away: {
        id: refAway.id,
        name: refAway.name,
        score: latest?.goals?.away ?? '-',
        aggregate: aggAway,
        qualified: Number(refAway.id) === qualifiedId
      },
      legs: matches.length
    });
  }

  summaries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return summaries.slice(0, maxItems);
}
