
const DISCORD_URL = '#';
const NAV_ITEMS = [
  { key:'home', label:'Home', icon:'⌂' },
  { key:'teams', label:'Squadre', icon:'⚽' },
  { key:'top', label:'Top', icon:'★' },
  { key:'market', label:'Mercato', icon:'⇄' },
  { key:'support', label:'Supporta il progetto', icon:'❤' },
  { key:'discord', label:'Discord', icon:'💬' }
];

const CATEGORY_TREE = [
  { key:'serie-a', label:'Serie A', items:[
    { name:'Serie A', code:'serie-a', live:true },
    { name:'Coppa Italia', code:'coppa-italia', live:true },
    { name:'Supercoppa Italiana', code:'supercoppa-italiana', live:false, disabled:true }
  ] },
  { key:'serie-b', label:'Serie B', items:[
    { name:'Serie B', code:'serie-b', live:true }
  ] },
  { key:'serie-c', label:'Serie C', items:[
    { name:'Serie C - Girone A', code:'serie-c-a', live:true },
    { name:'Serie C - Girone B', code:'serie-c-b', live:true },
    { name:'Serie C - Girone C', code:'serie-c-c', live:true },
    { name:'Coppa Italia Serie C', code:'coppa-italia-serie-c', live:true },
    { name:'Playoff Promozione Serie C', code:'serie-c-playoff-promozione', live:true },
    { name:'Playout Retrocessione Serie C', code:'serie-c-playout-retrocessione', live:true },
    { name:'Supercoppa Serie C', code:'supercoppa-serie-c', live:true }
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
    { name:'Serie D - Girone I', code:'serie-d-i', live:true },
    { name:'Coppa Italia Serie D', code:'coppa-italia-serie-d', live:true },
    { name:'Poule Scudetto Serie D', code:'serie-d-poule-scudetto', live:true },
    { name:'Playoff Promozione Serie D', code:'serie-d-playoff-promozione', live:true },
    { name:'Playout Retrocessione Serie D', code:'serie-d-playout-retrocessione', live:true }
  ]},
  { key:'primavera', label:'Primavera', items:[
    { name:'Campionato Primavera 1', code:'primavera-1', live:true },
    { name:'Campionato Primavera 2', code:'primavera-2', live:true },
    { name:'Coppa Italia Primavera', code:'coppa-italia-primavera', live:true },
    { name:'Supercoppa Primavera', code:'supercoppa-primavera', live:true }
  ]},
  { key:'femminile', label:'Femminile', items:[
    { name:'Serie A Femminile', code:'serie-a-women', live:true },
    { name:'Serie A Cup Women', code:'serie-a-cup-women', live:true },
    { name:'Coppa Italia Women', code:'coppa-italia-women', live:true }
  ]},
  { key:'italiane-europa', label:'Italiane in Europa', items:[
    { name:'Champions League', code:'champions-league', live:true },
    { name:'Europa League', code:'europa-league', live:true },
    { name:'Conference League', code:'conference-league', live:true }
  ]},
  { key:'nazionale', label:'Nazionale', items:[
    { name:'Italia', code:'italia', live:true, mode:'team', teamId:768 },
    { name:'Italia U20', code:'italia-u20', live:true, mode:'team', teamId:10289 },
    { name:'Italia U21', code:'italia-u21', live:true, mode:'team', teamId:820 },
    { name:'Qualificazioni Mondiali', code:'world-cup-qualifiers-europe', live:true, mode:'national-competition', teamId:768 },
    { name:'UEFA Nations League', code:'nations-league', live:true, mode:'national-competition', teamId:768 },
    { name:'Mondiali', code:'world-cup', live:true, mode:'national-competition', teamId:768 }
  ]}
];

const state = {
  page:'home', competition:'', filter:'all', search:'', fixtures:[], loading:false, error:'',
  selected:null, meta:null, standings:[], standingsLoading:false, selectedTeam:null, teamData:null, teamLoading:false,
  openMacro:'serie-a', marketTab:'official', rankings:{ scorers:[], assists:[], ratings:[] },
  rankingsLoading:{ scorers:false, assists:false, ratings:false }, rankingsNote:{ scorers:'', assists:'', ratings:'' },
  transfers:[], transfersLoading:false, transfersNote:'', teamDirectorySearch:'', teamTab:'overview', topTab:'scorers',
  _historyLock:false
};

const esc=s=>String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const allItems = CATEGORY_TREE.flatMap(group => group.items);
const getComp = () => allItems.find(c => c.name === state.competition);
const currentCode = () => getComp()?.code || '';
const currentMacro = () => CATEGORY_TREE.find(group => group.items.some(item => item.name === state.competition))?.label || 'Seleziona una categoria';
const currentItem = () => allItems.find(c => c.name === state.competition);
const currentMode = () => currentItem()?.mode || 'league';
const localDate = d => new Date(d).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'});
const localDateLong = d => new Date(d).toLocaleDateString('it-IT',{weekday:'long', day:'numeric', month:'long', year:'numeric'});
const monthKey = d => { const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`; };
const monthLabel = d => new Date(d).toLocaleDateString('it-IT',{month:'long', year:'numeric'});
const sortByDateDesc = list => [...list].sort((a,b)=>new Date(b.fixture.date)-new Date(a.fixture.date));
const sortByDateAsc = list => [...list].sort((a,b)=>new Date(a.fixture.date)-new Date(b.fixture.date));
const resultBadge = match => {
  const homeId = String(match?.teams?.home?.id || '');
  const awayId = String(match?.teams?.away?.id || '');
  const mine = String(state.selectedTeam?.id || state.teamData?.team?.id || '');
  const gh = Number(match?.goals?.home ?? -1), ga = Number(match?.goals?.away ?? -1);
  if(!mine || gh < 0 || ga < 0) return '—';
  const diff = homeId===mine ? gh-ga : awayId===mine ? ga-gh : 0;
  if(diff>0) return 'V';
  if(diff<0) return 'P';
  return 'N';
};
const standingRowClass = rank => {
  const r = Number(rank || 0);
  const code = currentCode();
  if(['champions-league','europa-league','conference-league'].includes(code)) return '';
  if(code==='serie-a'){
    if(r>=1 && r<=4) return 'standing-top';
    if(r===5 || r===6) return 'standing-mid';
    if(r>=18) return 'standing-bottom';
    return '';
  }
  if(code==='serie-b'){
    if(r<=2) return 'standing-top';
    if(r>=3 && r<=8) return 'standing-mid';
    if(r===16 || r===17) return 'standing-mid';
    if(r>=18) return 'standing-bottom';
    return '';
  }
  if(['serie-c-girone-a','serie-c-girone-b','serie-c-girone-c'].includes(code)){
    if(r===1) return 'standing-top';
    if(r>=2 && r<=10) return 'standing-mid';
    if(r===16) return 'standing-mid';
    if(r>=17) return 'standing-bottom';
    return '';
  }
  if(['serie-d-girone-a','serie-d-girone-b','serie-d-girone-c','serie-d-girone-d','serie-d-girone-e','serie-d-girone-f','serie-d-girone-g','serie-d-girone-h','serie-d-girone-i'].includes(code)){
    if(r===1) return 'standing-top';
    if(r>=2 && r<=5) return 'standing-mid';
    if(r>=16) return 'standing-bottom';
    return '';
  }
  return '';
};
function statusClass(short){ if(['1H','2H','HT','ET','BT','P','LIVE','INT'].includes(short)) return 'live'; if(['FT','AET','PEN'].includes(short)) return 'finished'; return 'scheduled'; }
function statusLabel(m){ const s=m.fixture.status.short, e=m.fixture.status.elapsed; if(['1H','2H'].includes(s)) return `<span class="live-dot"></span>Partita in corso ${s==='1H'?'1T':'2T'}${e?' • '+e+"'":''}`; if(s==='HT') return '<span class="live-dot"></span>Intervallo'; if(['ET','BT','P','LIVE','INT'].includes(s)) return '<span class="live-dot"></span>Partita in corso'; if(['FT','AET','PEN'].includes(s)) return 'Partita finita'; return 'Non iniziata'; }
function iconForEvent(type,detail){
  const t=`${type||''} ${detail||''}`.toLowerCase();
  if(t.includes('goal')) return '<span class="event-icon event-goal" aria-hidden="true">⚽</span>';
  if(t.includes('card')) return detail==='Red Card'
    ? '<span class="event-icon event-red" aria-hidden="true">🟥</span>'
    : '<span class="event-icon event-yellow" aria-hidden="true">🟨</span>';
  if(t.includes('subst')) return '<span class="event-icon event-subst" aria-hidden="true">🔁</span>';
  if(t.includes('var')) return '<span class="event-icon event-var" aria-hidden="true">🖥️</span>';
  if(t.includes('penalty')) return '<span class="event-icon event-penalty" aria-hidden="true">🎯</span>';
  return '<span class="event-icon" aria-hidden="true">•</span>';
}

function teamLink(name,id){ return `<span class="linklike" onclick="openTeam(${id},'${esc(String(name).replaceAll("'",'\''))}')">${esc(name)}</span>`; }
function safeJsonState(){
  return {
    page: state.page,
    competition: state.competition,
    filter: state.filter,
    search: state.search,
    openMacro: state.openMacro,
    marketTab: state.marketTab,
    selected: state.selected,
    selectedTeam: state.selectedTeam,
    teamTab: state.teamTab
  };
}
function syncHistory(replace=false){
  if(state._historyLock) return;
  const snapshot = safeJsonState();
  if(replace) history.replaceState(snapshot, '', '#'+(state.page || 'home'));
  else history.pushState(snapshot, '', '#'+(state.page || 'home'));
}
function parseNum(v){ const n=parseFloat(String(v||'0').replace('%','').replace(',','.')); return Number.isFinite(n)?n:0; }

const STAT_LABELS = {
  'Shots on Goal':'Tiri in porta','Shots off Goal':'Tiri fuori','Total Shots':'Tiri totali','Blocked Shots':'Tiri bloccati',
  'Shots insidebox':'Tiri in area','Shots outsidebox':'Tiri da fuori area','Fouls':'Falli','Corner Kicks':'Calci d\'angolo',
  'Offsides':'Fuorigioco','Ball Possession':'Possesso palla','Yellow Cards':'Cartellini gialli','Red Cards':'Cartellini rossi',
  'Goalkeeper Saves':'Parate del portiere','Total passes':'Passaggi totali','Passes accurate':'Passaggi riusciti',
  'Passes %':'Precisione passaggi','expected_goals':'Gol attesi','Goals Prevented':'Gol evitati','Penalty Kicks':'Rigori',
  'Big Chances Created':'Grandi occasioni create','Big Chances Missed':'Grandi occasioni sprecate','Substitutions':'Sostituzioni',
  'Attacks':'Attacchi','Dangerous Attacks':'Attacchi pericolosi','Hit Woodwork':'Legni colpiti','Free Kicks':'Calci di punizione',
  'Throwins':'Rimesse laterali','Goal Attempts':'Tentativi di gol','Goals':'Gol','Saves':'Parate','Duels Won':'Duelli vinti',
  'Dribble Attempts':'Dribbling tentati','Dribble Success':'Dribbling riusciti','Aerials Won':'Duelli aerei vinti','Crosses':'Cross',
  'Accurate Crosses':'Cross precisi','Interceptions':'Intercetti','Tackles':'Contrasti','Clearances':'Spazzate difensive',
  'Penalty won':'Rigori conquistati','Penalty scored':'Rigori segnati','Penalty missed':'Rigori sbagliati'
};
const EVENT_TYPE_LABELS = {
  Goal:'Gol',Card:'Cartellino',subst:'Sostituzione',Substitution:'Sostituzione',Var:'VAR',Foul:'Fallo',
  substs:'Sostituzione',Penalty:'Rigore'
};
const EVENT_DETAIL_LABELS = {
  'Normal Goal':'Gol','Own Goal':'Autogol','Penalty':'Rigore','Missed Penalty':'Rigore sbagliato','Yellow Card':'Ammonizione',
  'Red Card':'Espulsione','Substitution':'Sostituzione','subst':'Sostituzione','Var':'VAR','Goal Disallowed':'Gol annullato',
  'Penalty Shootout':'Rigori','Card Upgrade':'Cartellino modificato','Substitution 1':'Sostituzione','Substitution 2':'Sostituzione',
  'Injury':'Infortunio','Tactical Substitution':'Sostituzione tattica','Foul':'Fallo','Handball':'Fallo di mano'
};
const GENERIC_TRANSLATIONS = {
  'Starting XI':'Formazione titolare','Substitutes':'Panchina','Coach':'Allenatore','Home Team':'Squadra di casa','Away Team':'Squadra ospite',
  'Match Winner':'Vincitore partita','No Goals':'Nessun gol','Both Teams Score':'Gol di entrambe le squadre','Aggiornamento':'Aggiornamento',
  'Transfer':'Trasferimento','Loan':'Prestito','Free':'Svincolato','N/A':'n.d.','Cancelled':'Annullata','Abandoned':'Sospesa','Awarded':'Assegnata',
  'Postponed':'Rinviata','Suspended':'Sospesa','Time':'Orario','Home':'Casa','Away':'Trasferta','Win':'Vittoria','Draw':'Pareggio','Loss':'Sconfitta'
};
function tLabel(value){
  const raw = String(value ?? '').trim();
  if(!raw) return '';
  return STAT_LABELS[raw] || EVENT_TYPE_LABELS[raw] || EVENT_DETAIL_LABELS[raw] || GENERIC_TRANSLATIONS[raw]
    || raw.replace(/Substitutions?/gi,'Sostituzioni')
          .replace(/Substitution/gi,'Sostituzione')
          .replace(/Yellow Cards?/gi,'Cartellini gialli')
          .replace(/Red Cards?/gi,'Cartellini rossi')
          .replace(/Injury/gi,'Infortunio')
          .replace(/Goal Disallowed/gi,'Gol annullato')
          .replace(/Own Goal/gi,'Autogol')
          .replace(/Missed Penalty/gi,'Rigore sbagliato');
}

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
  return `<div class="topbar"><div class="brand-inline"><div class="logo" aria-label="Home" role="button" tabindex="0" onclick="setPage('home')" onkeydown="if(event.key==='Enter'||event.key===' '){setPage('home')}"><img src="logo.svg" alt="Logo Calcio Italiano" /></div><div><h1>Calcio Italiano</h1><small>Risultati, classifiche e approfondimenti sul calcio italiano</small></div></div><div class="topnav">${NAV_ITEMS.map(item=>`<button class="${state.page===item.key?'active':''}" onclick="setPage('${item.key}')"><span class="nav-ico">${item.icon}</span><span>${item.label}</span></button>`).join('')}</div></div>`;
}

function sidebar(){
  return `<aside class="sidebar"><h3>Campionati</h3><div class="footer-note" style="margin:0 0 14px">Apri una macro-categoria e scegli la sottocategoria da visualizzare. Ho già collegato tutte quelle ricavate dagli screen con ID v3 del 2025; le altre restano pronte come prossimi inserimenti.</div>${CATEGORY_TREE.map(group=>`<div class="macro ${state.openMacro===group.key?'open':''}"><button class="head" onclick="toggleMacro('${group.key}')"><span>${group.label}</span><span>${state.openMacro===group.key?'−':'+'}</span></button><div class="subs">${group.items.map(item=>`<button class="${item.disabled?'disabled':''} ${state.competition===item.name?'active':''}" onclick="${item.disabled?'return false':`selectCompetition('${item.name}')`}">${item.name}${item.disabled?' <span class="muted">(in arrivo)</span>':''}</button>`).join('')}</div></div>`).join('')}</aside>`;
}

function toolbar(){
  return `<div class="toolbar"><div class="tabs"><button class="${state.filter==='all'?'active':''}" onclick="setFilter('all')">Tutte</button><button class="${state.filter==='live'?'active':''}" onclick="setFilter('live')">Live</button><button class="${state.filter==='next'?'active':''}" onclick="setFilter('next')">Prossime</button><button class="${state.filter==='finished'?'active':''}" onclick="setFilter('finished')">Finite</button></div><input class="search" placeholder="Cerca squadra..." value="${esc(state.search)}" oninput="setSearch(this.value)" /></div>`;
}

function homeHero(){
  const selected = state.competition ? `<div class="feature"><span>Ultima competizione aperta</span><strong>${esc(state.competition)}</strong></div>` : `<div class="feature"><span>Ultima competizione aperta</span><strong>Nessuna ancora scelta</strong></div>`;
  return `<div class="hero-home"><div class="card hero-main hero-glow"><div class="select-note">Benvenuto su Calcio Italiano</div><h1>Una Home pulita, elegante e pronta a guidare davvero la navigazione.</h1><p>Quando entri nel sito resti sempre sulla Home iniziale, senza classifiche o partite caricate automaticamente. Da qui puoi scegliere con calma una competizione, aprire la sezione Squadre, consultare la pagina Top o il Mercato.</p><div class="pills"><span class="pill">Home pulita</span><span class="pill">Navigazione più chiara</span><span class="pill">Date ben visibili</span><span class="pill">Statistiche tradotte</span></div><div class="hero-cta"><button onclick="setPage('teams')">Apri Squadre</button><button onclick="setPage('top')">Apri Top</button><button onclick="setPage('market')">Apri Mercato</button></div><div class="home-highlight"><div class="feature"><div><strong>Competizioni</strong><div class="muted small">Apri una macro-categoria a sinistra e scegli il campionato che vuoi seguire.</div></div></div><div class="feature"><div><strong>Top unificata</strong><div class="muted small">Marcatori, assist e valutazioni nella stessa pagina, più ordinati e immediati.</div></div></div><div class="feature"><div><strong>Vista partite</strong><div class="muted small">Live e prossime più pulite, con date in evidenza e partite finite separate.</div></div></div></div></div><div class="card hero-side"><h2>Accesso rapido</h2><div class="hero-list">${selected}<div class="feature"><span>Come iniziare</span><strong>Scegli una competizione dal menu laterale</strong></div><div class="feature"><span>Esperienza</span><strong>Home sempre separata dai contenuti live</strong></div><div class="feature"><span>Struttura</span><strong>Squadre, Top, Mercato e Supporto</strong></div></div></div></div>`;
}

function homeLanding(){
  return `<div class="empty-shell"><div class="card section"><div class="section-head"><div><h2 style="margin-bottom:4px">Scegli una competizione</h2><div class="muted small">Apri una macro-categoria dal menu laterale oppure usa i pulsanti rapidi qui sotto.</div></div><div class="muted small">La Home resta sempre pulita finché non entri davvero in una competizione o nella sezione Nazionale.</div></div><div class="macro-grid">${CATEGORY_TREE.map(group=>`<div class="macro-tile"><strong>${group.label}</strong><div class="directory-meta">${group.items.filter(i=>!i.disabled).length} sottocategorie disponibili</div><div class="macro-actions">${group.items.map(item=>item.disabled?`<button disabled style="opacity:.55;cursor:not-allowed">${item.name}</button>`:`<button onclick="selectCompetition('${item.name}')">${item.name}</button>`).join('')}</div></div>`).join('')}</div></div><div class="home-grid"><div class="card home-card"><em>Home</em><strong>Ingresso ordinato</strong><div class="directory-meta">Niente contenuti automatici all'apertura: scegli tu quando visualizzare partite e classifiche.</div></div><div class="card home-card"><em>Squadre</em><strong>Ricerca veloce</strong><div class="directory-meta">Apri una squadra e consulta rosa, infortuni, cartellini, formazioni e notizie ufficiali.</div></div><div class="card home-card"><em>Top</em><strong>Una sola pagina</strong><div class="directory-meta">Marcatori, assist e valutazioni raccolti in tre tabelle affiancate più belle da leggere.</div></div></div></div>`;
}

function competitionView(){
  const teamMode = currentMode()==='team';
  const intro = teamMode
    ? 'Vista dedicata alla Nazionale: qui trovi partite in corso, prossimi impegni e risultati recenti dell\'Italia, senza scheda rosa o dati club.'
    : 'Vista principale della competizione con partite, classifica, schede squadra e statistiche tradotte in italiano. Puoi cambiare categoria dal menu laterale in qualsiasi momento oppure tornare alla Home pulita dal menu alto.';
  const pills = teamMode
    ? '<span class="pill">Partite Italia</span><span class="pill">Prossime</span><span class="pill">In corso</span><span class="pill">Risultati recenti</span>'
    : '<span class="pill">Live</span><span class="pill">Classifica</span><span class="pill">Dettagli partita</span><span class="pill">Schede squadra</span>' ;
  const rightLabel = teamMode ? 'Sezione attiva' : 'Competizione attiva';
  const rightValue = teamMode ? 'Nazionali' : esc(state.competition);
  return `<div class="content">${state.competition ? `<div class="hero"><div class="card hero-main"><div class="muted small">${esc(currentMacro())} • ${esc(state.competition)}</div><h1>${esc(state.competition)}</h1><p>${intro}</p><div class="pills">${pills}</div></div><div class="card hero-side"><h2>Stato rapido</h2><div class="kpi"><div class="row"><strong>${rightLabel}</strong><div class="muted small">${rightValue}</div></div><div class="row"><strong>Partite caricate</strong><div class="muted small">${state.fixtures.length || '—'}</div></div><div class="row"><strong>Ordine</strong><div class="muted small">Più recenti in alto</div></div></div></div></div><div class="grid ${teamMode ? 'grid1' : 'grid2'}">${matchesList()}${teamMode ? '' : standingsCard()}</div>` : homeLanding()}</div>`;
}


function renderMatchesGrouped(list){
  const months = new Map();
  list.forEach(m => {
    const mk = monthKey(m.fixture.date);
    if(!months.has(mk)) months.set(mk, { label: monthLabel(m.fixture.date), days:new Map() });
    const month = months.get(mk);
    const dk = new Date(m.fixture.date).toISOString().slice(0,10);
    if(!month.days.has(dk)) month.days.set(dk, { label: localDateLong(m.fixture.date), items:[] });
    month.days.get(dk).items.push(m);
  });
  return [...months.entries()].map(([_, month]) => `<div><div class="match-month">${esc(month.label)}</div>${[...month.days.entries()].map(([__, day]) => `<div class="match-date">${esc(day.label)}</div><div class="list">${day.items.map(m=>`<div class="card match" onclick="openMatch(${m.fixture.id})"><div class="rowflex"><div><div class="muted small">${esc(m.league.name)} • ${localDate(m.fixture.date)}</div><div class="title">${esc(m.teams.home.name)} vs ${esc(m.teams.away.name)}</div></div><div class="badges"><span class="badge ${statusClass(m.fixture.status.short)}">${statusLabel(m)}</span><span class="scorebadge">${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</span></div></div></div>`).join('')}</div>`).join('')}</div>`).join('');
}

function matchesList(){
  const allFixtures = state.fixtures || [];
  const liveList = sortByDateDesc(allFixtures.filter(m=>statusClass(m.fixture.status.short)==='live'));
  const nextListFull = sortByDateAsc(allFixtures.filter(m=>statusClass(m.fixture.status.short)==='scheduled'));
  const nextList = nextListFull.slice(0,10);
  const finishedList = sortByDateDesc(allFixtures.filter(m=>statusClass(m.fixture.status.short)==='finished'));

  let list = [];
  let note = 'Live in evidenza + massimo 10 prossime partite. Le partite finite restano separate nella tab Finite.';
  if(state.filter==='live'){ list = liveList; note = 'Solo partite live.'; }
  else if(state.filter==='next'){ list = nextList; note = 'Mostrate solo le prossime 10 partite, ordinate dalla più vicina.'; }
  else if(state.filter==='finished'){ list = finishedList; note = 'Partite finite, separate per mantenere la vista più pulita.'; }
  else { list = [...liveList, ...nextList]; }

  if(state.search.trim()){
    const q=state.search.toLowerCase();
    list=list.filter(m=>m.teams.home.name.toLowerCase().includes(q)||m.teams.away.name.toLowerCase().includes(q));
  }

  const euroMode = state.meta?.italianTeamsOnly && ['champions-league','europa-league','conference-league'].includes(currentCode());
  const euroEliminated = !!state.meta?.europeEliminated;
  const euroEmptyMessage = euroMode && euroEliminated && state.filter !== 'finished'
    ? `<div class="notice"><strong>Tutte le squadre italiane sono state eliminate dalla competizione.</strong><div class="footer-note">Nelle schede Tutte, Live e Prossime non c'è più nulla da mostrare. Apri Finite per rivedere le ultime partite delle italiane.</div></div>`
    : '';

  const euroSummary = state.meta?.recentItalianResults?.length && state.filter==='finished'
    ? `<div class="card section" style="margin-bottom:12px"><h2>Ultimi risultati delle italiane</h2><div class="list">${state.meta.recentItalianResults.map(tie=>`<div class="market-item"><div class="rowflex"><div><strong>${esc(tie.home.name)} ${tie.home.score} (${tie.home.aggregate}) ${tie.home.qualified ? '↑' : ''}</strong></div><div class="muted small">${tie.legs===2?'Andata / ritorno':'Partita secca'}</div></div><div style="margin-top:8px"><strong>${esc(tie.away.name)} ${tie.away.score} (${tie.away.aggregate}) ${tie.away.qualified ? '↑' : ''}</strong></div></div>`).join('')}</div></div>`
    : '';

  const hideMatchesBecauseEliminated = euroMode && euroEliminated && state.filter !== 'finished';
  const visibleList = hideMatchesBecauseEliminated ? [] : list;

  const body = !visibleList.length
    ? `${euroEmptyMessage}${euroSummary}<div class="notice">${hideMatchesBecauseEliminated ? 'Nessuna partita da mostrare in questa tab.' : 'Nessuna partita trovata per i filtri selezionati.'}</div>`
    : ((state.filter==='finished' || state.filter==='live') 
      ? `${euroEmptyMessage}${euroSummary}<div class="list">${visibleList.map(m=>`<div class="card match" onclick="openMatch(${m.fixture.id})"><div class="rowflex"><div><div class="muted small"><strong>${localDateLong(m.fixture.date)}</strong> • ${esc(m.league.name)} • ${localDate(m.fixture.date)}</div><div class="title">${esc(m.teams.home.name)} vs ${esc(m.teams.away.name)}</div></div><div class="badges"><span class="badge ${statusClass(m.fixture.status.short)}">${statusLabel(m)}</span><span class="scorebadge">${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</span></div></div></div>`).join('')}</div>`
      : `${euroEmptyMessage}${euroSummary}${renderMatchesGrouped(visibleList)}`);
  return `<div class="card section"><div class="section-head"><div><h2 style="margin-bottom:4px">Partite</h2><div class="muted small">${note}</div></div><div class="muted small">${state.fixtures.length ? state.fixtures.length+' incontri disponibili' : 'Nessun incontro caricato'}</div></div>${toolbar()}${state.loading?`<div class="notice">Caricamento partite...</div>`:state.error?`<div class="notice">${esc(state.error)}</div>`:body}</div>`;
}

function standingsCard(){
  const code = currentCode();
  const euro = ['champions-league','europa-league','conference-league'].includes(code);
  const noItalian = state.standingsMeta && state.standingsMeta.noItalianTeams && euro;
  const labelForRow = rank => {
    const r = Number(rank || 0);
    if(euro) return '';
    if(code==='serie-a'){
      if(r<=4) return '<span class="standing-tag">Champions League</span>';
      if(r===5) return '<span class="standing-tag">Europa League</span>';
      if(r===6) return '<span class="standing-tag">Conference League</span>';
      if(r>=18) return '<span class="standing-tag">Retrocessione</span>';
      return '';
    }
    if(code==='serie-b'){
      if(r<=2) return '<span class="standing-tag">Promozione</span>';
      if(r>=3 && r<=8) return '<span class="standing-tag">Playoff</span>';
      if(r===16 || r===17) return '<span class="standing-tag">Playout</span>';
      if(r>=18) return '<span class="standing-tag">Retrocessione</span>';
      return '';
    }
    if(['serie-c-girone-a','serie-c-girone-b','serie-c-girone-c'].includes(code)){
      if(r===1) return '<span class="standing-tag">Promozione</span>';
      if(r>=2 && r<=10) return '<span class="standing-tag">Playoff</span>';
      if(r===16) return '<span class="standing-tag">Playout</span>';
      if(r>=17) return '<span class="standing-tag">Retrocessione</span>';
      return '';
    }
    if(['serie-d-girone-a','serie-d-girone-b','serie-d-girone-c','serie-d-girone-d','serie-d-girone-e','serie-d-girone-f','serie-d-girone-g','serie-d-girone-h','serie-d-girone-i'].includes(code)){
      if(r===1) return '<span class="standing-tag">Promozione</span>';
      if(r>=2 && r<=5) return '<span class="standing-tag">Playoff</span>';
      if(r>=16) return '<span class="standing-tag">Retrocessione</span>';
      return '';
    }
    return '';
  };
  return `<div class="card section"><div class="rowflex" style="margin-bottom:10px"><h2>Classifica</h2><div class="muted small">${esc(state.competition)}</div></div>${state.standingsLoading?`<div class="notice">Caricamento classifica...</div>`:!state.standings.length?`<div class="notice">${noItalian ? 'Nessuna squadra italiana ancora presente nella classifica attuale della competizione.' : 'Classifica non disponibile per questa categoria.'}</div>`:`<table><thead><tr><th>#</th><th>Squadra</th><th>PT</th><th>G</th><th>V</th><th>N</th><th>P</th><th>DR</th></tr></thead><tbody>${state.standings.map((r,i)=>`<tr class="${standingRowClass(r.displayRank || r.rank)}"><td>${r.displayRank || r.rank || (i+1)}</td><td>${teamLink(r.team.name,r.team.id)} ${labelForRow(r.displayRank || r.rank)}</td><td>${r.points}</td><td>${r.all.played}</td><td>${r.all.win}</td><td>${r.all.draw}</td><td>${r.all.lose}</td><td>${r.goalsDiff}</td></tr>`).join('')}</tbody></table>`}</div>`;
}

function homeView(){ return `<div class="content">${homeHero()}${homeLanding()}</div>`; }

function detailView(){
  if(!state.selected) return '';
  if(state.selected.loading) return `<div class="content"><a class="back" onclick="closeMatch()">← Torna alla competizione</a><div class="card notice">Caricamento dettaglio partita...</div></div>`;
  if(state.selected.error) return `<div class="content"><a class="back" onclick="closeMatch()">← Torna alla competizione</a><div class="card notice">${esc(state.selected.error)}</div></div>`;
  const d=state.selected.data, m=d.match, events=d.events||[], stats=d.stats||[], lineups=d.lineups||[];
  const lineupCard=l=>`<div class="lineup"><h3>${esc(l.team?.name||'Squadra')}</h3><div class="muted small">Modulo: ${esc(l.formation||'n.d.')}</div><div class="players" style="margin-top:10px">${(l.startXI||[]).map(p=>`<div class="player">${esc(p.player?.number||'')} • ${esc(p.player?.name||'')}</div>`).join('') || '<div class="muted small">Formazione non disponibile.</div>'}</div></div>`;
  const interestingStats=['Shots on Goal','Shots off Goal','Total Shots','Blocked Shots','Shots insidebox','Shots outsidebox','Ball Possession','Corner Kicks','Offsides','Fouls','Yellow Cards','Red Cards','Goalkeeper Saves','Total passes','Passes accurate','Passes %','expected_goals','Goals Prevented'];
  const statsHtml = `<div class="card section"><h2>Statistiche</h2>${stats.length>=2?interestingStats.map(s=>renderStat(stats,s)).join(''):`<div class="muted small">Statistiche non disponibili.</div>`}</div>`;
  const lineupsHtml = `<div class="card section"><h2>Formazioni</h2>${lineups.length?`<div class="split">${lineups.map(lineupCard).join('')}</div>`:`<div class="muted small">Formazioni non disponibili.</div>`}</div>`;
  return `<div class="content"><a class="back" onclick="closeMatch()">← Torna alla competizione</a><div class="grid grid2"><div><div class="card section"><div class="rowflex"><div><div class="muted small">${esc(m.league.name)} • ${localDate(m.fixture.date)}</div><div class="title">${teamLink(m.teams.home.name,m.teams.home.id)} vs ${teamLink(m.teams.away.name,m.teams.away.id)}</div><div class="muted small">${esc(m.fixture.venue?.name||'Stadio non disponibile')}</div></div><div class="badges"><span class="badge ${statusClass(m.fixture.status.short)}">${statusLabel(m)}</span><span class="scorebadge">${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</span></div></div></div><div class="card section"><h2>Eventi</h2>${events.length?events.map(e=>{
      const label = esc(tLabel(e.detail) || tLabel(e.type) || e.type || '');
      const extra = e.detail && !EVENT_DETAIL_LABELS[e.detail] ? ' • '+esc(tLabel(e.detail)) : '';
      const tm = e.time.elapsed?e.time.elapsed+"'" : '-';
      const detailLower = String(e.detail||'').toLowerCase();
      const typeLower = String(e.type||'').toLowerCase();
      let body = '';
      if(typeLower.includes('subst') || detailLower.includes('substitution')){
        const outName = esc(e.player?.name || '');
        const inName = esc(e.assist?.name || '');
        body = `<div class="event-sub-line" style="margin-top:8px"><span class="sub-out">⬅ ${outName}</span><span class="sub-sep">→</span><span class="sub-in">${inName} ➜</span></div>`;
      } else if(detailLower.includes('yellow card')){
        body = `<div class="event-card-line event-yellow-line" style="margin-top:8px"><span class="card-badge yellow">🟨 Ammonizione</span><span>${esc(e.player?.name||'')}</span></div>`;
      } else if(detailLower.includes('red card')){
        body = `<div class="event-card-line event-red-line" style="margin-top:8px"><span class="card-badge red">🟥 Espulsione</span><span>${esc(e.player?.name||'')}</span></div>`;
      } else if(typeLower.includes('goal') || detailLower.includes('goal')){
        body = `<div class="event-card-line event-goal-line" style="margin-top:8px"><span class="goal-badge">⚽ Gol</span><span>${esc(e.player?.name||'')}</span>${e.assist?.name?`<span class="goal-assist">• ${esc(e.assist.name)}</span>`:''}</div>`;
      } else {
        body = `<div style="margin-top:6px">${esc(e.player?.name||'')}${e.assist?.name?' • • '+esc(e.assist.name):''}</div>`;
      }
      return `<div class="event"><div class="rowflex"><strong>${tm} ${iconForEvent(e.type,e.detail)}</strong><span class="muted small">${esc(e.team?.name||'')}</span></div>${body}<div class="muted small">${label}${extra}</div></div>`;
    }).join(''):`<div class="muted small">Nessun evento disponibile.</div>`}</div>${statsHtml}</div><div>${lineupsHtml}</div></div></div>`;
}

function teamTabOverview(d){
  const fixturesDesc=sortByDateDesc(d.fixtures||[]);
  const recentFinished = sortByDateDesc((d.fixtures||[]).filter(m=>statusClass(m.fixture.status.short)==='finished')).slice(0,5);
  const form = recentFinished.map(m => {
    const res = resultBadge(m);
    const cls = res==='V' ? 'win' : res==='N' ? 'draw' : 'loss';
    return `<span class="form-chip ${cls}">${res}</span>`;
  }).join('') || '<div class="muted small">Forma recente non disponibile.</div>';
  return `<div class="tab-shell"><div class="grid grid2"><div class="card section"><h2>Panoramica rapida</h2>${d.standing?`<table><thead><tr><th>#</th><th>PT</th><th>G</th><th>V</th><th>N</th><th>P</th><th>DR</th></tr></thead><tbody><tr class="${standingRowClass(d.standing.rank)}"><td>${d.standing.rank}</td><td>${d.standing.points}</td><td>${d.standing.all.played}</td><td>${d.standing.all.win}</td><td>${d.standing.all.draw}</td><td>${d.standing.all.lose}</td><td>${d.standing.goalsDiff}</td></tr></tbody></table>`:`<div class="muted small">Classifica non disponibile per questa squadra o categoria.</div>`}<div style="margin-top:16px"><strong>Forma recente</strong><div class="team-form">${form}</div></div></div><div class="card section"><h2>Ultime / prossime partite</h2>${fixturesDesc.length?fixturesDesc.map(m=>`<div class="team-item"><div class="muted small">${localDate(m.fixture.date)}</div><div style="margin-top:6px"><strong>${esc(m.teams.home.name)} vs ${esc(m.teams.away.name)}</strong></div><div class="muted small" style="margin-top:4px">${statusLabel(m).replace(/<[^>]+>/g,'')} • ${m.goals.home ?? '-'} - ${m.goals.away ?? '-'}</div></div>`).join(''):`<div class="muted small">Nessuna partita disponibile.</div>`}</div></div></div>`;
}
function teamTabSquad(d){
  const squad = d.squad || [];
  return `<div class="card section tab-shell"><h2>Rosa</h2>${squad.length?`<div class="grid grid3">${squad.map(p=>`<div class="mini-card"><strong>${esc(p.name)}</strong><div class="directory-meta">${esc(tLabel(p.position || 'Ruolo n.d.'))} • #${esc(p.number || '—')}</div><div class="directory-meta">Età: ${esc(p.age || '—')}</div></div>`).join('')}</div>`:`<div class="notice">Rosa non disponibile per questa squadra.</div>`}</div>`;
}
function teamTabInjuries(d){
  const injuries = d.injuries || [];
  return `<div class="card section tab-shell"><h2>Infortuni / indisponibilità</h2>${injuries.length?`<div class="list">${injuries.map(i=>`<div class="news-card"><strong>${esc(i.player?.name || 'Giocatore')}</strong><div class="directory-meta">${esc(tLabel(i.player?.type || 'Indisponibilità'))} • ${esc(tLabel(i.player?.reason || 'Motivo non indicato'))}</div><div class="directory-meta">Data: ${i.fixture?.date ? localDate(i.fixture.date) : 'n.d.'}</div></div>`).join('')}</div>`:`<div class="notice">Nessun infortunio segnalato nei dati disponibili.</div>`}</div>`;
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
  return `<div class="tab-shell" style="display:grid;gap:14px"><div class="card section"><h2>News ufficiali squadra</h2>${official.length?`<div class="list">${official.map(item=>`<div class="news-card"><strong><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title || 'News ufficiale')}</a></strong><div class="directory-meta">Fonte: ${esc(item.source || sourceLabel)}</div><div class="directory-meta">${item.publishedAt ? 'Pubblicata: '+localDate(item.publishedAt) : 'Data non disponibile'}</div>${item.description?`<div class="directory-meta" style="margin-top:8px">${esc(item.description)}</div>`:''}</div>`).join('')}</div>`:`<div class="notice">Nessuna news ufficiale disponibile al momento per questa squadra.</div>`}${officialNote?`<div class="footer-note">${esc(officialNote)}</div>`:''}</div><div class="card section"><h2>Movimenti ufficiali squadra</h2>${news.length?`<div class="list">${news.map(n=>`<div class="news-card"><strong>${esc(n.player?.name || 'Giocatore')}</strong><div class="directory-meta">${esc(n.teams?.out?.name || '—')} → ${esc(n.teams?.in?.name || '—')}</div><div class="directory-meta">${esc(tLabel(n.update?.type || 'Aggiornamento'))} • ${n.update?.date ? localDate(n.update.date) : 'n.d.'}</div></div>`).join('')}</div>`:`<div class="notice">Nessun movimento ufficiale disponibile per questa squadra.</div>`}</div></div>`;
}
function teamView(){
  if(!state.selectedTeam) return '';
  if(state.teamLoading) return `<div class="content"><a class="back" onclick="closeTeam()">← Torna alla competizione</a><div class="card notice">Caricamento squadra...</div></div>`;
  if(!state.teamData || state.teamData.error) return `<div class="content"><a class="back" onclick="closeTeam()">← Torna alla competizione</a><div class="card notice">${esc(state.teamData?.error || 'Errore nel caricamento squadra.')}</div></div>`;
  const d=state.teamData;
  const tabMap = { overview: teamTabOverview(d), squad: teamTabSquad(d), injuries: teamTabInjuries(d), cards: teamTabCards(d), formations: teamTabFormations(d), news: teamTabNews(d) };
  const recentFinished = sortByDateDesc((d.fixtures||[]).filter(m=>statusClass(m.fixture.status.short)==='finished')).slice(0,5);
  const form = recentFinished.map(m => {
    const res = resultBadge(m);
    const cls = res==='V' ? 'win' : res==='N' ? 'draw' : 'loss';
    return `<span class="form-chip ${cls}">${res}</span>`;
  }).join('') || '<div class="muted small">Forma non disponibile.</div>';
  return `<div class="content"><a class="back" onclick="closeTeam()">← Torna ${currentMode()==='team' ? 'alla categoria Nazionale' : 'alla competizione'}</a><div class="hero"><div class="card hero-main"><div class="team-header"><div class="team-brand">${d.team.logo ? `<img src="${esc(d.team.logo)}" alt="${esc(d.team.name)}" />` : ''}<div><div class="muted small">${esc(state.competition)}</div><h1 style="font-size:2.1rem">${esc(d.team.name)}</h1><p>Scheda squadra premium con riepilogo visivo, forma recente, rosa, infortuni, cartellini, formazioni e notizie ufficiali raccolte in un unico spazio più ordinato.</p></div></div><button class="ghost-btn" onclick="setPage('teams')">Vai a Squadre</button></div><div class="team-pills"><span class="pill">Posizione: ${d.standing?d.standing.rank:'—'}</span><span class="pill">Punti: ${d.standing?d.standing.points:'—'}</span><span class="pill">Partite: ${d.standing?d.standing.all.played:'—'}</span><span class="pill">Squadra ID: ${esc(d.team.id || '—')}</span></div><div class="team-hero-grid"><div class="feature"><div><strong>Gol fatti</strong><div class="muted small">${esc(d.teamStats?.goals?.for?.total?.total ?? '—')}</div></div></div><div class="feature"><div><strong>Gol subiti</strong><div class="muted small">${esc(d.teamStats?.goals?.against?.total?.total ?? '—')}</div></div></div><div class="feature"><div><strong>Porta inviolata</strong><div class="muted small">${esc(d.teamStats?.clean_sheet?.total ?? '—')}</div></div></div><div class="feature"><div><strong>Forma</strong><div class="team-form">${form}</div></div></div></div><div class="mini-tabs" style="margin-top:16px">${[['overview','Panoramica'],['squad','Rosa'],['injuries','Infortuni'],['cards','Ammonizioni'],['formations','Formazioni'],['news','Notizie']].map(([key,label])=>`<button class="${state.teamTab===key?'active':''}" onclick="setTeamTab('${key}')">${label}</button>`).join('')}</div></div><div class="card hero-side"><h2>Profilo squadra</h2><div class="kpi"><div class="row"><strong>Competizione</strong><div class="muted small">${esc(state.competition)}</div></div><div class="row"><strong>Stato vista</strong><div class="muted small">Scheda premium squadra</div></div><div class="row"><strong>Contenuti</strong><div class="muted small">Rosa, news, forma, dati rapidi</div></div></div></div></div>${tabMap[state.teamTab] || tabMap.overview}</div>`;
}

function teamsView(){
  if(!state.competition){
    return `<div class="content"><div class="card section"><h1 style="font-size:2rem">Squadre</h1><p>Prima seleziona una competizione dal menu laterale. Dopo vedrai la barra di ricerca e la directory completa delle squadre collegate a quella categoria.</p></div></div>`;
  }
  const q = state.teamDirectorySearch.trim().toLowerCase();
  const teams = uniqueTeams().filter(t => !q || String(t.name).toLowerCase().includes(q));
  return `<div class="content"><div class="team-directory-hero"><div class="card hero-main"><div class="muted small">Directory squadre</div><h1>Squadre</h1><p>Una sezione più pulita e più bella per cercare rapidamente una squadra, aprire la scheda completa e passare da rosa, infortuni, cartellini, formazioni e notizie ufficiali.</p><div class="pills"><span class="pill">Ricerca veloce</span><span class="pill">Scheda completa</span><span class="pill">Rosa e infortuni</span><span class="pill">News ufficiali</span></div><div class="team-highlight-grid"><div class="feature"><div><strong>Ricerca immediata</strong><div class="muted small">Filtra la directory in tempo reale sulla competizione selezionata.</div></div></div><div class="feature"><div><strong>Schede più ricche</strong><div class="muted small">Dati squadra raccolti in un'unica esperienza più ordinata.</div></div></div><div class="feature"><div><strong>Navigazione rapida</strong><div class="muted small">Apri direttamente la squadra che vuoi seguire senza passaggi inutili.</div></div></div></div></div><div class="card hero-side"><h2>Contesto</h2><div class="kpi"><div class="row"><strong>Competizione</strong><div class="muted small">${esc(state.competition)}</div></div><div class="row"><strong>Squadre indicizzate</strong><div class="muted small">${uniqueTeams().length}</div></div><div class="row"><strong>Stile</strong><div class="muted small">Directory premium e più leggibile</div></div></div></div></div><div class="card section"><div class="toolbar"><div><h2 style="margin-bottom:4px">Cerca una squadra</h2><div class="muted small">La ricerca lavora sulla competizione attualmente selezionata.</div></div><input class="search" placeholder="Es. Juventus, Palermo, Arezzo..." value="${esc(state.teamDirectorySearch)}" oninput="setTeamDirectorySearch(this.value)" /></div>${teams.length?`<div class="grid grid3">${teams.map(t=>`<div class="directory-card" onclick="openTeam(${t.id},'${String(t.name).replaceAll("'","\'")}')"><strong>${esc(t.name)}</strong><div class="directory-meta">${t.rank ? 'Posizione attuale: '+t.rank : 'Squadra presente nei dati disponibili'}</div><div class="directory-meta">${t.points!=null ? 'Punti: '+t.points : 'Apri la scheda completa della squadra'}</div><div class="directory-kpi"><span>${t.rank ? 'Top '+t.rank : 'Squadra'}</span><span>${t.points!=null ? t.points+' punti' : 'Scheda completa'}</span><span>Apri dettagli</span></div></div>`).join('')}</div>`:`<div class="notice">Nessuna squadra trovata con questo filtro.</div>`}</div></div>`;
}

function supportView(){
  return `<div class="content"><div class="support-wrap"><div class="support-story"><div class="card hero-main support-long"><div class="muted small">Supporta il progetto</div><h1>Calcio Italiano è un progetto indipendente creato da Gianmarco Teribia</h1><p><strong>Calcio Italiano</strong> è una piattaforma nata per raccogliere in un unico posto il meglio del calcio italiano: risultati live, calendario, classifiche, schede squadra, statistiche, mercato, competizioni giovanili, calcio femminile, coppe nazionali e presenza italiana nelle competizioni europee. L'obiettivo non è soltanto mostrare dati, ma costruire un'esperienza ordinata, moderna e davvero piacevole da consultare ogni giorno.</p><p>Il progetto è stato creato e sviluppato da <strong>Gianmarco Teribia</strong>, conosciuto sui social come <strong>novantasette</strong>. Dietro il sito c'è una visione precisa: valorizzare il calcio italiano con una web app credibile, veloce e sempre più completa, capace di seguire sia le competizioni più note sia quelle che spesso ricevono meno attenzione. Ogni scelta grafica e funzionale punta a dare identità, qualità e continuità a una creazione personale che vuole crescere nel tempo.</p><p>Supportare il progetto significa aiutare concretamente lo sviluppo: le donazioni sostengono i costi delle API, del deploy, dell'infrastruttura serverless e del lavoro necessario per aggiungere nuove funzioni, tradurre meglio i dati, migliorare il design, rifinire la home, potenziare le pagine squadra e rendere ogni sezione più professionale. In altre parole, ogni contributo si trasforma in un sito migliore, più stabile e più ricco.</p><p>La visione è ambiziosa: fare di Calcio Italiano un punto di riferimento riconoscibile per chi ama seguire il nostro calcio, con una firma stilistica forte, una navigazione chiara e contenuti sempre più utili. Se il progetto ti piace, se ne condividi l'idea o vuoi contribuire alla sua crescita, il tuo supporto conta davvero.</p><div class="tricolor-band"><div class="green">Calcio italiano al centro</div><div class="white">Progetto indipendente</div><div class="red">Sviluppo continuo</div></div><div class="hero-cta"><a class="paypal-btn" href="https://paypal.me/marcoteribia" target="_blank" rel="noopener noreferrer">Sostieni il progetto con PayPal</a><button class="ghost-btn" onclick="setPage('home')">Torna alla Home</button></div></div><div class="card section"><h2>Perché vale la pena supportarlo</h2><div class="support-grid"><div class="support-box"><strong>Prestazioni e stabilità</strong><div class="directory-meta">Aiuti a mantenere attivi servizi, API e infrastruttura, così il sito resta veloce e affidabile anche quando cresce.</div></div><div class="support-box"><strong>Nuove funzionalità</strong><div class="directory-meta">Ogni supporto rende più facile aggiungere sezioni premium, filtri migliori, statistiche avanzate e nuove idee utili.</div></div><div class="support-box"><strong>Qualità visiva</strong><div class="directory-meta">Permette di investire tempo nella cura del design, nella leggibilità e in un'identità grafica sempre più forte.</div></div><div class="support-box"><strong>Autore e identità</strong><div class="directory-meta">Sostieni direttamente la crescita di una creazione personale di Gianmarco Teribia, alias novantasette.</div></div></div></div></div><div class="support-visual"><div class="support-banner"><div class="select-note">Grazie davvero</div><h2 style="font-size:1.7rem;margin:8px 0 10px">Ogni contributo aiuta a trasformare un'idea personale in un progetto sempre più riconoscibile.</h2><p>Supportare Calcio Italiano significa credere in una piattaforma indipendente che vuole raccontare e organizzare il calcio italiano in modo moderno, ordinato e bello da usare.</p></div><div class="card hero-side"><h2>Profilo progetto</h2><div class="kpi"><div class="row"><strong>Creatore</strong><div class="muted small">Gianmarco Teribia</div></div><div class="row"><strong>Social</strong><div class="muted small">novantasette</div></div><div class="row"><strong>Missione</strong><div class="muted small">Costruire una casa digitale credibile per il calcio italiano.</div></div></div></div><div class="card hero-side"><h2>Cosa rende speciale il progetto</h2><div class="hero-list"><div class="feature"><span>Copertura</span><strong>dalle grandi competizioni fino ai dettagli più specifici</strong></div><div class="feature"><span>Focus</span><strong>solo calcio italiano e squadre italiane in Europa</strong></div><div class="feature"><span>Firma</span><strong>un progetto personale con identità precisa</strong></div></div></div></div></div></div>`;
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
  return `<div class="ranking-row"><div class="ranking-rank">${idx+1}</div><div><strong>${esc(player.name || 'Giocatore')}</strong><div class="ranking-meta">${esc(team)} • Presenze: ${stats.games?.appearences ?? stats.games?.appearances ?? '—'}</div></div><div><strong>${esc(val)}${suffix}</strong></div></div>`;
}

function rankingValue(type, stats){
  if(type==='scorers') return stats.goals?.total ?? 0;
  if(type==='assists') return stats.goals?.assists ?? 0;
  const raw = Number.parseFloat(String(stats.games?.rating || '').replace(',', '.'));
  return Number.isFinite(raw) ? raw.toFixed(2) : '—';
}

function rankingLabel(type){
  return type==='scorers' ? 'Gol' : type==='assists' ? 'Assist' : 'Valut.';
}

function rankingView(type){
  const list = state.rankings[type] || [];
  const loading = state.rankingsLoading[type];
  const note = state.rankingsNote[type];
  if(loading) return `<div class="directory-meta">Caricamento classifica...</div>`;
  if(!state.competition) return `<div class="directory-meta">Seleziona prima una competizione dal menu laterale.</div>`;
  if(!list.length) return `<div class="directory-meta">Nessun dato disponibile.</div>${note?`<div class="footer-note">${esc(note)}</div>`:''}`;
  return `<table class="top-mini-table"><thead><tr><th>#</th><th>Giocatore</th><th>${rankingLabel(type)}</th></tr></thead><tbody>${list.slice(0,10).map((item,idx)=>{ 
    const player = item.player || {}; 
    const stats = item.statistics?.[0] || {}; 
    const team = stats.team?.name || 'Squadra'; 
    const value = rankingValue(type, stats);
    const appearances = stats.games?.appearences ?? stats.games?.appearances ?? '—';
    return `<tr><td>${idx+1}</td><td class="namecol"><div class="player-main"><div class="player-stack"><strong>${esc(player.name || 'Giocatore')}</strong><div class="player-team-line"><span>${esc(team)}</span><span class="sep">•</span><span>Presenze: ${esc(appearances)}</span></div></div></div></td><td><span class="value-pill">${esc(value)}</span></td></tr>`; 
  }).join('')}</tbody></table>${note?`<div class="footer-note">${esc(note)}</div>`:''}`;
}

function loadAllRankings(){
  ['scorers','assists','ratings'].forEach(loadRanking);
}

function topView(){
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">${esc(state.competition || 'Nessuna competizione selezionata')}</div><h1>Top</h1><p>Una sola pagina, più pulita e più forte visivamente: tre tabelle affiancate per <strong>Marcatori</strong>, <strong>Assist</strong> e <strong>Valutazioni</strong>, con valori ben visibili, squadra e presenze in una sola vista più ordinata e con colori ispirati al tricolore italiano.</p><div class="top-overview value-wide"><div class="top-table green"><div class="top-table-head"><h2 style="margin-bottom:6px">Valori stimati</h2><div class="muted small">Una lettura rapida e comprensibile, senza dipendere da fonti esterne non ufficiali.</div></div>${body}${state.valuesNote ? `<div class="footer-note">${esc(state.valuesNote)}</div>` : ''}</div></div><div class="card hero-side"><h2>Contesto</h2><div class="kpi"><div class="row"><strong>Competizione</strong><div class="muted small">${esc(state.competition || 'Da selezionare')}</div></div><div class="row"><strong>Vista</strong><div class="muted small">Top unificata più ampia</div></div><div class="row"><strong>Dettagli</strong><div class="muted small">Squadra, presenze e valori più leggibili</div></div></div></div></div></div>`;
}

function marketView(){
  const rumorsDemo = [
    'Slot UI pronto per integrare feed esterno dedicato ai rumors.',
    'Puoi collegare una fonte custom o un backend dedicato alle indiscrezioni.',
    'La sezione ufficiali resta invece alimentata dai trasferimenti confermati.'
  ];
  return `<div class="content"><div class="hero"><div class="card hero-main"><div class="muted small">${esc(state.competition || 'Nessuna competizione selezionata')}</div><h1>Mercato</h1><p>Sezione separata in ufficiali e rumors. Gli ufficiali mostrano solo gli aggiornamenti più recenti, così la pagina resta davvero pulita e utile; la parte rumors resta predisposta per una futura fonte dedicata.</p><div class="subnav"><button class="${state.marketTab==='official'?'active':''}" onclick="setMarketTab('official')">Ufficiali</button><button class="${state.marketTab==='rumors'?'active':''}" onclick="setMarketTab('rumors')">Rumors</button></div></div><div class="card hero-side"><h2>Vista rapida</h2><div class="kpi"><div class="row"><strong>Competizione</strong><div class="muted small">${esc(state.competition)}</div></div><div class="row"><strong>Fonte ufficiali</strong><div class="muted small">API-Football / ultimi movimenti</div></div><div class="row"><strong>Rumors</strong><div class="muted small">Separati dagli ufficiali per una lettura più chiara</div></div></div></div></div>${state.marketTab==='official'?`<div class="card section">${!state.competition?`<div class="notice">Seleziona prima una competizione dal menu laterale.</div>`:state.transfersLoading?`<div class="notice">Caricamento movimenti ufficiali...</div>`:!state.transfers.length?`<div class="notice">Nessun trasferimento ufficiale recente disponibile per questa competizione.</div>`:`<div class="list">${state.transfers.map(t=>`<div class="market-item"><span class="market-badge">Ufficiale</span><strong>${esc(t.player?.name || 'Giocatore')}</strong><div class="market-meta">${esc(t.teams?.out?.name || '—')} → ${esc(t.teams?.in?.name || '—')}</div><div class="market-meta">Tipo: ${esc(tLabel(t.update?.type || 'Trasferimento'))} • Data: ${t.update?.date ? localDate(t.update.date) : 'n.d.'}</div></div>`).join('')}</div>`}${state.transfersNote?`<div class="footer-note">${esc(state.transfersNote)}</div>`:''}</div>`:`<div class="card section"><div class="list">${rumorsDemo.map(text=>`<div class="market-item">${esc(text)}</div>`).join('')}</div></div>`}</div>`;
}

function mainView(){
  if(state.selected) return detailView();
  if(state.selectedTeam) return teamView();
  if(state.page==='competition') return competitionView();
  if(state.page==='teams') return teamsView();
  if(state.page==='support') return supportView();
  if(state.page==='discord') return discordView();
  if(state.page==='market') return marketView();
  if(state.page==='top') return topView();
  return homeView();
}

function render(){ const app=document.getElementById('app'); const sidebarEl=app.querySelector('.sidebar'); const sidebarTop=sidebarEl?sidebarEl.scrollTop:0; app.innerHTML = `${topbar()}<div class="app">${sidebar()}${mainView()}</div>`; const newSidebar=app.querySelector('.sidebar'); if(newSidebar) newSidebar.scrollTop = sidebarTop; }
function setFilter(v){ state.filter=v; render(); syncHistory(true); }
function setSearch(v){ state.search=v; render(); syncHistory(true); }
function setTeamDirectorySearch(v){ state.teamDirectorySearch=v; render(); }
function setTeamTab(v){ state.teamTab=v; render(); syncHistory(true); }
function toggleMacro(key){ state.openMacro = state.openMacro === key ? '' : key; render(); syncHistory(true); }
function setMarketTab(v){ state.marketTab=v; render(); if(v==='official') loadTransfers(); }
function setTopTab(v){ state.topTab=v; state.page='top'; render(); loadAllRankings(); }
function resetToHome(){
  state.page='home'; state.competition=''; state.filter='all'; state.search=''; state.fixtures=[]; state.loading=false; state.error='';
  state.selected=null; state.meta=null; state.standings=[]; state.standingsLoading=false; state.selectedTeam=null; state.teamData=null; state.teamLoading=false;
  state.teamDirectorySearch=''; state.teamTab='overview'; state.marketTab='official'; state.topTab='scorers';
}
function setPage(page){
  if(page==='home'){ resetToHome(); render(); syncHistory(); return; }
  state.page=page; state.selected=null; state.selectedTeam=null; state.teamDirectorySearch=''; render(); syncHistory();
  if(page==='top') loadAllRankings();
  if(page==='market') loadTransfers();
}
function goCompetition(){
  if(!state.competition) return;
  state.page='competition';
  render(); syncHistory();
  if(!state.fixtures.length && !state.loading) loadCompetitionData();
}
function selectCompetition(name){
  const item = allItems.find(i => i.name===name);
  const group = CATEGORY_TREE.find(g => g.items.some(i => i.name===name));
  state.openMacro = group?.key || state.openMacro; state.competition=name; state.filter='all'; state.search='';
  state.fixtures=[]; state.selected=null; state.selectedTeam=null; state.teamData=null; state.meta=null; state.standings=[]; state.teamDirectorySearch=''; state.teamTab='overview';
  if((item?.mode==='team' || item?.mode==='national-competition') && item?.teamId){
    state.page='competition';
    state.fixtures=[]; state.meta=null; state.standings=[];
    syncHistory();
    loadCompetitionData();
    return;
  }
  state.page='competition';
  syncHistory();
  loadCompetitionData();
}
async function openNationalTeam(teamId, teamName){
  state.selected=null; state.selectedTeam={id:teamId,name:teamName}; state.teamLoading=true; state.teamData=null; state.teamTab='overview'; render();
  try{ const res=await fetch(`/api/national-team?team=${teamId}`); const data=await res.json(); if(!res.ok) throw new Error(data.error || 'Errore nel caricamento squadra nazionale'); state.teamData=data; }
  catch(err){ state.teamData={error:err.message || 'Errore nel caricamento squadra nazionale'}; }
  state.teamLoading=false; render(); syncHistory(true);
}

async function loadFixturesOnly(){
  if(currentMode()==='team' || currentMode()==='national-competition'){
    const teamId = currentItem()?.teamId;
    if(!teamId){ state.fixtures=[]; state.meta=null; return; }
    const compParam = currentMode()==='national-competition' ? `&competition=${encodeURIComponent(currentCode())}` : '';
    const res = await fetch(`/api/national-fixtures?team=${teamId}${compParam}`);
    const data = await res.json(); if(!res.ok) throw new Error(data.error || 'Errore nel caricamento');
    state.fixtures = data.fixtures || []; state.meta = data.debug || null;
    return;
  }
  if(!currentCode()) { state.fixtures=[]; state.meta=null; return; }
  const res = await fetch(`/api/fixtures?competition=${encodeURIComponent(currentCode())}`);
  const data = await res.json(); if(!res.ok) throw new Error(data.error || 'Errore nel caricamento');
  state.fixtures = data.fixtures || []; state.meta = data.debug || null;
}
async function loadStandings(){
  if(currentMode()==='team' || currentMode()==='national-competition'){ state.standings=[]; state.standingsLoading=false; render(); return; }
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
  state.selectedTeam=null; state.teamData=null; state.selected={loading:true}; render(); syncHistory();
  try{ const res=await fetch(`/api/match?id=${id}`); const data=await res.json(); if(!res.ok) throw new Error(data.error || 'Errore nel dettaglio partita'); state.selected={data}; }
  catch(err){ state.selected={error:err.message || 'Errore nel dettaglio partita'}; }
  render(); syncHistory(true);
}
function closeMatch(){ state.selected=null; render(); syncHistory(true); }
async function openTeam(teamId, teamName){
  state.selected=null; state.selectedTeam={id:teamId,name:teamName}; state.teamLoading=true; state.teamData=null; state.teamTab='overview'; render(); syncHistory();
  try{ const res=await fetch(`/api/team?competition=${encodeURIComponent(currentCode())}&team=${teamId}`); const data=await res.json(); if(!res.ok) throw new Error(data.error || 'Errore nel caricamento squadra'); state.teamData=data; }
  catch(err){ state.teamData={error:err.message || 'Errore nel caricamento squadra'}; }
  state.teamLoading=false; render();
}
function closeTeam(){ state.selectedTeam=null; state.teamData=null; state.teamLoading=false; state.teamTab='overview'; render(); syncHistory(true); }

window.addEventListener('popstate', (event) => {
  if(!event.state) return;
  state._historyLock = true;
  Object.assign(state, event.state);
  state._historyLock = false;
  render();
  if(state.page==='competition' && state.competition && !state.fixtures.length && !state.loading) loadCompetitionData();
});

syncHistory(true);
render();

