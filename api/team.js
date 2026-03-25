const MAP = {
  "serie-a": { league: 135, season: 2025 },
  "serie-b": { league: 136, season: 2025 },
  "coppa-italia": { league: 137, season: 2025 }
};

async function fetchJson(url, key) {
  const r = await fetch(url, { headers: { "x-apisports-key": key } });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.message || "Errore API esterna");
  return data;
}

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return res.status(500).json({ error: "API KEY mancante" });

  const comp = req.query.competition;
  const teamId = req.query.team;
  const cfg = MAP[comp];
  if (!cfg) return res.status(400).json({ error: "Competizione non supportata in questa versione." });
  if (!teamId) return res.status(400).json({ error: "Manca il team id." });

  try {
    const [standingsData, nextData, lastData] = await Promise.all([
      fetchJson(`https://v3.football.api-sports.io/standings?league=${cfg.league}&season=${cfg.season}`, key),
      fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&team=${teamId}&next=5`, key),
      fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&team=${teamId}&last=5`, key)
    ]);

    const rows = standingsData.response?.[0]?.league?.standings?.[0] || [];
    const standing = rows.find(r => String(r.team.id) === String(teamId)) || null;
    const team = standing?.team || nextData.response?.[0]?.teams?.home || lastData.response?.[0]?.teams?.home || { id: teamId, name: "Squadra" };

    const merged = [...(lastData.response || []), ...(nextData.response || [])];
    const uniq = [];
    const seen = new Set();
    for (const item of merged) {
      const id = item?.fixture?.id;
      if (id && !seen.has(id)) {
        seen.add(id);
        uniq.push(item);
      }
    }
    uniq.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

    return res.status(200).json({
      team,
      standing,
      fixtures: uniq
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Errore nel proxy team." });
  }
}
