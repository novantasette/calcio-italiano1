Calcio Italiano Live — versione con news ufficiali squadra

File principali aggiornati:
- index.html
- api/team.js
- api/news.js
- api/_news.js

Env vars su Vercel:
- API_FOOTBALL_KEY = obbligatoria
- NEWS_API_KEY = facoltativa ma consigliata

Come funziona:
- se NEWS_API_KEY è presente, le news ufficiali squadra vengono filtrate sulla fonte ufficiale del club
- se NEWS_API_KEY non è presente, il progetto usa un fallback via Google News RSS filtrato sul dominio ufficiale della squadra
- nella scheda squadra, tab “Notizie”, ora trovi:
  - News ufficiali squadra
  - Movimenti ufficiali squadra

Note:
- il mapping delle fonti ufficiali è in api/_news.js
- per squadre non ancora mappate basta aggiungere dominio e nome fonte nello stesso file
- API_FOOTBALL_KEY resta necessaria per partite, classifica, rosa, infortuni, formazioni e trasferimenti

Deploy:
1. sostituisci i file nel progetto
2. aggiungi NEWS_API_KEY su Vercel se vuoi la versione news più stabile
3. commit su GitHub
4. redeploy su Vercel


Note competizioni:
- Ho aggiunto nel menu tutte le macro-categorie richieste.
- Le voci senza ID collegato in API-Football sono segnate come 'in arrivo' per evitare errori nel frontend.
- API-Football copre varie competizioni italiane come Campionato Primavera 1/2, Coppa Italia Primavera, Coppa Italia Serie C, Coppa Italia Serie D e Coppa Italia Women; per collegarle davvero servono gli ID di lega ricavati dal dashboard / endpoint leagues.
- Le categorie Europee e Nazionale Italia sono predisposte nel menu ma lasciate disattivate finché non viene definita la mappatura corretta.
