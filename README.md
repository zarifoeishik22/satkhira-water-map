# Satkhira Water Governance Map (public viewer)

Static website. No server, no database, no account needed to run it.

## Files
| File | Purpose |
|---|---|
| `index.html`, `app.js`, `style.css` | The map |
| `config.js` | Titles, survey dates, correction contact, default radii, basemaps. Edit this, not the code |
| `data.js` | The map's data (sanitised). Regenerate for every update |
| `data.geojson` | Same data for ArcGIS Pro / QGIS |
| `vendor/leaflet/` | Map library, stored locally so nothing depends on a CDN |
| `tools/build_data.py` | Builds `data.js` and `data.geojson` from a KoBo export |
| `tools/org_names.csv` | Short names for funders and implementers (Bangla and English spellings). Edit this to fix or hide a name |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | Blue water drop tab icon |

## What a tap does
Tap a facility: the popup shows its details and how many facilities of the same technology sit within the radius (default 1,000 m, slider 250 to 1,500 m). The circle is drawn, matching facilities are highlighted with lines, and everything else is dimmed. The side panel lists them with distance and status.
"Check a location" drops a draggable circle on empty ground, with a technology picker. If no surveyed facility is within `surveyRadius` (config.js, default 1,500 m) a warning says the area may not be surveyed.
`surveyRadius` is a proxy. Replace it with the real upazila boundary polygon when you have one.

## Preview on your computer
Double-click `index.html`. The basemap needs internet. Or run `python3 -m http.server` in this folder and open http://localhost:8000.

## Publish (pick one, all free)
1. **Netlify Drop** (fastest): go to app.netlify.com/drop and drag this whole folder onto the page. You get a link at once. Create the account under an organisational email, not a personal one.
2. **Cloudflare Pages**: Workers & Pages, Create, Upload assets, upload the folder.
3. **GitHub Pages**: create a repository under an organisation account, upload the files, Settings, Pages, deploy from the main branch.

Use a custom domain held by an institution if you can. The map then outlives any one person's login.

## Update the data
`python3 tools/build_data.py <kobo_export.xlsx> .` then re-upload `data.js` and `data.geojson`. Fields written: ID (derived from the site code), technology, status, union, build month and year, water source, output (L/day), users, supported by, implemented by, O&M model, water observed at visit, coordinates. Caretaker name and phone, cost, photos, enumerator and notes are never copied. Funder and implementer names ARE public in `data.js` and `data.geojson`.
The script skips rows with a technology it does not map (for example "Other") and prints them.

## Assumptions to confirm before launch
- Ranges and nearby counts are straight-line, not path-based.
- Organisation short names (including English forms of Bangla names) were written by Claude. Review `tools/org_names.csv`.
- Basemaps: OpenStreetMap standard tiles suit low traffic (see their tile usage policy). The satellite option uses Esri World Imagery: check Esri's terms for your use. If traffic grows, switch to a provider with a key by editing `basemaps` in `config.js`.
- Distances are straight-line and the counts show what was surveyed, not demand or population. Keep the neutral wording.
- `contact` in `config.js` is empty, so the correction line is hidden. Add an address before launch.
