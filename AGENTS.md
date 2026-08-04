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
- **Percorso B completato**: admin = unica fonte dati. CRUD config listino (create/delete + form completo), anagrafiche (materiali/colori/capacità via CrudManager + toggle active/disattivo live), fasce (BracketsManager). Migrazione `0002` (capacities.enabled), PETG/PE_PCR attivati e popolabili da admin. Fix bug `updated_at: ''` (400). Smoke test Playwright tutti i flussi OK, DB ripristinato (44 config).
- Editing parametri macchina (allineato/rinfusa) abilitato in admin; refactor AuthContext con `refresh()`; login naviga su `/`.
- **Responsive mobile/tablet**: risultati prezzi come card <640px, tabella config admin ridotta a colonne essenziali <768px, fasce con scroll, form/header adattivi. Verificato Playwright 390×844 e 834×1112 (zero overflow).
- **Verifica dati 100%**: chain excel→seed (seed identico a excel) → seed→DB (4/2/12/11/44 ✅, 1 diff cosmetica COL.name) → prezzi vs excel **1932/1932** (seed==DB ⟹ app==excel). typecheck + build + test pricing OK.
- **Migration DB** su nuovo project `fkjaqhydotxubxnieguh` (Management REST API): migration 0001+0002 + seed applicati, counts verificati; env `app/.env.local` puntato al nuovo project (già in `.gitignore` via `*.local`); fallback URL `AuthContext`/`api.ts` aggiornati col nuovo project; admin `s.bonfanti@vetronaviglio.it` ricreato, login verificato (role=admin).
- **Commit WIP pushato su `main`** (`git@github.com:StefanoBonfanti66/vetronaviglio-listini-webapp.git`). Build OK.
- Pulizia: rimosso favicon non usato, `*.tsbuildinfo` in `.gitignore`.
- **3 utenti creati in Supabase Auth** (via Admin API, no email inviate): `f.rosi@vetronaviglio.it` (admin), `b.solitodesolis@vetronaviglio.it` (admin), `f.ruffini@vetronaviglio.it` (commerciale/user). Profile auto-create via DB trigger. Puliti 2 utenti test accidentalmente creati via signup.
- **Log login persistente**: disponibile in Supabase Dashboard → Authentication → Logs (`https://supabase.com/dashboard/project/fkjaqhydotxubxnieguh/auth/logs`).

### Da fare / miglioramenti futuri
- **Deploy preview Vercel** (manuale, via dashboard GitHub integration) con env `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (MCP non supporta env vars / JS 493 kB inline).
- Smoketest browser su nuovo project (dev riavvio per .env.local). 30ML PP NBN fascia1 = 0,57 €.
- Allineare label colore COL hardcodata (non bloccante prezzi).
- Chiarire con cliente: stampa/export PDF, popolamento dati.

### Prossimo step concreto
- Deploy preview Vercel + smoketest browser. (`docs/bootstrap.md`)
