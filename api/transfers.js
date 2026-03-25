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

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);

    const transfers = transferLists
      .flatMap(data => data.response || [])
      .flatMap(entry => (entry.transfers || []).map(transfer => ({
        player: entry.player,
        update: transfer,
        teams: transfer.teams
      })))
      .filter(item => {
        const when = item.update?.date ? new Date(item.update.date) : null;
        return when && !Number.isNaN(when.getTime()) && when >= cutoff;
      })
      .sort((a, b) => new Date(b.update?.date || 0) - new Date(a.update?.date || 0))
      .slice(0, 18);

    return res.status(200).json({
      transfers,
      note: EURO_COMP_CODES.has(comp)
        ? 'Mercato ufficiale limitato alle squadre italiane presenti nella competizione europea e agli ultimi 60 giorni.'
        : 'Mercato ufficiale limitato agli aggiornamenti più recenti (ultimi 60 giorni) per mantenere la pagina più pulita.'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy transfers.' });
  }
}
