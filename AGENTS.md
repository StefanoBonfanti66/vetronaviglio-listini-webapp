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
- **Percorso B completato**: admin = unica fonte dati. CRUD config listino (create/delete + form completo), anagrafiche (materiali/colori/capacità via CrudManager), fasce (BracketsManager). Migrazione `0002` (capacities.enabled), PETG/PE_PCR attivati e popolabili da admin. Fix bug `updated_at: ''` (400). Smoke test Playwright tutti i flussi OK, DB ripristinato (44 config).
- Editing parametri macchina (allineato/rinfusa) abilitato in admin; refactor AuthContext con `refresh()`; login naviga su `/`.
- **Responsive mobile/tablet**: risultati prezzi come card <640px, tabella config admin ridotta a colonne essenziali <768px, fasce con scroll, form/header adattivi. Verificato Playwright 390×844 e 834×1112 (zero overflow).
- Pulizia: rimosso favicon non usato, `*.tsbuildinfo` in `.gitignore`.
- typecheck + build + test pricing tutti OK.

### Da fare / miglioramenti futuri
- **Commit WIP su `main` (gate umano)**, poi deploy Vercel + secret + smoke test produzione.
- Chiarire con cliente: stampa/export PDF, ruoli admin, popolamento dati.

### Prossimo step concreto
- Dopo validazione umana: commit del WIP, poi configurare il deploy Vercel (`docs/bootstrap.md`).
