# Runbook — Vetronaviglio Listini Webapp

Istruzioni operative per lavorare sul progetto.

## Sorgente dati

- **Excel sorgente:** `data/listini/Nuovo_Listino_Plastica_06-2025_Rev01.xlsx`
- **Posizione originale:** allegato email Federico Rosi (03/08/2026)
- **Struttura:** `CAP_PESI_LOTTI` + fogli `<CAP> <MAT> <NBN|COL>` (solo PP e PE attualmente)
- **Output:** colonna AC = prezzo di vendita allineato, AD = prezzo di vendita rinfusa

## Aggiornare il listino

1. Sostituire il file in `data/listini/` con la nuova revisione.
2. Rigenerare i dati applicativi:

```bash
# import excel -> supabase/seed/listino_seed.json (venv openpyxl)
/tmp/opencode/xlvenv/bin/python scripts/import_listino.py
```

3. Verificare il motore di calcolo contro i valori reali dell'excel:

```bash
# e2e: 1932 check su 44 fogli (U/AA/AC/AD a 1e-6)
cd app && ./node_modules/.bin/esbuild tests/pricing-e2e.test.ts --bundle --platform=node --format=esm --outfile=/tmp/opencode/pricing-e2e.mjs && node /tmp/opencode/pricing-e2e.mjs

# unit: 30ML PP NBN + 500ML PE COL
./node_modules/.bin/esbuild tests/pricing.test.ts --bundle --platform=node --format=esm --outfile=/tmp/opencode/pricing.mjs && node /tmp/opencode/pricing.mjs

# typecheck + build
npm run typecheck && npm run build
```

4. Aggiornare `docs/changelog.md` e il versionamento.

## Peculiarità dati emerse dall'analisi

- **Peso del prodotto:** si legge dalla colonna F del singolo foglio (non da `CAP_PESI_LOTTI`). Eccezione: `50ML PE NBN` usa peso 20, gli altri fogli da 50ml usano 10.
- **Formula ricarico industriale rinfusa (col 26):** 43 fogli usano `=X+X*Y` (frazione), solo `1000ML PE COL` usa `=X+X*Y/100` (percentuale). Nel DB questo è il flag `rinfusa_ricarico_div_100`.
- **Nomi fogli non uniformi:** alcune combinazioni hanno suffissi (`'30ML PP COL '` trailing space, `'50ML PP NBN def'`) → normalizzati dall'import (`strip` + rimozione `' def'`).

## Ambiente di sviluppo

```bash
cd app
npm install
npm run dev
```

## Deploy

Da confermare (Vercel). Vedi `docs/bootstrap.md` per la procedura standard triathlon-starter.
