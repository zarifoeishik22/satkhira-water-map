#!/usr/bin/env python3
"""Turn a KoBo survey export (.xlsx) into the public map's data files.

Usage:  python3 build_data.py  <kobo_export.xlsx>  <output_folder>

Writes data.js (loaded by index.html) and data.geojson (open in ArcGIS Pro / QGIS).
Only the whitelisted fields below are written. Caretaker name and phone, cost,
photos, enumerator and free-text notes are never copied.
Organisation names are shortened using tools/org_names.csv (edit that file, not the code).
"""
import sys, json, csv, os, unicodedata
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
TECH = {"RO plant": "RO", "Rainwater harvesting facility (RWHS)": "RWH",
        "Pond sand filter (PSF)": "PSF", "Reservoir": "RES"}
STATUS = {"Operational": "O", "Non-functional": "N", "Abandoned": "A", "Under construction": "C"}
FLOW = "Enumerator-observed functionality indicators/Water flowing/available at time of visit"
LITRES = "How many litres of water does the plant produce per day?"
PEOPLE = "How many people does it serve?"
OTHER_SOURCE = {"বৃষ্টির পানি": "Rainwater"}
OTHER_OM = {"ব্যক্তিগত": "Private", "school fund": "School fund", "প্লান্ট এখনো চালু হয়নি": "Not yet operating"}

def load_rules():
    rules = []
    with open(os.path.join(HERE, "org_names.csv"), encoding="utf-8") as f:
        for line in f:
            if not line.strip() or line.startswith("#") or line.startswith("match,"): continue
            m, _, s = line.rstrip("\n").partition(",")
            rules.append((unicodedata.normalize('NFC', m.strip()).lower(), s.strip()))
    return rules

RULES = load_rules()
UNMAPPED = set()

def short(raw):
    """Return a short organisation name, 'SELF', or None for N/A."""
    if raw is None or (isinstance(raw, float) and pd.isna(raw)): return None
    t = unicodedata.normalize('NFC', " ".join(str(raw).split()))
    if not t: return None
    low = t.lower()
    for m, s in RULES:
        if m in low: return (s or None)
    UNMAPPED.add(t)
    return t

def clean(v):
    return None if v is None or (isinstance(v, float) and pd.isna(v)) else " ".join(str(v).split()) or None

def number(v):
    try:
        x = float(v)
        return int(round(x)) if x > 0 else None
    except Exception:
        return None

def main(src, out):
    df = pd.read_excel(src)
    df.columns = [str(c).strip() for c in df.columns]
    feats, skipped = [], []
    for i, r in df.iterrows():
        t = TECH.get(r.get("Intervention type")); s = STATUS.get(r.get("Current status"))
        try: lat, lon = float(r["Y"]), float(r["X"])
        except Exception: skipped.append((i, "no coordinates")); continue
        if t is None: skipped.append((i, f"technology not mapped: {r.get('Intervention type')}")); continue
        if s is None: skipped.append((i, f"status not mapped: {r.get('Current status')}")); continue
        if not (20 < lat < 27 and 87 < lon < 93): skipped.append((i, "coordinates outside Bangladesh")); continue

        # build date: month and year only when the month is known, year only when approximate
        known = str(r.get("Is the commissioning date known?", ""))
        d = pd.to_datetime(r.get("Commissioning date"), errors="coerce")
        y = int(d.year) if pd.notna(d) and not known.startswith("Not") else None
        m = int(d.month) if y and known.startswith("Exact") else None

        # source water
        sw = clean(r.get("Source water type"))
        if sw and sw.lower() == "rainwater": sw = "Rainwater"
        if sw == "Other":
            o = clean(r.get('If "Other", specify.1'))
            sw = OTHER_SOURCE.get(o, o) if o else None

        # O&M / tariff
        om = clean(r.get("O&M / tariff model"))
        if om == "User-fee": om = "User fee"
        elif om == "Unclear": om = None
        elif om == "Other":
            o = clean(r.get('If "Other", specify.2'))
            om = OTHER_OM.get((o or "").lower(), OTHER_OM.get(o or "", o)) if o else "Other"

        # supported by (funded by): Self, a named organisation, or both
        fb = str(r.get("Funded by", ""))
        parts = []
        if "Self-funded" in fb: parts.append("Self")
        nm = short(r.get("Please type the name of the funding organisation"))
        if nm and nm != "SELF" and nm not in parts: parts.append(nm)
        sup = " + ".join(parts) if parts else None
        imp = short(r.get("Implementing organisation(s)"))
        if imp == "SELF": imp = "Self"

        code = str(r.get("Site code", "")).split("-")[-1].upper() or f"R{i:04d}"
        feats.append({"type": "Feature",
            "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]},
            "properties": {"id": "SAT-" + code, "t": t, "s": s, "u": clean(r.get("Union")) or "", "y": y, "m": m,
                           "src": sw, "out": number(r.get(LITRES)) if t == "RO" else None, "pop": number(r.get(PEOPLE)),
                           "sup": sup, "imp": imp, "om": om,
                           "w": int(r[FLOW]) if FLOW in df.columns and pd.notna(r[FLOW]) else None}})
    gj = {"type": "FeatureCollection", "features": feats}
    with open(f"{out}/data.geojson", "w", encoding="utf-8") as f: json.dump(gj, f, separators=(",", ":"), ensure_ascii=False)
    with open(f"{out}/data.js", "w", encoding="utf-8") as f: f.write("window.WGM_DATA=" + json.dumps(gj, separators=(",", ":"), ensure_ascii=False) + ";\n")
    print(f"{len(feats)} assets written, {len(skipped)} skipped")
    for k in skipped: print("  skipped row", k)
    if UNMAPPED:
        print("Organisation names shown exactly as typed (add them to tools/org_names.csv to shorten or hide):")
        for u in sorted(UNMAPPED): print("  ", u)

if __name__ == "__main__":
    if len(sys.argv) != 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
