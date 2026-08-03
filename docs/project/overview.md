# Project Overview — Vetronaviglio Listini Webapp

Vista PM sintetica. Riferimento primario: [../overview.md](../overview.md).

## Stato

| Area | Stato |
|---|---|
| Commerciale | `lead` — brief compilato, in attesa chiarimenti |
| Operativo | `staging` — nessun codice applicativo ancora |
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

## Prossimo passo

1. Chiarire domande aperte (stampa/export, ruoli admin, popolamento iniziale dati).
2. Definire schema Supabase + motore di calcolo prezzi (replica formule excel).
3. Scaffold UI: login, selettore commerciale + tabella prezzi, pagina admin dati.
