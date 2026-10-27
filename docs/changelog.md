# Changelog — Vetronaviglio Listini Webapp

## 2026-10-26 — Costi imballo fissi (€/pezzo) editabili in admin

- **Richiesta clienti:** email Federico "I: listini" (22/10) → "TI PASSO DUE VALORI FISSI (MA COMUNQUE MODIFICABILI) UNO PER ALLINEATO E UNO PER RINFUSA … DA SOMMARE A COSTI DIRETTI PRIMA DI RICARICO VENDITE FINALE", con fasce FINO A 125 ML / OLTRE 125 ML. Federico non ha ancora comunicato i valori.
- **Modello:** 4 campi €/pezzo (allineato|rinfusa × fino_125|oltre_125), modificabili in admin; il costo fisso **sostituisce** il calcolo da pallettizzazione (`imballo_items / pezzi_pallet`) per la modalità valorizzata e viene sommato ai costi diretti prima del ricarico vendite. Campo vuoto/NULL = non definito → fallback alla pallettizzazione (legacy).
- **DB:** nuova migration `supabase/migrations/0005_imballi_fissi.sql` (tabella `imballo_fissi` con RLS, 4 righe iniziali NULL). Da applicare al DB on-prem con gate umano.
- **App:** `app/src/lib/imballi.ts` (fascia per ml/label, lettura valori), `app/src/components/admin/ImballiManager.tsx` (4 input + salvataggio), `AdminPage` (caricamento e salvataggio), `PriceSearchPage` (selezione fascia in base alla capacità e passaggio al motore prezzi), `pricing.ts` (costo fisso allineato/rinfusa + `costoImballo` nel breakdown rinfusa).
- **Seed:** `scripts/seed_listino.py` genera le 4 righe `imballo_fissi`; `supabase/seed/listino_seed.json` e `seed.sql` rigenerati.
- **Test:** nuovo `app/tests/imballi.test.ts` (fasce, valori, precedenza fisso su pallettizzazione, 0 valido); unit + e2e 1932 + snapshot 1936 + costs + imballi OK, typecheck e build OK.

## 2026-10-26 — Colore CUSTOM + verifica mix 96/4 sul listino

- **Richiesta utente:** inserire la voce "CUSTOM COLOR DEFINITIVO" nei Colori (costo master da compilare) e verificare che il listino rispetti la miscela 96% materia prima / 4% master color, senza modifiche non approvate.
- **Verifica (read-only):** 44/44 `listino_configs` conformi — `mp_utilizzi_pct` = [96,4,0,0], base = costo materiale, master = costo del colore, mix 96/4 identico al calcolo legacy. Nessun listino modificato.
- **DB:** inserito colore `CUSTOM` = "Custom color definitivo" (sort_order 3, `master_color_costo_kg` NULL in attesa del valore da Federico).
- **Seed:** `scripts/import_listino.py` (`MASTER_COLOR_COSTO_KG["CUSTOM"] = None`), `supabase/seed/listino_seed.json` e `seed.sql` rigenerati (3 colori).
- **Da fare con approvazione:** valorizzare il costo master CUSTOM quando comunicato e creare i listini per il colore CUSTOM.

## 2026-10-26 — Costi €/kg nelle anagrafiche admin (Materiali + Colori)

- **Richiesta utente:** inserire/editare i costi €/kg nella maschera admin "Materiali" (alcuni già noti) e, per analogia, il costo master color nella maschera "Colori".
- **Decisioni:** la modifica del costo di un materiale **propaga a tutti i listini** di quel materiale; il costo master color diventa editabile anche nei Colori.
- **DB:** nuova migration `supabase/migrations/0004_anagrafiche_costi.sql` → `materials.costo_kg` e `colors.master_color_costo_kg` (nullable = non definito). Da applicare al DB on-prem con `sudo docker exec supabase-db psql -U postgres -d postgres -f /tmp/0004_anagrafiche_costi.sql`.
- **App:** `app/src/lib/costs.ts` (helper puri + default quote 96/4), `CrudManager` con supporto input decimale nullable (vuoto = null, celle "—"), `AdminPage` con colonne "Costo MP (€/kg)" / "Costo master (€/kg)" e propagazione automatica ai `listino_configs` della famiglia; prefill costi alla scelta di materiale/colore nelle nuove configurazioni.
- **Seed:** `scripts/import_listino.py` e `scripts/seed_listino.py` allineati (costi su materials/colors), `supabase/seed/listino_seed.json` e `seed.sql` rigenerati.
- **Test:** nuovo `app/tests/costs.test.ts` (aggiunto a `npm test`); unit + e2e 1932 + snapshot 1936 + costs OK, typecheck e build OK.

## 2026-10-26 — Costi MP ultimo acquisto + master color 96/4 + velocità ciclo

- **Richieste clienti recepite:** email "I: listini" (Federico, 22/10) ed email "I: COSTO MP" (Margherita → Federico, cc Stefano).
- **Modello costi MP:** miscela fissa **96% MP base + 4% master color**. MP base = ultimo costo di acquisto 1,69 €/kg (PP RM03.0056 INEOS, PE RM01.0001 ERACLENE); master color 10 €/kg (BIANCO/NERO/NEUTRO) e 20 €/kg (COLORATO), CUSTOM da compilare. Nuovo campo `listino_configs.master_color_costo_kg` (migration `0003_master_color.sql`) con percorso legacy se NULL.
- **Velocità ciclo:** 450 pz/h fino a 125 ml, 350 pz/h oltre (1000 ml da 200 → 350; 50 ml PP NBN da 550 → 450), allineato e rinfusa.
- **DB on-prem** (`192.168.24.130:8000`) aggiornato via REST sui 44 config; `supabase/seed/listino_seed.json` + `seed.sql` rigenerati e allineati (`scripts/import_listino.py` / `scripts/seed_listino.py`).
- **Test:** baseline Excel 06-2025 congelata in `app/tests/fixtures/seed_legacy.json` (e2e 1932/1932 OK) + nuovo snapshot sui costi correnti `app/tests/pricing-current.test.ts` (1936 check OK, fixture `expected_current_costs.json`); unit, typecheck e build OK.
- **Aperto:** l'Excel 06-2025 ha ancora i costi precedenti (PP 2, PE 1,5, master 4/15) → i prezzi 30-1000 ml cambiano e serve l'Excel aggiornato; mancano i 4 valori fissi di costo imballi e le config 400 ml / PETG / PE PCR.

## 2026-08-06 — Preventivo + email a Federico Rosi (bozza)

- **`docs/proposals/`** creati: `preventivo-listini-webapp.md` (+ versione `preventivo-listini-webapp.html` da allegare) e `email-listini-webapp.md` (bozza email).
- **Struttura coerente con `vetronaviglio-report-visite`** (`docs/proposals/email-preventivo-report-visite.*`): prototipo online → cosa include → due opzioni hosting (A. Cloud gestito da me / B. On-premise server Sineto, una tantum da quantificare, dati in house) → prossimi passi (validazione, scelta opzione, personalizzazioni PDF/PETG/PE PCR/ruoli).
- **Verifica costi Opzione A (06/08, procurement)**: fonti ufficiali Vercel/Supabase/Render letti in data. Hobby=uso non commerciale (ToS), Supabase Free=pausa DB dopo 7gg inattività → per produzione gestita: Vercel Pro $20 + Supabase Pro $25 = $45 ≈ **41 €/mese escl. IVA** (50–56 € con IVA). Nota di confronto con report-visite (~7 € solo hosting, qui DB+auth gestiti).
- **Credenziali 3 account**: reset password via Admin API + login verificati (06/08): f.rosi (admin), b.solitodesolis (admin), f.ruffini (commerciale).
- **Draft Gmail su account personale** (`bonfantistefano4@gmail.com`) → `f.rosi@vetronaviglio.it`, oggetto "Listini — prototipo pronto per validazione", allegato `preventivo-listini-webapp.html`, credenziali nel corpo. Da rivedere e inoltrare dall'utente.

## 2026-08-06 — Deploy Vercel verificato in produzione

- **Deploy attivo:** project `vetronaviglio-listini-webapp` su Vercel, auto-deploy via GitHub integration (7 deployment, tutti READY); ultimo production = commit `4d548cf` (ultimo su `main`). URL: `https://vetronaviglio-listini-webapp.vercel.app`.
- **Env correttamente iniettate al build:** bundle JS contiene `https://fkjaqhydotxubxnieguh.supabase.co` + anon key (identiche a `app/.env.local`).
- **Smoke test produzione (Playwright):** login `s.bonfanti@vetronaviglio.it` OK → `30ML PP NBN fascia1 = 0,57 €` allineato / `0,51 €` rinfusa (identico excel AC 0.5725…). Breakdown calcolo popolato; materiali PP/PE/PETG/PE PCR presenti; link "Gestione dati" visibile per ruolo admin. Nessun runtime error su Vercel (7d). RLS attiva (query anonima su `materials` → `[]`).
- Docs: `docs/overview.md` + `docs/project/overview.md` aggiornate (last_updated 06/08, Percorso B, nuovo project, 3 utenti).

## 2026-08-04 — Allineamento label colore COL ("Colorato")

- Unica nota aperta risolta: label colore COL era in disaccordo (DB "Colorato custom" vs import_listino.py/seed.json "Colorato").
- Allineato a "Colorato" in `scripts/seed_listino.py`, `supabase/seed/seed.sql`, commento `supabase/migrations/0001_init.sql`; DB nuovo project aggiornato (`UPDATE colors SET name='Colorato' WHERE code='COL'`).
- Nessun impatto sui prezzi (label solo). Catena excel→seed→DB→app (1932/1932) invariata.

- Dev server riavviato (pid 27329); ora legge `app/.env.local` con `VITE_SUPABASE_URL=https://fkjaqhydotxubxnieguh.supabase.co`. Vite 6.4.2 ready su localhost:5173.
- **Smoketest confermato utente:** login `s.bonfanti@vetronaviglio.it` → `/admin` 4 materiali → `30ML PP NBN fascia1 = 0,57 €` (identico excel AC 0.5725…). **Catena verifica dati 100%: excel→seed(1932 check)→DB(4/2/12/11/44)→app.**

- **DB migrato** su Supabase project `fkjaqhydotxubxnieguh` (via Management REST API, token `sbp_5f69c9cb...`): migration `0001`+`0002` + seed.sql applicati. Counts verificati: 4 materiali / 2 colori / 12 capacità / 11 fasce / 44 config.
- **Env:** `app/.env.local` → `VITE_SUPABASE_URL=https://fkjaqhydotxubxnieguh.supabase.co` + `VITE_SUPABASE_ANON_KEY=<publishable key>` (file escluso da commit via `*.local`).
- **Fallback URL** hardcodati in `AuthContext.tsx` e `api.ts` aggiornati al nuovo project (era `oiyxsebbagxzzpaztahf`).
- **Admin rigenerato:** utente `s.bonfanti@vetronaviglio.it` ricreato su nuovo project (signup pubblica + `email_confirmed_at=now()` + `profiles.role='admin'`); login via password grant OK → accessibile `/admin`.
- **Importante:** il dev server deve riavrirsi per leggere `.env.local`; il browser era loggato sul vecchio project → serve rilogin.
- **Deploy preview Vercel:** da eseguire dall'utente via dashboard (GitHub integration) con env `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (tool MCP non supporta env vars / JS 493 kB).

## 2026-08-04 — Toggle attivo/disattivo materiali, colori, capacità

- **CrudManager**: il campo `enabled` ora è un **checkbox** (non più text input) sia nel form di creazione/modifica sia **live nella colonna "Attivo"** della tabella — un click per disattivare/riattivare senza aprire il form. Il toggle salva subito via API e mostra notifica.
- L'azione "Disattiva" descritta nei testi di sezione ora è reale: disattivando un materiale/colore/capacità sparisce dalla ricerca prezzi (`get*` con `enabled=eq.true`), mentre resta visibile in admin.
- **Verifica:** smoke test Playwright — PETG disattivato via checkbox → sparito dal select materiale di `/` (solo PP/PE/PE PCR) → riattivato → DB ripristinato (tutti `enabled=true`). typecheck + build OK.

## 2026-08-04 — Responsive mobile & tablet

- **Ricerca prezzi:** su mobile (<640px) i risultati diventano **card** (fascia, quantità, prezzo allineato/rinfusa) al posto della tabella a 4 colonne; su tablet/desktop resta la tabella. Header "Prezzi di vendita" con wrap per lo "Stampa / PDF".
- **Admin config:** su mobile (<768px) la tabella configurazioni mostra solo le colonne essenziali (Capacità, Materiale, Colore, Azioni); Peso, MP costi e Pezzi/pallet riappaiono da `md`. Header sezione con wrap.
- **Form admin:** input numerici più stretti su mobile (`w-16 md:w-20`), righe MP costi/utilizzi con `flex-wrap`, griglia parametri macchina 2 colonne su mobile (`md:grid-cols-3`), input imballo `w-40 md:w-48`.
- **Fasce:** tabella con `min-w-[640px]` → scroll orizzontale pulito su mobile; header con wrap. Stesso wrap su header di `CrudManager`.
- **Header/Footer:** header più compatto su mobile (logo `h-10`, padding ridotto), tagline nascosta sotto `lg`. Aggiunto `theme-color` meta (#F5F3EE).
- **Verifica:** typecheck + build OK; Playwright a 390×844 e 834×1112: zero overflow orizzontale su `/` e `/admin`, colonne nascoste corrette, card/breakdown/select presenti.

## 2026-08-04 — Percorso B: admin come unica fonte dati (CRUD completo)

- **Schema:** migrazione `supabase/migrations/0002_capacities_enabled.sql` — `capacities.enabled` (boolean, default true). Materiali PETG/PE_PCR attivati; seed rigenerato (44 config).
- **API** (`app/src/lib/api.ts`): helper `mutateJson<T>` (POST/PATCH/DELETE con `Prefer: return=representation`); `getMaterials/getColors/getCapacities` con flag `onlyEnabled` (filtro `enabled=eq.true` per la ricerca prezzi); CRUD completi su config, materiali, colori, capacità, fasce.
- **Admin** (`AdminPage.tsx`): sezione "Configurazioni listino" con filtri (capacità/materiale/colore) + contatore + "Azzera filtri"; bottone "Nuova configurazione" con form completo (capacità/materiale/colore, peso, pezzi_pallet, costi/usi MP, imballo, parametri macchina allineato/rinfusa) → `createConfig`; "Elimina" con confirm → `deleteConfig`. Nuovi componenti `CrudManager.tsx` (CRUD generico materiali/colori/capacità) e `BracketsManager.tsx` (CRUD fasce di prezzo, sort per sort_order). Ricerca prezzi carica solo i dati enabled.
- **Fix bug:** `makeEmptyConfig()` inviava `updated_at: ''` → PostgREST 400 (colonna timestamptz NOT NULL con default `now()`). Rimosso il campo; il default DB scatta.
- **Verifica:** smoke test Playwright su tutti i flussi (create/delete config, create/delete materiale, edit fascia) — OK; DB ripristinato allo stato iniziale (44 config, 4 materiali, sfrido fascia 1 = 0.1). typecheck + build OK; test pricing invariati (motore non toccato).

## 2026-08-04 — Tema e identità visiva Vetronaviglio

- **Asset branding:** copiati da `ecommerce-vetronaviglio` in `app/public/` — `favicon.ico`, `favicon.png`, `favicon.svg`, `logo-full.svg`, `logo.svg`, `logo-azienda.png`.
- **index.html:** favicon `/favicon.ico` + title corretto `Vetronaviglio | Listino` (prima "Race Planner").
- **Tema Tailwind v4** (`app/src/index.css`): tema integrale ecommerce — font Inter / Cormorant Garamond / Source Serif 4, colori `onyx`, `bone`, `aluminum`, `amber-accent`, `surface`; aggiunta dipendenza `@tailwindcss/typography`.
- **Layout:** nuovi componenti `app/src/components/layout/{Header,Footer,Layout}.tsx` — header fisso bone/90 blur con logo `logo-full.svg`, tagline "Listino commerciale", nome utente+role, link "Gestione dati" (amber, solo admin), bottone "Esci"; footer onyx con contatti Vetronaviglio, P.IVA e tagline "The beauty of being different."; `App.tsx` usa layout annidato (`/` protetto + `admin` protetto admin, `login` standalone).
- **Restyle pagine:** LoginPage (logo centrato, titolo font-display, input border-b, bottone onyx), PriceSearchPage (tabella border-aluminum/10, prezzo in amber-accent, card breakdown bianche, bottone stampa outline onyx, rimossi header propri), AdminPage (tabella/forme tema, bottoni outline onyx, rimossi header propri).
- **Verifica:** typecheck + build OK (CSS 19.17 kB); test pricing invariati (1932/1932 check e2e + unit); smoke test Playwright su login OK (font/colori applicati).

## 2026-08-04 — Editing parametri macchina in admin + refactor auth

- **Admin:** parametri macchina (allineato/rinfusa) ora **editabili** nella pagina admin — rimosso `disabled`/`readOnly` da `MachineParamsGrid`; aggiunte `key` agli input numerici per evitare perdita di stato su rerender.
- **AuthContext:** logica di inizializzazione estratta in callback `refresh()`, esposta tramite `useAuth`; `signOut` semplificato (pulizia localStorage). `LoginPage` ora chiama `refresh()` dopo `signInWithPassword` e naviga su `/`.
- **Pulizia:** rimosso `app/public/favicon.svg` (non usato); aggiunto `*.tsbuildinfo` a `.gitignore`.
- **Verifica:** typecheck + build OK; test pricing invariati (1932/1932 check e2e + unit).

## 2026-08-03 — Bootstrap

- Repo `vetronaviglio-listini-webapp` creato da `triathlon-starter` (profilo MCP `saas`).
- Copiato in repo l'allegato `Nuovo Listino Plastica_06 2025_Rev01.xlsx` → `data/listini/`.
- Analizzata struttura excel: 44 fogli (`CAP_PESI_LOTTI` + 43 combinazioni `<CAP> <MAT> <NBN|COL>`), 11 fasce quantità, output AC/AD.
- Compilato lead brief (`docs/leads/vetronaviglio-listini-webapp-brief.md`).
- Scaffold docs canonici (overview, runbook, ledger, cashflow, solleciti, leads index, invoices index).
- Stato commerciale: `lead`; operativo: `staging`; amministrativo: `inactive`.
- **Decisioni lead confermate (Stefano):** PETG/PE PCR vuoti (dati futuri via excel); niente excel a runtime → pagina admin dedicata per dati listino; 11 fasce in tabella; login; deploy GitHub+Vercel; plus = vista dettaglio calcolo prezzi. Aggiornato brief, overview, architettura.

## 2026-08-03 — Motore di calcolo prezzi + import excel

- **Schema Supabase** `supabase/migrations/0001_init.sql`: tabelle `materials`, `colors`, `capacities`, `price_brackets`, `listino_configs` (+ `peso_disegno_g`, `rinfusa_ricarico_div_100`), `profiles` con ruolo commerciale/admin, trigger profilo su signup, RLS (select authenticated, write solo admin).
- **Motore calcolo** `app/src/lib/pricing.ts`: replica tutte le formule excel (costo MP pesato, imballo al pezzo, attrezzaggio, costo uomo+macchina allineato/rinfusa, ricarichi, prezzo AC/AD con regola `doppio80` vs `percentuale`).
- **Import excel** `scripts/import_listino.py`: estrae materiali/colori/capacità/fasce + 44 config listino → `supabase/seed/listino_seed.json`. Normalizza nomi fogli (trailing space, `' def'`). Legge peso dal foglio e variante formula rinfusa.
- **Test:** unit `app/tests/pricing.test.ts` + e2e `app/tests/pricing-e2e.test.ts` vs valori reali excel (fixture `expected_excel.json`). **1932/1932 check OK sui 44 fogli**.
- **Dati anomali emersi:** `50ML PE NBN` peso 20 (vs 10); `1000ML PE COL` ricarico rinfusa `/100` (vs frazione). Gestiti via `peso_disegno_g` e `rinfusa_ricarico_div_100`.
- typecheck + build OK.

## 2026-08-03 — Setup Supabase + deploy primo ambiente

- **Progetto Supabase** `oiyxsebbagxzzpaztahf` (eu-west-1, free tier, org ZBN `ccznwmozaiwopuahtgcy`) via Management API con `SUPABASE_MCP_TOKEN`. DB password in `/tmp/opencode/zbn_dbpass.txt`.
- **Migrazione + seed** applicati: `0001_init.sql` (6 tabelle con RLS) + `scripts/seed_listino.py` → 4 materiali, 2 colori, 12 capacità, 11 fasce, 44 config.
- **Utente admin creato** via GoTrue admin API: s.bonfanti@vetronaviglio.it / (password in .env.local, non in repo). role=admin.
- **UI completa** (`app/src`): login commerciale (email/password), pagina prezzi con 3 select (materiale/colore/capacità), tabella 11 fasce con prezzi allineato/rinfusa (formattati EUR it-IT), breakdown dettagliato (costi, attrezzaggio, ricarichi, prezzo), pagina admin con CRUD materiali/colori + tabella 44 config + editing inline (mp, imballo, pezzi_pallet). Stampa/PDF.
- **Workaround deadlock Web Locks**: supabase-js@2.106.1 in Chromium headless (Playwright) blocca `getSession()` al mount con sessione in localStorage. Root cause: Web Locks `navigator.locks` deadlock (lock `lock:sb-...` held forever). Soluzione: AuthContext bypassa getSession → parse JWT locale + fetch REST per profile; tutte le API usano fetch REST diretto (non supabase client) per evitare il deadlock. Verificato: login UI OK, SPA naviga correttamente, prezzi corretti vs excel (es. 30ML PP NBN fascia1 Allineato 0,57 € / Rinfusa 0,51 € — identico a excel).
