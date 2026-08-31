# Project: vetronaviglio-listini-webapp

## Obiettivo
- Scopo: web app per i commerciali Vetronaviglio — selezionare materiale/colore/capacità e ottenere i prezzi di vendita allineato e rinfusa (replica dell'excel `Nuovo Listino Plastica_06 2025_Rev01.xlsx`), con login e pagina admin per gestire i dati di listino.
- Stato attuale: MVP implementato e testato (1932/1932 check vs excel). Percorso B completato: admin è l'unica fonte dati (CRUD config/anagrafiche/fasce), PETG/PE PCR popolabili da admin. Tema Vetronaviglio applicato (uniformità con ecommerce). UI responsive mobile/tablet (card risultati su phone, tabelle admin ridotte <768px). **Deploy Vercel attivo e verificato in produzione (2026-08-06).**
- Risultato atteso della sessione: chiusura del WIP (commit), docs aggiornate, prossimo step = chiarimenti cliente (stampa/export, popolamento dati).

## Stack e vincoli
- Frontend: React 19 + TypeScript + Vite + TailwindCSS
- Backend: Supabase (Auth, Postgres RLS)
- Database: Postgres con RLS multi-tenancy (scrittura solo admin)
- Infra: Vercel + GitHub Actions
- Vincoli tecnici: workaround deadlock Web Locks di supabase-js in Chromium headless → niente `getSession()`, parse JWT locale + fetch REST diretto
- Vincoli di piano/free tier: progetto gratuito, free tier Supabase

## Decisioni prese
- [2026-08-03] PETG/PE PCR selezionabili ma vuoti (dati futuri via excel).
- [2026-08-03] Niente excel a runtime → pagina admin CRUD dedicata.
- [2026-08-03] 11 fasce quantità in tabella; login richiesto; deploy GitHub+Vercel.
- [2026-08-03] Plus: vista breakdown calcolo prezzi + stampa/export PDF.
- [2026-08-03] Auth: bypass `getSession()` (deadlock Web Locks) → parse JWT + fetch REST.
- [2026-08-04] Parametri macchina allineato/rinfusa editabili in admin.
- [2026-08-04] Tema e identità visiva = identici a `ecommerce-vetronaviglio` (font, colori, layout, logo, favicon, footer). Asset in `app/public/`, layout in `app/src/components/layout/`, tema in `app/src/index.css`.
- [2026-08-04] Percorso B: admin = unica fonte dati. Admin può creare/modificare/eliminare config listino, materiali, colori, capacità, fasce (PETG/PE PCR popolabili da UI). Ricerca prezzi carica solo dati `enabled`.
- [2026-08-04] Fix: `makeEmptyConfig()` non deve includere `updated_at` (timestamptz NOT NULL default `now()` → 400 su stringa vuota).
- [2026-08-04] Toggle attivo/disattivo per materiali/colori/capacità: checkbox live nella colonna "Attivo" del CrudManager; disattivare nasconde dalla ricerca prezzi (`enabled=eq.true`).
- [2026-08-04] Responsive mobile/tablet: risultati prezzi come card <640px; tabella config admin ridotta a 4 colonne <768px (`hidden md:table-cell` su Peso/MP costi/Pezzi-pallet); fasce `min-w-[640px]` + scroll; form admin con input/griglie adattive; header compatto su phone. Verificato Playwright 390×844 e 834×1112 (zero overflow).

## Lavoro svolto
- File creati: schema `supabase/migrations/0001_init.sql`, seed `supabase/seed/listino_seed.json`, motore `app/src/lib/pricing.ts`, API `app/src/lib/api.ts`, UI (`LoginPage`, `PriceSearchPage`, `AdminPage`), import `scripts/import_listino.py`, layout `app/src/components/layout/{Header,Footer,Layout}.tsx`, asset `app/public/*` (favicon + loghi), migrazione `0002_capacities_enabled.sql`, componenti admin `CrudManager.tsx` + `BracketsManager.tsx`, workflow `.github/workflows/supabase-keepalive.yml` (cron ogni 5gg per prevenire pausa free tier).
- File modificati: `AuthContext.tsx` (refresh), `LoginPage.tsx` (navigate + restyle), `AdminPage.tsx` (parametri macchina editabili + CRUD completo config/anagrafiche/fasce), `PriceSearchPage.tsx` (restyle + solo dati enabled), `App.tsx` (layout annidato), `index.html`, `index.css` (tema), `package.json` (+@tailwindcss/typography), `.gitignore`, `docs/*`.
- Test eseguiti: `pricing.test.ts` (unit) + `pricing-e2e.test.ts` (1932 check su 44 fogli) — tutti OK; `typecheck` + `build` OK; smoke test Playwright CRUD (create/delete config, create/delete materiale, edit fascia) — tutti OK, DB ripristinato.
- **Sessione 2026-08-04**: creazione 3 utenti Supabase Auth via Admin API (`f.rosi`, `b.solitodesolis` come admin; `f.ruffini` come commerciale). Profili auto-creati via DB trigger. Puliti 2 utenti test accidentalmente creati via signup.
- [2026-08-06] Reset password 3 utenti via Admin API + login verificati (password reali solo nel draft Gmail personale `r2340419766766766437`, placeholder nei doc committati).
- [2026-08-06] Fix header: full_name f.rosi "F. Rossi"→"F. Rosi" + ruolo admin (b.solitodesolis admin) via PATCH profiles. Verificato in produzione (header "F. Rosi · admin", link Gestione dati).
- [2026-08-06] Preventivo + email a Federico Rosi (bozza): `docs/proposals/preventivo-listini-webapp.md`+.html (Cloud ≈41€/mese escl. IVA vs On-premise Sineto), draft Gmail personale `r2340419766766766437` da inoltrare.

## TODO aperti
1. [fatto] Commit del WIP (tema + restyle + Percorso B + responsive + toggle) su `main` — eseguito e pushato (gate umano confermato con commit).
2. [fatto] Migration DB su nuovo project `fkjaqhydotxubxnieguh` (migrazioni + seed) + admin rigenerato.
3. [fatto] Creazione 3 utenti Supabase Auth via Admin API (no email): `f.rosi@vetronaviglio.it` (admin), `b.solitodesolis@vetronaviglio.it` (admin), `f.ruffini@vetronaviglio.it` (commerciale). Profili auto-creati via DB trigger. Puliti 2 utenti test accidentalmente creati via signup.
4. [fatto] Log login persistente disponibile in Supabase Dashboard → Authentication → Logs.
5. [fatto] Deploy preview Vercel: project attivo su `https://vetronaviglio-listini-webapp.vercel.app`, auto-deploy via GitHub integration, env `VITE_SUPABASE_URL`+`VITE_SUPABASE_ANON_KEY` iniettate al build (verificato nel bundle JS).
6. [fatto] Smoketest browser su nuovo project: login `s.bonfanti@vetronaviglio.it` in produzione OK → `30ML PP NBN fascia1 = 0,57 €` (identico excel AC 0.5725…). Breakdown popolato, PETG/PE PCR presenti, link admin visibile.
7. Allineare label colore COL hardcodata ("Colorato" vs "Colorato custom") — **RISOLTO**: DB + seed_listino.py + seed.sql allineati a "Colorato" (nessun impatto prezzi).

## Problemi aperti
- Free tier Supabase: pausa automatica dopo 7gg di inattività sul DB → mitigato con workflow keep-alive `supabase-keepalive.yml` (cron ogni 5gg, richiede secrets `SUPABASE_URL` + `SUPABASE_ANON_KEY`). Fino a passaggio in produzione.
- Problema: deadlock Web Locks con supabase-js@2.106.1 in Chromium headless.
- Ipotesi: legato a `navigator.locks`; aggirato con fetch REST diretto.
- Blocco attuale: nessuno.

## File toccati
- `app/src/context/AuthContext.tsx`, `app/src/pages/LoginPage.tsx`, `app/src/pages/AdminPage.tsx`, `app/src/components/admin/CrudManager.tsx`, `app/src/components/admin/BracketsManager.tsx`, `app/src/lib/api.ts`, `app/src/lib/types.ts`, `app/src/lib/pricing.ts`, `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_capacities_enabled.sql`, `scripts/import_listino.py`, `docs/*`

## Prossimo step suggerito
- Deploy Vercel attivo e verificato (2026-08-06). Prossimo: **inoltrare la bozza email a Federico Rosi** (draft Gmail personale `r2340419766766766437`, cancellare la vecchia `r-1809523374683032986`), poi incontro cliente per validazione prototipo, scelta hosting (cloud/on-premise) e personalizzazioni (PDF, PETG/PE PCR, ruoli).
