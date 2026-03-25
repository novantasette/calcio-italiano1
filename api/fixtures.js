import {
  EURO_COMP_CODES,
  NATIONAL_COMP_CODES,
  fetchJson,
  filterFixturesByTeamIds,
  getCfg,
  getItalianTeamIdsForCompetition,
  isLiveFixture,
  isScheduledFixture,
  buildRecentItalianEuroSummary
} from './_map.js';

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: 'API KEY mancante' });

  const comp = req.query.competition;
  const cfg = getCfg(comp);
  if (!cfg) return res.status(400).json({ error: 'Competizione non supportata in questa versione.' });

  try {
    let merged = [];
    if (EURO_COMP_CODES.has(comp)) {
      const seasonData = await fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}`, key);
      merged = seasonData.response || [];
    } else if (NATIONAL_COMP_CODES.has(comp)) {
      const teamId = Number(req.query.team || 768);
      const seasonData = await fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&team=${teamId}`, key);
      merged = seasonData.response || [];
    } else {
      const [nextData, lastData] = await Promise.all([
        fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&next=50`, key),
        fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&last=120`, key)
      ]);
      merged = [...(lastData.response || []), ...(nextData.response || [])];
    }

    const uniq = [];
    const seen = new Set();
    for (const item of merged) {
      const id = item?.fixture?.id;
      if (id && !seen.has(id)) {
        seen.add(id);
        uniq.push(item);
      }
    }

    let filtered = uniq;
    let italianTeamIds = null;
    let europeEliminated = false;
    let recentItalianResults = [];

    if (EURO_COMP_CODES.has(comp)) {
      italianTeamIds = await getItalianTeamIdsForCompetition(cfg, key);
      filtered = filterFixturesByTeamIds(uniq, italianTeamIds);
      const stillActive = filtered.some(item => isLiveFixture(item) || isScheduledFixture(item));
      europeEliminated = filtered.length > 0 && !stillActive;
      recentItalianResults = buildRecentItalianEuroSummary(filtered, italianTeamIds, 8);
    }

    filtered.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

    return res.status(200).json({
      fixtures: filtered,
      debug: {
        competition: comp,
        league: cfg.league,
        season: cfg.season,
        total: filtered.length,
        italianTeamsOnly: EURO_COMP_CODES.has(comp),
        italianTeamsCount: italianTeamIds ? italianTeamIds.size : null,
        europeEliminated,
        recentItalianResults
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy fixtures.' });
  }
}
