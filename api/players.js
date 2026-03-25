import { fetchJson, getCfg } from './_map.js';

const TYPE_TO_PATH = {
  scorers: 'players/topscorers',
  assists: 'players/topassists'
};

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: 'API KEY mancante' });

  const comp = req.query.competition;
  const type = req.query.type || 'scorers';
  const cfg = getCfg(comp);
  const path = TYPE_TO_PATH[type];
  if (!cfg) return res.status(400).json({ error: 'Competizione non supportata in questa versione.' });
  if (!path) return res.status(400).json({ error: 'Tipo classifica non supportato.' });

  try {
    const data = await fetchJson(`https://v3.football.api-sports.io/${path}?league=${cfg.league}&season=${cfg.season}`, key);
    const players = (data.response || []).slice(0, 20);
    return res.status(200).json({ players });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy players.' });
  }
}
