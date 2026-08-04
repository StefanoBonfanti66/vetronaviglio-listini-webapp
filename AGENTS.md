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

## Current Focus — 2026-08-04

### Completato
- MVP completo: schema Supabase + seed (44 config), motore prezzi (1932 check vs excel), import excel, UI (login, prezzi + breakdown, admin CRUD).
- Editing parametri macchina (allineato/rinfusa) abilitato in admin; refactor AuthContext con `refresh()`; login naviga su `/`.
- Pulizia: rimosso favicon non usato, `*.tsbuildinfo` in `.gitignore`.
- typecheck + build + test pricing tutti OK.

### Da fare / miglioramenti futuri
- Deploy Vercel + secret + smoke test produzione.
- Chiarire con cliente: stampa/export PDF, ruoli admin, popolamento dati.
- Dati PETG / PE PCR (oggi selezionabili ma vuoti).

### Prossimo step concreto
- Commit del WIP corrente su `main`, poi configurare il deploy Vercel (`docs/bootstrap.md`).
