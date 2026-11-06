# Vetronaviglio Listini Webapp — Riepilogo per la Direzione

**Destinatario:** CFO Vetronaviglio s.r.l.
**Data:** 2026-11-03
**Referente tecnico:** Stefano Bonfanti
**Referente azienda:** Federico Rosi (Direzione Qualità, R&D e Sviluppo Prodotto)

---

## 1. Cos'è

È una applicazione web interna che permette ai commerciali di Vetronaviglio di ottenere in pochi secondi i **prezzi di vendita allineato** e **alla rinfusa** di un prodotto (flacone/vaso), selezionando semplicemente:

- **materiale** (PP, PE, PETG, PE PCR)
- **colore**
- **capacità** (da 30 ml a 1000 ml)

L'applicazione restituisce automaticamente i prezzi per tutte le **11 fasce di quantità**, identici a quelli calcolati oggi dal foglio Excel `Nuovo Listino Plastica_06 2025_Rev01.xlsx`.

---

## 2. Problema che risolve

Oggi i commerciali leggono i prezzi da un file Excel complesso (44 fogli, colonne AC e AD per prezzo allineato e rinfusa). Questo comporta:

- tempo perso nella consultazione manuale del foglio
- rischio di errori di lettura o di fascia sbagliata
- difficoltà a tenere i prezzi allineati quando cambiano i costi o i listini

L'applicazione elimina la consultazione manuale dell'Excel: il commerciale seleziona i tre parametri e ottiene subito i due prezzi, coerenti con il listino di riferimento.

---

## 3. Come funziona

1. L'utente effettua il login (ogni commerciale ha le proprie credenziali).
2. Seleziona materiale, colore e capacità da menu a tendina.
3. Vede immediatamente una tabella (o card su mobile) con il prezzo di vendita **allineato** e **alla rinfusa** per ciascuna delle 11 fasce di quantità.
4. Può consultare il dettaglio del calcolo (breakdown: costo materia prima, imballo, macchina, ricarico) per trasparenza sui prezzi.

Esiste inoltre una **pagina amministrativa** riservata, dove un utente con ruolo admin può gestire i dati di listino (materiali, colori, capacità, costi, parametri macchina, fasce quantità) senza dover modificare file Excel o intervenire sul database.

---

## 4. Benefici per l'azienda

| Area | Beneficio |
|---|---|
| Commerciali | Preventivi più rapidi, zero consultazione Excel, prezzi sempre allineati al listino |
| Direzione | Unico punto di verità per i prezzi di vendita; controllo centralizzato dei dati via admin |
| Operativo | Rischio di errore umano nella lettura dei prezzi ridotto a zero |
| Flessibilità | Aggiornamento listini, costi e fasce direttamente dalla pagina admin, senza sviluppatore |

---

## 5. Stato attuale

L'applicazione è **in produzione** sull'ambiente aziendale on-premise, raggiungibile all'indirizzo:

**http://listini.vetrodom.local**

Il motore di calcolo è stato verificato punto per punto contro l'Excel di riferimento: **1.932 controlli su 1.932 superati**, con perfetta coincidenza tra i valori dell'applicazione e quelli del foglio di calcolo.

La soluzione è ospitata sui server aziendali (database Supabase self-hosted), quindi i dati rimangono all'interno dell'infrastruttura di Vetronaviglio.

---

## 6. Cosa serve per chiudere il progetto

Per completare l'allineamento definitivo con il listino attuale, sono necessari alcuni dati ancora da confermare da parte di Vetronaviglio:

1. **4 valori di costo imballo** (€/pezzo), differenziati per allineato/rinfusa e per fascia capacità (fino/oltre 125 ml)
2. **Excel di riferimento aggiornato**, per rigenerare la baseline di confronto con i nuovi costi
3. Conferma delle **configurazioni mancanti**: capacità 400 ml e materiali PETG / PE PCR
4. **Ricarichi di vendita** applicati e valore del **master colore CUSTOM**

Una volta ricevuti questi dati, si potranno caricare i costi imballo in amministrazione e consegnare il prospetto finale delle variazioni di prezzo.

---

## 7. Contatti

- **Sviluppo / supporto tecnico:** Stefano Bonfanti — ZetaByteNexus
- **Referente azienda:** Federico Rosi — Direttore Qualità, R&D e Sviluppo Prodotto (M +39 347 086 0267, Int. 425)

---
