# Changelog — Vetronaviglio Listini Webapp

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
