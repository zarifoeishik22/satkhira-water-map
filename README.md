# Satkhira Water Governance Map (public viewer)

Static website. No server, no database, no account needed to run it.

## Files
| File | Purpose |
|---|---|
| `index.html`, `app.js`, `style.css` | The map |
| `config.js` | Titles, survey dates, correction contact, walking distances, basemaps. Edit this, not the code |
| `data.js` | The map's data (sanitised). Regenerate for every update |
| `data.geojson` | Same data for ArcGIS Pro / QGIS |
| `vendor/leaflet/` | Map library, stored locally so nothing depends on a CDN |
| `tools/build_data.py` | Builds `data.js` and `data.geojson` from a KoBo export |

## Preview on your computer
Double-click `index.html`. The basemap needs internet. Or run `python3 -m http.server` in this folder and open http://localhost:8000.

## Publish (pick one, all free)
1. **Netlify Drop** (fastest): go to app.netlify.com/drop and drag this whole folder onto the page. You get a link at once. Create the account under an organisational email, not a personal one.
2. **Cloudflare Pages**: Workers & Pages, Create, Upload assets, upload the folder.
3. **GitHub Pages**: create a repository under an organisation account, upload the files, Settings, Pages, deploy from the main branch.

Use a custom domain held by an institution if you can. The map then outlives any one person's login.

## Update the data
`python3 tools/build_data.py <kobo_export.xlsx> .` then re-upload `data.js` and `data.geojson`. Only these fields are ever written: ID (derived from the site code), technology, status, union, year built, water observed at visit, coordinates. Funder, implementer, caretaker name and phone, cost, photos, enumerator and notes are never copied.
The script skips rows with a technology it does not map (for example "Other") and prints them.

## Assumptions to confirm before launch
- Walking range: 800 m = 15 min at 3.2 km/h carrying water; 1,250 m = 15 min at 5 km/h. These speeds are assumptions. Replace with a cited value in `config.js` and the text in `app.js` if you have one.
- Ranges are straight-line, not path-based.
- Bangla wording was written by Claude and needs review by a native reader.
- Basemaps: OpenStreetMap standard tiles suit low traffic (see their tile usage policy). The satellite option uses Esri World Imagery: check Esri's terms for your use. If traffic grows, switch to a provider with a key by editing `basemaps` in `config.js`.
- `contact` in `config.js` is empty, so the correction line is hidden. Add an address before launch.
