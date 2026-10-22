#!/usr/bin/env python3
"""Turn a KoBo survey export (.xlsx) into the public map's data files.

Usage:  python3 build_data.py  <kobo_export.xlsx>  <output_folder>

Writes data.js (loaded by index.html) and data.geojson (open in ArcGIS Pro / QGIS).
Only the whitelisted fields below are ever written. Funder, implementer, caretaker
name and phone, cost, photos, enumerator and free-text notes are never copied.
"""
import sys, json, re
import pandas as pd

TECH = {"RO plant": "RO", "Rainwater harvesting facility (RWHS)": "RWH",
        "Pond sand filter (PSF)": "PSF", "Reservoir": "RES"}
STATUS = {"Operational": "O", "Non-functional": "N", "Abandoned": "A", "Under construction": "C"}
FLOW = "Enumerator-observed functionality indicators/Water flowing/available at time of visit"

def main(src, out):
    df = pd.read_excel(src)
    df.columns = [str(c).strip() for c in df.columns]
    feats, skipped = [], []
    for i, r in df.iterrows():
        t = TECH.get(r.get("Intervention type"))
        s = STATUS.get(r.get("Current status"))
        try:
            lat, lon = float(r["Y"]), float(r["X"])
        except Exception:
            skipped.append((i, "no coordinates")); continue
        if t is None:
            skipped.append((i, f"technology not mapped: {r.get('Intervention type')}")); continue
        if s is None:
            skipped.append((i, f"status not mapped: {r.get('Current status')}")); continue
        if not (20 < lat < 27 and 87 < lon < 93):
            skipped.append((i, "coordinates outside Bangladesh")); continue
        d = pd.to_datetime(r.get("Commissioning date"), errors="coerce")
        code = str(r.get("Site code", "")).split("-")[-1].upper() or f"R{i:04d}"
        feats.append({"type": "Feature",
            "geometry": {"type": "Point", "coordinates": [round(lon, 5), round(lat, 5)]},
            "properties": {"id": "SAT-" + code, "t": t, "s": s, "u": str(r.get("Union", "")).strip(),
                           "y": int(d.year) if pd.notna(d) else None,
                           "w": int(r[FLOW]) if FLOW in df.columns and pd.notna(r[FLOW]) else None}})
    gj = {"type": "FeatureCollection", "features": feats}
    with open(f"{out}/data.geojson", "w") as f: json.dump(gj, f, separators=(",", ":"))
    with open(f"{out}/data.js", "w") as f: f.write("window.WGM_DATA=" + json.dumps(gj, separators=(",", ":")) + ";\n")
    print(f"{len(feats)} assets written, {len(skipped)} skipped")
    for k in skipped: print("  skipped row", k)

if __name__ == "__main__":
    if len(sys.argv) != 3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
