#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificacion INDEPENDIENTE: cada monto del JSON del dashboard debe coincidir
con la celda correspondiente del Excel original (ESF, ER y Ratios).

No confia en build_data.py: vuelve a leer el Excel y busca cada valor.
"""
import json
import sys
import unicodedata
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT.parent / "Alicorp_EEFF_Separados_2010-2025.xlsx"
JSON = ROOT / "public" / "data" / "alicorp.json"


def norm(s):
    if s is None:
        return ""
    t = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    return " ".join(t.lower().split())


def cell_num(v):
    if v is None or v == "":
        return None
    if isinstance(v, float):
        return int(v) if v.is_integer() else round(v, 6)
    if isinstance(v, int):
        return v
    return None


wb = openpyxl.load_workbook(XLSX, data_only=True)
data = json.load(open(JSON, encoding="utf-8"))
years = data["meta"]["years"]
NY = len(years)


def sheet_index(ws):
    """label normalizado -> lista de 16 valores, tal cual el Excel."""
    idx = {}
    for row in ws.iter_rows(values_only=True):
        if not row or not isinstance(row[0], str) or not row[0].strip():
            continue
        key = norm(row[0])
        vals = [cell_num(row[i]) if i < len(row) else None for i in range(1, NY + 1)]
        idx.setdefault(key, vals)  # primera aparicion
    return idx


esf_idx = sheet_index(wb["ESF"])
er_idx = sheet_index(wb["ER"])
rat_idx = sheet_index(wb["Ratios"])

mismatches = []
checked = 0


def approx(a, b, tol=1e-4):
    if a is None or b is None:
        return a == b
    return abs(a - b) <= max(tol, abs(b) * 1e-6)


def check(source_idx, label, values, where):
    global checked
    key = norm(label)
    if key not in source_idx:
        mismatches.append(f"[{where}] etiqueta no hallada en Excel: '{label}'")
        return
    src = source_idx[key]
    for i in range(NY):
        checked += 1
        if not approx(values[i], src[i]):
            mismatches.append(
                f"[{where}] '{label}' {years[i]}: JSON={values[i]} vs Excel={src[i]}"
            )


# --- ESF: cuentas y totales de bloque ---
for b in data["esf"]["bloques"]:
    for c in b["cuentas"]:
        check(esf_idx, c["label"], c["values"], "ESF")
    # total de bloque
    total_labels = {
        "activo_corriente": "Total activo corriente",
        "activo_no_corriente": "Total activo no corriente",
        "pasivo_corriente": "Total pasivo corriente",
        "pasivo_no_corriente": "Total pasivo no corriente",
        "patrimonio": "TOTAL PATRIMONIO",
    }
    check(esf_idx, total_labels[b["id"]], b["total"], "ESF-total")

# --- ER: cada linea ---
for l in data["er"]["lineas"]:
    check(er_idx, l["label"], l["values"], "ER")

# --- Ratios: cada item ---
for g in data["ratios"]["grupos"]:
    for it in g["items"]:
        check(rat_idx, it["label"], it["values"], "Ratios")

print(f"Valores comparados contra el Excel: {checked}")
if mismatches:
    print(f"\n[FALLO] {len(mismatches)} discrepancias:")
    for m in mismatches[:40]:
        print("  -", m)
    if len(mismatches) > 40:
        print(f"  … y {len(mismatches) - 40} mas")
    sys.exit(1)
print("[OK] Ningun monto del dashboard contradice los estados financieros originales.")
