export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return res.status(500).json({ error: "Manca la variabile API_FOOTBALL_KEY su Vercel." });
  }

  const map = {
    "serie-a": { league: 135, season: 2025 },
    "serie-b": { league: 136, season: 2025 },
    "coppa-italia": { league: 137, season: 2025 }
  };

  const comp = req.query.competition;
  const cfg = map[comp];
  if (!cfg) {
    return res.status(400).json({ error: "Competizione non supportata in questa prima versione live." });
  }

  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 7);
  const to = new Date(today);
  to.setDate(today.getDate() + 14);
  const fmt = d => d.toISOString().split("T")[0];

  const url = `https://v3.football.api-sports.io/fixtures?league=${cfg.league}&season=${cfg.season}&from=${fmt(from)}&to=${fmt(to)}`;

  try {
    const r = await fetch(url, {
      headers: { "x-apisports-key": key }
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data?.message || "Errore API esterna." });
    }
    return res.status(200).json({ fixtures: data.response || [] });
  } catch (e) {
    return res.status(500).json({ error: "Errore nel proxy fixtures." });
  }
}
