(function () {
  "use strict";
  var CFG = window.WGM_CONFIG, FEATS = window.WGM_DATA.features;
  var TECH = ["RO", "RWH", "PSF", "RES"], STAT = ["O", "N", "A", "C"];
  var TECH_NAME = { RO: "RO plant", RWH: "Rainwater harvesting", PSF: "Pond sand filter", RES: "Reservoir" };
  var STAT_NAME = { O: "Working", N: "Not working", A: "Abandoned", C: "Under construction" };
  var COL = { O: "#1f9d55", N: "#e8890c", A: "#d1342a", C: "#7d8a8f", X: "#44555b" };
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var NA = "N/A";

  var num = function (n) { return Number(n).toLocaleString("en"); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var val = function (v) { return v === null || v === undefined || v === "" ? NA : esc(v); };

  /* ---------- data ---------- */
  var lat0 = 0, lon0 = 0;
  FEATS.forEach(function (f) { lon0 += f.geometry.coordinates[0]; lat0 += f.geometry.coordinates[1]; });
  lon0 /= FEATS.length; lat0 /= FEATS.length;
  var kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110574;
  var ASSETS = FEATS.map(function (f) {
    var p = f.properties, c = f.geometry.coordinates;
    return { id: p.id, t: p.t, s: p.s, u: p.u, y: p.y, m: p.m, src: p.src, out: p.out, pop: p.pop, sup: p.sup, imp: p.imp, om: p.om, w: p.w,
             lon: c[0], lat: c[1], x: (c[0] - lon0) * kx, yy: (c[1] - lat0) * ky };
  });
  var xy = function (lat, lon) { return { x: (lon - lon0) * kx, yy: (lat - lat0) * ky }; };
  function dist(a, b) { var dx = a.x - b.x, dy = a.yy - b.yy; return Math.sqrt(dx * dx + dy * dy); }

  /* ---------- symbols: shape = technology, colour = status ---------- */
  function iconSVG(t, s, size) {
    var shape, attr = ' fill="' + COL[s] + '" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>';
    if (t === "RO") shape = '<circle cx="14" cy="14" r="11.5"' + attr;
    else if (t === "RWH") shape = '<rect x="3" y="3" width="22" height="22" rx="3"' + attr;
    else if (t === "PSF") shape = '<path d="M14 2.5 L26.5 24.5 H1.5 Z"' + attr;
    else shape = '<path d="M14 1.5 L26.5 14 L14 26.5 L1.5 14 Z"' + attr;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 28 28" aria-hidden="true">' + shape + "</svg>";
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
  function fit() { map.fitBounds(bounds, { padding: [34, 34] }); }
  fit();

  var FitCtl = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function () {
      var d = L.DomUtil.create("div", "leaflet-bar leaflet-control"), a = L.DomUtil.create("a", "wgm-fit", d);
      a.href = "#"; a.textContent = "Fit"; a.title = "Fit map to all facilities";
      a.setAttribute("role", "button"); a.setAttribute("aria-label", "Fit map to all facilities");
      L.DomEvent.on(a, "click", function (e) { L.DomEvent.stop(e); fit(); });
      L.DomEvent.disableClickPropagation(d);
      return d;
    }
  });
  new FitCtl().addTo(map);

  /* merged range layer: one canvas, circles unioned so overlaps do not stack */
  var Cov = L.Layer.extend({
    initialize: function (o) { this.o = o; this.pts = []; this.radii = []; },
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
      var m = this._map, sz = m.getSize(), dpr = window.devicePixelRatio || 1, c = this._c, t = this._t, o = this.o;
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
        tc.globalCompositeOperation = "source-over"; tc.clearRect(0, 0, sz.x, sz.y); circles(r, o.fill);
        ctx.globalAlpha = o.fa; ctx.drawImage(t, 0, 0, sz.x, sz.y);
        tc.clearRect(0, 0, sz.x, sz.y); circles(r + 1.25, o.edge);
        tc.globalCompositeOperation = "destination-out"; circles(Math.max(0, r - 1.25), "#000");
        ctx.globalAlpha = o.ea; ctx.drawImage(t, 0, 0, sz.x, sz.y);
      });
      ctx.globalAlpha = 1;
    }
  });
  function sizeClass() { map.getContainer().classList.toggle("wgm-small", map.getZoom() < 13); }
  map.on("zoomend", sizeClass); sizeClass();
  var surv = new Cov({ fill: "#8a969a", edge: "#5b6b70", fa: 0.1, ea: 0.7 });
  var cov = new Cov({ fill: "#2f6fb0", edge: "#1f4f86", fa: 0.3, ea: 0.9 }).addTo(map);
  var focus = L.layerGroup().addTo(map);

  /* ---------- state ---------- */
  var tech = new Set(TECH), stat = new Set(STAT);
  var markers = L.layerGroup().addTo(map), byId = {};
  var R = CFG.nearbyRadius || 1000;
  var selA = null, pin = null, pinMarker = null, checking = false, checkTech = "RO";

  function nearList(o, t, excludeId) {
    return ASSETS.filter(function (a) { return a.t === t && a.id !== excludeId; })
      .map(function (a) { return { a: a, d: dist(o, a) }; })
      .sort(function (p, q) { return p.d - q.d; });
  }
  function origin() {
    if (selA) return { o: selA, t: selA.t, ex: selA.id, ll: [selA.lat, selA.lon] };
    if (pin) return { o: xy(pin.lat, pin.lng), t: checkTech, ex: null, ll: [pin.lat, pin.lng] };
    return null;
  }
  function summaryHTML(f0) {
    var f = f0 || origin(); if (!f) return "";
    var all = nearList(f.o, f.t, f.ex), inR = all.filter(function (p) { return p.d <= R; });
    var w = inR.filter(function (p) { return p.a.s === "O"; }).length,
        n = inR.filter(function (p) { return p.a.s === "N"; }).length,
        b = inR.filter(function (p) { return p.a.s === "A"; }).length,
        c = inR.filter(function (p) { return p.a.s === "C"; }).length, parts = [];
    if (w) parts.push(num(w) + " working"); if (n) parts.push(num(n) + " not working"); if (b) parts.push(num(b) + " abandoned"); if (c) parts.push(num(c) + " under construction");
    var html = "<div>Same type (" + TECH_NAME[f.t] + ") within " + num(R) + " m</div><div class='lead'><b>" + (inR.length ? num(inR.length) + "</b> · " + parts.join(" · ") : "None found</b>") + "</div>";
    if (all.length) html += "<div style='color:var(--muted);font-size:12px'>Nearest of same type: " + num(Math.round(all[0].d)) + " m</div>";
    if (pin && !selA && !f0) {
      var near = Math.min.apply(null, ASSETS.map(function (a) { return dist(f.o, a); }));
      if (near > CFG.surveyRadius) html += '<div class="warn">No surveyed facility within ' + num(CFG.surveyRadius) + " m. This area may not be covered by the survey, so finding none here does not mean none exist.</div>";
    }
    return html;
  }
  function listHTML() {
    var f = origin(); if (!f) return "";
    var inR = nearList(f.o, f.t, f.ex).filter(function (p) { return p.d <= R; }), max = 12;
    if (!inR.length) return "";
    return "<ul>" + inR.slice(0, max).map(function (p) {
      return "<li>" + iconSVG(p.a.t, p.a.s, 20) + "<span>" + STAT_NAME[p.a.s] + ", " + esc(p.a.u) + '</span><span class="d">' + num(Math.round(p.d)) + " m</span></li>";
    }).join("") + (inR.length > max ? "<li>+ " + num(inR.length - max) + " more</li>" : "") + "</ul>";
  }
  function refreshReadouts() {
    var sh = summaryHTML(); document.querySelectorAll(".popSum").forEach(function (e) { e.innerHTML = sh; });
    document.querySelectorAll(".popRv").forEach(function (e) { e.textContent = num(R) + " m"; });
    document.getElementById("rv2").textContent = num(R) + " m";
    var nr = document.getElementById("nearres"), f = origin();
    nr.innerHTML = f ? summaryHTML() + listHTML() : "";
    document.querySelectorAll("#rad,#popR").forEach(function (e) { if (+e.value !== R) e.value = R; });
  }
  function applyFocus() {
    focus.clearLayers();
    var f = origin(), ids = {};
    if (f) {
      L.circle(f.ll, { radius: R, color: "#16262c", weight: 1.6, fillColor: "#16262c", fillOpacity: 0.04, interactive: false }).addTo(focus);
      nearList(f.o, f.t, f.ex).forEach(function (p) {
        if (p.d > R) return; ids[p.a.id] = 1;
        L.polyline([f.ll, [p.a.lat, p.a.lon]], { color: "#16262c", weight: 1.2, dashArray: "4 4", opacity: 0.6, interactive: false }).addTo(focus);
      });
      if (selA) ids[selA.id] = 1;
    }
    Object.keys(byId).forEach(function (id) {
      var el = byId[id].getElement(); if (!el) return;
      el.classList.toggle("wgm-near", !!(f && ids[id]));
      el.classList.toggle("wgm-dim", !!(f && !ids[id]));
    });
    refreshReadouts();
  }

  /* ---------- popup ---------- */
  function built(a) { return a.y ? (a.m ? MON[a.m - 1] + " " + a.y : String(a.y)) : NA; }
  function row(k, v) { return "<dt>" + k + "</dt><dd>" + v + "</dd>"; }
  function popupHTML(a) {
    var water = a.w === 1 ? "Flowing" : a.w === 0 ? "Not flowing" : NA;
    return '<div class="pop"><h3>' + TECH_NAME[a.t] + '</h3><span class="badge" style="background:' + COL[a.s] + '">' + STAT_NAME[a.s] + "</span><dl>" +
      row("Union", val(a.u)) + row("Built", built(a)) + row("Water source", val(a.src)) +
      row("Output", a.out ? num(a.out) + " L/day" : NA) + row("Users", a.pop ? num(a.pop) : NA) +
      row("Supported by", val(a.sup)) + row("Implemented by", val(a.imp)) + row("O&amp;M", val(a.om)) +
      row("Water at visit", water) + "</dl>" +
      '<div class="sep"><div class="sum popSum">' + summaryHTML({ o: a, t: a.t, ex: a.id }) + "</div>" + radHTML() + "</div>" +
      '<div class="id">ID: ' + esc(a.id) + "</div></div>";
  }
  function radHTML() {
    return '<div class="rad"><span>Radius</span><b class="popRv"></b></div><input type="range" id="popR" min="250" max="1500" step="50" value="' + R + '" aria-label="Nearby radius in metres">';
  }
  function wirePopup(e) {
    var el = e.popup.getElement(); if (!el) return;
    var r = el.querySelector("#popR"); if (r) r.addEventListener("input", function () { setR(+r.value); });
    var s = el.querySelector("#popT"); if (s) s.addEventListener("change", function () { checkTech = s.value; document.getElementById("ctech").value = checkTech; applyFocus(); });
    refreshReadouts(); e.popup.update();
  }
  function setR(v) { R = v; applyFocus(); }
  var POPOPT = function (w) { return { maxWidth: w, maxHeight: Math.round(window.innerHeight * 0.55), autoPanPadding: [20, 70] }; };

  function buildMarkers() {
    markers.clearLayers(); byId = {};
    ASSETS.forEach(function (a) {
      if (!tech.has(a.t) || !stat.has(a.s)) return;
      var m = L.marker([a.lat, a.lon], {
        icon: L.divIcon({ className: "wgm-pin", html: iconSVG(a.t, a.s, 28), iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] }),
        title: TECH_NAME[a.t] + ", " + STAT_NAME[a.s], riseOnHover: true
      });
      m.bindPopup(function () { return popupHTML(a); }, POPOPT(310));
      m.on("click", function () { setChecking(false); });
      m.on("popupopen", function (e) { selA = a; if (pinMarker || pin) clearPin(); wirePopup(e); applyFocus(); });
      m.on("popupclose", function () { if (selA === a) { selA = null; applyFocus(); } });
      markers.addLayer(m); byId[a.id] = m;
    });
    var shown = ASSETS.filter(function (a) { return tech.has(a.t) && stat.has(a.s); });
    document.getElementById("summary").textContent = num(shown.length) + " shown · " + num(shown.filter(function (a) { return a.s === "O"; }).length) + " working";
    applyFocus();
  }

  /* ---------- check a location ---------- */
  var pinIcon = L.divIcon({ className: "wgm-pin", iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14],
    html: '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="11" fill="#fff" stroke="#16262c" stroke-width="2"/><path d="M15 5v20M5 15h20" stroke="#16262c" stroke-width="2"/><circle cx="15" cy="15" r="3" fill="#16262c"/></svg>' });
  function pinHTML() {
    var opts = TECH.map(function (k) { return '<option value="' + k + '"' + (k === checkTech ? " selected" : "") + ">" + TECH_NAME[k] + "</option>"; }).join("");
    return '<div class="pop"><select id="popT" aria-label="Technology to look for">' + opts + '</select><div class="sum popSum">' + summaryHTML() + "</div>" + radHTML() + "</div>";
  }
  function placePin(ll) {
    selA = null; map.closePopup(); pin = ll;
    if (!pinMarker) {
      pinMarker = L.marker(ll, { icon: pinIcon, draggable: true, zIndexOffset: 1000 }).addTo(map);
      pinMarker.bindPopup(function () { return pinHTML(); }, POPOPT(280));
      pinMarker.on("dragend", function () { pin = pinMarker.getLatLng(); applyFocus(); });
      pinMarker.on("popupopen", function (e) { wirePopup(e); });
    } else pinMarker.setLatLng(ll);
    updateSurvey(); applyFocus(); pinMarker.openPopup(); refreshReadouts();
  }
  function clearPin() { pin = null; if (pinMarker) { map.removeLayer(pinMarker); pinMarker = null; } updateSurvey(); applyFocus(); }
  function updateSurvey() {
    var on = checking || pin;
    if (on) { surv.set(ASSETS, [CFG.surveyRadius]); if (!map.hasLayer(surv)) surv.addTo(map); } else if (map.hasLayer(surv)) map.removeLayer(surv);
  }
  function setChecking(v) {
    checking = v;
    var b = document.getElementById("check"); b.setAttribute("aria-pressed", String(v)); b.textContent = v ? "Tap the map to place a circle" : "Check a location";
    document.getElementById("ctw").hidden = !v && !pin;
    map.getContainer().classList.toggle("map-check", v);
    if (!v && pin && !pinMarker) clearPin();
    updateSurvey();
  }
  map.on("click", function (e) { if (checking) placePin(e.latlng); else if (pin) clearPin(); });
  document.getElementById("check").addEventListener("click", function () {
    if (checking) { setChecking(false); clearPin(); } else { selA = null; map.closePopup(); setChecking(true); }
  });
  document.getElementById("ctech").addEventListener("change", function (e) { checkTech = e.target.value; applyFocus(); });

  /* ---------- range shading ---------- */
  var RANGE = CFG.rangeRadius || 800;
  function updateCoverage() {
    var layer = document.getElementById("layer").value, working = document.getElementById("working").checked;
    var cap = document.getElementById("cap");
    document.getElementById("rv").textContent = num(RANGE) + " m";
    if (layer === "off" || RANGE <= 0) { cov.set([], []); cap.innerHTML = ""; return; }
    var pts = ASSETS.filter(function (a) { return (layer === "all" || a.t === layer) && (!working || a.s === "O"); });
    cov.set(pts, [RANGE]);
    cap.innerHTML = '<span class="swatch"></span>Shaded: within ' + num(RANGE) + " m of a " + (working ? "working " : "") + (layer === "all" ? "water facility" : TECH_NAME[layer]) + ".";
  }

  /* ---------- panel ---------- */
  function buildLists() {
    var tl = document.getElementById("techs"), sl = document.getElementById("stats");
    tl.innerHTML = ""; sl.innerHTML = "";
    TECH.forEach(function (k) {
      var n = ASSETS.filter(function (a) { return a.t === k; }).length; if (!n) return;
      var l = document.createElement("label");
      l.innerHTML = '<input type="checkbox" data-t="' + k + '"' + (tech.has(k) ? " checked" : "") + ">" + iconSVG(k, "X", 20) + "<span>" + TECH_NAME[k] + '</span><span class="n">' + num(n) + "</span>";
      tl.appendChild(l);
    });
    STAT.forEach(function (k) {
      var n = ASSETS.filter(function (a) { return a.s === k; }).length; if (!n) return;
      var l = document.createElement("label");
      l.innerHTML = '<input type="checkbox" data-s="' + k + '"' + (stat.has(k) ? " checked" : "") + '><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="' + COL[k] + '" stroke="#fff" stroke-width="1.5"/></svg><span>' + STAT_NAME[k] + '</span><span class="n">' + num(n) + "</span>";
      sl.appendChild(l);
    });
  }
  document.getElementById("t_title").textContent = CFG.title;
  document.getElementById("t_area").textContent = CFG.area;
  document.getElementById("t_surveyed").textContent = CFG.surveyed;
  var ctc = document.getElementById("contact");
  if (CFG.contact) { ctc.hidden = false; ctc.textContent = "To report a correction, contact " + CFG.contact; }
  document.getElementById("ctech").innerHTML = TECH.map(function (k) { return '<option value="' + k + '">' + TECH_NAME[k] + "</option>"; }).join("");

  var panel = document.getElementById("panel"), toggle = document.getElementById("toggle");
  function setToggleLabel() {
    var closed = panel.classList.contains("closed");
    toggle.textContent = closed ? "Filters" : "Hide";
    toggle.setAttribute("aria-expanded", String(!closed));
  }
  toggle.addEventListener("click", function () { panel.classList.toggle("closed"); setToggleLabel(); setTimeout(function () { map.invalidateSize(); }, 50); });
  if (window.matchMedia("(max-width:760px)").matches) { panel.classList.add("closed"); setToggleLabel(); setTimeout(function () { map.invalidateSize(); map.fitBounds(bounds, { padding: [24, 24] }); }, 50); }

  document.getElementById("techs").addEventListener("change", function (e) { var k = e.target.getAttribute("data-t"); if (!k) return; e.target.checked ? tech.add(k) : tech.delete(k); buildMarkers(); });
  document.getElementById("stats").addEventListener("change", function (e) { var k = e.target.getAttribute("data-s"); if (!k) return; e.target.checked ? stat.add(k) : stat.delete(k); buildMarkers(); });
  ["layer", "working"].forEach(function (id) { document.getElementById(id).addEventListener("change", updateCoverage); });
  document.getElementById("range").addEventListener("input", function (e) { RANGE = +e.target.value; updateCoverage(); });
  document.querySelectorAll('input[name="base"]').forEach(function (r) {
    r.addEventListener("change", function () { if (!r.checked) return; map.removeLayer(base[curBase]); curBase = r.value; base[curBase].addTo(map); });
  });
  document.getElementById("rad").addEventListener("input", function (e) { setR(+e.target.value); });
  document.getElementById("layer").value = "RO";
  document.getElementById("rad").value = R;
  document.getElementById("range").value = RANGE;
  buildLists(); buildMarkers(); updateCoverage();
})();
