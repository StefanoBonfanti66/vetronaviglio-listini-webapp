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

## Current Focus — 2026-08-31

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
- **Deploy Vercel attivo e verificato (06/08)**: `https://vetronaviglio-listini-webapp.vercel.app`, auto-deploy via GitHub integration; smoketest produzione login + `30ML PP NBN fascia1 = 0,57 €` (identico excel). Bundle JS contiene env corrette del nuovo project.
- **Password reset 3 utenti + ruoli admin (06/08)**: reset via Admin API (password reali solo nel draft Gmail personale, non nei doc committati), login verificati; fix full_name f.rosi "F. Rossi"→"F. Rosi" e ruoli admin per f.rosi/b.solitodesolis (f.ruffini commerciale). Verificato in produzione (header "F. Rosi · admin", link Gestione dati visibile).
- **Preventivo + email a Federico Rosi (bozza, 06/08)**: `docs/proposals/preventivo-listini-webapp.md`+.html (2 opzioni: Cloud Vercel Pro+Supabase Pro ≈41€/mese escl. IVA vs On-premise server Sineto una tantum; nota confronto report-visite ~7€ solo hosting) + `email-listini-webapp.md` (credenziali in placeholder, reali solo nel draft Gmail personale `r2340419766766766437`, da inoltrare). Aggiornati `docs/_INDEX.md` e `docs/changelog.md`.
- **Keep-alive Supabase free tier (31/08)**: creato `.github/workflows/supabase-keepalive.yml` (cron `0 6 */5 * *` ogni 5 gg + workflow_dispatch) che chiama `GET /rest/v1/materials?select=id&limit=1` col secret `SUPABASE_URL`+`SUPABASE_ANON_KEY`, così il progetto `fkjaqhydotxubxnieguh` non viene messo in pausa dal free tier. **Verificato in verde** (commit `88e4a48`, fix endpoint `2d45253`); log Supabase conferma `GET 200`. La rotazione della anon key legata a GitHub secret è **a carico dell'utente**.

### Da fare / miglioramenti futuri
- Chiarire con cliente: stampa/export PDF, popolamento dati PETG/PE PCR, ruoli admin.
- Allineare label colore COL hardcodata (non bloccante prezzi).
- **Rotazione anon key** (esposta in chat 31/08): utente rigenera la legacy anon key in Dashboard → Project Settings → API e aggiorna il secret GitHub `SUPABASE_ANON_KEY`.

### Prossimo step concreto
- **Inoltrare la bozza email a Federico Rosi** (draft Gmail personale `r2340419766766766437`) e cancellare la vecchia bozza `r-1809523374683032986`.
- Incontro con cliente per validazione prototipo, scelta hosting (cloud/on-premise) e personalizzazioni (PDF, PETG/PE PCR, ruoli).
