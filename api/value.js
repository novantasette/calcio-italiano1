
import { EURO_COMP_CODES, fetchJson, getCfg, getItalianTeamIdsForCompetition } from './_map.js';

function parseNumber(value) {
  const n = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function estimateValue(item) {
  const player = item.player || {};
  const stats = item.statistics?.[0] || {};
  const age = Number(player.age || 27);
  const appearances = Number(stats.games?.appearences ?? stats.games?.appearances ?? 0);
  const goals = Number(stats.goals?.total || 0);
  const assists = Number(stats.goals?.assists || 0);
  const rating = parseNumber(stats.games?.rating);
  const minutes = Number(stats.games?.minutes || 0);

  let value = 400000;
  value += appearances * 90000;
  value += goals * 550000;
  value += assists * 350000;
  value += Math.max(0, rating - 6) * 2200000;
  value += Math.min(minutes, 3200) * 180;

  if (age <= 21) value *= 1.45;
  else if (age <= 24) value *= 1.25;
  else if (age >= 31) value *= 0.72;
  else if (age >= 28) value *= 0.9;

  const position = String(player.position || '').toLowerCase();
  if (position.includes('attacker') || position.includes('forward')) value *= 1.15;
  if (position.includes('goalkeeper')) value *= 0.82;

  return Math.max(250000, Math.round(value));
}

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: 'API KEY mancante' });

  const comp = req.query.competition;
  const cfg = getCfg(comp);
  if (!cfg) return res.status(400).json({ error: 'Competizione non supportata in questa versione.' });

  try {
    let italianTeamIds = null;
    if (EURO_COMP_CODES.has(comp)) italianTeamIds = await getItalianTeamIdsForCompetition(cfg, key);

    const [scorersData, assistsData, playersPage] = await Promise.all([
      fetchJson(`https://v3.football.api-sports.io/players/topscorers?league=${cfg.league}&season=${cfg.season}`, key).catch(() => ({ response: [] })),
      fetchJson(`https://v3.football.api-sports.io/players/topassists?league=${cfg.league}&season=${cfg.season}`, key).catch(() => ({ response: [] })),
      fetchJson(`https://v3.football.api-sports.io/players?league=${cfg.league}&season=${cfg.season}&page=1`, key).catch(() => ({ response: [] }))
    ]);

    const merged = new Map();
    for (const item of [...(scorersData.response || []), ...(assistsData.response || []), ...(playersPage.response || [])]) {
      const id = String(item?.player?.id || item?.player?.name || Math.random());
      if (!merged.has(id)) merged.set(id, item);
      else {
        const prev = merged.get(id);
        const prevStats = prev.statistics?.[0] || {};
        const newStats = item.statistics?.[0] || {};
        const prevApps = Number(prevStats.games?.appearences ?? prevStats.games?.appearances ?? 0);
        const newApps = Number(newStats.games?.appearences ?? newStats.games?.appearances ?? 0);
        if (newApps > prevApps) merged.set(id, item);
      }
    }

    let players = Array.from(merged.values()).filter(item => (item.statistics?.[0]?.games?.appearences ?? item.statistics?.[0]?.games?.appearances ?? 0) >= 1);
    if (italianTeamIds) players = players.filter(item => italianTeamIds.has(Number(item?.statistics?.[0]?.team?.id)));

    players = players
      .map(item => ({ ...item, estimatedValue: estimateValue(item) }))
      .sort((a, b) => b.estimatedValue - a.estimatedValue)
      .slice(0, 20);

    return res.status(200).json({
      players,
      note: 'Valore stimato automatico, pensato per una lettura rapida e coerente con il rendimento disponibile nei dati.'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy valore.' });
  }
}
