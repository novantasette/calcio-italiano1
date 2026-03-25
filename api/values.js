import { EURO_COMP_CODES, fetchJson, getCfg, getItalianTeamIdsForCompetition } from './_map.js';

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function parseRating(value) {
  const n = Number.parseFloat(String(value || '').replace(',', '.'));
  return Number.isFinite(n) ? n : 6.2;
}

function formatMillions(valueM) {
  if (valueM >= 1000) return `€${(valueM / 1000).toFixed(2).replace('.', ',')} mld`;
  if (valueM >= 1) return `€${valueM.toFixed(1).replace('.', ',')} M`;
  return `€${Math.round(valueM * 1000)} mila`;
}

function estimateValue(item, competitionWeight = 1) {
  const player = item.player || {};
  const stats = item.statistics?.[0] || {};
  const age = Number(player.age || 27);
  const appearances = Number(stats.games?.appearences || stats.games?.appearances || 0);
  const minutes = Number(stats.games?.minutes || 0);
  const goals = Number(stats.goals?.total || 0);
  const assists = Number(stats.goals?.assists || 0);
  const rating = parseRating(stats.games?.rating);
  const lineups = Number(stats.games?.lineups || 0);
  const position = String(stats.games?.position || player.position || '').toLowerCase();
  const cleanSheets = Number(stats.goals?.against?.goals?.insidebox || 0);

  const ageCurve = age <= 21 ? 1.28 : age <= 24 ? 1.18 : age <= 28 ? 1.08 : age <= 31 ? 0.96 : age <= 34 ? 0.82 : 0.68;
  const availability = clamp((appearances / 12), 0.45, 1.18);
  const minuteFactor = clamp((minutes / 1400), 0.55, 1.18);
  const ratingFactor = clamp(0.7 + ((rating - 6.0) * 0.42), 0.72, 1.72);
  const starterFactor = clamp(0.84 + (lineups / Math.max(appearances || 1, 1)) * 0.35, 0.84, 1.2);

  let production = 1;
  if (position.includes('att')) production += goals * 0.95 + assists * 0.55;
  else if (position.includes('mid')) production += goals * 0.7 + assists * 0.7;
  else if (position.includes('def')) production += goals * 0.55 + assists * 0.35;
  else if (position.includes('goal')) production += cleanSheets * 0.18;
  else production += goals * 0.75 + assists * 0.5;

  let baseM = 1.8;
  baseM += appearances * 0.18;
  baseM += Math.max(0, goals) * 0.9;
  baseM += Math.max(0, assists) * 0.65;
  baseM += Math.max(0, (rating - 6.5)) * 6.8;

  let estimatedM = baseM * ageCurve * availability * minuteFactor * ratingFactor * starterFactor * competitionWeight;
  estimatedM = clamp(estimatedM, 0.25, 180);

  return {
    estimatedValueM: Number(estimatedM.toFixed(1)),
    estimatedValueLabel: formatMillions(estimatedM)
  };
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

    const competitionWeight = EURO_COMP_CODES.has(comp) ? 1.18 : 1;
    const players = responses
      .filter(item => {
        const stats = item.statistics?.[0] || {};
        const appearances = Number(stats.games?.appearences || stats.games?.appearances || 0);
        if (italianTeamIds && !italianTeamIds.has(Number(stats.team?.id))) return false;
        return appearances >= 3;
      })
      .map(item => ({ ...item, ...estimateValue(item, competitionWeight) }))
      .sort((a, b) => (b.estimatedValueM || 0) - (a.estimatedValueM || 0))
      .slice(0, 20);

    return res.status(200).json({
      players,
      note: 'Valore stimato automatico calcolato internamente con età, rendimento, presenze, continuità e peso competitivo. Non è un dato ufficiale di mercato.'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy valori.' });
  }
}
