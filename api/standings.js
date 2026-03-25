import { EURO_COMP_CODES, fetchJson, filterStandingsByTeamIds, getCfg, getItalianTeamIdsForCompetition, isLiveFixture, isScheduledFixture } from './_map.js';

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
    let europeanOrder = false;
    if (EURO_COMP_CODES.has(comp)) {
      const italianTeamIds = await getItalianTeamIdsForCompetition(cfg, key);
      standings = filterStandingsByTeamIds(standings, italianTeamIds);
      noItalianTeams = !standings.length;
      europeanOrder = true;
      if (standings.length) {
        const fx = await fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}`, key);
        const fixtures = fx.response || [];
        const teamMeta = new Map();
        for (const row of standings) {
          const id = row?.team?.id;
          if (!id) continue;
          const mine = fixtures.filter(f => f?.teams?.home?.id === id || f?.teams?.away?.id === id);
          const active = mine.some(f => isLiveFixture(f) || isScheduledFixture(f));
          const dates = mine.map(f => new Date(f.fixture?.date || 0).getTime()).filter(Boolean);
          const lastDate = dates.length ? Math.max(...dates) : 0;
          teamMeta.set(id, { active, lastDate });
        }
        standings.sort((a,b) => {
          const ma = teamMeta.get(a.team?.id) || { active:false, lastDate:0 };
          const mb = teamMeta.get(b.team?.id) || { active:false, lastDate:0 };
          if (ma.active !== mb.active) return ma.active ? -1 : 1;
          if (ma.lastDate !== mb.lastDate) return mb.lastDate - ma.lastDate;
          return (a.rank || 999) - (b.rank || 999);
        }).forEach((row, idx) => row.displayRank = idx + 1);
      }
    }
    return res.status(200).json({ standings, debug: { noItalianTeams, europeanOrder } });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Errore nel proxy standings." });
  }
}
