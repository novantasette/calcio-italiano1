import { fetchJson, getCfg } from './_map.js';

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: 'API KEY mancante' });

  const comp = req.query.competition;
  const cfg = getCfg(comp);
  if (!cfg) return res.status(400).json({ error: 'Competizione non supportata in questa versione.' });

  try {
    const standingsData = await fetchJson(`https://v3.football.api-sports.io/standings?league=${cfg.league}&season=${cfg.season}`, key);
    const teams = (standingsData.response?.[0]?.league?.standings?.[0] || []).slice(0, 8).map(row => row.team?.id).filter(Boolean);
    const transferLists = await Promise.all(
      teams.map(teamId => fetchJson(`https://v3.football.api-sports.io/transfers?team=${teamId}`, key).catch(() => ({ response: [] })))
    );

    const transfers = transferLists
      .flatMap(data => data.response || [])
      .flatMap(entry => (entry.transfers || []).map(transfer => ({
        player: entry.player,
        update: transfer,
        teams: transfer.teams
      })))
      .sort((a, b) => new Date(b.update?.date || 0) - new Date(a.update?.date || 0))
      .slice(0, 30);

    return res.status(200).json({
      transfers,
      note: 'Mercato ufficiale basato sugli ultimi trasferimenti disponibili per una selezione di squadre della competizione.'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy transfers.' });
  }
}
