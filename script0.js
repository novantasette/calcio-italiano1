
const DISCORD_URL = '#';
const NAV_ITEMS = [
  { key:'home', label:'Home' },
  { key:'teams', label:'Squadre' },
  { key:'top', label:'Top' },
  { key:'market', label:'Mercato' },
  { key:'support', label:'Supporta il progetto' },
  { key:'discord', label:'Discord' }
];

const CATEGORY_TREE = [
  { key:'serie-a', label:'Serie A', items:[{ name:'Serie A', code:'serie-a', live:true }] },
  { key:'serie-b', label:'Serie B', items:[{ name:'Serie B', code:'serie-b', live:true }] },
  { key:'serie-c', label:'Serie C', items:[
    { name:'Serie C - Girone A', code:'serie-c-a', live:true },
    { name:'Serie C - Girone B', code:'serie-c-b', live:true },
    { name:'Serie C - Girone C', code:'serie-c-c', live:true }
  ]},
  { key:'serie-d', label:'Serie D', items:[
    { name:'Serie D - Girone A', code:'serie-d-a', live:true },
    { name:'Serie D - Girone B', code:'serie-d-b', live:true },
    { name:'Serie D - Girone C', code:'serie-d-c', live:true },
    { name:'Serie D - Girone D', code:'serie-d-d', live:true },
    { name:'Serie D - Girone E', code:'serie-d-e', live:true },
    { name:'Serie D - Girone F', code:'serie-d-f', live:true },
    { name:'Serie D - Girone G', code:'serie-d-g', live:true },
    { name:'Serie D - Girone H', code:'serie-d-h', live:true },
    { name:'Serie D - Girone I', code:'serie-d-i', live:true }
  ]},
  { key:'primavera', label:'Primavera', items:[
    { name:'Primavera 1', code:'primavera-1', live:false, disabled:true },
    { name:'Primavera 2', code:'primavera-2', live:false, disabled:true }
  ]},
  { key:'femminile', label:'Femminile', items:[
    { name:'Serie A Femminile', code:'serie-a-women', live:true },
    { name:'Serie A Cup Women', code:'serie-a-cup-women', live:true }
  ]}
];

const state = {
  page:'home', competition:'', filter:'all', search:'', fixtures:[], loading:false, error:'',
  selected:null, meta:null, standings:[], standingsLoading:false, selectedTeam:null, teamData:null, teamLoading:false,
  openMacro:'serie-a', marketTab:'official', rankings:{ scorers:[], assists:[], ratings:[] },
  rankingsLoading:{ scorers:false, assists:false, ratings:false }, rankingsNote:{ scorers:'', assists:'', ratings:'' },
  transfers:[], transfersLoading:false, transfersNote:'', teamDirectorySearch:'', teamTab:'overview', topTab:'scorers'
};

const esc=s=>String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const allItems = CATEGORY_TREE.flatMap(group => group.items);
const getComp = () => allItems.find(c => c.name === state.competition);
const currentCode = () => getComp()?.code || '';
const currentMacro = () => CATEGORY_TREE.find(group => group.items.some(item => item.name === state.competition))?.label || 'Seleziona una categoria';
const localDate = d => new Date(d).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'});
const sortByDateDesc = list => [...list].sort((a,b)=>new Date(b.fixture.date)-new Date(a.fixture.date));
function statusClass(short){ if(['1H','2H','HT','ET','BT','P','LIVE','INT'].includes(short)) return 'live'; if(['FT','AET','PEN'].includes(short)) return 'finished'; return 'scheduled'; }
function statusLabel(m){ const s=m.fixture.status.short, e=m.fixture.status.elapsed; if(['1H','2H'].includes(s)) return `<span class="live-dot"></span>Partita in corso ${s==='1H'?'1T':'2T'}${e?' • '+e+"'":''}`; if(s==='HT') return '<span class="live-dot"></span>Intervallo'; if(['ET','BT','P','LIVE','INT'].includes(s)) return '<span class="live-dot"></span>Partita in corso'; if(['FT','AET','PEN'].includes(s)) return 'Partita finita'; return 'Non iniziata'; }
function iconForEvent(type,detail){ const t=`${type||''} ${detail||''}`.toLowerCase(); if(t.includes('goal')) return '⚽'; if(t.includes('card')) return detail==='Red Card'?'🟥':'🟨'; if(t.includes('subst')) return '🔁'; if(t.includes('var')) return '🖥️'; if(t.includes('penalty')) return '🎯'; return '•'; }
function teamLink(name,id){ return `<span class="linklike" onclick="openTeam(${id},'${esc(String(name).replaceAll("'",'\\\''))}')">${esc(name)}</span>`; }
function parseNum(v){ const n=parseFloat(String(v||'0').replace('%','').replace(',','.')); return Number.isFinite(n)?n:0; }

const STAT_LABELS = {
  'Shots on Goal':'Tiri in porta','Shots off Goal':'Tiri fuori','Total Shots':'Tiri totali','Blocked Shots':'Tiri bloccati',
  'Shots insidebox':'Tiri in area','Shots outsidebox':'Tiri da fuori area','Fouls':'Falli','Corner Kicks':'Calci d\'angolo',
  'Offsides':'Fuorigioco','Ball Possession':'Possesso palla','Yellow Cards':'Cartellini gialli','Red Cards':'Cartellini rossi',
  'Goalkeeper Saves':'Parate del portiere','Total passes':'Passaggi totali','Passes accurate':'Passaggi riusciti',
  'Passes %':'Precisione passaggi','expected_goals':'Gol attesi','Goals Prevented':'Gol evitati','Penalty Kicks':'Rigori',
  'Big Chances Created':'Grandi occasioni create','Big Chances Missed':'Grandi occasioni sprecate','Substitutions':'Sostituzioni',
  'Attacks':'Attacchi','Dangerous Attacks':'Attacchi pericolosi','Hit Woodwork':'Legni colpiti','Free Kicks':'Calci di punizione',
  'Throwins':'Rimesse laterali','Goal Attempts':'Tentativi di gol','Goals':'Gol'
};
const EVENT_TYPE_LABELS = {
  Goal:'Gol',Card:'Cartellino',subst:'Sostituzione',Var:'VAR'
};
const EVENT_DETAIL_LABELS = {
  'Normal Goal':'Gol','Own Goal':'Autogol','Penalty':'Rigore','Missed Penalty':'Rigore sbagliato','Yellow Card':'Ammonizione',
  'Red Card':'Espulsione','Substitution':'Sostituzione','subst':'Sostituzione','Var':'VAR','Goal Disallowed':'Gol annullato',
  'Penalty Shootout':'Rigori','Card Upgrade':'Cartellino modificato'
};

function renderStat(stats,name,labelOverride){
  const home = stats[0]?.statistics?.find(s=>s.type===name)?.value ?? 0;
  const away = stats[1]?.statistics?.find(s=>s.type===name)?.value ?? 0;
  const label = labelOverride || STAT_LABELS[name] || name;
  const homeNum = parseNum(home), awayNum = parseNum(away), total = homeNum + awayNum || 1;
  const hp = Math.max(6, (homeNum/total)*100), ap = Math.max(6, (awayNum/total)*100);
  return `<div class="stat"><div class="rowflex"><strong>${esc(label)}</strong><span class="muted small">${esc(home)} - ${esc(away)}</span></div><div style="display:grid;grid-template-columns:${hp}% ${ap}%;gap:8px;margin-top:10px"><div class="bar"><div class="fill"></div></div><div class="bar"><div class="fill" style="opacity:.45"></div></div></div></div>`;
}

function uniqueTeams(){
  const map = new Map();
  (state.standings || []).forEach(r => {
    if(r.team?.id) map.set(String(r.team.id), { id:r.team.id, name:r.team.name, rank:r.rank, points:r.points, source:'classifica' });
  });
  (state.fixtures || []).forEach(f => {
    [f.teams?.home, f.teams?.away].forEach(t => { if(t?.id && !map.has(String(t.id))) map.set(String(t.id), { id:t.id, name:t.name, source:'partite' }); });
  });
  return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'it'));
}

function topbar(){
  return `<div class="topbar"><div class="brand-inline"><div class="logo" aria-hidden="true"><img src="logo.svg" alt="Logo Calcio Italiano Live" /></div><div><h1>Calcio Italiano Live</h1><small>Risultati, classifiche e approfondimenti</small></div></div><div class="topnav">${NAV_ITEMS.map(item=>`<button class="${state.page===item.key?'active':''}" onclick="setPage('${item.key}')">${item.label}</button>`).join('')}</div></div>`;
}

function sidebar(){
  return `<aside class="sidebar"><h3>Campionati</h3><div class="footer-note" style="margin:0 0 14px">Apri una macro-categoria e scegli la sottocategoria da visualizzare.</div>${CATEGORY_TREE.map(group=>`<div class="macro ${state.openMacro===group.key?'open':''}"><button class="head" onclick="toggleMacro('${group.key}')"><span>${group.label}</span><span>${state.openMacro===group.key?'−':'+'}</span></button><div class="subs">${group.items.map(item=>`<button class="${item.disabled?'disabled':''} ${state.competition===item.name?'active':''}" onclick="${item.disabled?'return false':`selectCompetition('${item.name}')`}">${item.name}${item.disabled?' <span class="muted">(in arrivo)</span>':''}</button>`).join('')}</div></div>`).join('')}</aside>`;
}

function toolbar(){
  return `<div class="toolbar"><div class="tabs"><button class="${state.filter==='all'?'active':''}" onclick="setFilter('all')">Tutte</button><button class="${state.filter==='live'?'active':''}" onclick="setFilter('live')">Live</button><button class="${state.filter==='next'?'active':''}" onclick="setFilter('next')">Prossime</button><button class="${state.filter==='finished'?'active':''}" onclick="setFilter('finished')">Finite</button></div><input class="search" placeholder="Cerca squadra..." value="${esc(state.search)}" oninput="setSearch(this.value)" /></div>`;
}

function homeHero(){
  if(!state.competition){
    return `<div class="hero-home"><div class="card hero-main hero-glow"><div class="select-note">Benvenuto su Calcio Italiano Live</div><h1>Una home più pulita, prima scegli tu cosa seguire.</h1><p>All'apertura del sito resti su una vera pagina Home: nessuna classifica o lista partite mostrata finché non selezioni una competizione. Da qui puoi entrare subito nel campionato che ti interessa oppure aprire le sezioni Squadre, Top e Mercato.</p><div class="pills"><span class="pill">Home pulita</span><span class="pill">Competizioni italiane</span><span class="pill">Squadre</span><span class="pill">Top</span><span class="pill">Mercato</span></div><div class="macro-actions"><button onclick="setPage('teams')">Apri Squadre</button><button onclick="setPage('top')">Vai a Top</button><button onclick="setPage('market')">Apri Mercato</button></div></div><div class="card hero-side"><h2>Consiglio UX</h2><div class="hero-list"><div class="feature"><span>Step 1</span><strong>Scegli la competizione dal menu laterale</strong></div><div class="feature"><span>Step 2</span><strong>Visualizza partite, classifica e dettagli</strong></div><div class="feature"><span>Step 3</span><strong>Esplora Squadre, Top e Mercato</strong></div></div></div></div>`;
  }
  return `<div class="hero"><div class="card hero-main"><div class="muted small">${esc(currentMacro())} • ${esc(state.competition)}</div><h1>${esc(state.competition)}</h1><p>Vista principale della competizione con partite, classifica, schede squadra e statistiche tradotte in italiano. Puoi cambiare categoria dal menu laterale in qualsiasi momento.</p><div class="pills"><span class="pill">Live</span><span class="pill">Classifica</span><span class="pill">Dettagli partita</span><span class="pill">Squadre</span></div></div><div class="card hero-side"><h2>Stato rapido</h2><div class="kpi"><div class="row"><strong>Competizione attiva</strong><div class="muted small">${esc(state.competition)}</div></div><div class="row"><strong>Partite caricate</strong><div class="muted small">${state.fixtures.length || '—'}</div></div><div class="row"><strong>Ordine</strong><div class="muted small">Più recenti in alto</div></div></div></div></div>`;
}

function homeLanding(){
  return `<div class="empty-shell"><div class="card section"><div class="section-head"><div><h2 style="margin-bottom:4px">Scegli una competizione</h2><div class="muted small">Le macro-categorie nel menu laterale aprono le relative sottocategorie. Qui sotto trovi anche una selezione rapida.</div></div><div class="muted small">Nessun contenuto caricato finché non selezioni una competizione.</div></div><div class="macro-grid">${CATEGORY_TREE.map(group=>`<div class="macro-tile"><strong>${group.label}</strong><div class="directory-meta">${group.items.filter(i=>!i.disabled).length} sottocategorie disponibili</div><div class="macro-actions">${group.items.map(item=>item.disabled?`<button disabled style="opacity:.55;cursor:not-allowed">${item.name}</button>`:`<button onclick="selectCompetition('${item.name}')">${item.name}</button>`).join('')}</div></div>`).join('')}</div></div><div class="quick-grid"><div class="card quick-card"><strong>Home</strong><div class="directory-meta">Pagina iniziale leggera e ordinata, senza dati mostrati subito.</div></div><div class="card quick-card"><strong>Top</strong><div class="directory-meta">Un solo menu con marcatori, assist e valutazioni.</div></div><div class="card quick-card"><strong>Squadre</strong><div class="directory-meta">Ricerca squadra, rosa, infortuni, cartellini, formazioni e movimenti ufficiali.</div></div></div>`;
}

function matchesList(){
  let list = sortByDateDesc(state.fixtures || []);
  if(state.filter==='live') list=list.filter(m=>statusClass(m.fixture.status.short)==='live');
  if(state.filter==='next') list=list.filter(m=>statusClass(m.fixture.status.short)==='scheduled');
  if(state.filter==='finished') list=list.filter(m=>statusClass(m.fixture.status.short)==='finished');
  if(state.search.trim()){
    const q=state.search.toLowerCase();
    list=list.filter(m=>m.teams.home.name.toLowerCase().includes(q)||m.teams.away.name.toLowerCase().includes(q));
  }
  return `<div class="card section"><div class="rowflex" style="margin-bottom:10px"><h2>Partite</h2><div class="muted small">Ordinamento decrescente per data</div></div>${toolbar()}${state.loading?`<div class="notice">Caricamento partite...</div>`:state.error?`<div class="notice">${esc(state.error)}</div>`:!list.length?`<div class="notice">Nessuna partita trovata per i filtri selezionati.</div>`:`<div class="list">${list.map(m=>`<div class="card match" onclick="openMatch(${m.fixture.id})"><div class="rowflex"><div><div class="muted small">${esc(m.league.name)} • ${localDate(m.fixture.date)}</div><div class="title">${esc(m.teams.home.name)} vs ${esc(m.teams.away.name)}</div></div><div class="badges"><span class="badge ${statusClass(m.fixture.status.short)}">${statusLabel(m)}</span><span class="scorebadge">${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</span></div></div></div>`).join('')}</div>`}</div>`;
}

function standingsCard(){
  return `<div class="card section"><div class="rowflex" style="margin-bottom:10px"><h2>Classifica</h2><div class="muted small">${esc(state.competition)}</div></div>${state.standingsLoading?`<div class="notice">Caricamento classifica...</div>`:!state.standings.length?`<div class="notice">Classifica non disponibile per questa categoria.</div>`:`<table><thead><tr><th>#</th><th>Squadra</th><th>PT</th><th>G</th><th>V</th><th>N</th><th>P</th><th>DR</th></tr></thead><tbody>${state.standings.map(r=>`<tr><td>${r.rank}</td><td>${teamLink(r.team.name,r.team.id)}</td><td>${r.points}</td><td>${r.all.played}</td><td>${r.all.win}</td><td>${r.all.draw}</td><td>${r.all.lose}</td><td>${r.goalsDiff}</td></tr>`).join('')}</tbody></table>`}</div>`;
}

function homeView(){ return `<div class="content">${homeHero()}${!state.competition ? homeLanding() : `<div class="grid grid2">${matchesList()}${standingsCard()}</div>`}</div>`; }

function detailView(){
  if(!state.selected) return '';
  if(state.selected.loading) return `<div class="content"><a class="back" onclick="closeMatch()">← Torna alla competizione</a><div class="card notice">Caricamento dettaglio partita...</div></div>`;
  if(state.selected.error) return `<div class="content"><a class="back" onclick="closeMatch()">← Torna alla competizione</a><div class="card notice">${esc(state.selected.error)}</div></div>`;
  const d=state.selected.data, m=d.match, events=d.events||[], stats=d.stats||[], lineups=d.lineups||[];
  const lineupCard=l=>`<div class="lineup"><h3>${esc(l.team?.name||'Squadra')}</h3><div class="muted small">Modulo: ${esc(l.formation||'n.d.')}</div><div class="players" style="margin-top:10px">${(l.startXI||[]).map(p=>`<div class="player">${esc(p.player?.number||'')} • ${esc(p.player?.name||'')}</div>`).join('') || '<div class="muted small">Formazione non disponibile.</div>'}</div></div>`;
  const interestingStats=['Shots on Goal','Shots off Goal','Total Shots','Blocked Shots','Shots insidebox','Shots outsidebox','Ball Possession','Corner Kicks','Offsides','Fouls','Yellow Cards','Red Cards','Goalkeeper Saves','Total passes','Passes accurate','Passes %','expected_goals','Goals Prevented'];
  const statsHtml = `<div class="card section"><h2>Statistiche</h2>${stats.length>=2?interestingStats.map(s=>renderStat(stats,s)).join(''):`<div class="muted small">Statistiche non disponibili.</div>`}</div>`;
  const lineupsHtml = `<div class="card section"><h2>Formazioni</h2>${lineups.length?`<div class="split">${lineups.map(lineupCard).join('')}</div>`:`<div class="muted small">Formazioni non disponibili.</div>`}</div>`;
  return `<div class="content"><a class="back" onclick="closeMatch()">← Torna alla competizione</a><div class="grid grid2"><div><div class="card section"><div class="rowflex"><div><div class="muted small">${esc(m.league.name)} • ${localDate(m.fixture.date)}</div><div class="title">${teamLink(m.teams.home.name,m.teams.home.id)} vs ${teamLink(m.teams.away.name,m.teams.away.id)}</div><div class="muted small">${esc(m.fixture.venue?.name||'Stadio non disponibile')}</div></div><div class="badges"><span class="badge ${statusClass(m.fixture.status.short)}">${statusLabel(m)}</span><span class="scorebadge">${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</span></div></div></div><div class="card section"><h2>Eventi</h2>${events.length?events.map(e=>`<div class="event"><div class="rowflex"><strong>${e.time.elapsed?e.time.elapsed+"'":'-'} ${iconForEvent(e.type,e.detail)}</strong><span class="muted small">${esc(e.team?.name||'')}</span></div><div style="margin-top:6px">${esc(e.player?.name||'')}${e.assist?.name?' • 👟 '+esc(e.assist.name):''}</div><div class="muted small">${EVENT_DETAIL_LABELS[e.detail] || EVENT_TYPE_LABELS[e.type] || STAT_LABELS[e.type] || esc(e.type||'')}${e.detail && !EVENT_DETAIL_LABELS[e.detail] ? ' • '+esc(e.detail):''}</div></div>`).join(''):`<div class="muted small">Nessun evento disponibile.</div>`}</div>${statsHtml}</div><div>${lineupsHtml}</div></div></div>`;
}

function teamTabOverview(d){
  const fixturesDesc=sortByDateDesc(d.fixtures||[]);
  return `<div class="tab-shell"><div class="grid grid2"><div class="card section"><h2>Classifica</h2>${d.standing?`<table><thead><tr><th>#</th><th>PT</th><th>G</th><th>V</th><th>N</th><th>P</th><th>DR</th></tr></thead><tbody><tr><td>${d.standing.rank}</td><td>${d.standing.points}</td><td>${d.standing.all.played}</td><td>${d.standing.all.win}</td><td>${d.standing.all.draw}</td><td>${d.standing.all.lose}</td><td>${d.standing.goalsDiff}</td></tr></tbody></table>`:`<div class="muted small">Classifica non disponibile.</div>`}</div><div class="card section"><h2>Ultime / prossime partite</h2>${fixturesDesc.length?fixturesDesc.map(m=>`<div class="team-item"><div class="muted small">${localDate(m.fixture.date)}</div><div style="margin-top:6px"><strong>${esc(m.teams.home.name)} vs ${esc(m.teams.away.name)}</strong></div><div class="muted small" style="margin-top:4px">${statusLabel(m).replace(/<[^>]+>/g,'')} • ${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</div></div>`).join(''):`<div class="muted small">Nessuna partita disponibile.</div>`}</div></div></div>`;
}
function teamTabSquad(d){
  const squad = d.squad || [];
  return `<div class="card section tab-shell"><h2>Rosa</h2>${squad.length?`<div class="grid grid3">${squad.map(p=>`<div class="mini-card"><strong>${esc(p.name)}</strong><div class="directory-meta">${esc(p.position || 'Ruolo n.d.')} • #${esc(p.number || '—')}</div><div class="directory-meta">Età: ${esc(p.age || '—')}</div></div>`).join('')}</div>`:`<div class="notice">Rosa non disponibile per questa squadra.</div>`}</div>`;
}
function teamTabInjuries(d){
  const injuries = d.injuries || [];
  return `<div class="card section tab-shell"><h2>Infortuni / indisponibilità</h2>${injuries.length?`<div class="list">${injuries.map(i=>`<div class="news-card"><strong>${esc(i.player?.name || 'Giocatore')}</strong><div class="directory-meta">${esc(i.player?.type || 'Indisponibilità')} • ${esc(i.player?.reason || 'Motivo non indicato')}</div><div class="directory-meta">Data: ${i.fixture?.date ? localDate(i.fixture.date) : 'n.d.'}</div></div>`).join('')}</div>`:`<div class="notice">Nessun infortunio segnalato nei dati disponibili.</div>`}</div>`;
}
function teamTabCards(d){
  const cards = d.cards || {};
  return `<div class="card section tab-shell"><h2>Cartellini squadra</h2><div class="grid grid4"><div class="mini-card"><strong>Gialli</strong><div class="directory-meta">${esc(cards.yellow || 0)}</div></div><div class="mini-card"><strong>Rossi</strong><div class="directory-meta">${esc(cards.red || 0)}</div></div><div class="mini-card"><strong>Gol fatti</strong><div class="directory-meta">${esc(d.teamStats?.goals?.for?.total?.total ?? '—')}</div></div><div class="mini-card"><strong>Gol subiti</strong><div class="directory-meta">${esc(d.teamStats?.goals?.against?.total?.total ?? '—')}</div></div></div><div class="footer-note">Qui trovi il riepilogo squadra sui cartellini nei dati stagionali disponibili.</div></div>`;
}
function teamTabFormations(d){
  const formations = d.formations || [];
  return `<div class="card section tab-shell"><h2>Formazioni recenti</h2>${formations.length?`<div class="list">${formations.map(f=>`<div class="lineup"><div class="rowflex"><strong>${esc(f.formation || 'Modulo n.d.')}</strong><span class="muted small">${f.fixtureDate ? localDate(f.fixtureDate) : ''}</span></div><div class="players" style="margin-top:10px">${(f.startXI || []).map(p=>`<div class="player">${esc(p.player?.number || '—')} • ${esc(p.player?.name || '')}</div>`).join('') || '<div class="muted small">Dettaglio titolari non disponibile.</div>'}</div></div>`).join('')}</div>`:`<div class="notice">Formazioni recenti non disponibili.</div>`}</div>`;
}
function teamTabNews(d){
  const official = d.officialNews?.articles || [];
  const officialNote = d.officialNews?.note || '';
  const sourceLabel = d.officialNews?.source?.siteName || 'fonte ufficiale';
  const news = d.teamNews || [];
  return `<div class="tab-shell" style="display:grid;gap:14px"><div class="card section"><h2>News ufficiali squadra</h2>${official.length?`<div class="list">${official.map(item=>`<div class="news-card"><strong><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title || 'News ufficiale')}</a></strong><div class="directory-meta">Fonte: ${esc(item.source || sourceLabel)}</div><div class="directory-meta">${item.publishedAt ? 'Pubblicata: '+localDate(item.publishedAt) : 'Data non disponibile'}</div>${item.description?`<div class="directory-meta" style="margin-top:8px">${esc(item.description)}</div>`:''}</div>`).join('')}</div>`:`<div class="notice">Nessuna news ufficiale disponibile al momento per questa squadra.</div>`}${officialNote?`<div class="footer-note">${esc(officialNote)}</div>`:''}</div><div class="card section"><h2>Movimenti ufficiali squadra</h2>${news.length?`<div class="list">${news.map(n=>`<div class="news-card"><strong>${esc(n.player?.name || 'Giocatore')}</strong><div class="directory-meta">${esc(n.teams?.out?.name || '—')} → ${esc(n.teams?.in?.name || '—')}</div><div class="directory-meta">${esc(n.update?.type || 'Aggiornamento')} • ${n.update?.date ? localDate(n.update.date) : 'n.d.'}</div></div>`).join('')}</div>`:`<div class="notice">Nessun movimento ufficiale disponibile per questa squadra.</div>`}</div></div>`;
}
function teamView(){
  if(!state.selectedTeam) return '';
  if(state.teamLoading) return `<div class="content"><a class="back" onclick="closeTeam()">← Torna alla competizione</a><div class="card notice">Caricamento squadra...</div></div>`;
  if(!state.teamData || state.teamData.error) return `<div class="content"><a class="back" onclick="closeTeam()">← Torna alla competizione</a><div class="card notice">${esc(state.teamData?.error || 'Errore nel caricamento squadra.')}</div></div>`;
  const d=state.teamData;
  const tabMap = {
    overview: teamTabOverview(d), squad: teamTabSquad(d), injuries: teamTabInjuries(d), cards: teamTabCards(d), formations: teamTabFormations(d), news: teamTabNews(d)
  };
  return `<div class="content"><a class="back" onclick="closeTeam()">← Torna alla competizione</a><div class="hero"><div class="card hero-main"><div class="team-header"><div><div class="muted small">${esc(state.competition)}</div><h1 style="font-size:2.05rem">${esc(d.team.name)}</h1><p>Pagina squadra con ricerca dedicata, rosa, infortuni, riepilogo cartellini, formazioni recenti, news ufficiali e movimenti ufficiali collegati.</p></div><button class="ghost-btn" onclick="setPage('teams')">Vai a Squadre</button></div><div class="team-pills"><span class="pill">Posizione: ${d.standing?d.standing.rank:'—'}</span><span class="pill">Punti: ${d.standing?d.standing.points:'—'}</span><span class="pill">Partite: ${d.standing?d.standing.all.played:'—'}</span><span class="pill">Squadra ID: ${esc(d.team.id || '—')}</span></div><div class="mini-tabs" style="margin-top:16px">${[
      ['overview','Panoramica'],['squad','Rosa'],['injuries','Infortuni'],['cards','Ammonizioni'],['formations','Formazioni'],['news','Notizie']
    ].map(([key,label])=>`<button class="${state.teamTab===key?'active':''}" onclick="setTeamTab('${key}')">${label}</button>`).join('')}</div></div><div class="card hero-side"><h2>Statistiche rapide</h2>${d.standing?`<div class="grid grid3"><div class="feature"><div><strong>Vittorie</strong><div class="muted small">${d.standing.all.win}</div></div></div><div class="feature"><div><strong>Pareggi</strong><div class="muted small">${d.standing.all.draw}</div></div></div><div class="feature"><div><strong>Sconfitte</strong><div class="muted small">${d.standing.all.lose}</div></div></div></div>`:`<div class="muted small">Statistiche squadra non disponibili.</div>`}<div class="hero-list"><div class="feature"><span>Gol fatti</span><strong>${esc(d.teamStats?.goals?.for?.total?.total ?? '—')}</strong></div><div class="feature"><span>Gol subiti</span><strong>${esc(d.teamStats?.goals?.against?.total?.total ?? '—')}</strong></div><div class="feature"><span>Porta inviolata</span><strong>${esc(d.teamStats?.clean_sheet?.total ?? '—')}</strong></div></div></div></div>${tabMap[state.teamTab] || tabMap.overview}</div>`;
}

function teamsView(){
  if(!state.competition){
    return `<div class="content"><div class="card section"><h1 style="font-size:2rem">Squadre</h1><p>Prima seleziona una competizione dal menu laterale. Dopo vedrai la barra di ricerca e la directory completa delle squadre collegate a quella categoria.</p></div></div>`;
  }
  const q = state.teamDirectorySearch.trim().toLowerCase();
  let teams = uniqueTeams();
  if(q) teams = teams.filter(t => t.name.toLowerCase().includes(q));
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">Directory squadre</div><h1>Squadre</h1><p>Menu dedicato con barra di ricerca per aprire rapidamente la scheda di una squadra della competizione selezionata.</p><div class="pills"><span class="pill">Ricerca veloce</span><span class="pill">Rosa</span><span class="pill">Infortuni</span><span class="pill">Formazioni</span><span class="pill">Cartellini</span></div></div><div class="card hero-side"><h2>Contesto</h2><div class="kpi"><div class="row"><strong>Competizione</strong><div class="muted small">${esc(state.competition)}</div></div><div class="row"><strong>Squadre indicizzate</strong><div class="muted small">${uniqueTeams().length}</div></div><div class="row"><strong>Fonte</strong><div class="muted small">Classifica + partite caricate</div></div></div></div></div><div class="card section"><div class="toolbar"><div><h2 style="margin-bottom:4px">Cerca una squadra</h2><div class="muted small">La ricerca lavora sulla competizione attualmente selezionata.</div></div><input class="search" placeholder="Es. Juventus, Palermo, Arezzo..." value="${esc(state.teamDirectorySearch)}" oninput="setTeamDirectorySearch(this.value)" /></div>${teams.length?`<div class="grid grid3">${teams.map(t=>`<div class="directory-card" onclick="openTeam(${t.id},'${esc(String(t.name).replaceAll("'",'\\\''))}')"><strong>${esc(t.name)}</strong><div class="directory-meta">${t.rank ? 'Posizione: '+t.rank : 'Squadra presente nei dati'}</div><div class="directory-meta">${t.points!=null ? 'Punti: '+t.points : 'Clicca per aprire la scheda completa'}</div></div>`).join('')}</div>`:`<div class="notice">Nessuna squadra trovata con questo filtro.</div>`}</div></div>`;
}

function supportView(){
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">Supporta il progetto</div><h1>Donazioni no profit</h1><p>Il progetto nasce dalla passione per il calcio italiano e dalla voglia di creare una piattaforma utile, ordinata e sempre più completa. Le donazioni aiutano a sostenere API, hosting e sviluppo continuo.</p><div class="pills"><span class="pill">No profit</span><span class="pill">Aggiornamenti continui</span><span class="pill">Costi reali</span></div><a class="paypal-btn" href="https://paypal.me/marcoteribia" target="_blank" rel="noopener noreferrer">Dona con PayPal</a></div><div class="card hero-side"><h2>Chi sono</h2><div class="kpi"><div class="row"><strong>Nome</strong><div class="muted small">Gianmarco Teribia</div></div><div class="row"><strong>Nick social</strong><div class="muted small">novantasette</div></div><div class="row"><strong>Missione</strong><div class="muted small">Costruire una web app completa e più pulita sul calcio italiano.</div></div></div></div></div></div>`;
}

function discordView(){
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">Community</div><h1>Discord dedicato al progetto</h1><p>La sezione è pronta. Ti basta sostituire la costante <strong>DISCORD_URL</strong> in index.html con il link invito definitivo del server per renderla subito operativa.</p><a class="discord-btn" href="${esc(DISCORD_URL)}" target="_blank" rel="noopener noreferrer" onclick="if('${DISCORD_URL}'==='#'){alert('Inserisci il link reale del server Discord nella costante DISCORD_URL.'); return false;}">Apri il server Discord</a></div><div class="card hero-side"><h2>Perché serve</h2><div class="hero-list"><div class="feature"><span>Segnalazioni bug</span><strong>più rapide</strong></div><div class="feature"><span>Feedback utenti</span><strong>centralizzato</strong></div><div class="feature"><span>Novità di progetto</span><strong>in evidenza</strong></div></div></div></div></div>`;
}

function rankingCard(item, idx, type){
  const player = item.player || {};
  const stats = item.statistics?.[0] || {};
  const team = stats.team?.name || 'Squadra';
  const val = type==='scorers' ? (stats.goals?.total ?? 0) : type==='assists' ? (stats.goals?.assists ?? 0) : (stats.games?.rating || '—');
  const suffix = type==='ratings' ? '' : (type==='assists' ? ' assist' : ' gol');
  return `<div class="ranking-row"><div class="ranking-rank">${idx+1}</div><div><strong>${esc(player.name || 'Giocatore')}</strong><div class="ranking-meta">${esc(team)} • Presenze: ${stats.games?.appearences ?? '—'}</div></div><div><strong>${esc(val)}${suffix}</strong></div></div>`;
}

function rankingView(type, title, description){
  const list = state.rankings[type] || [];
  const loading = state.rankingsLoading[type];
  const note = state.rankingsNote[type];
  return `<div class="card section">${loading?`<div class="notice">Caricamento classifica...</div>`:!state.competition?`<div class="notice">Seleziona prima una competizione dal menu laterale.</div>`:!list.length?`<div class="notice">Nessun dato disponibile per questa competizione.</div>`:`<div class="list">${list.map((item,idx)=>rankingCard(item,idx,type)).join('')}</div>`}${note?`<div class="footer-note">${esc(note)}</div>`:''}</div>`;
}

function topView(){
  const type = state.topTab || 'scorers';
  const title = type==='scorers' ? 'Top Marcatori' : type==='assists' ? 'Top Assist' : 'Top Valutazioni';
  const description = type==='scorers' ? 'Classifica marcatori della competizione selezionata.' : type==='assists' ? 'Classifica assist della competizione selezionata.' : 'Giocatori con le migliori valutazioni medie rilevate nei dati disponibili.';
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">${esc(state.competition || 'Nessuna competizione selezionata')}</div><h1>Top</h1><p>Menu unico per raccogliere le classifiche individuali più utili. Il nome "Top" qui funziona bene perché è rapido, chiaro e pulito nella navigazione.</p><div class="subnav">${['scorers','assists','ratings'].map(key=>`<button class="${(state.topTab||'scorers')===key?'active':''}" onclick="setTopTab('${key}')">${key==='scorers'?'Marcatori':key==='assists'?'Assist':'Valutazioni'}</button>`).join('')}</div><div class="footer-note" style="margin-top:12px">${description}</div></div><div class="card hero-side"><h2>Contesto</h2><div class="kpi"><div class="row"><strong>Competizione</strong><div class="muted small">${esc(state.competition || 'Da selezionare')}</div></div><div class="row"><strong>Macro-categoria</strong><div class="muted small">${esc(currentMacro())}</div></div><div class="row"><strong>Fonte</strong><div class="muted small">API-Football</div></div></div></div></div>${rankingView(type, title, description)}</div>`;
}

function marketView(){
  const rumorsDemo = [
    'Slot UI pronto per integrare feed esterno dedicato ai rumors.',
    'Puoi collegare una fonte custom o un backend dedicato alle indiscrezioni.',
    'La sezione ufficiali resta invece alimentata dai trasferimenti confermati.'
  ];
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">${esc(state.competition || 'Nessuna competizione selezionata')}</div><h1>Mercato</h1><p>Sezione separata in ufficiali e rumors. La parte ufficiale usa i dati transfer disponibili; la parte rumors resta predisposta per una futura fonte dedicata.</p><div class="subnav"><button class="${state.marketTab==='official'?'active':''}" onclick="setMarketTab('official')">Ufficiali</button><button class="${state.marketTab==='rumors'?'active':''}" onclick="setMarketTab('rumors')">Rumors</button></div></div><div class="card hero-side"><h2>Vista rapida</h2><div class="kpi"><div class="row"><strong>Competizione</strong><div class="muted small">${esc(state.competition)}</div></div><div class="row"><strong>Fonte ufficiali</strong><div class="muted small">API-Football / transfers</div></div><div class="row"><strong>Rumors</strong><div class="muted small">Pronto per integrazione custom</div></div></div></div></div>${state.marketTab==='official'?`<div class="card section">${!state.competition?`<div class="notice">Seleziona prima una competizione dal menu laterale.</div>`:state.transfersLoading?`<div class="notice">Caricamento movimenti ufficiali...</div>`:!state.transfers.length?`<div class="notice">Nessun trasferimento ufficiale disponibile per questa competizione.</div>`:`<div class="list">${state.transfers.map(t=>`<div class="market-item"><strong>${esc(t.player?.name || 'Giocatore')}</strong><div class="market-meta">${esc(t.teams?.out?.name || '—')} → ${esc(t.teams?.in?.name || '—')}</div><div class="market-meta">Tipo: ${esc(t.update?.type || 'Trasferimento')} • Data: ${t.update?.date ? localDate(t.update.date) : 'n.d.'}</div></div>`).join('')}</div>`}${state.transfersNote?`<div class="footer-note">${esc(state.transfersNote)}</div>`:''}</div>`:`<div class="card section"><div class="list">${rumorsDemo.map(text=>`<div class="market-item">${esc(text)}</div>`).join('')}</div></div>`}</div>`;
}

function mainView(){
  if(state.selected) return detailView();
  if(state.selectedTeam) return teamView();
  if(state.page==='teams') return teamsView();
  if(state.page==='support') return supportView();
  if(state.page==='discord') return discordView();
  if(state.page==='market') return marketView();
  if(state.page==='top') return topView();
  return homeView();
}

function render(){ document.getElementById('app').innerHTML = `${topbar()}<div class="app">${sidebar()}${mainView()}</div>`; }
function setFilter(v){ state.filter=v; render(); }
function setSearch(v){ state.search=v; render(); }
function setTeamDirectorySearch(v){ state.teamDirectorySearch=v; render(); }
function setTeamTab(v){ state.teamTab=v; render(); }
function toggleMacro(key){ state.openMacro = state.openMacro === key ? '' : key; render(); }
function setMarketTab(v){ state.marketTab=v; render(); if(v==='official') loadTransfers(); }
function setTopTab(v){ state.topTab=v; state.page='top'; render(); loadRanking(v); }
function setPage(page){
  state.page=page; state.selected=null; state.selectedTeam=null; state.teamDirectorySearch=''; render();
  if(page==='top') loadRanking(state.topTab || 'scorers');
  if(page==='market') loadTransfers();
}
function selectCompetition(name){
  const group = CATEGORY_TREE.find(g => g.items.some(i => i.name===name));
  state.openMacro = group?.key || state.openMacro; state.page='home'; state.competition=name; state.filter='all'; state.search='';
  state.fixtures=[]; state.selected=null; state.selectedTeam=null; state.teamData=null; state.meta=null; state.standings=[]; state.teamDirectorySearch=''; state.teamTab='overview';
  loadCompetitionData();
  if(state.page==='top') loadRanking(state.topTab || 'scorers');
  if(state.page==='market' && state.marketTab==='official') loadTransfers();
}
async function loadFixturesOnly(){
  if(!currentCode()) { state.fixtures=[]; state.meta=null; return; }
  const res = await fetch(`/api/fixtures?competition=${encodeURIComponent(currentCode())}`);
  const data = await res.json(); if(!res.ok) throw new Error(data.error || 'Errore nel caricamento');
  state.fixtures = data.fixtures || []; state.meta = data.debug || null;
}
async function loadStandings(){
  if(!currentCode()) { state.standings=[]; state.standingsLoading=false; render(); return; }
  state.standingsLoading=true; render();
  try{ const res = await fetch(`/api/standings?competition=${encodeURIComponent(currentCode())}`); const data = await res.json(); if(!res.ok) throw new Error(data.error || 'Errore classifica'); state.standings = data.standings || []; }
  catch(err){ state.standings=[]; }
  state.standingsLoading=false; render();
}
async function loadCompetitionData(){
  state.loading=true; state.error=''; render();
  try{ await loadFixturesOnly(); }
  catch(err){ state.fixtures=[]; state.meta=null; state.error=err.message || 'Errore nel caricamento'; }
  state.loading=false; render(); loadStandings();
}
async function loadRanking(type){
  if(!currentCode()) { state.rankings[type]=[]; state.rankingsNote[type]='Seleziona una competizione per caricare la classifica.'; render(); return; }
  if(state.rankingsLoading[type]) return;
  state.rankingsLoading[type]=true; render();
  try{
    const endpoint = type==='ratings' ? '/api/ratings' : `/api/players?type=${type==='scorers'?'scorers':'assists'}`;
    const res = await fetch(`${endpoint}${endpoint.includes('?')?'&':'?'}competition=${encodeURIComponent(currentCode())}`);
    const data = await res.json(); if(!res.ok) throw new Error(data.error || 'Errore caricamento classifica');
    state.rankings[type] = data.players || []; state.rankingsNote[type] = data.note || '';
  }catch(err){ state.rankings[type] = []; state.rankingsNote[type] = err.message || 'Errore nel caricamento'; }
  state.rankingsLoading[type]=false; render();
}
async function loadTransfers(){
  if(!currentCode()) { state.transfers=[]; state.transfersNote='Seleziona una competizione per caricare il mercato ufficiale.'; render(); return; }
  if(state.transfersLoading) return;
  state.transfersLoading=true; render();
  try{ const res = await fetch(`/api/transfers?competition=${encodeURIComponent(currentCode())}`); const data = await res.json(); if(!res.ok) throw new Error(data.error || 'Errore caricamento mercato'); state.transfers = data.transfers || []; state.transfersNote = data.note || ''; }
  catch(err){ state.transfers = []; state.transfersNote = err.message || 'Errore nel caricamento'; }
  state.transfersLoading=false; render();
}
async function openMatch(id){
  state.selectedTeam=null; state.teamData=null; state.selected={loading:true}; render();
  try{ const res=await fetch(`/api/match?id=${id}`); const data=await res.json(); if(!res.ok) throw new Error(data.error || 'Errore nel dettaglio partita'); state.selected={data}; }
  catch(err){ state.selected={error:err.message || 'Errore nel dettaglio partita'}; }
  render();
}
function closeMatch(){ state.selected=null; render(); }
async function openTeam(teamId, teamName){
  state.selected=null; state.selectedTeam={id:teamId,name:teamName}; state.teamLoading=true; state.teamData=null; state.teamTab='overview'; render();
  try{ const res=await fetch(`/api/team?competition=${encodeURIComponent(currentCode())}&team=${teamId}`); const data=await res.json(); if(!res.ok) throw new Error(data.error || 'Errore nel caricamento squadra'); state.teamData=data; }
  catch(err){ state.teamData={error:err.message || 'Errore nel caricamento squadra'}; }
  state.teamLoading=false; render();
}
function closeTeam(){ state.selectedTeam=null; state.teamData=null; state.teamLoading=false; state.teamTab='overview'; render(); }

