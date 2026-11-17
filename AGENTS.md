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
- Sessione 2026-11-17: creata migration `supabase/migrations/0009_listino_configs_petg_pepcr_biobased.sql` (72 INSERT PETG/PE_PCR/BIOBASED × 12 capacità × colori NBN/COL).
- Sessione 2026-11-17: aggiornato `supabase/seed/listino_seed.json` (116 configs totali) e `supabase/seed/seed.sql` rigenerato con `scripts/seed_listino.py`.
- Sessione 2026-11-17: commit `db01d7e` pushato su `origin/main` (5 file, 3556 insertions, 4 deletions, 0/0 vs upstream).
- Sessione 2026-11-17: migration 0009 applicata al DB on-prem live (psql: INSERT 0 72).
- Sessione 2026-11-17: creata migration `supabase/migrations/0010_listino_configs_400ml_pp_pe.sql` (4 INSERT PP/PE × 400 ml × NBN/COL, `ON CONFLICT DO NOTHING`).
- Sessione 2026-11-17: conferma funzionale ricevuta da Federico — "Per il formato 400 ml usa il 350." Regola di eredità parametri dal 300/350 confermata.
- Sessione 2026-11-17: migration 0010 applicata al DB on-prem live; verifica finale 10 combinazioni per label='400' (peso 38.0, velocità 350.0).
- Sessione 2026-11-17: combinazione UI "PP → Non bianco / neutro → 400 ml" confermata funzionante.
- Sessione 2026-11-17: aggiornato `PROJECT_AI_NOTES.md` (esito migration 0009/0010, decisione Federico, riferimenti operativi on-prem).
- Sessione 2026-11-17: aggiornata bozza mail a Federico (versione non tecnica pronta).
- Costi imballo €/pezzo caricati in admin da Federico: allineato ≤125 ml 0,00375; rinfusa ≤125 ml 0,005; allineato >125 ml 0,005; rinfusa >125 ml 0,0075.
- Master color CUSTOM valorizzato a 30 (da confermare/ritoccare da Federico).
- typecheck OK, npm test OK (1932/1932 + 1936/1936 + costs + imballi), build OK.

### Da fare / miglioramenti futuri
- Ricevere Excel aggiornato da Federico con i fogli mancanti (PETG, PE PCR, BIOBASED × capacità inclusa 400 ml).
- Ricevere conferma valore master color CUSTOM (già a 30, da ritoccare).
- Account Rosanna Pezzion (`r.pezzoni@vetronaviglio.it`) da creare su Supabase Auth (nessun accesso al server da parte mia).
- Invio manuale della mail a Federico (destinatario To: s.bonfanti@vetronaviglio.it; Cc: r.pezzoni@vetronaviglio.it).
- Docs: `README.md` boilerplate Triathlon Starter ancora da allineare.
- Rotazione anon key (esposta in chat 31/08): utente rigenera la legacy anon key in Dashboard → Project Settings → API e aggiorna il secret GitHub `SUPABASE_ANON_KEY`.
- Nota sicurezza: la select REST su `imballo_fissi` risponde anche con anon key (RLS select non restrittiva).

### Prossimo step operativo (non Git)
- Invio mail a Federico con conferma risoluzione PETG, PE PCR e 400 ml.
- Preparare il prospetto finale delle variazioni di prezzo per validazione cliente.
- Incontro con cliente per validazione prototipo, scelta hosting e personalizzazioni (PDF, PETG/PE PCR, ruoli).
