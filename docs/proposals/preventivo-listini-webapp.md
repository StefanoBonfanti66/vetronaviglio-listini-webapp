# Preventivo — Web App Listini Commerciali

**A cura di:** Stefano Bonfanti
**Per:** Federico Rosi — Direttore Qualità, R&D e Sviluppo Prodotto, Vetronaviglio s.r.l.
**Data:** 06/08/2026
**Stato:** BOZZA da validare prima dell'invio

---

## 1. Oggetto

Web app che permette ai commerciali di ottenere in pochi secondi il **prezzo di vendita allineato** e il **prezzo di vendita alla rinfusa** (oggi colonne AC e AD dell'excel), selezionando materiale, colore e capacità.

Il prototipo è già **online e funzionante** per la validazione:

**https://vetronaviglio-listini-webapp.vercel.app**

## 2. Cosa include il prototipo

- **Login** con account individuale per ogni commerciale
- **Ricerca prezzo**: materiale (PP, PE, PETG, PE PCR) + colore + capacità → prezzo allineato e rinfusa per tutte le fasce di quantità
- **Dettaglio calcolo**: vista del breakdown (costi → prezzo) per verificare come è ricavato il prezzo
- **Gestione dati (admin)**: pagina dedicata per aggiornare listino, materiali, colori, capacità e fasce senza toccare file excel
- **Verificato contro l'excel**: 1.932 combinazioni testate, risultato identico al foglio

## 3. Due opzioni di messa in produzione

Come per il modulo visite, ci sono due strade per l'uso definitivo:

### Opzione A — Cloud (hosting esterno, gestito da me)

| Voce | Costo |
|---|---|
| Hosting web (Vercel Pro) | ~18 €/mese |
| Database + autenticazione (Supabase Pro) | ~23 €/mese |
| **Totale indicativo** | **~41 €/mese** (escl. IVA) |

- Tutto gestito da me, zero carico per il vostro IT
- Aggiornamenti e backup inclusi
- Accessibile da qualsiasi dispositivo, anche fuori sede
- Prezzi verificati sui listini ufficiali (06/2026); i piani gratuiti non sono adatti alla produzione (Vercel li riserva a uso personale, Supabase mette in pausa il database dopo 7 giorni di inattività)

### Opzione B — On-premise (sui vostri server Sineto)

| Voce | Costo |
|---|---|
| Installazione su server interno | Una tantum (da quantificare) |
| Gestione ordinaria | A cura dell'IT interno (Abbiati) |

- Dati **100% in house**
- Nessun canone mensile di hosting
- Necessario un server/node raggiungibile dai commerciali (anche in trasferta serve accesso alla rete aziendale o VPN)

> **Nota di confronto:** nel modulo visite l'hosting è quotato ~7 €/mese (solo hosting, server Render). Qui il totale è più alto perché l'app listini include anche il **database e l'autenticazione gestiti** (voci Vercel + Supabase), che nel modulo visite non erano previsti.

## 4. Nota sul listino attuale

- L'excel contiene oggi i prezzi per **PP e PE** (colori bianco/neutro e colorato).
- **PETG e PE PCR** sono selezionabili nell'app ma i prezzi restano **vuoti** finché il listino non li prevede: quando i dati saranno disponibili si popolano dall'admin in pochi minuti.

## 5. Prossimi passi

1. **Validazione prototipo** — mi fai sapere se va bene o cosa cambiare
2. **Scelta opzione** (cloud o on-premise)
3. **Eventuali personalizzazioni**: stampa/export PDF del listino, popolamento dati PETG/PE PCR, definizione ruoli (amministratore vs commerciale)

Resto a disposizione per un incontro per vedere insieme il prototipo e decidere.
