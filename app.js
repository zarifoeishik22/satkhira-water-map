(function () {
  "use strict";
  var CFG = window.WGM_CONFIG, FEATS = window.WGM_DATA.features;
  var TECH = ["RO", "RWH", "PSF", "RES"], STAT = ["O", "N", "A", "C"];
  var COL = { O: "#1a8f4c", N: "#d1342a", A: "#d1342a", C: "#7d8a8f", X: "#44555b" };
  var WALK = [CFG.walk.loaded, CFG.walk.unloaded];

  var I18N = {
    en: {
      tech: { RO: "RO plant", RWH: "Rainwater harvesting", PSF: "Pond sand filter", RES: "Reservoir" },
      stat: { O: "Working", N: "Not working", A: "Abandoned", C: "Under construction" },
      h_range: "Walking range", l_layer: "Show range of", o_off: "Off", o_all: "All technologies",
      d_loaded: "15 min carrying water (800 m)", d_unloaded: "15 min unloaded (1,250 m)", d_both: "Show both",
      c_working: "Count working facilities only", h_tech: "Technology", h_status: "Status", h_base: "Basemap",
      b_street: "Street", b_sat: "Satellite", h_about: "About this map",
      a_1: "Each symbol is a community water facility recorded in a field survey. Shape shows the technology. Green with a tick means working, red with a cross means not working or abandoned, grey means under construction.",
      a_2: "Status is what was recorded on the survey date and may have changed since. Walking ranges are straight-line distances at assumed speeds of 3.2 km/h carrying water and 5 km/h unloaded. Real paths are usually longer.",
      a_3: "The map shows what exists, not who is responsible for it. Household tube wells are not included.",
      contact: "To report a correction, contact ", tog_open: "Hide", tog_closed: "Filters",
      p_union: "Union", p_built: "Built", p_water: "Water at visit", p_yes: "Flowing", p_no: "Not flowing", p_unknown: "Unknown",
      p_within: "Same type within", p_nearest: "Nearest of same type", p_none: "none", p_working: "working", p_id: "ID", p_m: "m",
      any: "water facility", workingWord: "working ",
      summary: function (n, w) { return n + " shown · " + w + " working"; },
      caption: function (w, t) { return "Shaded: within a 15 minute walk of a " + w + t + "."; }
    },
    bn: {
      tech: { RO: "আরও (RO) প্ল্যান্ট", RWH: "বৃষ্টির পানি সংরক্ষণ", PSF: "পুকুর বালু ফিল্টার", RES: "জলাধার" },
      stat: { O: "চালু", N: "অচল", A: "পরিত্যক্ত", C: "নির্মাণাধীন" },
      h_range: "হাঁটার দূরত্ব", l_layer: "যার দূরত্ব দেখাবেন", o_off: "বন্ধ", o_all: "সব প্রযুক্তি",
      d_loaded: "পানি বহন করে ১৫ মিনিট (৮০০ মিটার)", d_unloaded: "খালি হাতে ১৫ মিনিট (১,২৫০ মিটার)", d_both: "দুটিই দেখান",
      c_working: "শুধু চালু সুবিধা গণনা করুন", h_tech: "প্রযুক্তি", h_status: "অবস্থা", h_base: "ব্যাকগ্রাউন্ড",
      b_street: "রাস্তা", b_sat: "স্যাটেলাইট", h_about: "এই মানচিত্র সম্পর্কে",
      a_1: "প্রতিটি চিহ্ন মাঠ জরিপে নথিভুক্ত একটি কমিউনিটি পানি সুবিধা। আকার প্রযুক্তি বোঝায়। সবুজ ও টিক চিহ্ন মানে চালু, লাল ও ক্রস চিহ্ন মানে অচল বা পরিত্যক্ত, ধূসর মানে নির্মাণাধীন।",
      a_2: "অবস্থা জরিপের দিনে যেমন ছিল তেমন; পরে বদলে থাকতে পারে। হাঁটার দূরত্ব সরলরেখায় হিসাব করা, ধরা হয়েছে পানি বহন করে ঘণ্টায় ৩.২ কিমি এবং খালি হাতে ৫ কিমি। বাস্তবে পথ সাধারণত আরও দীর্ঘ।",
      a_3: "মানচিত্রটি দেখায় কী আছে, কে দায়ী তা নয়। পরিবারভিত্তিক নলকূপ এতে নেই।",
      contact: "সংশোধনের জন্য যোগাযোগ: ", tog_open: "লুকান", tog_closed: "ফিল্টার",
      p_union: "ইউনিয়ন", p_built: "নির্মাণ", p_water: "পরিদর্শনের সময় পানি", p_yes: "পাওয়া গেছে", p_no: "পাওয়া যায়নি", p_unknown: "অজানা",
      p_within: "একই ধরনের, দূরত্বের মধ্যে", p_nearest: "নিকটতম একই ধরন", p_none: "নেই", p_working: "চালু", p_id: "আইডি", p_m: "মিটার",
      any: "পানি সুবিধা", workingWord: "চালু ",
      summary: function (n, w) { return n + "টি দেখানো হচ্ছে · " + w + "টি চালু"; },
      caption: function (w, t) { return "ছায়াঙ্কিত অংশ: " + w + t + " থেকে ১৫ মিনিট হাঁটার মধ্যে।"; }
    }
  };
  var UNION_BN = { "Budhhata": "বুধহাটা", "Assasuni Sadar": "আশাশুনি সদর", "Borodol": "বড়দল", "Dargahpur": "দরগাহপুর",
    "Khajra": "খাজরা", "Sreeula": "শ্রীউলা", "Shovnali": "শোভনালী", "Anulia": "আনুলিয়া", "Protapnagar": "প্রতাপনগর" };

  var lang = "en";
  try { var sv = localStorage.getItem("wgm_lang"); if (sv === "bn" || sv === "en") lang = sv; else if ((navigator.language || "").indexOf("bn") === 0) lang = "bn"; } catch (e) {}
  var T = function () { return I18N[lang]; };
  var num = function (n) { var s = Number(n).toLocaleString("en"); return lang === "bn" ? s.replace(/\d/g, function (d) { return "০১২৩৪৫৬৭৮৯"[d]; }) : s; };

  /* ---------- data ---------- */
  var lat0 = 0, lon0 = 0;
  FEATS.forEach(function (f) { lon0 += f.geometry.coordinates[0]; lat0 += f.geometry.coordinates[1]; });
  lon0 /= FEATS.length; lat0 /= FEATS.length;
  var kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110574;
  var ASSETS = FEATS.map(function (f) {
    var p = f.properties, c = f.geometry.coordinates;
    return { id: p.id, t: p.t, s: p.s, u: p.u, y: p.y, w: p.w, lon: c[0], lat: c[1], x: (c[0] - lon0) * kx, yy: (c[1] - lat0) * ky };
  });

  /* ---------- symbols ---------- */
  function glyph(s, gy, sc) {
    var g = "";
    if (s === "O") g = '<path d="M-4.5 0.5 L-1.2 3.8 L4.6 -3" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
    else if (s === "N" || s === "A") g = '<path d="M-3.6 -3.6 L3.6 3.6 M3.6 -3.6 L-3.6 3.6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>';
    else if (s === "C") g = '<circle cx="-4" r="1.5" fill="#fff"/><circle r="1.5" fill="#fff"/><circle cx="4" r="1.5" fill="#fff"/>';
    return g ? '<g transform="translate(14 ' + gy + ') scale(' + sc + ')">' + g + "</g>" : "";
  }
  function iconSVG(t, s, size) {
    var shape, gy = 14, sc = 1, attr = ' fill="' + COL[s] + '" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>';
    if (t === "RO") shape = '<circle cx="14" cy="14" r="11.5"' + attr;
    else if (t === "RWH") shape = '<rect x="3" y="3" width="22" height="22" rx="3"' + attr;
    else if (t === "PSF") { shape = '<path d="M14 2.5 L26.5 24.5 H1.5 Z"' + attr; gy = 17.5; sc = 0.82; }
    else { shape = '<path d="M14 1.5 L26.5 14 L14 26.5 L1.5 14 Z"' + attr; sc = 0.9; }
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 28 28" aria-hidden="true">' + shape + glyph(s, gy, sc) + "</svg>";
  }

  /* ---------- map ---------- */
  var map = L.map("map", { zoomSnap: 0.25, minZoom: 9, maxZoom: 19 });
  var base = {};
  Object.keys(CFG.basemaps).forEach(function (k) {
    var b = CFG.basemaps[k];
    base[k] = L.tileLayer(b.url, { maxZoom: b.maxZoom, maxNativeZoom: b.maxZoom, attribution: b.attribution });
  });
  var curBase = CFG.defaultBasemap; base[curBase].addTo(map);
  var bounds = L.latLngBounds(ASSETS.map(function (a) { return [a.lat, a.lon]; }));
  map.fitBounds(bounds, { padding: [34, 34] });

  /* merged walking-range layer: one canvas, circles unioned so overlaps do not stack */
  var Cov = L.Layer.extend({
    initialize: function () { this.pts = []; this.radii = []; },
    onAdd: function (m) {
      this._map = m;
      if (!m.getPane("cov")) { var p = m.createPane("cov"); p.style.zIndex = 450; p.style.pointerEvents = "none"; }
      this._c = L.DomUtil.create("canvas", "wgm-cov leaflet-zoom-hide");
      m.getPane("cov").appendChild(this._c);
      this._t = document.createElement("canvas");
      m.on("move zoom resize viewreset", this._sched, this);
      this._draw();
    },
    onRemove: function (m) { m.off("move zoom resize viewreset", this._sched, this); L.DomUtil.remove(this._c); },
    set: function (pts, radii) { this.pts = pts; this.radii = radii; if (this._map) this._draw(); },
    _sched: function () { var s = this; if (s._raf) return; s._raf = requestAnimationFrame(function () { s._raf = 0; s._draw(); }); },
    _draw: function () {
      var m = this._map, sz = m.getSize(), dpr = window.devicePixelRatio || 1, c = this._c, t = this._t;
      c.width = sz.x * dpr; c.height = sz.y * dpr; c.style.width = sz.x + "px"; c.style.height = sz.y + "px";
      L.DomUtil.setPosition(c, m.containerPointToLayerPoint([0, 0]));
      var ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, sz.x, sz.y);
      if (!this.pts.length) return;
      var mpp = 40075016.686 * Math.cos(lat0 * Math.PI / 180) / (256 * Math.pow(2, m.getZoom()));
      var P = this.pts.map(function (p) { return m.latLngToContainerPoint([p.lat, p.lon]); });
      t.width = sz.x * dpr; t.height = sz.y * dpr;
      var tc = t.getContext("2d"); tc.setTransform(dpr, 0, 0, dpr, 0, 0);
      function circles(r, col) { tc.fillStyle = col; tc.beginPath(); P.forEach(function (q) { tc.moveTo(q.x + r, q.y); tc.arc(q.x, q.y, r, 0, 6.2832); }); tc.fill(); }
      this.radii.forEach(function (R) {
        var r = R / mpp;
        tc.globalCompositeOperation = "source-over"; tc.clearRect(0, 0, sz.x, sz.y); circles(r, "#2f6fb0");
        ctx.globalAlpha = 0.3; ctx.drawImage(t, 0, 0, sz.x, sz.y);
        tc.clearRect(0, 0, sz.x, sz.y); circles(r + 1.25, "#1f4f86");
        tc.globalCompositeOperation = "destination-out"; circles(Math.max(0, r - 1.25), "#000");
        ctx.globalAlpha = 0.9; ctx.drawImage(t, 0, 0, sz.x, sz.y);
      });
      ctx.globalAlpha = 1;
    }
  });
  function sizeClass() { map.getContainer().classList.toggle("wgm-small", map.getZoom() < 13); }
  map.on("zoomend", sizeClass); sizeClass();
  var cov = new Cov().addTo(map);
  var ring = L.layerGroup().addTo(map);

  /* ---------- state ---------- */
  var tech = new Set(TECH), stat = new Set(STAT);
  var markers = L.layerGroup().addTo(map);

  function dist(a, b) { var dx = a.x - b.x, dy = a.yy - b.yy; return Math.sqrt(dx * dx + dy * dy); }

  function popupHTML(a) {
    var tr = T(), same = ASSETS.filter(function (b) { return b !== a && b.t === a.t; });
    var rows = WALK.map(function (R) {
      var n = same.filter(function (b) { return dist(a, b) <= R; }), w = n.filter(function (b) { return b.s === "O"; }).length;
      return "<dt>" + tr.p_within + " " + num(R) + " " + tr.p_m + "</dt><dd>" + (n.length ? num(n.length) + " · " + num(w) + " " + tr.p_working : tr.p_none) + "</dd>";
    }).join("");
    var nearest = same.length ? Math.round(Math.min.apply(null, same.map(function (b) { return dist(a, b); }))) : null;
    var water = a.w === 1 ? tr.p_yes : a.w === 0 ? tr.p_no : tr.p_unknown;
    var union = lang === "bn" && UNION_BN[a.u] ? UNION_BN[a.u] : a.u;
    return '<div class="pop"><h3>' + tr.tech[a.t] + '</h3><span class="badge" style="background:' + COL[a.s] + '">' + tr.stat[a.s] + "</span>" +
      "<dl><dt>" + tr.p_union + "</dt><dd>" + union + "</dd><dt>" + tr.p_built + "</dt><dd>" + (a.y ? (lang === "bn" ? num(a.y).replace(/,/g, "") : a.y) : tr.p_unknown) +
      "</dd><dt>" + tr.p_water + "</dt><dd>" + water + "</dd></dl>" +
      '<div class="sep"><dl>' + rows + "<dt>" + tr.p_nearest + "</dt><dd>" + (nearest === null ? tr.p_none : num(nearest) + " " + tr.p_m) + "</dd></dl></div>" +
      '<div class="id">' + tr.p_id + ": " + a.id + "</div></div>";
  }

  function buildMarkers() {
    markers.clearLayers();
    ASSETS.forEach(function (a) {
      if (!tech.has(a.t) || !stat.has(a.s)) return;
      var m = L.marker([a.lat, a.lon], {
        icon: L.divIcon({ className: "wgm-pin", html: iconSVG(a.t, a.s, 28), iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] }),
        title: T().tech[a.t] + ", " + T().stat[a.s], riseOnHover: true
      });
      m.bindPopup(function () { return popupHTML(a); }, { maxWidth: 300 });
      m.on("popupopen", function () {
        ring.clearLayers();
        WALK.forEach(function (R) { L.circle([a.lat, a.lon], { radius: R, color: "#16262c", weight: 1.5, dashArray: "5 4", fill: false, interactive: false }).addTo(ring); });
      });
      m.on("popupclose", function () { ring.clearLayers(); });
      markers.addLayer(m);
    });
    var shown = ASSETS.filter(function (a) { return tech.has(a.t) && stat.has(a.s); });
    document.getElementById("summary").textContent = T().summary(num(shown.length), num(shown.filter(function (a) { return a.s === "O"; }).length));
  }

  function updateCoverage() {
    var layer = document.getElementById("layer").value, working = document.getElementById("working").checked;
    var d = document.querySelector('input[name="dist"]:checked').value;
    var cap = document.getElementById("cap");
    if (layer === "off") { cov.set([], []); cap.innerHTML = ""; return; }
    var pts = ASSETS.filter(function (a) { return (layer === "all" || a.t === layer) && (!working || a.s === "O"); });
    cov.set(pts, d === "loaded" ? [WALK[0]] : d === "unloaded" ? [WALK[1]] : [WALK[1], WALK[0]]);
    var tr = T();
    cap.innerHTML = '<span class="swatch"></span>' + tr.caption(working ? tr.workingWord : "", layer === "all" ? tr.any : tr.tech[layer]);
  }

  /* ---------- panel ---------- */
  function buildLists() {
    var tr = T(), tl = document.getElementById("techs"), sl = document.getElementById("stats");
    tl.innerHTML = ""; sl.innerHTML = "";
    TECH.forEach(function (k) {
      var n = ASSETS.filter(function (a) { return a.t === k; }).length; if (!n) return;
      var l = document.createElement("label");
      l.innerHTML = '<input type="checkbox" data-t="' + k + '"' + (tech.has(k) ? " checked" : "") + ">" + iconSVG(k, "X", 20) + "<span>" + tr.tech[k] + '</span><span class="n">' + num(n) + "</span>";
      tl.appendChild(l);
    });
    STAT.forEach(function (k) {
      var n = ASSETS.filter(function (a) { return a.s === k; }).length; if (!n) return;
      var l = document.createElement("label");
      l.innerHTML = '<input type="checkbox" data-s="' + k + '"' + (stat.has(k) ? " checked" : "") + ">" + iconSVG("RO", k, 20) + "<span>" + tr.stat[k] + '</span><span class="n">' + num(n) + "</span>";
      sl.appendChild(l);
    });
  }
  function applyLang() {
    var tr = T();
    document.documentElement.lang = lang;
    document.getElementById("t_title").textContent = CFG.title[lang];
    document.getElementById("t_area").textContent = CFG.area[lang];
    document.getElementById("t_surveyed").textContent = CFG.surveyed[lang];
    document.title = CFG.title[lang];
    document.querySelectorAll("[data-i]").forEach(function (el) { el.textContent = tr[el.getAttribute("data-i")]; });
    var sel = document.getElementById("layer");
    TECH.forEach(function (k) { sel.querySelector('option[value="' + k + '"]').textContent = tr.tech[k]; });
    document.getElementById("lang_en").setAttribute("aria-pressed", lang === "en");
    document.getElementById("lang_bn").setAttribute("aria-pressed", lang === "bn");
    var ct = document.getElementById("contact");
    if (CFG.contact) { ct.hidden = false; ct.textContent = tr.contact + CFG.contact; } else ct.hidden = true;
    setToggleLabel();
    buildLists(); buildMarkers(); updateCoverage(); map.closePopup();
  }
  var panel = document.getElementById("panel"), toggle = document.getElementById("toggle");
  function setToggleLabel() {
    var closed = panel.classList.contains("closed");
    toggle.textContent = closed ? T().tog_closed : T().tog_open;
    toggle.setAttribute("aria-expanded", String(!closed));
  }
  toggle.addEventListener("click", function () { panel.classList.toggle("closed"); setToggleLabel(); setTimeout(function () { map.invalidateSize(); }, 50); });
  if (window.matchMedia("(max-width:760px)").matches) { panel.classList.add("closed"); setTimeout(function () { map.invalidateSize(); map.fitBounds(bounds, { padding: [24, 24] }); }, 50); }

  document.getElementById("techs").addEventListener("change", function (e) { var k = e.target.getAttribute("data-t"); if (!k) return; e.target.checked ? tech.add(k) : tech.delete(k); buildMarkers(); });
  document.getElementById("stats").addEventListener("change", function (e) { var k = e.target.getAttribute("data-s"); if (!k) return; e.target.checked ? stat.add(k) : stat.delete(k); buildMarkers(); });
  ["layer", "working"].forEach(function (id) { document.getElementById(id).addEventListener("change", updateCoverage); });
  document.querySelectorAll('input[name="dist"]').forEach(function (r) { r.addEventListener("change", updateCoverage); });
  document.querySelectorAll('input[name="base"]').forEach(function (r) {
    r.addEventListener("change", function () { if (!r.checked) return; map.removeLayer(base[curBase]); curBase = r.value; base[curBase].addTo(map); });
  });
  function setLang(l) { lang = l; try { localStorage.setItem("wgm_lang", l); } catch (e) {} applyLang(); }
  document.getElementById("lang_en").addEventListener("click", function () { setLang("en"); });
  document.getElementById("lang_bn").addEventListener("click", function () { setLang("bn"); });
  document.getElementById("layer").value = "RO";
  applyLang();
})();
