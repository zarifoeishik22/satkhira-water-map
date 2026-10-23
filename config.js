/* Edit this file to change wording, dates, radius defaults or basemaps.
   For a routine update only data.js needs to change. */
window.WGM_CONFIG = {
  title: "Satkhira Water Governance Map",
  area: "Assasuni upazila",
  surveyed: "Survey: 17 Sep to 17 Oct 2026",
  // Email or web address shown for corrections. Leave "" to hide the line.
  contact: "",
  // A "Check a location" circle further than this (metres) from every surveyed facility triggers a "may not be surveyed" warning.
  surveyRadius: 1500,
  // Default radius (metres). One radius drives both the nearby circle and the range shading.
  radius: 800,
  basemaps: {
    street:    { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", maxZoom: 19,
                 attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" },
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", maxZoom: 18,
                 attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics" }
  },
  defaultBasemap: "street"
};
