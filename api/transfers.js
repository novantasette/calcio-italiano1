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
      teams = (standingsData.response?.[0]?.league?.standings?.flat?.() || standingsData.response?.[0]?.league?.standings?.[0] || [])
        .map(row => row.team?.id)
        .filter(Boolean)
        .slice(0, 20);
    }

    const transferLists = await Promise.all(
      teams.map(teamId => fetchJson(`https://v3.football.api-sports.io/transfers?team=${teamId}`, key).catch(() => ({ response: [] })))
    );

    const now = new Date();
    const rollingCutoff = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365);
    const seasonStart = new Date(Date.UTC(Number(cfg.season), 5, 1, 0, 0, 0));
    const recentCutoff = seasonStart > rollingCutoff ? seasonStart : rollingCutoff;

    const transfers = transferLists
      .flatMap(data => data.response || [])
      .flatMap(entry => (entry.transfers || []).map(transfer => ({
        player: entry.player,
        update: transfer,
        teams: transfer.teams
      })))
      .filter(item => {
        const rawDate = item.update?.date ? String(item.update.date) : '';
        const when = rawDate ? new Date(rawDate) : null;
        if (!when || Number.isNaN(when.getTime())) return false;
        if (when < recentCutoff) return false;
        return true;
      })
      .sort((a, b) => new Date(b.update?.date || 0) - new Date(a.update?.date || 0))
      .filter((item, idx, arr) => idx === arr.findIndex(other =>
        String(other.player?.id || other.player?.name || '') === String(item.player?.id || item.player?.name || '') &&
        String(other.update?.date || '') === String(item.update?.date || '') &&
        String(other.teams?.in?.id || other.teams?.in?.name || '') === String(item.teams?.in?.id || item.teams?.in?.name || '')
      ))
      .slice(0, 24);

    return res.status(200).json({
      transfers,
      note: EURO_COMP_CODES.has(comp)
        ? 'Movimenti ordinati dal più recente al meno recente e limitati agli ultimi 12 mesi per le italiane presenti nella competizione europea.'
        : 'Movimenti ordinati dal più recente al meno recente e limitati agli ultimi 12 mesi.'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy transfers.' });
  }
}
