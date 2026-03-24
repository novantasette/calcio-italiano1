export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return res.status(500).json({ error: "API KEY mancante" });
  }

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ error: "Manca l'id della partita." });
  }

  const call = async (path) => {
    const r = await fetch(`https://v3.football.api-sports.io/${path}`, {
      headers: { "x-apisports-key": key }
    });
    const data = await r.json();
    return { ok: r.ok, status: r.status, data };
  };

  try {
    const [fx, events, stats, lineups] = await Promise.all([
      call(`fixtures?id=${id}`),
      call(`fixtures/events?fixture=${id}`),
      call(`fixtures/statistics?fixture=${id}`),
      call(`fixtures/lineups?fixture=${id}`)
    ]);

    if (!fx.ok) {
      return res.status(fx.status).json({ error: fx.data?.message || "Errore nel dettaglio match." });
    }

    return res.status(200).json({
      match: fx.data.response?.[0] || null,
      events: events.data?.response || [],
      stats: stats.data?.response || [],
      lineups: lineups.data?.response || []
    });
  } catch (e) {
    return res.status(500).json({ error: "Errore nel proxy match." });
  }
}
