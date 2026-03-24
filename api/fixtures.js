export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;

  if (!key) {
    return res.status(500).json({ error: "API KEY mancante" });
  }

  const league = 135; // Serie A
  const season = 2025;

  try {
    const r = await fetch(`https://v3.football.api-sports.io/fixtures?league=${league}&season=${season}`, {
      headers: { "x-apisports-key": key }
    });

    const data = await r.json();
    return res.status(200).json({ fixtures: data.response });

  } catch (e) {
    return res.status(500).json({ error: "Errore API" });
  }
}
