import { EURO_COMP_CODES, fetchJson, getCfg, getItalianTeamIdsForCompetition } from './_map.js';

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: 'API KEY mancante' });

  const comp = req.query.competition;
  const cfg = getCfg(comp);
  if (!cfg) return res.status(400).json({ error: 'Competizione non supportata in questa versione.' });

  try {
    let teams = [];
    if (EURO_COMP_CODES.has(comp)) {
      teams = Array.from(await getItalianTeamIdsForCompetition(cfg, key));
    } else {
      const standingsData = await fetchJson(`https://v3.football.api-sports.io/standings?league=${cfg.league}&season=${cfg.season}`, key);
      teams = (standingsData.response?.[0]?.league?.standings?.[0] || []).slice(0, 8).map(row => row.team?.id).filter(Boolean);
    }

    const transferLists = await Promise.all(
      teams.map(teamId => fetchJson(`https://v3.football.api-sports.io/transfers?team=${teamId}`, key).catch(() => ({ response: [] })))
    );

    
const allTransfers = transferLists
  .flatMap(data => data.response || [])
  .flatMap(entry => (entry.transfers || []).map(transfer => ({
    player: entry.player,
    update: transfer,
    teams: transfer.teams
  })))
  .filter(item => {
    const when = item.update?.date ? new Date(item.update.date) : null;
    return when && !Number.isNaN(when.getTime());
  })
  .sort((a, b) => new Date(b.update?.date || 0) - new Date(a.update?.date || 0));

const recentCutoff = new Date();
recentCutoff.setMonth(recentCutoff.getMonth() - 6);
let transfers = allTransfers.filter(item => new Date(item.update?.date || 0) >= recentCutoff);
if (!transfers.length) {
  const fallbackCutoff = new Date();
  fallbackCutoff.setFullYear(fallbackCutoff.getFullYear() - 1);
  transfers = allTransfers.filter(item => new Date(item.update?.date || 0) >= fallbackCutoff);
}
transfers = transfers.slice(0, 18);

    return res.status(200).json({
      transfers,
      note: EURO_COMP_CODES.has(comp)
        ? 'Mercato ufficiale limitato alle squadre italiane presenti nella competizione europea e ai movimenti più recenti.'
        : 'Mercato ufficiale limitato ai movimenti più recenti, con fallback massimo all’ultimo anno se i dati più freschi non sono disponibili.'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy transfers.' });
  }
}
