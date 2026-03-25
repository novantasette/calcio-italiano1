import { EURO_COMP_CODES, fetchJson, getCfg, getItalianTeamIdsForCompetition } from './_map.js';

function parseRating(value) {
  const n = Number.parseFloat(String(value || '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: 'API KEY mancante' });

  const comp = req.query.competition;
  const cfg = getCfg(comp);
  if (!cfg) return res.status(400).json({ error: 'Competizione non supportata in questa versione.' });

  try {
    const pagesToFetch = 4;
    const responses = [];
    let italianTeamIds = null;
    if (EURO_COMP_CODES.has(comp)) italianTeamIds = await getItalianTeamIdsForCompetition(cfg, key);
    for (let page = 1; page <= pagesToFetch; page += 1) {
      const data = await fetchJson(`https://v3.football.api-sports.io/players?league=${cfg.league}&season=${cfg.season}&page=${page}`, key);
      responses.push(...(data.response || []));
      const totalPages = data.paging?.total || pagesToFetch;
      if (page >= totalPages) break;
    }

    const players = responses
      .map(item => {
        const stats = item.statistics?.[0] || {};
        const rating = parseRating(stats.games?.rating);
        return { item, rating, stats };
      })
      .filter(x => x.rating !== null && (x.stats.games?.appearences || 0) >= 3)
      .filter(x => !italianTeamIds || italianTeamIds.has(Number(x.stats.team?.id)))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 20)
      .map(x => x.item);

    return res.status(200).json({
      players,
      note: EURO_COMP_CODES.has(comp)
        ? 'Classifica limitata ai giocatori delle squadre italiane presenti nella competizione europea.'
        : 'Classifica calcolata sulle prime pagine disponibili dell'endpoint giocatori della competizione.'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy ratings.' });
  }
}
