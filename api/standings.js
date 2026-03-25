import { EURO_COMP_CODES, fetchJson, filterStandingsByTeamIds, getCfg, getItalianTeamIdsForCompetition } from './_map.js';

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: "API KEY mancante" });

  const comp = req.query.competition;
  const cfg = getCfg(comp);
  if (!cfg) return res.status(400).json({ error: "Competizione non supportata in questa versione." });

  try {
    const data = await fetchJson(`https://v3.football.api-sports.io/standings?league=${cfg.league}&season=${cfg.season}`, key);
    const raw = data.response?.[0]?.league?.standings || [];
    let standings = raw.flat();
    let noItalianTeams = false;
    if (EURO_COMP_CODES.has(comp)) {
      const italianTeamIds = await getItalianTeamIdsForCompetition(cfg, key);
      standings = filterStandingsByTeamIds(standings, italianTeamIds);
      noItalianTeams = !standings.length;
    }
    return res.status(200).json({ standings, debug: { noItalianTeams } });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Errore nel proxy standings." });
  }
}
