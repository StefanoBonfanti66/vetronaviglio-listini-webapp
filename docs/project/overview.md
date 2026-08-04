# Project Overview — Vetronaviglio Listini Webapp

Vista PM sintetica. Riferimento primario: [../overview.md](../overview.md).

## Stato

| Area | Stato |
|---|---|
| Commerciale | `lead` — brief compilato, in attesa chiarimenti |
| Operativo | `staging` — UI completa, motore prezzi testato (1932 check), deploy da confermare |
| Amministrativo | `inactive` — progetto gratuito |

## Obiettivo MVP

Selettore materiale / colore / capacità → prezzi di vendita allineato e rinfusa (coerenti con l'excel), con login e pagina admin per gestire i dati di listino.

## Decisioni confermate (2026-08-03)

- PETG/PE PCR: selezionabili ma vuoti (dati futuri via excel)
- Niente excel a runtime → pagina admin CRUD dedicata
- 11 fasce quantità in tabella
- Login richiesto (Supabase Auth)
- Deploy GitHub + Vercel auto
- Plus: vista breakdown del calcolo prezzi
- Stampa/export PDF del listino calcolato

## Realizzato (2026-08-03/04)

- Schema Supabase (`0001_init.sql`, 6 tabelle + RLS) e seed (4 materiali, 2 colori, 12 capacità, 11 fasce, 44 config).
- Motore prezzi (`app/src/lib/pricing.ts`): replica formule excel; 1932/1932 check vs valori reali.
- Import excel (`scripts/import_listino.py` → `supabase/seed/listino_seed.json`).
- UI: login, pagina prezzi con select + tabella 11 fasce + breakdown, pagina admin CRUD (materie prime, imballo, parametri macchina allineato/rinfusa editabili).

## Prossimo passo

1. Chiarire domande aperte (stampa/export, ruoli admin, popolamento iniziale dati).
2. Deploy Vercel (configurazione + secret) e smoke test in produzione.
3. Chiusura work in corso: commit e aggiornamento docs.
