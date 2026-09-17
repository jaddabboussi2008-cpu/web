/* ─────────────────────────────────────────────────────────────────────────
   Locator map for the showrooms section.

   Geography is real, never drawn by hand: coastlines come from Natural Earth
   (world-atlas 110m, public domain) projected with d3-geo. The three islands
   are smaller than that dataset resolves, so each one is marked at its real
   coordinates rather than outlined — a locator map, not a coastline map.

   The map draws into the panel only once the geometry has loaded. If the
   network is unavailable the panel keeps its "map to come" label, so the
   page never shows a broken frame.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  var host = document.querySelector("[data-map]");
  if (!host || typeof d3 === "undefined" || typeof topojson === "undefined") return;

  var W = 1260, H = 540;

  // Showroom cities, in the order the locations grid lists them.
  var SITES = [
    { island: "Bonaire", city: "Kralendijk", lon: -68.283, lat: 12.151, anchor: "start", lift: 132 },
    { island: "Curaçao", city: "Willemstad", lon: -68.933, lat: 12.108, anchor: "middle", lift: 74 },
    { island: "Aruba",   city: "Oranjestad", lon: -70.027, lat: 12.521, anchor: "end", lift: 96 }
  ];
  var NEAR = ["Venezuela", "Colombia", "Trinidad and Tobago"];

  var URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";

  fetch(URL).then(function (r) { return r.json(); }).then(function (topo) {
    var land = topojson.feature(topo, topo.objects.countries);

    // Frame the southern Caribbean. A two-corner MultiPoint gives unambiguous
    // bounds (a bbox polygon can wind the wrong way and fit the whole globe).
    var frame = { type: "MultiPoint", coordinates: [[-71.9, 9.3], [-66.1, 13.9]] };
    var proj = d3.geoMercator().fitSize([W, H], frame);
    var path = d3.geoPath(proj);

    var coast = land.features
      .filter(function (f) { return f.properties && NEAR.indexOf(f.properties.name) >= 0; })
      .map(function (f) { return path(f); })
      .filter(Boolean);

    // Scale bar, measured on the sphere so it stays honest.
    var kmPerPx = (d3.geoDistance([-70.027, 12.521], [-68.283, 12.151]) * 6371) /
      Math.hypot(proj([-68.283, 12.151])[0] - proj([-70.027, 12.521])[0],
                 proj([-68.283, 12.151])[1] - proj([-70.027, 12.521])[1]);
    var barKm = 50;
    var barPx = barKm / kmPerPx;

    var svg = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Locator map: Dabboussi Motors showrooms on Bonaire, Curaçao and Aruba, off the coast of Venezuela." preserveAspectRatio="xMidYMid slice">'];

    svg.push('<rect width="' + W + '" height="' + H + '" fill="var(--map-sea)"></rect>');

    coast.forEach(function (d) {
      svg.push('<path d="' + d + '" fill="var(--map-land)" stroke="var(--map-line)" stroke-width="1.5"></path>');
    });

    svg.push('<text x="40" y="52" class="map-sea-label">Caribbean Sea</text>');
    svg.push('<text x="' + (W - 40) + '" y="' + (H - 34) + '" text-anchor="end" class="map-sea-label">Venezuela</text>');

    SITES.forEach(function (s) {
      var p = proj([s.lon, s.lat]);
      var x = Math.round(p[0]), y = Math.round(p[1]);
      var top = y - s.lift;
      svg.push('<line x1="' + x + '" y1="' + (y - 12) + '" x2="' + x + '" y2="' + top + '" stroke="var(--map-pin)" stroke-width="1.5"></line>');
      svg.push('<circle cx="' + x + '" cy="' + y + '" r="8" fill="var(--map-pin)"></circle>');
      svg.push('<circle cx="' + x + '" cy="' + y + '" r="19" fill="none" stroke="var(--map-pin)" stroke-width="1.5" opacity="0.5"></circle>');
      var tx = s.anchor === "start" ? x + 10 : s.anchor === "end" ? x - 10 : x;
      var ta = s.anchor === "start" ? "start" : s.anchor === "end" ? "end" : "middle";
      svg.push('<text x="' + tx + '" y="' + (top - 26) + '" text-anchor="' + ta + '" class="map-island">' + s.island + '</text>');
      svg.push('<text x="' + tx + '" y="' + (top - 4) + '" text-anchor="' + ta + '" class="map-city">' + s.city + '</text>');
    });

    var bx = 40, by = H - 40;
    svg.push('<line x1="' + bx + '" y1="' + by + '" x2="' + (bx + barPx) + '" y2="' + by + '" stroke="var(--map-line)" stroke-width="2"></line>');
    svg.push('<line x1="' + bx + '" y1="' + (by - 6) + '" x2="' + bx + '" y2="' + (by + 6) + '" stroke="var(--map-line)" stroke-width="2"></line>');
    svg.push('<line x1="' + (bx + barPx) + '" y1="' + (by - 6) + '" x2="' + (bx + barPx) + '" y2="' + (by + 6) + '" stroke="var(--map-line)" stroke-width="2"></line>');
    svg.push('<text x="' + bx + '" y="' + (by - 14) + '" class="map-scale">' + barKm + ' km</text>');

    svg.push('</svg>');

    host.innerHTML = svg.join("");
    host.classList.remove("placeholder");
    host.removeAttribute("data-label");
    host.classList.add("map-ready");
  }).catch(function () { /* panel keeps its placeholder label */ });
})();
