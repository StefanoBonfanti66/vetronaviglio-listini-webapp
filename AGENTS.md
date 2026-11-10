# Agent rules

- Read PROJECT_AI_NOTES.md before doing major work.
- Prefer small diffs.
- Ask before touching secrets, .env, deployment, infra, auth, billing.
- Follow existing code style.
- Update PROJECT_AI_NOTES.md at meaningful checkpoints.

## OpenCode usage in this template
- Treat this repository as a project-scoped OpenCode workspace.
- Personalize `AGENTS.md` after cloning so the rules match the new project.
- Use `PROJECT_AI_NOTES.md` to track decisions, checkpoints, and pending items across sessions.
- If you use custom commands in your OpenCode setup, document project-specific ones here or in the repository docs.

## Current Focus — 2026-11-10

### Completato
- Sessione 2026-11-10: rimossa dicitura "(email Federico, 10/11/2026)" dal testo frontend (AdminPage.tsx) — testo visibile semplificato, commenti tecnici conservati.
- Sessione 2026-11-10: costi orari globali resi unici e non modificabili per-variante:
  - Rimossi `costo_rsu`, `costo_orario_rsu`, `costo_orario_macchina` dai form crea/modifica configurazione (Fase 1 e Fase 2); restano solo le quantità (`ore_uomo`, `velocita_pz_h`, `ricarico_costi_ind`).
  - Aggiunto testo sola lettura "(Parametro globale)" che mostra i valori effettivi di `parametriCostiOrari.costo_orario_attrezzista` / `_operatore` / `_macchina`.
  - `saveEdit` non reintroduce più i vecchi costi per-variante nel patch di salvataggio.
  - Pannello "Costi orari globali" gestisce stati di caricamento ed errore espliciti.
  - PriceSearchPage blocca il rendering dei prezzi se i parametri globali non sono caricati (non mostra più fallback per-variante).
  - typecheck OK, npm test OK (1932/1932 + 1936/1936 + costs + imballi), build OK.
- 5 commit della sessione 2026-11-09 già pushati su `origin/main` (voce "non ancora pushati" rimossa: era stale).
- 2 commit locali in `main` non pushati: `c338cad` (style: rimuove riferimento email frontend) e `5008ba3` (fix: costi orari globali in sola lettura nelle configurazioni).
- Costi imballo €/pezzo caricati in admin da Federico: allineato ≤125 ml 0,00375; rinfusa ≤125 ml 0,005; allineato >125 ml 0,005; rinfusa >125 ml 0,0075.
- Mail bozza per Federico e Rossana preparata con costi imballi e elenco dati mancanti (testo pronto, non inviato — nessun tool `create_draft` disponibile).

### Da fare / miglioramenti futuri
- Push dei 2 commit locali (`c338cad`, `5008ba3`) su `origin/main` (attende conferma utente, SOLO LOCALE per ora).
- Dati mancanti da Federico: Excel di riferimento aggiornato, conferma config 400 ml/PETG/PE_PCR/BIO BASED, ricarichi vendite, valore master color CUSTOM.
- Account Rosanna Pezzion (`r.pezzoni@vetronaviglio.it`) da creare su Supabase Auth (nessun accesso al server da parte mia).
- Invio manuale della mail bozza a Federico (destinatari: s.bonfanti@vetronaviglio.it in To, r.pezzoni@vetronaviglio.it in Cc).
- Docs: `README.md` boilerplate Triathlon Starter ancora da allineare; `docs/overview.md`, `docs/project/overview.md` e `docs/project/runbook.md` già allineati al reale (deploy on-prem produzione).
- Rotazione anon key (esposta in chat 31/08): utente rigenera la legacy anon key in Dashboard → Project Settings → API e aggiorna il secret GitHub `SUPABASE_ANON_KEY`.
- Nota sicurezza: la select REST su `imballo_fissi` risponde anche con anon key (RLS select non restrittiva).

### Prossimo step operativo (non Git)
- Ricevere Excel aggiornato e dati mancanti da Federico; preparare il prospetto finale delle variazioni di prezzo.
- Incontro con cliente per validazione prototipo, scelta hosting e personalizzazioni (PDF, PETG/PE PCR, ruoli).
