const TEAM_OFFICIAL_SOURCES = {
  'atalanta': { domain: 'atalanta.it', siteName: 'Atalanta BC' },
  'bologna': { domain: 'bolognafc.it', siteName: 'Bologna FC 1909' },
  'cagliari': { domain: 'cagliaricalcio.com', siteName: 'Cagliari Calcio' },
  'como': { domain: 'comofootball.com', siteName: 'Como 1907' },
  'cremonese': { domain: 'uscremonese.it', siteName: 'US Cremonese' },
  'empoli': { domain: 'empolifc.com', siteName: 'Empoli FC' },
  'fiorentina': { domain: 'acffiorentina.com', siteName: 'ACF Fiorentina' },
  'genoa': { domain: 'genoacfc.it', siteName: 'Genoa CFC' },
  'inter': { domain: 'inter.it', siteName: 'FC Internazionale Milano' },
  'internazionale': { domain: 'inter.it', siteName: 'FC Internazionale Milano' },
  'juventus': { domain: 'juventus.com', siteName: 'Juventus' },
  'lazio': { domain: 'sslazio.it', siteName: 'SS Lazio' },
  'lecce': { domain: 'uslecce.it', siteName: 'US Lecce' },
  'milan': { domain: 'acmilan.com', siteName: 'AC Milan' },
  'monza': { domain: 'acmonza.com', siteName: 'AC Monza' },
  'napoli': { domain: 'sscnapoli.it', siteName: 'SSC Napoli' },
  'parma': { domain: 'parmacalcio1913.com', siteName: 'Parma Calcio 1913' },
  'pisa': { domain: 'pisasportingclub.com', siteName: 'Pisa Sporting Club' },
  'roma': { domain: 'asroma.com', siteName: 'AS Roma' },
  'torino': { domain: 'torinofc.it', siteName: 'Torino FC' },
  'udinese': { domain: 'udinese.it', siteName: 'Udinese Calcio' },
  'venezia': { domain: 'veneziafc.it', siteName: 'Venezia FC' },
  'verona': { domain: 'hellasverona.it', siteName: 'Hellas Verona FC' },
  'hellas verona': { domain: 'hellasverona.it', siteName: 'Hellas Verona FC' },

  'bari': { domain: 'ssc-bari.it', siteName: 'SSC Bari' },
  'catanzaro': { domain: 'uscatanzaro.net', siteName: 'US Catanzaro 1929' },
  'cesena': { domain: 'cesenafc.com', siteName: 'Cesena FC' },
  'cittadella': { domain: 'ascittadella.it', siteName: 'AS Cittadella' },
  'frosinone': { domain: 'frosinonecalcio.com', siteName: 'Frosinone Calcio' },
  'mantova': { domain: 'mantova1911.club', siteName: 'Mantova 1911' },
  'modena': { domain: 'modenacalcio.com', siteName: 'Modena FC' },
  'palermo': { domain: 'palermofc.com', siteName: 'Palermo FC' },
  'reggiana': { domain: 'acreggiana1919.it', siteName: 'AC Reggiana 1919' },
  'salernitana': { domain: 'ussalernitana1919.it', siteName: 'US Salernitana 1919' },
  'sampdoria': { domain: 'sampdoria.it', siteName: 'UC Sampdoria' },
  'spezia': { domain: 'acspezia.com', siteName: 'Spezia Calcio' },
  'sudtirol': { domain: 'fc-suedtirol.com', siteName: 'FC Südtirol' },
  'südtirol': { domain: 'fc-suedtirol.com', siteName: 'FC Südtirol' },

  'arezzo': { domain: 'ssarezzo.it', siteName: 'SS Arezzo' },
  'padova': { domain: 'padovacalcio.it', siteName: 'Calcio Padova' },
  'triestina': { domain: 'triestina1918.it', siteName: 'US Triestina Calcio 1918' },
  'vicenza': { domain: 'lrvicenza.net', siteName: 'LR Vicenza' },
  'benevento': { domain: 'beneventocalcio.club', siteName: 'Benevento Calcio' },
  'catania': { domain: 'cataniafc.it', siteName: 'Catania FC' },
  'trapani': { domain: 'trapani1905.it', siteName: 'Trapani Calcio' },
  'perugia': { domain: 'acperugiacalcio.com', siteName: 'AC Perugia Calcio' },
  'ternana': { domain: 'ternanacalcio.com', siteName: 'Ternana Calcio' },
  'spal': { domain: 'spalferrara.it', siteName: 'SPAL' },
  'pescara': { domain: 'pescaracalcio.com', siteName: 'Pescara Calcio' },
  'avellino': { domain: 'usavellino1912.com', siteName: 'US Avellino 1912' },
  'casertana': { domain: 'casertanafc.it', siteName: 'Casertana FC' },
  'crotone': { domain: 'fccrotone.it', siteName: 'FC Crotone' },
  'foggia': { domain: 'calciofoggia1920.net', siteName: 'Calcio Foggia 1920' },
  'juve stabia': { domain: 'ssjuvestabia.it', siteName: 'SS Juve Stabia' },
  'turris': { domain: 'turris1944.it', siteName: 'Turris Calcio' },

  'juventus women': { domain: 'juventus.com', siteName: 'Juventus Women' },
  'roma women': { domain: 'asroma.com', siteName: 'AS Roma Femminile' },
  'inter women': { domain: 'inter.it', siteName: 'Inter Women' },
  'milan women': { domain: 'acmilan.com', siteName: 'Milan Women' },
  'fiorentina women': { domain: 'acffiorentina.com', siteName: 'Fiorentina Femminile' },
};

function decodeHtml(text = '') {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTeamName(name = '') {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(fc|ac|as|us|ssc|ss|uc|calcio|football club|sporting club|women|femminile|club|1907|1909|1913|1919|1929)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getOfficialSource(teamName) {
  const norm = normalizeTeamName(teamName);
  if (TEAM_OFFICIAL_SOURCES[norm]) return TEAM_OFFICIAL_SOURCES[norm];
  const parts = norm.split(' ').filter(Boolean);
  for (const part of [norm, ...parts]) {
    if (TEAM_OFFICIAL_SOURCES[part]) return TEAM_OFFICIAL_SOURCES[part];
  }
  return null;
}

function stripGoogleNewsUrl(url = '') {
  return url.replace(/^https?:\/\/news\.google\.com\/rss\/articles\//, 'https://news.google.com/rss/articles/');
}

function parseRssItems(xml = '') {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.map(match => {
    const block = match[1] || '';
    const title = decodeHtml((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const link = decodeHtml((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '');
    const pubDate = decodeHtml((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '');
    const description = decodeHtml((block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '');
    const source = decodeHtml((block.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1] || '');
    return { title, url: stripGoogleNewsUrl(link), publishedAt: pubDate, description, source };
  }).filter(item => item.title && item.url);
}

async function fetchGoogleNewsRss(teamName, source) {
  const q = encodeURIComponent(`"${teamName}" site:${source.domain}`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=it&gl=IT&ceid=IT:it`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 CalcioItalianoLive/1.0' } });
  if (!r.ok) throw new Error('Feed news non raggiungibile');
  const xml = await r.text();
  return parseRssItems(xml).slice(0, 8).map(item => ({ ...item, source: item.source || source.siteName, domain: source.domain }));
}

async function fetchGNews(teamName, source, apiKey) {
  const params = new URLSearchParams({
    q: `"${teamName}"`,
    lang: 'it',
    country: 'it',
    max: '8',
    expand: 'content',
    in: 'title,description',
    apikey: apiKey,
    nullable: 'description,image',
    from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  });
  if (source?.domain) params.set('domain', source.domain);
  const r = await fetch(`https://gnews.io/api/v4/search?${params.toString()}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.errors?.[0] || data?.message || 'Servizio news non disponibile');
  return (data.articles || []).map(article => ({
    title: article.title,
    url: article.url,
    publishedAt: article.publishedAt,
    description: article.description,
    source: article.source?.name || source?.siteName || 'Fonte ufficiale',
    domain: source?.domain || ''
  }));
}

export async function fetchOfficialNews(teamName) {
  const source = getOfficialSource(teamName);
  if (!source) {
    return {
      articles: [],
      source: null,
      note: 'Nessuna fonte ufficiale configurata automaticamente per questa squadra. Puoi aggiungerla facilmente nel file api/_news.js.'
    };
  }

  const apiKey = process.env.NEWS_API_KEY;
  try {
    const articles = apiKey ? await fetchGNews(teamName, source, apiKey) : await fetchGoogleNewsRss(teamName, source);
    return {
      articles,
      source,
      note: apiKey
        ? `News ufficiali filtrate sulla fonte ${source.siteName}.`
        : `News ufficiali filtrate via Google News RSS sulla fonte ${source.siteName}. Per risultati ancora più stabili puoi aggiungere NEWS_API_KEY.`
    };
  } catch (error) {
    return {
      articles: [],
      source,
      note: error?.message || 'Impossibile caricare le news ufficiali al momento.'
    };
  }
}
