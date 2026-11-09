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

## Current Focus — 2026-11-09

### Completato
- 5 commit in locale su `main` (non ancora pushati): default ore_uomo=6 e etichetta IMBALLO fase 3 (b862f4e); audit trail prezzi con migration 0007 e getProfiles (f208bd6); avviso prezzi scaduti e data dedicata aggiornamento prezzo (f45fdeb); evidenziazione marcata prezzi da aggiornare (4a702b6); conferma esplicita prezzi invariati con pulsante 'Conferma prezzo' (ecaab3c).
- Costi imballo €/pezzo caricati in admin da Federico: allineato ≤125 ml 0,00375; rinfusa ≤125 ml 0,005; allineato >125 ml 0,005; rinfusa >125 ml 0,0075 (fonte: 4.000 pz/bancale fino a 125 ml, 2.000 pz/bancale oltre).
- Mail bozza per Federico e Rossana preparata con costi imballi caricati e elenco dati mancanti.
- Verifiche: typecheck OK, npm test OK (1932/1932 + 1936/1936 + costs + imballi), build OK.
- AGENTS.md Current Focus allineato alla sessione corrente (vecchie voci 'committare/pushare' rimosse: i 5 commit sono già fatti in locale).

### Da fare / miglioramenti futuri
- Push dei 5 commit locali su `origin/main` (attende conferma utente).
- Dati mancanti da Federico: Excel di riferimento aggiornato, conferma config 400 ml/PETG/PE_PCR/BIO BASED, ricarichi vendite, valore master color CUSTOM.
- Account Rosanna Pezzion (`r.pezzoni@vetronaviglio.it`) da creare su Supabase Auth (nessun accesso al server da parte mia).
- Docs: `README.md` boilerplate Triathlon Starter ancora da allineare; `docs/overview.md`, `docs/project/overview.md` e `docs/project/runbook.md` già allineati al reale (deploy on-prem produzione).
- Rotazione anon key (esposta in chat 31/08): utente rigenera la legacy anon key in Dashboard → Project Settings → API e aggiorna il secret GitHub `SUPABASE_ANON_KEY`.
- Nota sicurezza: la select REST su `imballo_fissi` risponde anche con anon key (RLS select non restrittiva).

### Prossimo step concreto
- Pubblicare i 5 commit locali su `origin/main` (richiesta di conferma in fase di chiusura sessione).
- Ricevere Excel aggiornato e dati mancanti da Federico; preparare il prospetto finale delle variazioni di prezzo.
- Incontro con cliente per validazione prototipo, scelta hosting e personalizzazioni (PDF, PETG/PE PCR, ruoli).
