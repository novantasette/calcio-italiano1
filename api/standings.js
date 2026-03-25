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
  const cfg = MAP[comp];
  if (!cfg) return res.status(400).json({ error: "Competizione non supportata in questa versione." });

  try {
    const data = await fetchJson(`https://v3.football.api-sports.io/standings?league=${cfg.league}&season=${cfg.season}`, key);
    const standings = data.response?.[0]?.league?.standings?.[0] || [];
    return res.status(200).json({ standings });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Errore nel proxy standings." });
  }
}
