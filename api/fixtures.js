export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return res.status(500).json({ error: "API KEY mancante" });
  }

  const map = {
    "serie-a": { league: 135, season: 2025 },
    "serie-b": { league: 136, season: 2025 },
    "coppa-italia": { league: 137, season: 2025 }
  };

  const comp = req.query.competition;
  const cfg = map[comp];
  if (!cfg) {
    return res.status(400).json({ error: "Competizione non supportata in questa versione." });
  }

  const fetchJson = async (url) => {
    const r = await fetch(url, { headers: { "x-apisports-key": key } });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || "Errore API esterna");
    return data;
  };

  try {
    const [nextData, lastData] = await Promise.all([
      fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&next=50`),
      fetchJson(`https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&last=50`)
    ]);

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
      fixtures: uniq,
      debug: {
        competition: comp,
        league: cfg.league,
        season: cfg.season,
        lastCount: (lastData.response || []).length,
        nextCount: (nextData.response || []).length,
        total: uniq.length
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Errore nel proxy fixtures." });
  }
}
