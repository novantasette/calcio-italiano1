import { fetchJson, getCfg } from './_map.js';
import { fetchOfficialNews } from './_news.js';

async function safeFetch(url, key, fallback) {
  try {
    return await fetchJson(url, key);
  } catch {
    return fallback;
  }
}

function uniqFixtures(list) {
  const out = [];
  const seen = new Set();
  for (const item of list || []) {
    const id = item?.fixture?.id;
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(item);
    }
  }
  return out.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
}

function mapCards(teamStats) {
  const yellow = Object.values(teamStats?.cards?.yellow || {}).reduce((sum, item) => sum + (item?.total || 0), 0);
  const red = Object.values(teamStats?.cards?.red || {}).reduce((sum, item) => sum + (item?.total || 0), 0);
  return { yellow, red };
}

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: 'API KEY mancante' });

  const comp = req.query.competition;
  const teamId = req.query.team;
  const cfg = getCfg(comp);
  if (!cfg) return res.status(400).json({ error: 'Competizione non supportata in questa versione.' });
  if (!teamId) return res.status(400).json({ error: 'Manca il team id.' });

  try {
    const [standingsData, nextData, lastData, squadData, injuriesData, statsData, transfersData] = await Promise.all([
      fetchJson(`https://v3.football.api-sports.io/standings?league=${cfg.league}&season=${cfg.season}`, key),
      safeFetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&team=${teamId}&next=5`, key, { response: [] }),
      safeFetch(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&team=${teamId}&last=5`, key, { response: [] }),
      safeFetch(`https://v3.football.api-sports.io/players/squads?team=${teamId}`, key, { response: [] }),
      safeFetch(`https://v3.football.api-sports.io/injuries?team=${teamId}&season=${cfg.season}`, key, { response: [] }),
      safeFetch(`https://v3.football.api-sports.io/teams/statistics?league=${cfg.league}&season=${cfg.season}&team=${teamId}`, key, { response: {} }),
      safeFetch(`https://v3.football.api-sports.io/transfers?team=${teamId}`, key, { response: [] })
    ]);

    const rows = standingsData.response?.[0]?.league?.standings?.[0] || [];
    const standing = rows.find(r => String(r.team.id) === String(teamId)) || null;
    const team = standing?.team || nextData.response?.[0]?.teams?.home || lastData.response?.[0]?.teams?.home || { id: teamId, name: 'Squadra' };
    const fixtures = uniqFixtures([...(lastData.response || []), ...(nextData.response || [])]);

    const recentIds = (lastData.response || []).slice(0, 2).map(item => item?.fixture?.id).filter(Boolean);
    const lineupsResp = await Promise.all(
      recentIds.map(id => safeFetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${id}`, key, { response: [] }))
    );

    const formations = lineupsResp
      .flatMap((payload, idx) => {
        const lineup = (payload.response || []).find(item => String(item.team?.id) === String(teamId));
        if (!lineup) return [];
        return [{
          fixtureId: recentIds[idx],
          fixtureDate: fixtures.find(f => String(f.fixture.id) === String(recentIds[idx]))?.fixture?.date || null,
          formation: lineup.formation || null,
          startXI: lineup.startXI || []
        }];
      });

    const squad = squadData.response?.[0]?.players || [];
    const injuries = (injuriesData.response || []).slice(0, 20);
    const teamStats = statsData.response || {};
    const cards = mapCards(teamStats);
    const teamNews = ((transfersData.response || [])[0]?.transfers || [])
      .slice(0, 12)
      .map(update => ({
        player: transfersData.response?.[0]?.player || null,
        update,
        teams: update.teams || {}
      }));

    const officialNews = await fetchOfficialNews(team.name);

    return res.status(200).json({
      team,
      standing,
      fixtures,
      squad,
      injuries,
      teamStats,
      cards,
      formations,
      teamNews,
      officialNews
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy team.' });
  }
}
