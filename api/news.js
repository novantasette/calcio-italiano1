import { fetchOfficialNews } from './_news.js';

export default async function handler(req, res) {
  const teamName = req.query.teamName;
  if (!teamName) return res.status(400).json({ error: 'Manca il nome squadra.' });
  try {
    const payload = await fetchOfficialNews(teamName);
    return res.status(200).json(payload);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Errore nel proxy news.' });
  }
}
