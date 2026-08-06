---
title: "Vetronaviglio Listini Webapp"
slug: vetronaviglio-listini-webapp
project_type: internal
commercial_status: lead
operational_status: staging
administrative_status: inactive
client: Vetronaviglio s.r.l.
owner: Zetabytenexus
last_updated: 2026-08-06
mcp_profile: saas
---

# Vetronaviglio Listini Webapp

Web app che permette ai commerciali di Vetronaviglio di ottenere il prezzo di vendita **allineato** e **alla rinfusa** dei prodotti (flaconi/vasi) selezionando materiale, colore e capacità, senza consultare il foglio Excel.

## Contesto

Vetronaviglio è un produttore di packaging primario per il beauty (Bareggio MI). I commerciali oggi leggono i prezzi dal file `Nuovo Listino Plastica_06 2025_Rev01.xlsx` (colonne AC = prezzo allineato, AD = prezzo rinfusa). La richiesta di Federico Rosi (Direzione Qualità/R&D) è uno strumento web che replichi quella logica.

**Natura:** progetto GRATUITO — Stefano è ancora dipendente di Vetronaviglio.

## Obiettivo

MVP di una web app dove il commerciale seleziona **materiale** (PP, PE, PETG, PE PCR), **colore** (Colorato Custom, nero, bianco, neutro) e **capacità** (30–1000 ml) e ottiene i due prezzi di vendita per le fasce di quantità, con login e gestione dati via pagina admin.

## Stack tecnico previsto

- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS v4 (da triathlon-starter)
- **Backend/DB/Auth:** Supabase (Postgres + Auth)
- **Sorgente iniziale dati:** `data/listini/Nuovo_Listino_Plastica_06-2025_Rev01.xlsx` (import bootstrap; niente excel a runtime)
- **Admin:** pagina dedicata per gestire i dati di listino (materiali, colori, capacità, pesi, lotti, imballi, costi, parametri, fasce)
- **Calcolo prezzi:** motore applicativo che replica le formule dell'excel (dati base → costi → prezzo allineato/rinfusa), con vista dettaglio breakdown
- **Deploy:** GitHub + Vercel (auto)

## Stato attuale

- Lead ricevuto (email Federico Rosi 03/08/2026), brief compilato in `docs/leads/`
- Excel sorgente copiato in `data/listini/` e analizzato (44 fogli)
- **Decisioni confermate (03/08):** PETG/PE PCR vuoti (dati futuri via excel); niente excel a runtime → pagina admin; 11 fasce in tabella; login; GitHub+Vercel; plus = breakdown calcolo prezzi
- **Realizzato (03–04/08):** schema Supabase + seed, motore prezzi (1932 check vs excel), import excel, UI completa (login, prezzi con breakdown, admin CRUD), parametri macchina editabili in admin, tema Vetronaviglio, responsive mobile/tablet
- **Percorso B completato (04/08):** admin = unica fonte dati (CRUD config listino + anagrafiche materiali/colori/capacità + fasce, toggle attivo/disattivo live). Migrazione `0002_capacities_enabled.sql`
- **DB su nuovo project Supabase `fkjaqhydotxubxnieguh`** (04/08): migration 0001+0002 + seed applicati (4/2/12/11/44); 3 utenti auth creati (f.rosi, b.solitodesolis admin; f.ruffini commerciale)
- Gap noto: **PETG e PE PCR** selezionabili ma senza valori listino (popolabili da admin, dati futuri via excel)
- Prossimi step: chiarimenti residui (stampa/export, ruoli admin), deploy Vercel + smoke test produzione

## Documentazione operativa

Vedi `docs/_INDEX.md` per l'indice completo.
