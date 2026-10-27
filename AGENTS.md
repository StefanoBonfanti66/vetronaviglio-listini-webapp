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

## Current Focus — 2026-10-27

### Completato
- MVP completo: schema Supabase + seed (44 config), motore prezzi (1932 check vs excel), import excel, UI (login, prezzi + breakdown, admin CRUD).
- **Percorso B completato**: admin = unica fonte dati. CRUD config listino (create/delete + form completo), anagrafiche (materiali/colori/capacità via CrudManager + toggle active/disattivo live), fasce (BracketsManager). Migrazione `0002` (capacities.enabled), PETG/PE_PCR attivati e popolabili da admin. Fix bug `updated_at: ''` (400). Smoke test Playwright tutti i flussi OK, DB ripristinato (44 config).
- Editing parametri macchina (allineato/rinfusa) abilitato in admin; refactor AuthContext con `refresh()`; login naviga su `/`.
- **Responsive mobile/tablet**: risultati prezzi come card <640px, tabella config admin ridotta a colonne essenziali <768px, fasce con scroll, form/header adattivi. Verificato Playwright 390×844 e 834×1112 (zero overflow).
- **Verifica dati 100%**: chain excel→seed (seed identico a excel) → seed→DB (4/2/12/11/44 ✅, 1 diff cosmetica COL.name) → prezzi vs excel **1932/1932** (seed==DB ⟹ app==excel). typecheck + build + test pricing OK.
- **DB on-prem** (Supabase self-hosted `192.168.24.130:8000`, host `app-db-01`): URL configurabile via env, deploy Vercel non più il target primario.
- **Costi MP/master e velocità applicati** (email Margherita "COSTO MP"): MP base = ultimo acquisto (PP 1,69 / PE 1,69 / PE_PCR 1,98 / PETG 3,822 €/kg), master color 10 €/kg (neutro) e 20 €/kg (colorato), mix fisso 96/4, velocità 450 pz/h ≤125 ml e 350 pz/h >125 ml. Tabella sfrido→ricarico vendite allineata (0,1→180% … 0,03→65/60%).
- **Anagrafiche costs in admin** (migration `0004`): €/kg editabili per materiale e master per colore, propagati a tutte le config; colore CUSTOM aggiunto.
- **Costi imballo fissi €/pezzo** (migration `0005`, applicata al DB on-prem): 4 campi in admin (allineato/rinfusa × fino 125 ml/oltre 125 ml), applicazione automatica per fascia di capacità con fallback alla palletizzazione, `0` valido. Test end-to-end su dev e DB reale (valori di prova poi azzerati).
- **Deploy on-prem in produzione** (26/10): http://listini.vetrodom.local su `app-dev-01` (container `listini-webapp` su rete `intranet_proxy`, proxy nginx con reload dopo lo swap). Smoke test: login, prezzi, sezione admin "Costi imballi" OK. Rollback: immagine `vetronaviglio/listini-webapp:rollback-20261026` + container `listini-webapp-old` + tar sorgenti in `/opt/intranet/backups/`.
- **Mail di risposta a Federico/Margherita/Bettina inviata** il 26/10 (Gmail ZBN, inoltrata manualmente dal proprio indirizzo per non mostrare "ZetaByteNexus"); restano da chiedere 4 valori imballi, Excel aggiornato, config 400 ml/PETG/PE_PCR, ricarichi vendite, master color CUSTOM.
- **WIP committato e pushato** il 27/10: `d7ed92e` "feat: costi MP/master, anagrafiche costi e costi imballo fissi €/pezzo in admin" — 30 file (+8180/−276): `app/src/lib/costs.ts`, `app/src/lib/imballi.ts`, `app/src/components/admin/ImballiManager.tsx`, test `costs.test.ts`/`imballi.test.ts`/`pricing-current.test.ts` + snapshot, migration `0003`–`0005`, seed/import allineati, script `npm test`.
- **Copia locale riallineata a `origin/main`** (27/10): scartate 3 modifiche locali stale del 23/10 (variante *pre-correzione* del mapping `material_code` in `pricing.ts`/`types.ts` + `0003_master_color.sql` untracked), poi `git merge --ff-only` → `d7ed92e`. Verifica su codice allineato: `npm test` OK (unit + 1932/1932 vs Excel baseline + 1936/1936 costi correnti + costs + imballi), `npm run typecheck` OK, `npm run build` OK.
- **`.gitignore`**: aggiunto `*.jpg` (coerente con `*.png` già presente) → i 2 screenshot JPG di riferimento costi MP in `data/listini/` restano in locale e non sporcano `git status`.

### Da fare / miglioramenti futuri
- **Dati mancanti da Federico/Margherita**: 4 valori €/pezzo costi imballi, Excel di riferimento aggiornato, conferma config 400 ml/PETG/PE_PCR, ricarichi vendite, valore master color CUSTOM.
- **Docs allineati al reale** (incoerenze rilevate il 27/10): `README.md` è ancora il boilerplate "Triathlon Starter"; `docs/overview.md` e `docs/project/overview.md` sono fermi al 06/08 (dicono ancora Supabase cloud + Vercel, stato `lead`/`staging`) e non riflettono il deploy on-prem in produzione; `docs/project/runbook.md` ha comandi di test superati (`npm test` ora esiste) e deploy "da confermare". Riuso del `docs/` esistente, nessuna struttura nuova.
- Chiarire con cliente: stampa/export PDF, popolamento dati PETG/PE PCR, ruoli admin.
- Allineare label colore COL hardcodata (non bloccante prezzi).
- **Rotazione anon key** (esposta in chat 31/08): utente rigenera la legacy anon key in Dashboard → Project Settings → API e aggiorna il secret GitHub `SUPABASE_ANON_KEY`.
- Nota sicurezza: la select REST su `imballo_fissi` risponde anche con anon key (RLS select non restrittiva).

### Prossimo step concreto
- **Allineare la documentazione al reale**: aggiornare `README.md`, `docs/overview.md`, `docs/project/overview.md`, `docs/project/runbook.md` alla situazione on-prem (produzione `http://listini.vetrodom.local`, DB self-hosted `192.168.24.130:8000`, WIP `d7ed92e` pushato), riusando le note esistenti e senza creare cartelle/file nuovi.
- Caricare in admin i **4 valori €/pezzo** appena arrivano da Federico e mandare il prospetto finale delle variazioni di prezzo (serve l'Excel aggiornato).
- Incontro con cliente per validazione prototipo, scelta hosting e personalizzazioni (PDF, PETG/PE PCR, ruoli).

