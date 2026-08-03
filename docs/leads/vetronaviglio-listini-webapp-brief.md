# Client Intake — Vetronaviglio Listini Webapp

- **Data:** 2026-08-03
- **Contatto:** Federico Rosi <f.rosi@vetronaviglio.it> (Direttore Qualità, R&D e Sviluppo Prodotto, Vetronaviglio srl)
- **Riferimento:** Email "I: listini" del 03/08/2026, inoltrata da Stefano a bonfantistefano4@gmail.com (id Gmail `19fc7a60f9f4b124`)
- **Tipo Lead:** Delivery
- **Natura:** Progetto GRATUITO — Stefano ancora dipendente di Vetronaviglio (vertenza in corso con avv. Ida Allocca)

---

## 1. Client & Business Context
- **Tipo azienda:** Vetronaviglio s.r.l. — produttore di packaging primario per il Beauty (flaconi, barattoli, tappi, dispenser in plastica e vetro). Bareggio (MI), P.IVA IT03366120271, COD SDI 4IYRYKK.
- **Richiedente:** Federico Rosi — Direttore Qualità, R&D e Sviluppo Prodotto (M +39 347 086 0267, Int. 425).
- **Contesto:** I commerciali oggi leggono i prezzi da un file Excel (colonne AC e AD). Serve una web app che dia in mano ai commerciali il prezzo di vendita in modo rapido e allineato.

## 2. Richiesta (dal richiedente)
"Mi serve una web app per la gestione dell'excel allegato. Dare in mano ai commerciali uno strumento che permetta di ottenere il prezzo di vendita allineato ed il prezzo di vendita alla rinfusa dei nostri prodotti vetronaviglio (ora colonne AC e AD dell'excel)."

- **Prezzo allineato:** prodotto riposto nella scatola in modo ordinato e con cura.
- **Prezzo alla rinfusa:** prodotto dal nastro trasportatore finisce direttamente nella scatola senza controllo operatore.
- **Input commerciale:** materiale, colore, capacità del flacone o vaso.
- **Dati e formule già nel foglio Excel** → la web app deve replicare/importare la logica dell'excel.

## 3. Input da esporre al commerciale
| Campo | Valori |
|---|---|
| Materiale | PP, PE, **PETG, PE PCR** |
| Colore | Colorato Custom, nero, bianco, neutro |
| Capacità | 30, 50, 75, 100, 125, 150, 200, 250, 300/350, 400, 500, 1000 ml |

> ⚠️ **Gap dati confermato:** l'excel allegato contiene fogli solo per **PP e PE** (NBN=non bianco/neutro, COL=colorato). **PETG e PE PCR non hanno fogli propri** — sono un'aggiunta: il commerciale deve poterli selezionare ma i prezzi restano **vuoti/non disponibili** finché il listino non li prevede. I dati arriveranno successivamente, in linea di massima come nuovo excel.

## 4. Sorgente dati (Excel)
- **File:** `Nuovo Listino Plastica_06 2025_Rev01.xlsx` (Rev 01)
- **Copia in repo:** `data/listini/Nuovo_Listino_Plastica_06-2025_Rev01.xlsx`
- **Struttura (verificata):** 44 fogli = `CAP_PESI_LOTTI` + 43 fogli combinazione `<CAP> <MAT> <NBN|COL>` (es. `30ML PP NBN`, `30ML PP COL`, ... `1000ML PE COL`).
- **Per foglio:** 11 fasce di quantità (da 2.000 a 200.000 pezzi), colonne con costo MP pesato, costo imballo al pezzo, costo attrezzaggio, costo macchina+uomo allineato/rinfusa, ricarichi, e output:
  - **AC** = PREZZO DI VENDITA ALLINEATO
  - **AD** = PREZZO DI VENDITA RINFUSA
- **CAP_PESI_LOTTI:** pesi da disegno per capacità (30ml→8g ... 1000ml→60g), tabelle lotti, codici imballo/materiali.
- Formule replicate in modo deterministico → possibile estrarre i valori calcolati una volta e servirli come dati (senza motore di calcolo Excel a runtime).
- **Decisione (2026-08-03):** il file excel **sparirà dal flusso**. I dati del listino saranno gestiti a livello admin in una **pagina dedicata** (massima flessibilità, user-friendly) invece di importare/aggiornare il file.

## 5. Goals & Success Criteria
- **Obiettivo:** Il commerciale seleziona materiale + colore + capacità e ottiene subito i due prezzi (allineato/rinfusa) per tutte le fasce quantità, senza aprire Excel.
- **Criterio di successo:** zero consultazione manuale del file; risultato coerente con i valori che l'excel oggi produce.
- **Vincoli:** progetto gratuito; nessun budget commerciale. Stack/risorse interne ZBN.

## 6. Constraints
- **Tecnici:** repo nato da triathlon-starter (Vite + React + TS + Tailwind + Supabase). Profilo MCP `saas`.
- **Organizzativi:** referente Federico Rosi. Stefano sviluppa (dipendente).
- **Compliance:** dati listino interni Vetronaviglio — trattare come dati aziendali riservati del datore di lavoro.

## 7. Decisioni confermate (2026-08-03)

| # | Domanda | Decisione |
|---|---|---|
| 1 | PETG / PE PCR | Selettore disponibile ma valori vuoti; dati arriveranno in seguito (in linea di massima via excel) |
| 2 | Gestione listino | **Niente file excel a runtime** — pagina admin dedicata per gestire i dati (max flessibilità, user-friendly) |
| 3 | Fasce quantità | Le 11 fasce mostrate in tabella |
| 4 | Utenti | Login richiesto |
| 5 | Deploy | GitHub + Vercel (deploy automatico su push, hosting Vercel) |
| 6 | Dettaglio prezzi | Plus: vista del dettaglio di come sono stati ricavati i prezzi (breakdown del calcolo da dati di base → costi → prezzi allineato/rinfusa) |
| 7 | Stampa/export | **Confermato:** prevista stampa/export (PDF) del listino calcolato per il commerciale |

### Implicazioni architetturali (da decisioni)
- **Admin dati:** CRUD sui dati di listino (materiali, colori, capacità, pesi, lotti, imballi, costi MP, parametri macchina, fasce) con pagina dedicata e login amministrativo.
- **Calcolo prezzi:** il breakdown "dati di base → costi → prezzo" va replicato lato applicativo (motore di calcolo, non solo valori pre-calcolati) per supportare il plus del dettaglio e la flessibilità admin.
- **Auth:** login (utenti commerciali + ruolo admin). Supabase Auth è il candidato naturale dato il profilo `saas`.

---

## A. Systems & Integrations
- **Excel sorgente:** fonte iniziale dei dati, ma **non parte del flusso runtime**. I dati vengono importati una volta (bootstrap) e poi gestiti via pagina admin.
- **Auth:** login utenti (commerciali + admin) — Supabase Auth candidato naturale.
- **DB:** Supabase Postgres per dati listino (materiali, colori, capacità, pesi, imballi, costi, parametri, fasce).

## B. Architecture Options & Constraints
- **Frontend:** Vite + React + TS + Tailwind (starter).
- **Backend/DB:** Supabase (auth + Postgres).
- **Calcolo prezzi:** motore di calcolo applicativo che replica le formule dell'excel (dati base → costi → prezzo allineato/rinfusa), per supportare admin flessibile e vista dettaglio breakdown.
- **Admin:** pagina dedicata con CRUD sui dati di listino.
- **Deploy:** GitHub + Vercel (auto).
- **Estensibilità:** schema per materiale/colore/capacità pronto ad accogliere PETG/PE PCR quando i dati arriveranno.

---

## Intake Summary (uso interno)

**Chi è il cliente:** Vetronaviglio s.r.l. (packaging Beauty, Bareggio MI). Richiedente: Federico Rosi (Direzione Qualità/R&D).

**Problema principale:** i commerciali devono leggere prezzi da un Excel complesso (colonne AC/AD) per ogni combinazione materiale/colore/capacità.

**Sistemi coinvolti:** file `Nuovo Listino Plastica_06 2025_Rev01.xlsx` (44 fogli, formule di costo). Output: prezzo allineato e prezzo rinfusa.

**Vincoli tempo/budget:** nessun budget (progetto gratuito). Nessuna deadline esplicita.

**Incertezze maggiori:** materiali PETG/PE PCR senza dati (vuoti da gestire); ruolo/portata della pagina admin; gestione login (scope utenti).

---

## Domande ancora aperte

1. **Ruoli:** oltre al login commerciale, chi è l'admin che gestirà la pagina dati? Conferma separazione ruoli commerciale vs admin.
2. **Volume dati iniziale:** la pagina admin parte popolata con i dati estratti dall'excel attuale, o inseriti a mano?
