# Project: vetronaviglio-listini-webapp

## Obiettivo
- Scopo: web app per i commerciali Vetronaviglio — selezionare materiale/colore/capacità e ottenere i prezzi di vendita allineato e rinfusa (replica dell'excel `Nuovo Listino Plastica_06 2025_Rev01.xlsx`), con login e pagina admin per gestire i dati di listino.
- Stato attuale: MVP implementato e testato (1932/1932 check vs excel). Percorso B completato: admin è l'unica fonte dati (CRUD config/anagrafiche/fasce), PETG/PE PCR popolabili da admin. Tema Vetronaviglio applicato (uniformità con ecommerce). UI responsive mobile/tablet (card risultati su phone, tabelle admin ridotte <768px).
- Risultato atteso della sessione: chiusura del WIP (commit), docs aggiornate, prossimo step = deploy Vercel.

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
- File creati: schema `supabase/migrations/0001_init.sql`, seed `supabase/seed/listino_seed.json`, motore `app/src/lib/pricing.ts`, API `app/src/lib/api.ts`, UI (`LoginPage`, `PriceSearchPage`, `AdminPage`), import `scripts/import_listino.py`, layout `app/src/components/layout/{Header,Footer,Layout}.tsx`, asset `app/public/*` (favicon + loghi), migrazione `0002_capacities_enabled.sql`, componenti admin `CrudManager.tsx` + `BracketsManager.tsx`.
- File modificati: `AuthContext.tsx` (refresh), `LoginPage.tsx` (navigate + restyle), `AdminPage.tsx` (parametri macchina editabili + CRUD completo config/anagrafiche/fasce), `PriceSearchPage.tsx` (restyle + solo dati enabled), `App.tsx` (layout annidato), `index.html`, `index.css` (tema), `package.json` (+@tailwindcss/typography), `.gitignore`, `docs/*`.
- Test eseguiti: `pricing.test.ts` (unit) + `pricing-e2e.test.ts` (1932 check su 44 fogli) — tutti OK; `typecheck` + `build` OK; smoke test Playwright CRUD (create/delete config, create/delete materiale, edit fascia) — tutti OK, DB ripristinato.

## TODO aperti
1. Commit del WIP (tema + restyle + Percorso B) su `main` — gate umano esplicito.
2. Deploy Vercel (configurazione progetto + secret) e smoke test produzione.
3. Chiarire con cliente: stampa/export PDF, ruoli admin, popolamento iniziale dati.
4. Dati PETG / PE PCR ora popolabili da admin (nessun blocco tecnico).

## Problemi aperti
- Problema: deadlock Web Locks con supabase-js@2.106.1 in Chromium headless.
- Ipotesi: legato a `navigator.locks`; aggirato con fetch REST diretto.
- Blocco attuale: nessuno.

## File toccati
- `app/src/context/AuthContext.tsx`, `app/src/pages/LoginPage.tsx`, `app/src/pages/AdminPage.tsx`, `app/src/components/admin/CrudManager.tsx`, `app/src/components/admin/BracketsManager.tsx`, `app/src/lib/api.ts`, `app/src/lib/types.ts`, `app/src/lib/pricing.ts`, `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_capacities_enabled.sql`, `scripts/import_listino.py`, `docs/*`

## Prossimo step suggerito
- Commit del WIP corrente (tema + restyle + Percorso B) dopo validazione umana, poi configurare deploy Vercel (vedi `docs/bootstrap.md`).
