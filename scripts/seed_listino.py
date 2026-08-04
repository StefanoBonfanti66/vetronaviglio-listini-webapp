#!/usr/bin/env python3
"""Genera supabase/seed/seed.sql dal listino_seed.json.

Uso:
    python3 scripts/seed_listino.py [--out supabase/seed/seed.sql]

Produce INSERT idempotenti (ON CONFLICT DO UPDATE) per materials,
colors, capacities, price_brackets, listino_configs.
"""
import argparse
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SEED_JSON = ROOT / "supabase" / "seed" / "listino_seed.json"


def jsonb_array(items):
    return "'" + json.dumps(items, separators=(",", ":")) + "'::jsonb"


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default=str(ROOT / "supabase" / "seed" / "seed.sql"))
    args = parser.parse_args()

    data = json.loads(SEED_JSON.read_text())
    lines = []
    lines.append("-- Seed generato da scripts/seed_listino.py (non modificare a mano)")

    lines.append("""
INSERT INTO public.materials (code, name, sort_order, enabled) VALUES
    ('PP', 'PP', 1, true),
    ('PE', 'PE', 2, true),
    ('PETG', 'PETG', 3, true),
    ('PE_PCR', 'PE PCR', 4, true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, enabled = EXCLUDED.enabled;
""")

    lines.append("""
INSERT INTO public.colors (code, name, sort_order, enabled) VALUES
    ('NBN', 'Non bianco / neutro', 1, true),
    ('COL', 'Colorato custom', 2, true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order, enabled = EXCLUDED.enabled;
""")

    lines.append("INSERT INTO public.capacities (label, peso_disegno_g, sort_order, enabled) VALUES")
    cap_rows = [
        f"({q(c['label'])}, {q(c['peso_disegno_g'])}, {i + 1}, true)"
        for i, c in enumerate(data["capacities"])
    ]
    lines.append(",\n    ".join(cap_rows))
    lines.append("""
ON CONFLICT (label) DO UPDATE SET peso_disegno_g = EXCLUDED.peso_disegno_g, sort_order = EXCLUDED.sort_order, enabled = EXCLUDED.enabled;
""")

    lines.append(
        "INSERT INTO public.price_brackets (sort_order, da, fino, quantita_lotto, sfrido, ricarico_vendite, regola_vendita) VALUES"
    )
    b_rows = [
        f"({q(b['sort_order'])}, {q(b['da'])}, {q(b['fino'])}, {q(b['quantita_lotto'])}, {q(b['sfrido'])}, {q(b['ricarico_vendite'])}, {q(b['regola_vendita'])})"
        for b in data["price_brackets"]
    ]
    lines.append(",\n    ".join(b_rows))
    lines.append("""
ON CONFLICT (sort_order) DO UPDATE SET da = EXCLUDED.da, fino = EXCLUDED.fino,
    quantita_lotto = EXCLUDED.quantita_lotto, sfrido = EXCLUDED.sfrido,
    ricarico_vendite = EXCLUDED.ricarico_vendite, regola_vendita = EXCLUDED.regola_vendita;
""")

    lines.append("INSERT INTO public.listino_configs (capacity_id, material_id, color_id, peso_disegno_g, rinfusa_ricarico_div_100, mp_costos_kg, mp_utilizzi_pct, imballo_items, pezzi_pallet, allineato, rinfusa) VALUES")
    cfg_rows = []
    for c in data["listino_configs"]:
        cfg_rows.append(
            "("
            f"(SELECT id FROM public.capacities WHERE label = {q(c['capacity_label'])}), "
            f"(SELECT id FROM public.materials WHERE code = {q(c['material_code'])}), "
            f"(SELECT id FROM public.colors WHERE code = {q(c['color_code'])}), "
            f"{q(c['peso_disegno_g'])}, {q(c['rinfusa_ricarico_div_100'])}, "
            f"ARRAY{c.get('mp_costos_kg', [])}::numeric[], ARRAY{c.get('mp_utilizzi_pct', [])}::numeric[], "
            f"{jsonb_array(c['imballo_items'])}, {q(c['pezzi_pallet'])}, "
            f"{jsonb_array(c['allineato'])}, {jsonb_array(c['rinfusa'])}"
            ")"
        )
    lines.append(",\n    ".join(cfg_rows))
    lines.append("""
ON CONFLICT (capacity_id, material_id, color_id) DO UPDATE SET
    peso_disegno_g = EXCLUDED.peso_disegno_g,
    rinfusa_ricarico_div_100 = EXCLUDED.rinfusa_ricarico_div_100,
    mp_costos_kg = EXCLUDED.mp_costos_kg,
    mp_utilizzi_pct = EXCLUDED.mp_utilizzi_pct,
    imballo_items = EXCLUDED.imballo_items,
    pezzi_pallet = EXCLUDED.pezzi_pallet,
    allineato = EXCLUDED.allineato,
    rinfusa = EXCLUDED.rinfusa,
    updated_at = now();
""")

    out = pathlib.Path(args.out)
    out.write_text("\n".join(lines))
    print(f"scritto {out} ({len(lines)} righe, {len(data['listino_configs'])} configs)")


if __name__ == "__main__":
    sys.exit(main())
