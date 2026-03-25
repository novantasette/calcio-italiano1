
const NAV_ITEMS = [
  { key:'home', label:'Home' },
  { key:'support', label:'Supporta il progetto' },
  { key:'discord', label:'Discord' },
  { key:'market', label:'Mercato' },
  { key:'scorers', label:'Top Marcatori' },
  { key:'assists', label:'Top Assist' },
  { key:'ratings', label:'Top Valutazioni' }
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
  page:'home',
  competition:'Serie A',
  filter:'all',
  search:'',
  fixtures:[],
  loading:false,
  error:'',
  selected:null,
  meta:null,
  standings:[],
  standingsLoading:false,
  selectedTeam:null,
  teamData:null,
  teamLoading:false,
  openMacro:'serie-a',
  marketTab:'official',
  rankings:{ scorers:[], assists:[], ratings:[] },
  rankingsLoading:{ scorers:false, assists:false, ratings:false },
  rankingsNote:{ scorers:'', assists:'', ratings:'' },
  transfers:[],
  transfersLoading:false,
  transfersNote:''
};

const esc=s=>String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const allItems = CATEGORY_TREE.flatMap(group => group.items);
const getComp = () => allItems.find(c => c.name === state.competition);
const currentCode = () => getComp()?.code || 'serie-a';
const currentMacro = () => CATEGORY_TREE.find(group => group.items.some(item => item.name === state.competition))?.label || 'Serie A';
const localDate = d => new Date(d).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'});
const sortByDateDesc = list => [...list].sort((a,b)=>new Date(b.fixture.date)-new Date(a.fixture.date));
function statusClass(short){ if(['1H','2H','HT','ET','BT','P','LIVE','INT'].includes(short)) return 'live'; if(['FT','AET','PEN'].includes(short)) return 'finished'; return 'scheduled'; }
function statusLabel(m){ const s=m.fixture.status.short, e=m.fixture.status.elapsed; if(['1H','2H'].includes(s)) return `<span class="live-dot"></span>Partita in corso ${s==='1H'?'1T':'2T'}${e?' • '+e+"'":''}`; if(s==='HT') return '<span class="live-dot"></span>Intervallo'; if(['ET','BT','P','LIVE','INT'].includes(s)) return '<span class="live-dot"></span>Partita in corso'; if(['FT','AET','PEN'].includes(s)) return 'Partita finita'; return 'Non iniziata'; }
function iconForEvent(type,detail){ const t=`${type||''} ${detail||''}`.toLowerCase(); if(t.includes('goal')) return '⚽'; if(t.includes('card')) return detail==='Red Card'?'🟥':'🟨'; if(t.includes('subst')) return '🔁'; if(t.includes('var')) return '🖥️'; if(t.includes('penalty')) return '🎯'; return '•'; }
function teamLink(name,id){ return `<span class="linklike" onclick="openTeam(${id},'${esc(String(name).replaceAll("'",'\\\''))}')">${esc(name)}</span>`; }
function parseNum(v){ const n=parseFloat(String(v||'0').replace('%','').replace(',','.')); return Number.isFinite(n)?n:0; }

const STAT_LABELS = {
  'Shots on Goal':'Tiri in porta','Shots off Goal':'Tiri fuori','Total Shots':'Tiri totali','Blocked Shots':'Tiri bloccati',
  'Shots insidebox':'Tiri in area','Shots outsidebox':'Tiri fuori area','Fouls':'Falli','Corner Kicks':'Calci d\'angolo',
  'Offsides':'Fuorigioco','Ball Possession':'Possesso palla','Yellow Cards':'Cartellini gialli','Red Cards':'Cartellini rossi',
  'Goalkeeper Saves':'Parate del portiere','Total passes':'Passaggi totali','Passes accurate':'Passaggi riusciti',
  'Passes %':'Precisione passaggi','expected_goals':'Gol attesi','Goals Prevented':'Gol evitati'
};

function renderStat(stats,name,labelOverride){
  const home = stats[0]?.statistics?.find(s=>s.type===name)?.value ?? 0;
  const away = stats[1]?.statistics?.find(s=>s.type===name)?.value ?? 0;
  const label = labelOverride || STAT_LABELS[name] || name;
  const homeNum = parseNum(home), awayNum = parseNum(away), total = homeNum + awayNum || 1;
  const hp = Math.max(6, (homeNum/total)*100), ap = Math.max(6, (awayNum/total)*100);
  return `<div class="stat"><div class="rowflex"><strong>${esc(label)}</strong><span class="muted small">${esc(home)} - ${esc(away)}</span></div><div style="display:grid;grid-template-columns:${hp}% ${ap}%;gap:8px;margin-top:10px"><div class="bar"><div class="fill"></div></div><div class="bar"><div class="fill" style="opacity:.45"></div></div></div></div>`;
}

function topbar(){
  return `<div class="topbar"><div class="brand-inline"><div class="logo" aria-hidden="true"></div><div><h1>Calcio Italiano Live</h1><small>Risultati, classifiche e approfondimenti</small></div></div><div class="topnav">${NAV_ITEMS.map(item=>`<button class="${state.page===item.key?'active':''}" onclick="setPage('${item.key}')">${item.label}</button>`).join('')}</div></div>`;
}

function sidebar(){
  return `<aside class="sidebar"><h3>Campionati</h3>${CATEGORY_TREE.map(group=>`<div class="macro ${state.openMacro===group.key?'open':''}"><button class="head" onclick="toggleMacro('${group.key}')"><span>${group.label}</span><span>${state.openMacro===group.key?'−':'+'}</span></button><div class="subs">${group.items.map(item=>`<button class="${item.disabled?'disabled':''} ${state.competition===item.name?'active':''}" onclick="${item.disabled?'return false':`selectCompetition('${item.name}')`}">${item.name}${item.disabled?' <span class="muted">(in arrivo)</span>':''}</button>`).join('')}</div></div>`).join('')}</aside>`;
}

function toolbar(){
  return `<div class="toolbar"><div class="tabs"><button class="${state.filter==='all'?'active':''}" onclick="setFilter('all')">Tutte</button><button class="${state.filter==='live'?'active':''}" onclick="setFilter('live')">Live</button><button class="${state.filter==='next'?'active':''}" onclick="setFilter('next')">Prossime</button><button class="${state.filter==='finished'?'active':''}" onclick="setFilter('finished')">Finite</button></div><input class="search" placeholder="Cerca squadra..." value="${esc(state.search)}" oninput="setSearch(this.value)" /></div>`;
}

function homeHero(){
  return `<div class="hero"><div class="card hero-main"><div class="muted small">${esc(currentMacro())} • ${esc(state.competition)}</div><h1>Il calcio italiano, in una vista più pulita.</h1><p>Home, mercato, classifiche individuali e campionati organizzati in macro-categorie con sottocategorie. La navigazione è più chiara e il colpo d'occhio è più ordinato.</p><div class="pills"><span class="pill">Live</span><span class="pill">Classifica</span><span class="pill">Top Marcatori</span><span class="pill">Top Assist</span><span class="pill">Top Valutazioni</span></div></div><div class="card hero-side"><h2>Stato rapido</h2><div class="kpi"><div class="row"><strong>Competizione attiva</strong><div class="muted small">${esc(state.competition)}</div></div><div class="row"><strong>Partite caricate</strong><div class="muted small">${state.fixtures.length || '—'}</div></div><div class="row"><strong>Ordine</strong><div class="muted small">Più recenti in alto</div></div></div></div></div>`;
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

function homeView(){
  return `<div class="content">${homeHero()}<div class="grid grid2">${matchesList()}${standingsCard()}</div></div>`;
}

function detailView(){
  if(!state.selected) return '';
  if(state.selected.loading) return `<div class="content"><a class="back" onclick="closeMatch()">← Torna alla competizione</a><div class="card notice">Caricamento dettaglio partita...</div></div>`;
  if(state.selected.error) return `<div class="content"><a class="back" onclick="closeMatch()">← Torna alla competizione</a><div class="card notice">${esc(state.selected.error)}</div></div>`;
  const d=state.selected.data, m=d.match, events=d.events||[], stats=d.stats||[], lineups=d.lineups||[];
  const lineupCard=l=>`<div class="lineup"><h3>${esc(l.team?.name||'Squadra')}</h3><div class="muted small">Modulo: ${esc(l.formation||'n.d.')}</div><div class="players" style="margin-top:10px">${(l.startXI||[]).map(p=>`<div class="player">${esc(p.player?.number||'')} • ${esc(p.player?.name||'')}</div>`).join('') || '<div class="muted small">Formazione non disponibile.</div>'}</div></div>`;
  const interestingStats=['Shots on Goal','Shots off Goal','Total Shots','Blocked Shots','Shots insidebox','Shots outsidebox','Ball Possession','Corner Kicks','Offsides','Fouls','Yellow Cards','Red Cards','Goalkeeper Saves','Total passes','Passes accurate','Passes %'];
  const statsHtml=stats.length>=2?`<div class="card section"><h2>Statistiche</h2><div class="grid">${interestingStats.map(name=>renderStat(stats,name)).join('')}</div></div>`:`<div class="card section"><h2>Statistiche</h2><div class="muted small">Non disponibili per questa partita.</div></div>`;
  const lineupsHtml=lineups.length>=2?`<div class="card section"><h2>Formazioni</h2><div class="grid grid2">${lineupCard(lineups[0])}${lineupCard(lineups[1])}</div></div>`:`<div class="card section"><h2>Formazioni</h2><div class="muted small">Ancora non comunicate.</div></div>`;
  return `<div class="content"><a class="back" onclick="closeMatch()">← Torna alla competizione</a><div class="grid grid2"><div><div class="card section"><div class="rowflex"><div><div class="muted small">${esc(m.league.name)} • ${localDate(m.fixture.date)}</div><div class="title">${teamLink(m.teams.home.name,m.teams.home.id)} vs ${teamLink(m.teams.away.name,m.teams.away.id)}</div><div class="muted small">${esc(m.fixture.venue?.name||'Stadio non disponibile')}</div></div><div class="badges"><span class="badge ${statusClass(m.fixture.status.short)}">${statusLabel(m)}</span><span class="scorebadge">${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</span></div></div></div><div class="card section"><h2>Eventi</h2>${events.length?events.map(e=>`<div class="event"><div class="rowflex"><strong>${e.time.elapsed?e.time.elapsed+"'":'-'} ${iconForEvent(e.type,e.detail)}</strong><span class="muted small">${esc(e.team?.name||'')}</span></div><div style="margin-top:6px">${esc(e.player?.name||'')}${e.assist?.name?' • 👟 '+esc(e.assist.name):''}</div><div class="muted small">${STAT_LABELS[e.type] || esc(e.type||'')}${e.detail?' • '+esc(e.detail):''}</div></div>`).join(''):`<div class="muted small">Nessun evento disponibile.</div>`}</div>${statsHtml}</div><div>${lineupsHtml}</div></div></div>`;
}

function teamView(){
  if(!state.selectedTeam) return '';
  if(state.teamLoading) return `<div class="content"><a class="back" onclick="closeTeam()">← Torna alla competizione</a><div class="card notice">Caricamento squadra...</div></div>`;
  if(!state.teamData || state.teamData.error) return `<div class="content"><a class="back" onclick="closeTeam()">← Torna alla competizione</a><div class="card notice">${esc(state.teamData?.error || 'Errore nel caricamento squadra.')}</div></div>`;
  const d=state.teamData, fixturesDesc=sortByDateDesc(d.fixtures||[]);
  return `<div class="content"><a class="back" onclick="closeTeam()">← Torna alla competizione</a><div class="hero"><div class="card hero-main"><div class="muted small">${esc(state.competition)}</div><h1 style="font-size:2.1rem">${esc(d.team.name)}</h1><p>Pagina squadra con classifica, andamento recente e accesso rapido alle ultime partite.</p><div class="team-pills"><span class="pill">Posizione: ${d.standing?d.standing.rank:'—'}</span><span class="pill">Punti: ${d.standing?d.standing.points:'—'}</span><span class="pill">Partite: ${d.standing?d.standing.all.played:'—'}</span></div></div><div class="card hero-side"><h2>Statistiche rapide</h2>${d.standing?`<div class="grid grid3"><div class="feature"><div><strong>Vittorie</strong><div class="muted small">${d.standing.all.win}</div></div></div><div class="feature"><div><strong>Pareggi</strong><div class="muted small">${d.standing.all.draw}</div></div></div><div class="feature"><div><strong>Sconfitte</strong><div class="muted small">${d.standing.all.lose}</div></div></div></div>`:`<div class="muted small">Statistiche squadra non disponibili.</div>`}</div></div><div class="grid grid2"><div class="card section"><h2>Classifica</h2>${d.standing?`<table><thead><tr><th>#</th><th>PT</th><th>G</th><th>V</th><th>N</th><th>P</th><th>DR</th></tr></thead><tbody><tr><td>${d.standing.rank}</td><td>${d.standing.points}</td><td>${d.standing.all.played}</td><td>${d.standing.all.win}</td><td>${d.standing.all.draw}</td><td>${d.standing.all.lose}</td><td>${d.standing.goalsDiff}</td></tr></tbody></table>`:`<div class="muted small">Classifica non disponibile.</div>`}</div><div class="card section"><h2>Ultime / prossime partite</h2>${fixturesDesc.length?fixturesDesc.map(m=>`<div class="team-item"><div class="muted small">${localDate(m.fixture.date)}</div><div style="margin-top:6px"><strong>${esc(m.teams.home.name)} vs ${esc(m.teams.away.name)}</strong></div><div class="muted small" style="margin-top:4px">${statusLabel(m).replace(/<[^>]+>/g,'')} • ${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</div></div>`).join(''):`<div class="muted small">Nessuna partita disponibile.</div>`}</div></div></div>`;
}

function supportView(){
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">Supporta il progetto</div><h1>Donazioni no profit</h1><p>Il progetto nasce dalla passione per il calcio italiano e dalla voglia di creare una piattaforma utile, ordinata e sempre più completa. Le donazioni aiutano a sostenere API, hosting e sviluppo continuo.</p><div class="pills"><span class="pill">No profit</span><span class="pill">Aggiornamenti continui</span><span class="pill">Costi reali</span></div><a class="paypal-btn" href="https://paypal.me/marcoteribia" target="_blank" rel="noopener noreferrer">Dona con PayPal</a></div><div class="card hero-side"><h2>Chi sono</h2><div class="kpi"><div class="row"><strong>Nome</strong><div class="muted small">Gianmarco Teribia</div></div><div class="row"><strong>Nick social</strong><div class="muted small">novantasette</div></div><div class="row"><strong>Missione</strong><div class="muted small">Costruire una web app completa e più pulita sul calcio italiano.</div></div></div></div></div></div>`;
}

function discordView(){
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">Community</div><h1>Discord dedicato al progetto</h1><p>La barra alta è pronta anche per il collegamento alla community. Inserisci qui il link invito definitivo del server Discord per aprire direttamente la stanza ufficiale del progetto.</p><button class="discord-btn" onclick="window.alert('Inserisci il link finale del server Discord in questo pulsante.')">Collega il server Discord</button></div><div class="card hero-side"><h2>Perché serve</h2><div class="hero-list"><div class="feature"><span>Segnalazioni bug</span><strong>più rapide</strong></div><div class="feature"><span>Feedback utenti</span><strong>centralizzato</strong></div><div class="feature"><span>Novità di progetto</span><strong>in evidenza</strong></div></div></div></div></div>`;
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
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">${esc(state.competition)}</div><h1>${title}</h1><p>${description}</p><div class="subnav">${['scorers','assists','ratings'].map(key=>`<button class="${state.page===key?'active':''}" onclick="setPage('${key}')">${key==='scorers'?'Top Marcatori':key==='assists'?'Top Assist':'Top Valutazioni'}</button>`).join('')}</div></div><div class="card hero-side"><h2>Contesto</h2><div class="kpi"><div class="row"><strong>Competizione</strong><div class="muted small">${esc(state.competition)}</div></div><div class="row"><strong>Macro-categoria</strong><div class="muted small">${esc(currentMacro())}</div></div><div class="row"><strong>Aggiornamento</strong><div class="muted small">Da API-Football</div></div></div></div></div><div class="card section">${loading?`<div class="notice">Caricamento classifica...</div>`:!list.length?`<div class="notice">Nessun dato disponibile per questa competizione.</div>`:`<div class="list">${list.map((item,idx)=>rankingCard(item,idx,type)).join('')}</div>`}${note?`<div class="footer-note">${esc(note)}</div>`:''}</div></div>`;
}

function marketView(){
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">${esc(state.competition)}</div><h1>Mercato</h1><p>Sezione separata in ufficiali e rumors. La parte ufficiale usa i dati transfer disponibili; la parte rumors è pronta come slot dedicato per future fonti esterne o feed custom.</p><div class="subnav"><button class="${state.marketTab==='official'?'active':''}" onclick="setMarketTab('official')">Ufficiali</button><button class="${state.marketTab==='rumors'?'active':''}" onclick="setMarketTab('rumors')">Rumors</button></div></div><div class="card hero-side"><h2>Vista rapida</h2><div class="kpi"><div class="row"><strong>Competizione</strong><div class="muted small">${esc(state.competition)}</div></div><div class="row"><strong>Fonte ufficiali</strong><div class="muted small">API-Football / transfers</div></div><div class="row"><strong>Rumors</strong><div class="muted small">Slot dedicato per integrazione successiva</div></div></div></div></div>${state.marketTab==='official'?`<div class="card section">${state.transfersLoading?`<div class="notice">Caricamento movimenti ufficiali...</div>`:!state.transfers.length?`<div class="notice">Nessun trasferimento ufficiale disponibile per questa competizione.</div>`:`<div class="list">${state.transfers.map(t=>`<div class="market-item"><strong>${esc(t.player?.name || 'Giocatore')}</strong><div class="market-meta">${esc(t.teams?.out?.name || '—')} → ${esc(t.teams?.in?.name || '—')}</div><div class="market-meta">Tipo: ${esc(t.update?.type || 'Trasferimento')} • Data: ${t.update?.date ? localDate(t.update.date) : 'n.d.'}</div></div>`).join('')}</div>`}${state.transfersNote?`<div class="footer-note">${esc(state.transfersNote)}</div>`:''}</div>`:`<div class="card section"><div class="notice">Sezione rumors pronta a livello UI. Per riempirla serve collegare una fonte dedicata diversa dall'API ufficiale dei trasferimenti.</div></div>`}</div>`;
}

function mainView(){
  if(state.selected) return detailView();
  if(state.selectedTeam) return teamView();
  if(state.page==='support') return supportView();
  if(state.page==='discord') return discordView();
  if(state.page==='market') return marketView();
  if(state.page==='scorers') return rankingView('scorers', 'Top Marcatori', 'Classifica marcatori della competizione selezionata.');
  if(state.page==='assists') return rankingView('assists', 'Top Assist', 'Classifica assistman della competizione selezionata.');
  if(state.page==='ratings') return rankingView('ratings', 'Top Valutazioni', 'Giocatori con le migliori valutazioni medie rilevate nei dati disponibili.');
  return homeView();
}

function render(){
  document.getElementById('app').innerHTML = `${topbar()}<div class="app">${sidebar()}${mainView()}</div>`;
}

function setFilter(v){ state.filter=v; render(); }
function setSearch(v){ state.search=v; render(); }
function toggleMacro(key){ state.openMacro = state.openMacro === key ? '' : key; render(); }
function setMarketTab(v){ state.marketTab=v; render(); if(v==='official') loadTransfers(); }
function setPage(page){
  state.page=page;
  state.selected=null;
  state.selectedTeam=null;
  render();
  if(page==='scorers' || page==='assists') loadRanking(page);
  if(page==='ratings') loadRanking('ratings');
  if(page==='market') loadTransfers();
}
function selectCompetition(name){
  const group = CATEGORY_TREE.find(g => g.items.some(i => i.name===name));
  state.openMacro = group?.key || state.openMacro;
  state.page='home';
  state.competition=name;
  state.filter='all';
  state.search='';
  state.fixtures=[];
  state.selected=null;
  state.selectedTeam=null;
  state.teamData=null;
  state.meta=null;
  state.standings=[];
  loadCompetitionData();
}

async function loadFixturesOnly(){
  const res = await fetch(`/api/fixtures?competition=${encodeURIComponent(currentCode())}`);
  const data = await res.json();
  if(!res.ok) throw new Error(data.error || 'Errore nel caricamento');
  state.fixtures = data.fixtures || [];
  state.meta = data.debug || null;
}
async function loadStandings(){
  state.standingsLoading=true; render();
  try{
    const res = await fetch(`/api/standings?competition=${encodeURIComponent(currentCode())}`);
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Errore classifica');
    state.standings = data.standings || [];
  }catch(err){ state.standings=[]; }
  state.standingsLoading=false; render();
}
async function loadCompetitionData(){
  state.loading=true; state.error=''; render();
  try{ await loadFixturesOnly(); }
  catch(err){ state.fixtures=[]; state.meta=null; state.error=err.message || 'Errore nel caricamento'; }
  state.loading=false; render();
  loadStandings();
}
async function loadRanking(type){
  if(state.rankingsLoading[type]) return;
  state.rankingsLoading[type]=true; render();
  try{
    const endpoint = type==='ratings' ? '/api/ratings' : `/api/players?type=${type==='scorers'?'scorers':'assists'}`;
    const res = await fetch(`${endpoint}${endpoint.includes('?')?'&':'?'}competition=${encodeURIComponent(currentCode())}`);
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Errore caricamento classifica');
    state.rankings[type] = data.players || [];
    state.rankingsNote[type] = data.note || '';
  }catch(err){
    state.rankings[type] = [];
    state.rankingsNote[type] = err.message || 'Errore nel caricamento';
  }
  state.rankingsLoading[type]=false; render();
}
async function loadTransfers(){
  if(state.transfersLoading) return;
  state.transfersLoading=true; render();
  try{
    const res = await fetch(`/api/transfers?competition=${encodeURIComponent(currentCode())}`);
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Errore caricamento mercato');
    state.transfers = data.transfers || [];
    state.transfersNote = data.note || '';
  }catch(err){
    state.transfers = [];
    state.transfersNote = err.message || 'Errore nel caricamento';
  }
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
  state.selected=null; state.selectedTeam={id:teamId,name:teamName}; state.teamLoading=true; state.teamData=null; render();
  try{ const res=await fetch(`/api/team?competition=${encodeURIComponent(currentCode())}&team=${teamId}`); const data=await res.json(); if(!res.ok) throw new Error(data.error || 'Errore nel caricamento squadra'); state.teamData=data; }
  catch(err){ state.teamData={error:err.message || 'Errore nel caricamento squadra'}; }
  state.teamLoading=false; render();
}
function closeTeam(){ state.selectedTeam=null; state.teamData=null; state.teamLoading=false; render(); }

loadCompetitionData();
