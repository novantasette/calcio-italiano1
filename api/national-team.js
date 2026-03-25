import { fetchJson } from './_map.js';
import { fetchOfficialNews } from './_news.js';

async function safeFetch(url, key, fallback) {
  try { return await fetchJson(url, key); } catch { return fallback; }
}
function uniqFixtures(list) {
  const out = [];
  const seen = new Set();
  for (const item of list || []) {
    const id = item?.fixture?.id;
    if (id && !seen.has(id)) { seen.add(id); out.push(item); }
  }
  return out.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
}
export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: 'API KEY mancante' });
  const teamId = req.query.team;
  if (!teamId) return res.status(400).json({ error: 'Manca il team id.' });
  try {
    const [nextData, lastData, squadData, injuriesData, transfersData] = await Promise.all([
      safeFetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&next=5`, key, { response: [] }),
      safeFetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=5`, key, { response: [] }),
      safeFetch(`https://v3.football.api-sports.io/players/squads?team=${teamId}`, key, { response: [] }),
      safeFetch(`https://v3.football.api-sports.io/injuries?team=${teamId}&season=2025`, key, { response: [] }),
      safeFetch(`https://v3.football.api-sports.io/transfers?team=${teamId}`, key, { response: [] })
    ]);
    const sample = [...(nextData.response || []), ...(lastData.response || [])].find(Boolean);
    const team = String(sample?.teams?.home?.id) === String(teamId) ? sample.teams.home : String(sample?.teams?.away?.id) === String(teamId) ? sample.teams.away : { id: teamId, name: 'Italia', logo: '' };
    const fixtures = uniqFixtures([...(lastData.response || []), ...(nextData.response || [])]);
    const recentIds = (lastData.response || []).slice(0, 2).map(item => item?.fixture?.id).filter(Boolean);
    const lineupsResp = await Promise.all(recentIds.map(id => safeFetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${id}`, key, { response: [] })));
    const formations = lineupsResp.flatMap((payload, idx) => {
      const lineup = (payload.response || []).find(item => String(item.team?.id) === String(teamId));
      if (!lineup) return [];
      return [{ fixtureId: recentIds[idx], fixtureDate: fixtures.find(f => String(f.fixture.id) === String(recentIds[idx]))?.fixture?.date || null, formation: lineup.formation || null, startXI: lineup.startXI || [] }];
    });
    const squad = squadData.response?.[0]?.players || [];
    const transfers = (transfersData.response || []).flatMap(entry => (entry.transfers || []).map(transfer => ({ player: entry.player, update: transfer, teams: transfer.teams }))).slice(0, 10);
    const officialNews = await fetchOfficialNews(team.name || 'Italia');
    return res.status(200).json({ team, standing: null, fixtures, squad, injuries: injuriesData.response || [], teamStats: null, cards: { yellow: 0, red: 0 }, formations, teamNews: transfers, officialNews });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy squadra nazionale.' });
  }
}
