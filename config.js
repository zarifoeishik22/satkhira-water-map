/* Edit this file to change wording, dates, walking distances or basemaps.
   Nothing else needs touching for a routine update (new data.js is all you need). */
window.WGM_CONFIG = {
  title:    { en: "Satkhira Water Governance Map", bn: "সাতক্ষীরা পানি ব্যবস্থাপনা মানচিত্র" },
  area:     { en: "Assasuni upazila", bn: "আশাশুনি উপজেলা" },
  surveyed: { en: "Survey: 17 Sep to 17 Oct 2026", bn: "জরিপ: ১৭ সেপ্টেম্বর থেকে ১৭ অক্টোবর ২০২৬" },
  // Email or web address shown for corrections. Leave "" to hide the line.
  contact: "",
  // Walking range in metres. 800 m = 15 min at 3.2 km/h (carrying water); 1250 m = 15 min at 5 km/h (unloaded).
  walk: { loaded: 800, unloaded: 1250 },
  basemaps: {
    street:    { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", maxZoom: 19,
                 attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" },
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", maxZoom: 18,
                 attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics" }
  },
  defaultBasemap: "street"
};
