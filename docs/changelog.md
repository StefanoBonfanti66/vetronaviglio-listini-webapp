# Changelog — Vetronaviglio Listini Webapp

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
