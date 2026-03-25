import { EURO_COMP_CODES, fetchJson, filterFixturesByTeamIds, getCfg, getItalianTeamIdsForCompetition } from './_map.js';

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: "API KEY mancante" });

  const comp = req.query.competition;
  const cfg = getCfg(comp);
  if (!cfg) return res.status(400).json({ error: "Competizione non supportata in questa versione." });

  try {
    const [nextData, lastData] = await Promise.all([
      fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&next=50`, key),
      fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&last=50`, key)
    ]);
    const merged = [...(lastData.response || []), ...(nextData.response || [])];
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
    if (EURO_COMP_CODES.has(comp)) {
      italianTeamIds = await getItalianTeamIdsForCompetition(cfg, key);
      filtered = filterFixturesByTeamIds(uniq, italianTeamIds);
    }
    filtered.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
    return res.status(200).json({
      fixtures: filtered,
      debug: {
        competition: comp,
        league: cfg.league,
        season: cfg.season,
        lastCount: (lastData.response || []).length,
        nextCount: (nextData.response || []).length,
        total: filtered.length,
        italianTeamsOnly: EURO_COMP_CODES.has(comp),
        italianTeamsCount: italianTeamIds ? italianTeamIds.size : null
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Errore nel proxy fixtures." });
  }
}
