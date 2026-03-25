import { fetchJson } from './_map.js';

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: 'API KEY mancante' });
  const teamId = req.query.team;
  if (!teamId) return res.status(400).json({ error: 'Manca il team id.' });
  try {
    const [nextData, lastData] = await Promise.all([
      fetchJson(`https://v3.football.api-sports.io/fixtures?team=${teamId}&next=12`, key),
      fetchJson(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=12`, key)
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
    uniq.sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
    return res.status(200).json({ fixtures: uniq, debug: { teamId, total: uniq.length } });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy partite nazionale.' });
  }
}
