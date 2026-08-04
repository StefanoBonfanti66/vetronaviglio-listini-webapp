# Project: vetronaviglio-listini-webapp

## Obiettivo
- Scopo: web app per i commerciali Vetronaviglio — selezionare materiale/colore/capacità e ottenere i prezzi di vendita allineato e rinfusa (replica dell'excel `Nuovo Listino Plastica_06 2025_Rev01.xlsx`), con login e pagina admin per gestire i dati di listino.
- Stato attuale: MVP implementato e testato (1932/1932 check vs excel). Work in corso su editing parametri macchina + refactor auth completato, da committare.
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

## Lavoro svolto
- File creati: schema `supabase/migrations/0001_init.sql`, seed `supabase/seed/listino_seed.json`, motore `app/src/lib/pricing.ts`, API `app/src/lib/api.ts`, UI (`LoginPage`, `PriceSearchPage`, `AdminPage`), import `scripts/import_listino.py`.
- File modificati: `AuthContext.tsx` (refresh), `LoginPage.tsx` (navigate), `AdminPage.tsx` (parametri macchina editabili), `.gitignore`, `docs/*`.
- Test eseguiti: `pricing.test.ts` (unit) + `pricing-e2e.test.ts` (1932 check su 44 fogli) — tutti OK; `typecheck` + `build` OK.

## TODO aperti
1. Deploy Vercel (configurazione progetto + secret) e smoke test produzione.
2. Chiarire con cliente: stampa/export PDF, ruoli admin, popolamento iniziale dati.
3. Aggiungere dati PETG / PE PCR quando disponibili.

## Problemi aperti
- Problema: deadlock Web Locks con supabase-js@2.106.1 in Chromium headless.
- Ipotesi: legato a `navigator.locks`; aggirato con fetch REST diretto.
- Blocco attuale: nessuno.

## File toccati
- `app/src/context/AuthContext.tsx`, `app/src/pages/LoginPage.tsx`, `app/src/pages/AdminPage.tsx`, `app/src/lib/api.ts`, `app/src/lib/types.ts`, `app/src/lib/pricing.ts`, `supabase/migrations/0001_init.sql`, `scripts/import_listino.py`, `docs/*`

## Prossimo step suggerito
- Commit del WIP corrente, poi configurare deploy Vercel (vedi `docs/bootstrap.md`).
