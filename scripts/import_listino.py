#!/usr/bin/env python3
"""Import del listino excel in seed JSON per Supabase.

Legge il file "Nuovo Listino Plastica_06 2025_Rev01.xlsx" e produce
supabase/seed/listino_seed.json con i dati canonici (materials, colors,
capacities, price_brackets, listino_configs) pronti per il seeding.

- Nomi sheet normalizzati: trim + rimozione suffisso " def".
- PETG / PE PCR non hanno fogli propri: non generati (selettore UI con valori vuoti).
- Ogni foglio "CAP MAT COL" -> listino_config (capacity, material, color, MP, imballo, parametri).
"""

import json
import re
import sys
from pathlib import Path

import openpyxl

XLSX = Path(__file__).resolve().parent.parent / "data/listini/Nuovo_Listino_Plastica_06-2025_Rev01.xlsx"
OUT = Path(__file__).resolve().parent.parent / "supabase/seed/listino_seed.json"


def norm(name: str) -> str:
    n = name.strip()
    n = re.sub(r"\s+def$", "", n)
    return n


def f(v) -> float:
    return 0.0 if v is None else float(v)


def main() -> int:
    wbv = openpyxl.load_workbook(XLSX, data_only=True)
    wbf = openpyxl.load_workbook(XLSX, data_only=False)  # per le formule

    # --- materials / colors / capacities (ordine canonico) ---
    materials = [
        {"code": "PP", "name": "PP"},
        {"code": "PE", "name": "PE"},
        {"code": "PETG", "name": "PETG"},
        {"code": "PE_PCR", "name": "PE PCR"},
    ]
    colors = [
        {"code": "NBN", "name": "Non bianco / neutro"},
        {"code": "COL", "name": "Colorato"},
    ]

    cap_sheet = wbv["CAP_PESI_LOTTI"]
    # colonna A = label capacità, colonna C = peso da disegni (g)
    # le righe sono duplicate (una per combinazione materiale/colore): dedup
    seen_caps: dict[str, float] = {}
    r = 2
    while True:
        a = cap_sheet.cell(row=r, column=1).value
        c = cap_sheet.cell(row=r, column=3).value
        if a is None and c is None:
            break
        if a is not None and c is not None:
            seen_caps.setdefault(str(a).strip(), f(c))
        r += 1
    capacities = [
        {"label": label, "peso_disegno_g": peso} for label, peso in seen_caps.items()
    ]

    # --- price brackets (canonici, da 30ML PP NBN) ---
    brackets = [
        {"sort_order": 1, "da": 1000, "fino": 2999, "quantita_lotto": 2000, "sfrido": 0.1, "ricarico_vendite": 180, "regola_vendita": "doppio80"},
        {"sort_order": 2, "da": 3000, "fino": 4999, "quantita_lotto": 4000, "sfrido": 0.1, "ricarico_vendite": 160, "regola_vendita": "doppio80"},
        {"sort_order": 3, "da": 5000, "fino": 9999, "quantita_lotto": 7500, "sfrido": 0.07, "ricarico_vendite": 140, "regola_vendita": "doppio80"},
        {"sort_order": 4, "da": 10000, "fino": 14999, "quantita_lotto": 12500, "sfrido": 0.07, "ricarico_vendite": 85, "regola_vendita": "percentuale"},
        {"sort_order": 5, "da": 15000, "fino": 19999, "quantita_lotto": 17500, "sfrido": 0.07, "ricarico_vendite": 80, "regola_vendita": "percentuale"},
        {"sort_order": 6, "da": 20000, "fino": 29999, "quantita_lotto": 25000, "sfrido": 0.05, "ricarico_vendite": 75, "regola_vendita": "percentuale"},
        {"sort_order": 7, "da": 30000, "fino": 39999, "quantita_lotto": 35000, "sfrido": 0.05, "ricarico_vendite": 75, "regola_vendita": "percentuale"},
        {"sort_order": 8, "da": 40000, "fino": 49999, "quantita_lotto": 45000, "sfrido": 0.05, "ricarico_vendite": 70, "regola_vendita": "percentuale"},
        {"sort_order": 9, "da": 50000, "fino": 99999, "quantita_lotto": 75000, "sfrido": 0.05, "ricarico_vendite": 70, "regola_vendita": "percentuale"},
        {"sort_order": 10, "da": 100000, "fino": 150000, "quantita_lotto": 125000, "sfrido": 0.03, "ricarico_vendite": 65, "regola_vendita": "percentuale"},
        {"sort_order": 11, "da": 150000, "fino": 300000, "quantita_lotto": 200000, "sfrido": 0.03, "ricarico_vendite": 60, "regola_vendita": "percentuale"},
    ]

    # --- listino_configs ---
    configs = []
    for name in wbv.sheetnames:
        n = norm(name)
        if n == "CAP_PESI_LOTTI":
            continue
        m = re.fullmatch(r"(\d+[\w /]*?)\s+(PP|PE)\s+(NBN|COL)", n)
        if not m:
            print(f"SKIP sheet non riconosciuto: {name!r}", file=sys.stderr)
            continue
        cap_label, mat_code, col_code = m.group(1).strip(), m.group(2), m.group(3)
        # normalizza etichette capacità verso CAP_PESI_LOTTI
        cap_label = re.sub(r"\s*ML$", "", cap_label).strip()
        if cap_label == "300 to 400":
            cap_label = "300 / 350"
        cap = next(c for c in capacities if c["label"] == cap_label)

        ws = wbv[name]
        wsf = wbf[name]

        def g(r: int, c: int):
            return ws.cell(row=r, column=c).value

        def params(row: int):
            return {
                "ore_uomo": f(g(row, 1)),
                "costo_rsu": f(g(row, 2)),
                "velocita_pz_h": f(g(row, 3)),
                "rsu_unit": f(g(row, 4)),
                "costo_orario_macchina": f(g(row, 5)),
                "costo_orario_rsu": f(g(row, 6)),
                "ricarico_costi_ind": f(g(row, 7)),
            }

        mp_costos = [f(g(r, 2)) for r in range(22, 26)]
        mp_pct = [f(g(r, 3)) for r in range(22, 26)]
        n_scatole = f(g(30, 2))
        n_sacchetti = f(g(32, 2))
        n_veline = f(g(33, 2))
        imballo_items = [
            {"name": "scatole", "costo": round(n_scatole * f(g(30, 4)), 6)},
            {"name": "sacchetti", "costo": round(n_sacchetti * f(g(32, 4)), 6)},
            {"name": "veline", "costo": round(n_veline * f(g(33, 4)), 6)},
            {"name": "film", "costo": round(f(g(34, 4)), 6)},
        ]
        pezzi_pallet = n_scatole * f(g(29, 2))

        # peso effettivo dal foglio (colonna F, riga 4) — può divergere da CAP_PESI_LOTTI
        peso_foglio = f(g(4, 6))

        # variante formula ricarico industriale rinfusa (cella Z4):
        # '=X4+X4*Y4/100' -> percentuale (solo '1000ML PE COL')
        # '=X4+X4*Y4'     -> frazione (default)
        z4 = wsf.cell(row=4, column=26).value
        rinfusa_div_100 = isinstance(z4, str) and "/100" in z4

        configs.append({
            "capacity_label": cap_label,
            "material_code": mat_code,
            "color_code": col_code,
            "peso_disegno_g": round(peso_foglio, 4),
            "rinfusa_ricarico_div_100": rinfusa_div_100,
            "mp_costos_kg": mp_costos,
            "mp_utilizzi_pct": mp_pct,
            "imballo_items": imballo_items,
            "pezzi_pallet": round(pezzi_pallet, 2),
            "allineato": params(18),
            "rinfusa": params(19),
        })

    seed = {
        "materials": materials,
        "colors": colors,
        "capacities": capacities,
        "price_brackets": brackets,
        "listino_configs": configs,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n")
    print(f"OK: {len(configs)} listino_configs -> {OUT}")
    print(f"  capacities={len(capacities)} materials={len(materials)} colors={len(colors)} brackets={len(brackets)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
