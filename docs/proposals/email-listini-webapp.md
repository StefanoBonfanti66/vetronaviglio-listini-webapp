# Bozza email per Federico Rosi

**Oggetto:** Listini — prototipo pronto per validazione

Buongiorno Federico,

come promesso, il prototipo dell'app per i prezzi di listino è online e funzionante all'indirizzo:

**https://vetronaviglio-listini-webapp.vercel.app**

Cosa include:
- **Login** con account individuale per ogni commerciale
- **Ricerca prezzo** selezionando materiale, colore e capacità → prezzo di vendita allineato e rinfusa per tutte le fasce di quantità
- **Dettaglio del calcolo** (breakdown costi → prezzo) per verificare come è ricavato
- **Gestione dati (admin)** per aggiornare listino, materiali, colori, capacità e fasce senza toccare l'excel
- **Verificato contro l'excel**: 1.932 combinazioni testate con risultato identico al foglio

Per provarlo ho preparato questi account (le password si possono cambiare in qualsiasi momento):

- f.rosi@vetronaviglio.it (amministratore) — {{PASSWORD_F_ROS1}}
- b.solitodesolis@vetronaviglio.it (amministratore) — {{PASSWORD_B_SOLITO}}
- f.ruffini@vetronaviglio.it (commerciale) — {{PASSWORD_F_RUFFINI}}

Allego il preventivo di spesa con le due opzioni di messa in produzione (cloud gestito da me oppure on-premise sui vostri server), come per il modulo visite.

Per i prossimi passi servirebbe un incontro per:
1. **Vedere insieme il prototipo** — mi fai sapere se va bene o cosa cambiare
2. **Decidere dove metterlo** — cloud o sui vostri server Sineto
3. **Valutare le personalizzazioni** (stampa/export PDF del listino, popolamento dati PETG e PE PCR, ruoli amministratore vs commerciale)

Nota: nell'app sono oggi presenti i prezzi per **PP e PE**; **PETG e PE PCR** sono selezionabili ma restano vuoti finché il listino non li prevede — quando i dati arriveranno si popolano dall'admin in pochi minuti.

Quando hai un momento per vederlo?

Ciao,
Stefano
