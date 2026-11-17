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

## Current Focus — 2026-11-17

### Completato
- Sessione 2026-11-10: costi orari globali resi unici e non modificabili per-variante (tipocheck, test, build OK).
- Sessione 2026-11-09: 5 commit già pushati su `origin/main` (allineato 0/0).
- Sessione 2026-11-17: diagnosi problema PETG/PE PCR/400 ml — causa = `listino_configs` mancanti (dati non caricati), non bug di codice; flusso `getConfig` → `PriceSearchPage` si comporta correttamente.
- Sessione 2026-11-17: aggiornato `PROJECT_AI_NOTES.md` (TODO 0: i 4 valori costo imballo e master color CUSTOM a 30 sono già inseriti da Federico; resta Excel aggiornato + config mancanti).
- Sessione 2026-11-17: bozza mail collaborativa a Federico preparata (testo pronto, invio manuale dal proprio indirizzo).
- Costi imballo €/pezzo caricati in admin da Federico: allineato ≤125 ml 0,00375; rinfusa ≤125 ml 0,005; allineato >125 ml 0,005; rinfusa >125 ml 0,0075.
- Master color CUSTOM valorizzato a 30 (da confermare/ritoccare da Federico).
- typecheck OK, npm test OK (1932/1932 + 1936/1936 + costs + imballi), build OK.

### Da fare / miglioramenti futuri
- Ricevere Excel aggiornato da Federico con i fogli mancanti (PETG, PE PCR, BIOBASED × capacità inclusa 400 ml).
- Creare le config listino mancanti nel DB on-prem e applicare al live (gate umano).
- Ricevere conferma valore master color CUSTOM (già a 30, da ritoccare).
- Account Rosanna Pezzion (`r.pezzoni@vetronaviglio.it`) da creare su Supabase Auth (nessun accesso al server da parte mia).
- Invio manuale della mail bozza a Federico (destinatari: s.bonfanti@vetronaviglio.it in To, r.pezzoni@vetronaviglio.it in Cc).
- Docs: `README.md` boilerplate Triathlon Starter ancora da allineare.
- Rotazione anon key (esposta in chat 31/08): utente rigenera la legacy anon key in Dashboard → Project Settings → API e aggiorna il secret GitHub `SUPABASE_ANON_KEY`.
- Nota sicurezza: la select REST su `imballo_fissi` risponde anche con anon key (RLS select non restrittiva).

### Prossimo step operativo (non Git)
- Attendere Excel aggiornato da Federico; rigenerare i `listino_configs` con `scripts/import_listino.py` e applicare al DB on-prem.
- Preparare il prospetto finale delle variazioni di prezzo per validazione cliente.
- Incontro con cliente per validazione prototipo, scelta hosting e personalizzazioni (PDF, PETG/PE PCR, ruoli).
