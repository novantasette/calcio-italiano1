export const COMP_MAP = {
  "serie-a": { league: 135, season: 2025, label: "Serie A" },
  "serie-b": { league: 136, season: 2025, label: "Serie B" },
  "coppa-italia": { league: 137, season: 2025, label: "Coppa Italia" },
  "serie-c-a": { league: 138, season: 2025, label: "Serie C - Girone A" },
  "serie-c-b": { league: 942, season: 2025, label: "Serie C - Girone B" },
  "serie-c-c": { league: 943, season: 2025, label: "Serie C - Girone C" },
  "serie-d-a": { league: 426, season: 2025, label: "Serie D - Girone A" },
  "serie-d-b": { league: 427, season: 2025, label: "Serie D - Girone B" },
  "serie-d-c": { league: 428, season: 2025, label: "Serie D - Girone C" },
  "serie-d-d": { league: 429, season: 2025, label: "Serie D - Girone D" },
  "serie-d-e": { league: 430, season: 2025, label: "Serie D - Girone E" },
  "serie-d-f": { league: 431, season: 2025, label: "Serie D - Girone F" },
  "serie-d-g": { league: 432, season: 2025, label: "Serie D - Girone G" },
  "serie-d-h": { league: 433, season: 2025, label: "Serie D - Girone H" },
  "serie-d-i": { league: 434, season: 2025, label: "Serie D - Girone I" },
  "serie-a-women": { league: 139, season: 2025, label: "Serie A Femminile" },
  "serie-a-cup-women": { league: 1198, season: 2025, label: "Serie A Cup Women" }
};

export async function fetchJson(url, key) {
  const r = await fetch(url, { headers: { "x-apisports-key": key } });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.message || "Errore API esterna");
  return data;
}

export function getCfg(comp) {
  return COMP_MAP[comp];
}
