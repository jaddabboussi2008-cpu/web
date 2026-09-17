/* ─────────────────────────────────────────────────────────────────────────
   Dabboussi Motors — site behaviour.
   Plain browser JavaScript, no build step. Data lives in assets/data.js.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";

  /* ── Configuration ──────────────────────────────────────────────────── */

  // "ruled" is the shipped hero. "bleed" and "poster" are the alternates
  // documented in the handoff — switch by setting data-hero on <body>.
  var HERO_VARIANT = document.body.dataset.hero || "ruled";

  // Test-drive requests go to WhatsApp. Put the number here in full
  // international form, digits only — e.g. "599717XXXX" for Bonaire. A location
  // in assets/data.js may override it with its own "whatsapp" number, so each
  // island can answer its own enquiries.
  //
  // Until a number is set the form still validates and confirms on screen, so
  // nothing looks broken — it simply has nowhere to send.
  var WHATSAPP_NUMBER = "";

  // Alternative: paste a form endpoint (Formspree, Basin, Netlify Forms, your
  // own handler) to POST the fields as JSON instead of opening WhatsApp.
  var FORM_ENDPOINT = null;

  // Some paints still fall back to photographs hotlinked from Wikimedia and from
  // a Changan distributor's site — carried over from the prototype. They keep the
  // site looking complete, but they are somebody else's bandwidth and somebody
  // else's licence. Set this to false to show the "photograph to come" panel
  // instead, and turn it off for good once the dealer's own renders arrive.
  // Third-party photographs hotlinked from Wikimedia and from a Changan
  // distributor's site — somebody else's bandwidth and somebody else's licence,
  // and several of them no longer load. Off: models fall back to the dealer's
  // own renders, and only a model with no photograph at all shows the panel.
  var REMOTE_PHOTOS = false;

  var D = window.DM;
  var CARS = D.cars;
  var FLAGSHIP = D.flagship;

  /* ── State ──────────────────────────────────────────────────────────── */

  var state = {
    model: 0,
    trim: 0,
    color: 0,
    brand: "All",          // brand filter inside the configurator rail
    lineupBody: "All",
    lineupBrand: "All",
    lineupSort: "floor",
    configOpen: false,
    photo: -1,
    submitted: false,
    modelText: ""
  };

  var prev = { model: -1, color: -1, trim: -1 };
  var lastOpener = null;

  function set(patch) {
    Object.assign(state, patch);
    render();
  }

  /* ── Helpers ────────────────────────────────────────────────────────── */

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function money(v) { return parseFloat(String(v).replace(/[^0-9.]/g, "")) || 0; }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  /* ── Shareable configuration links ──────────────────────────────────────
     A built car gets a URL: #/build/avatr-11/grey/0 — model, paint, trim.
     Salespeople can send exactly what the customer configured, and the back
     button steps out of the configurator instead of leaving the site.
     Plain anchors (#lineup, #contact) are untouched: routes start "#/".      */

  function readRoute() {
    var m = /^#\/build\/([^/]+)(?:\/([^/]+))?(?:\/(\d+))?/.exec(window.location.hash || "");
    if (!m) return null;

    var carIdx = CARS.findIndex(function (c) { return slug(c.name) === m[1]; });
    if (carIdx < 0) return null;
    var car = CARS[carIdx];

    var colorIdx = 0;
    if (m[2]) {
      var ci = car.colors.findIndex(function (c) { return slug(c.name) === m[2]; });
      if (ci >= 0) colorIdx = ci;
    }
    var trimIdx = m[3] ? Math.min(Number(m[3]), car.trims.length - 1) : 0;

    return { model: carIdx, color: colorIdx, trim: trimIdx };
  }

  function writeRoute() {
    var hash = window.location.hash || "";
    if (state.configOpen) {
      var c = current();
      var want = "#/build/" + slug(c.car.name) + "/" + slug(c.color.name) + "/" + state.trim;
      if (hash !== want) history.replaceState(null, "", want);
    } else if (hash.indexOf("#/build/") === 0) {
      // Leaving the configurator — drop the build route, keep them at the lineup.
      history.replaceState(null, "", "#lineup");
    }
    // Any other hash (a plain #contact anchor, or none at all) is left alone.
  }


  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  var BODY_TEST = {
    Sedans: function (c) { return /sedan/i.test(c.body); },
    SUVs: function (c) { return /suv|off-roader|crossover/i.test(c.body); },
    Pickups: function (c) { return /pickup/i.test(c.body); },
    Electric: function (c) { return /ev\b|electric|reev/i.test(c.body) || c.brand === "Avatr"; }
  };

  function powerLine(c) {
    var sp = c.trims[0].specs || {};
    var drive = sp.Engine || sp.Motor || sp.Drivetrain || (sp.Battery ? "Electric" : "");
    var pw = String(sp.Power || sp["Motor power"] || "").split("/")[0].trim();
    var rg = sp.Range ? sp.Range + " range" : "";
    return [drive, pw, rg].filter(Boolean).join(", ");
  }

  // The dealer's own render of this model in any paint — used when the exact
  // paint has no photograph, so a hotlink is never needed to fill a gap.
  function ownRender(car) {
    for (var i = 0; i < car.colors.length; i++) {
      var v = D.byColor[car.name + "|" + car.colors[i].name];
      if (v && !/^https?:/.test(v)) return v;
    }
    var m = D.byModel[car.name];
    return m && !/^https?:/.test(m) ? m : null;
  }

  // Which photograph shows this model in this paint.
  function shotFor(car, colorIdx) {
    var color = car.colors[Math.min(colorIdx || 0, car.colors.length - 1)];
    var exact = D.byColor[car.name + "|" + color.name];
    if (exact && !/^https?:/.test(exact)) return { src: exact, credit: null };

    var own = ownRender(car);
    if (own) return { src: own, credit: null };

    var local = exact || D.byModel[car.name];
    if (local && REMOTE_PHOTOS) return { src: local, credit: null };

    var c = D.credits[car.name];
    if (c && REMOTE_PHOTOS) return { src: c.src, credit: c };
    return { src: null, credit: null };
  }

  function stage(shot, opts) {
    opts = opts || {};
    var cls = "stage" + (opts.cls ? " " + opts.cls : "");
    if (!shot.src) return '<span class="' + cls + ' is-empty"></span>';
    var credit = shot.credit
      ? '<a class="credit" href="' + esc(shot.credit.href) + '" target="_blank" rel="noopener noreferrer">' + esc(shot.credit.label) + "</a>"
      : "";
    return '<span class="' + cls + '">'
      + '<img src="' + esc(shot.src) + '" alt="' + esc(opts.alt || "") + '"'
      + (opts.cover ? ' class="cover"' : "")
      + (opts.style ? ' style="' + esc(opts.style) + '"' : opts.fit ? ' style="object-fit: ' + esc(opts.fit) + '"' : "")
      + ' loading="' + (opts.eager ? "eager" : "lazy") + '" decoding="async">'
      + credit + "</span>";
  }

  /* ── Derived values ─────────────────────────────────────────────────── */

  function current() {
    var m = CARS[Math.min(state.model, CARS.length - 1)];
    return {
      car: m,
      trim: m.trims[Math.min(state.trim, m.trims.length - 1)],
      color: m.colors[Math.min(state.color, m.colors.length - 1)]
    };
  }

  function inBrand(c) {
    return state.lineupBrand === "All"
      ? true
      : (c.brand === state.lineupBrand && c.name !== FLAGSHIP[state.lineupBrand]);
  }
  function inBody(c) {
    return state.lineupBody === "All" ? true : BODY_TEST[state.lineupBody](c);
  }

  // Showroom order walks the floor the way the salesfloor is laid out — city
  // cars, sedans, SUVs smallest to largest, coupe SUVs, pickups, then the
  // electric and Avatr end — so neighbouring cards share a family and a stance.
  var FLOOR = D.floorOrder || [];

  function filteredRows() {
    var rows = CARS.map(function (c, i) { return { c: c, i: i }; })
      .filter(function (o) { return inBrand(o.c) && inBody(o.c); });

    if (state.lineupSort === "floor") {
      return rows.sort(function (a, b) {
        var ai = FLOOR.indexOf(a.c.name), bi = FLOOR.indexOf(b.c.name);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      });
    }

    var asc = state.lineupSort === "asc";
    rows.sort(function (a, b) {
      return (money(a.c.trims[0].price) - money(b.c.trims[0].price)) * (asc ? 1 : -1);
    });
    return applySwaps(rows);
  }

  // The dealer wants a few models shown out of price order. Each pair in
  // D.rowSwap trades places once the price sort has run, so the rest of the
  // floor still reads cheapest- or dearest-first.
  function applySwaps(rows) {
    (D.rowSwap || []).forEach(function (pair) {
      var a = -1, b = -1;
      rows.forEach(function (o, n) {
        if (o.c.name === pair[0]) a = n;
        if (o.c.name === pair[1]) b = n;
      });
      if (a >= 0 && b >= 0) { var t = rows[a]; rows[a] = rows[b]; rows[b] = t; }
    });
    return rows;
  }

  function flagshipCar() {
    var name = FLAGSHIP[state.lineupBrand];
    if (!name) return null;
    var i = CARS.findIndex(function (c) { return c.name === name; });
    if (i < 0) return null;
    return inBody(CARS[i]) ? { car: CARS[i], i: i } : null;
  }

  /* ── Rendering ──────────────────────────────────────────────────────── */

  function renderHero() {
    var mount = $("[data-hero-mount]");
    var eyebrow = "Authorised Changan dealer — Bonaire · Curaçao · Aruba";

    if (HERO_VARIANT === "bleed") {
      mount.innerHTML =
        '<section class="hero-bleed">'
        + '<div class="shot"><img src="photos/hero-hunter-bonaire.jpg" alt="A Changan Hunter on the coast road in Bonaire" fetchpriority="high"></div>'
        + '<div class="scrim"></div>'
        + '<div class="copy">'
        + '<div class="hero-rule" aria-hidden="true"></div>'
        + '<span class="hero-eyebrow">' + esc(eyebrow) + "</span>"
        + "<h1><span>The whole Changan range.</span><span>One dealer that stands behind it.</span></h1>"
        + '<div class="hero-actions"><a href="#lineup" class="btn btn-primary">See the lineup</a></div>'
        + "</div></section>";
      return;
    }

    if (HERO_VARIANT === "poster") {
      mount.innerHTML =
        '<section class="hero-ruled" style="background: var(--color-accent); color: var(--color-bg); max-width: none;">'
        + '<div style="max-width: 1240px; margin: 0 auto;">'
        + '<span class="hero-eyebrow" style="color: var(--color-bg);">' + esc(eyebrow) + "</span>"
        + '<h1 style="max-width: 18ch;"><span>Nineteen models.</span><span>Six showrooms.</span><span>One workshop standard.</span></h1>'
        + '<div class="hero-actions"><a href="#lineup" class="btn btn-ghost" style="color: var(--color-bg); border-color: var(--color-bg);">See the lineup</a></div>'
        + "</div></section>";
      return;
    }

    mount.innerHTML =
      '<section class="hero-ruled">'
      + '<div class="hero-rule" aria-hidden="true"></div>'
      + '<span class="hero-eyebrow">' + esc(eyebrow) + "</span>"
      + "<h1><span>Engineered in Chongqing.</span><span>Delivered, serviced and</span><span>warrantied here.</span></h1>"
      + '<p class="hero-lede">Dabboussi Motors imports, sells and maintains the full Changan group range — Changan, Deepal and Avatr, from the Lumin city EV to the Avatr 11 — with factory-trained technicians, genuine parts held on the shelf, and 5 to 8 year warranties honoured at our own workshops.</p>'
      + '<div class="hero-actions">'
      + '<a href="#lineup" class="btn btn-primary">See the lineup</a>'
      + '<a href="#configure" class="btn btn-ghost">Configure a vehicle</a>'
      + "</div></section>";
  }

  function renderFeatured() {
    var host = $("[data-featured]");
    host.innerHTML = D.featured.map(function (name) {
      var i = CARS.findIndex(function (c) { return c.name === name; });
      var x = CARS[i];
      var hero = D.heroShot[name];
      var shot = hero ? { src: hero, credit: null } : shotFor(x, 0);
      return '<button type="button" class="tile" data-pick="' + i + '">'
        + stage(shot, { alt: x.name, eager: true, fit: hero ? (D.heroFit[name] || null) : null })
        + '<span class="tile-body">'
        + '<span class="tile-kind">' + esc(x.brand + " " + x.body) + "</span>"
        + '<span class="tile-name">' + esc(x.name) + "</span>"
        + '<span class="tile-price">From ' + esc(x.trims[0].price) + "</span>"
        + "</span></button>";
    }).join("");
  }

  // The Avatr section: the marque's own cards, rendered once (no filtering —
   // the whole point is that both models are shown together).
  function renderAvatr() {
    var host = $("[data-avatr-models]");
    if (!host) return;
    host.innerHTML = CARS.map(function (c, i) { return { c: c, i: i }; })
      .filter(function (o) { return o.c.brand === "Avatr"; })
      .map(function (o) {
        var x = o.c;
        return '<button type="button" class="avatr-card" data-pick="' + o.i + '">'
          + stage(frameShot(x, 0, -1).shot, { alt: x.name })
          + '<span class="avatr-id">'
          + '<span class="avatr-name">' + esc(x.name) + "</span>"
          + '<span class="avatr-body">' + esc(x.body + ", " + x.warranty + " battery warranty") + "</span>"
          + "</span>"
          + '<p class="avatr-blurb">' + esc(x.blurb) + "</p>"
          + '<span class="avatr-figures">'
          + specCells(x).map(function (cell) {
              return '<span class="cell"><span class="v">' + esc(cell.v) + '</span><span class="k">' + esc(cell.k) + "</span></span>";
            }).join("")
          + "</span>"
          + '<span class="avatr-foot">'
          + '<span class="avatr-price">'
          + (x.trims[0].was ? '<span class="was">' + esc(x.trims[0].was) + "</span>" : "")
          + '<span class="now">' + esc(x.trims[0].price) + "</span>"
          + "</span>"
          + '<span class="avatr-cue">Configure</span>'
          + "</span></button>";
      }).join("");
  }

  function renderFilters() {
    var bodyHost = $("[data-body-filters]");
    var brandHost = $("[data-brand-filters]");
    var rows = filteredRows();

    bodyHost.innerHTML = ["All", "Sedans", "SUVs", "Pickups", "Electric"].map(function (f) {
      var active = state.lineupBody === f;
      var count = CARS.filter(function (c) {
        return (f === "All" ? true : BODY_TEST[f](c)) && inBrand(c);
      }).length;
      return '<button type="button" class="tab' + (count === 0 && !active ? " is-empty" : "") + '"'
        + ' aria-pressed="' + active + '" data-body="' + esc(f) + '">'
        + esc(f === "All" ? "Everything" : f)
        + '<span class="count">' + count + "</span></button>";
    }).join("");

    brandHost.innerHTML = ["All", "Changan", "Deepal", "Avatr"].map(function (b) {
      var active = state.lineupBrand === b;
      var n = CARS.filter(function (c) {
        return (b === "All" || c.brand === b) && (state.lineupBody === "All" || BODY_TEST[state.lineupBody](c));
      }).length;
      return '<button type="button" class="pill' + (n === 0 && !active ? " is-empty" : "") + '"'
        + ' aria-pressed="' + active + '" data-brand="' + esc(b) + '">'
        + esc(b === "All" ? "All brands" : b) + "</button>";
    }).join("");

    $("[data-result-count]").textContent = rows.length === 1 ? "1 model" : rows.length + " models";
    $("[data-sort]").textContent = state.lineupSort === "floor" ? "Showroom order"
      : state.lineupSort === "asc" ? "Cheapest first" : "Dearest first";
  }

  function renderFlagship() {
    var host = $("[data-flagship]");
    var f = flagshipCar();
    if (!f) { host.innerHTML = ""; return; }
    var x = f.car;
    host.innerHTML =
      '<article class="flagship">'
      + stage(shotFor(x, 0), { alt: x.name })
      + '<div class="flagship-body">'
      + '<span class="flagship-kicker">The ' + esc(x.brand) + " flagship</span>"
      + "<h3>" + esc(x.name) + "</h3>"
      + "<p>" + esc(x.blurb) + "</p>"
      + '<div class="filter-row">'
      + x.chips.map(function (c) { return '<span class="tag tag-outline">' + esc(c) + "</span>"; }).join("")
      + "</div>"
      + '<div class="price-row">'
      + (x.trims[0].was ? '<span class="price-was">' + esc(x.trims[0].was) + "</span>" : "")
      + '<span class="price-now">' + esc(x.trims[0].price) + "</span>"
      + '<span class="price-note">' + esc(x.warranty) + " warranty</span>"
      + "</div>"
      + '<div class="actions"><button type="button" class="btn btn-primary" data-pick="' + f.i + '">Configure this model</button></div>'
      + "</div></article>";
  }

  // Keep a spec value short enough to sit in a narrow column.
  function clip(v, n) {
    v = String(v).trim();
    if (v.length <= n) return v;
    var cut = v.slice(0, n);
    var sp = cut.lastIndexOf(" ");
    return (sp > n * 0.5 ? cut.slice(0, sp) : cut).replace(/[,.\s]+$/, "") + "…";
  }

  // A spec table sentence is not a figure. Pull the number a buyer compares out
  // of prose like "1.5L engine + 35.07 kWh battery" or "56.12 kWh — 235 hp".
  function hp(v) {
    var m = v && String(v).match(/([\d.]+)\s*(hp|kW)\b/i);
    if (!m) return null;
    var n = +m[1];
    return Math.round(/kw/i.test(m[2]) ? n * 1.36 : n) + " hp";
  }
  function kwh(v) { var m = v && String(v).match(/([\d.]+)\s*kWh/i); return m ? Math.round(+m[1]) + " kWh" : null; }
  function drive(v) {
    if (!v) return null;
    var t = String(v);
    if (/reev|range extended/i.test(t)) return "Range extender";
    if (/plug-in|phev/i.test(t)) return "Plug-in hybrid";
    if (/awd|all wheel|4wd|4x4/i.test(t)) return "All-wheel drive";
    if (/rear-wheel|\brwd\b/i.test(t)) return "Rear-wheel drive";
    if (/front-wheel|\bfwd\b/i.test(t)) return "Front-wheel drive";
    return clip(t, 16);
  }

  function specCells(car) {
    var s = car.trims[0].specs || {};
    var out = [];
    function push(k, v, n) { if (v && out.length < 3) out.push({ k: k, v: clip(v, n || 18) }); }

    push("Power", hp(s["Power"] || s["Motor power"] || s["Front motor"] || s["Motor"]), 12);
    push("Range", s["Range"], 12);
    push("0–100 km/h", s["0–100 km/h"], 10);
    push("Battery", kwh(s["Battery"] || s["Motor"] || s["Engine"]), 12);
    push("Engine", s["Engine"] && String(s["Engine"]).split("+")[0].replace(/\s*gasoline\b/i, ""), 15);
    push("Drive", drive(s["Drive"] || s["Drivetrain"]), 17);
    push("Gearbox", s["Transmission"] && String(s["Transmission"]).replace(/(\d+-speed)\s+automatic/i, "$1 auto").replace(/^automatic$/i, "Auto"), 16);
    push("Warranty", car.warranty, 12);
    return out;
  }

  function renderRows() {
    var host = $("[data-rows]");
    var rows = filteredRows();

    if (!rows.length) {
      var word = state.lineupBody === "All" ? "models" : state.lineupBody.toLowerCase();
      host.innerHTML =
        '<div class="empty-state">'
        + "<p>No " + esc(word) + " in that brand yet. The nearest thing we hold is the whole range.</p>"
        + '<button type="button" class="ghost-pill" data-clear>Show every model</button>'
        + "</div>";
      return;
    }

    host.innerHTML = rows.map(function (o) {
      var x = o.c;
      var lead = D.rowShot[x.name];
      var shot = lead ? { src: lead, credit: null } : shotFor(x, 0);
      return '<button type="button" class="mcard" data-pick="' + o.i + '">'
        + stage(shot, { alt: x.name, cover: !!lead, fit: lead ? (D.rowFit[x.name] || "fill") : null, style: lead ? D.rowStyle[x.name] : null })
        + '<span class="mcard-id">'
        + '<span class="mcard-name">' + esc(x.name) + "</span>"
        + '<span class="mcard-meta">' + esc(x.brand + " " + x.body) + "</span>"
        + "</span>"
        + '<span class="mcard-specs">'
        + specCells(x).map(function (c) {
          return '<span class="cell"><span class="v">' + esc(c.v) + '</span><span class="k">' + esc(c.k) + "</span></span>";
        }).join("")
        + "</span>"
        + '<span class="mcard-foot">'
        + '<span class="mcard-price">'
        + (x.trims[0].was ? '<span class="was">' + esc(x.trims[0].was) + "</span>" : "")
        + '<span class="now">' + esc(x.trims[0].price) + "</span>"
        + "</span>"
        + '<span class="mcard-cue">Configure</span>'
        + "</span></button>";
    }).join("");
  }

  function swatchMarkup(car, withLabels) {
    return car.colors.map(function (c, i) {
      var active = i === Math.min(state.color, car.colors.length - 1);
      var btn = '<button type="button" class="swatch" data-color="' + i + '"'
        + ' aria-pressed="' + active + '" aria-label="' + esc(c.name) + '" title="' + esc(c.name) + '"'
        + ' style="background: ' + esc(c.hex) + ';"></button>';
      return withLabels
        ? '<span class="swatch-cell">' + btn + "<span>" + esc(c.name) + "</span></span>"
        : btn;
    }).join("");
  }

  function trimMarkup(car) {
    if (car.trims.length < 2) return "";
    return car.trims.map(function (t, i) {
      var active = i === Math.min(state.trim, car.trims.length - 1);
      return '<button type="button" class="trim" data-trim="' + i + '" aria-pressed="' + active + '">'
        + '<span class="trim-name">' + esc(t.name) + "</span>"
        + '<span class="trim-price"><span class="now">' + esc(t.price) + "</span>"
        + (t.was ? '<span class="was">' + esc(t.was) + "</span>" : "")
        + "</span></button>";
    }).join("");
  }

  function frameShot(car, colorIdx, photoIdx) {
    var gallery = (D.gallery && D.gallery[car.name]) || [];
    if (gallery[photoIdx]) return { shot: gallery[photoIdx], photo: true };
    var paint = shotFor(car, colorIdx);
    if (paint.src) return { shot: paint, photo: false };
    if (gallery[0]) return { shot: gallery[0], photo: true };
    return { shot: paint, photo: false };
  }

  // The car's own photographs, beside the paint chooser.
  function galleryMarkup(car, gallery) {
    if (!gallery.length) return "";
    return '<div class="gallery"><span class="gallery-label">Photographs</span><div class="gallery-strip">'
      + gallery.map(function (g, i) {
          return '<button type="button" class="shot" data-photo="' + i + '" aria-pressed="' + (i === state.photo) + '"'
            + ' title="' + esc(g.label) + '">'
            + '<img src="' + esc(g.src) + '" alt="' + esc(car.name + ", " + g.label) + '" loading="lazy" decoding="async">'
            + "</button>";
        }).join("")
      + "</div></div>";
  }

  function renderInlineConfig() {
    var c = current();
    var host = $("[data-inline-config]");
    var trims = trimMarkup(c.car);
    var gallery = (D.gallery && D.gallery[c.car.name]) || [];
    var inline = frameShot(c.car, state.color, state.photo);

    host.innerHTML =
      '<div class="render" data-render>' + stage(inline.shot, { alt: inline.photo ? c.car.name : c.car.name + " in " + c.color.name, cover: inline.photo }) + "</div>"
      + '<div class="configure-panel">'
      + '<div class="stack" style="gap: 8px;">'
      + '<span class="panel-meta">' + esc(c.car.brand + ", " + c.car.warranty + " warranty") + "</span>"
      + "<h2>" + esc(c.car.name) + "</h2>"
      + '<p class="panel-blurb">' + esc(c.car.blurb) + "</p>"
      + "</div>"
      + '<div class="stack">'
      + '<span class="step-label">Paint, in ' + esc(c.color.name) + "</span>"
      + '<div class="swatches">' + swatchMarkup(c.car, false) + "</div>"
      + "</div>"
      + galleryMarkup(c.car, gallery)
      + (trims ? '<div class="stack" style="gap: 10px;"><span class="step-label">Level</span>' + trims + "</div>" : "")
      + '<div class="total">'
      + (c.trim.was ? '<span class="price-was">' + esc(c.trim.was) + "</span>" : "")
      + '<span class="now" data-price>' + esc(c.trim.price) + "</span>"
      + "</div>"
      + '<div class="actions">'
      + '<button type="button" class="btn btn-primary" data-quote>Request a quote</button>'
      + '<button type="button" class="ghost-pill" data-open-config>See full specification</button>'
      + "</div></div>";
  }

  function renderOverlay() {
    var host = $("[data-overlay]");
    host.hidden = !state.configOpen;
    document.body.classList.toggle("is-locked", state.configOpen);
    if (!state.configOpen) { host.innerHTML = ""; return; }

    var prevRail = host.querySelector(".rail");
    var railScroll = prevRail ? prevRail.scrollLeft : null;

    var c = current();
    var rail = CARS.map(function (x, i) { return { car: x, i: i }; })
      .filter(function (o) { return state.brand === "All" || o.car.brand === state.brand; });

    var specs = Object.keys(c.trim.specs).map(function (k) {
      return '<div class="spec-row"><span class="label">' + esc(k) + '</span><span class="value">' + esc(c.trim.specs[k]) + "</span></div>";
    }).join("");

    var equipment = (c.trim.features || []).map(function (f) {
      return "<li>" + esc(f) + "</li>";
    }).join("");

    var trims = trimMarkup(c.car);
    var gallery = (D.gallery && D.gallery[c.car.name]) || [];
    var frame = frameShot(c.car, state.color, state.photo);

    host.innerHTML =
      '<div class="overlay-bar">'
      + '<button type="button" class="back-btn" data-close-config>← Back to lineup</button>'
      + '<span class="overlay-now">' + esc(c.car.name + ", " + c.trim.name) + "</span>"
      + '<span class="overlay-price">'
      + (c.trim.was ? '<span class="was">' + esc(c.trim.was) + "</span>" : "")
      + '<span class="now" data-price>' + esc(c.trim.price) + "</span>"
      + "</span></div>"

      + '<div class="overlay-body">'
      + '<div class="overlay-head">'
      + '<span class="panel-meta">' + esc(c.car.brand + ", " + c.car.warranty + " warranty") + "</span>"
      + "<h2>" + esc(c.car.name) + "</h2>"
      + "<p>" + esc(c.car.blurb) + "</p>"
      + "</div>"

      + '<div class="stack" style="gap: 16px;">'
      + '<span class="step-label">Step one: model</span>'
      + '<div class="filter-row">'
      + ["All", "Changan", "Deepal", "Avatr"].map(function (b) {
          return '<button type="button" class="brand-pill" data-config-brand="' + esc(b) + '"'
            + ' aria-pressed="' + (state.brand === b) + '">' + esc(b) + "</button>";
        }).join("")
      + "</div>"
      + '<div class="rail">'
      + rail.map(function (o) {
          return '<button type="button" class="rail-item" data-rail="' + o.i + '" aria-pressed="' + (o.i === state.model) + '">'
            + '<span class="rail-name">' + esc(o.car.name) + "</span>"
            + '<span class="rail-body">' + esc(o.car.body) + "</span>"
            + '<span class="rail-price">' + esc(o.car.trims[0].price) + "</span>"
            + "</button>";
        }).join("")
      + "</div></div>"

      + '<div class="render" data-render>' + stage(frame.shot, { alt: frame.photo ? c.car.name + ", " + frame.shot.label : c.car.name + " in " + c.color.name, eager: true, cover: frame.photo }) + "</div>"

      + '<div class="stack" style="gap: 14px;">'
      + '<span class="step-label">Step two: paint, in ' + esc(c.color.name) + "</span>"
      + '<div class="paint-row">'
      + '<div class="swatch-grid">' + swatchMarkup(c.car, true) + "</div>"
      + galleryMarkup(c.car, gallery)
      + "</div></div>"

      + '<div class="overlay-cols">'
      + '<div class="stack" style="gap: 28px;">'
      + (trims ? '<div class="stack" style="gap: 12px;"><span class="step-label">Step three: level</span>' + trims + "</div>" : "")
      + "</div>"
      + '<div class="stack" style="gap: 28px;">'
      + '<div class="stack" style="gap: 10px;"><span class="step-label">Specification</span>' + specs + "</div>"
      + '<div class="stack" style="gap: 10px;"><span class="step-label">Equipment</span><ul class="equipment">' + equipment + "</ul></div>"
      + "</div></div>"

      + '<div class="summary">'
      + '<div class="summary-line">'
      + '<span class="what">' + esc(c.car.name + ", " + c.trim.name + ", " + c.color.name) + "</span>"
      + '<span class="price-row">'
      + (c.trim.was ? '<span class="was">' + esc(c.trim.was) + "</span>" : "")
      + '<span class="now">' + esc(c.trim.price) + "</span>"
      + "</span></div>"
      + '<div class="actions">'
      + '<button type="button" class="btn btn-primary" data-quote>Request a quote</button>'
      + '<button type="button" class="ghost-pill" data-copy-link>Copy link</button>'
      + '<button type="button" class="ghost-pill" data-close-config>Keep browsing</button>'
      + "</div></div></div>";

    if (railScroll) {
      var newRail = host.querySelector(".rail");
      if (newRail) newRail.scrollLeft = railScroll;
    }
  }

  function renderLocations() {
    $("[data-locations]").innerHTML = D.locations.map(function (l) {
      return '<div class="location">'
        + '<span class="tag tag-accent">' + esc(l.type) + "</span>"
        + "<h3>" + esc(l.city) + "</h3>"
        + "<p>" + esc(l.address) + "</p>"
        + '<p class="phone"><a href="tel:' + esc(String(l.phone).replace(/[^0-9+]/g, "")) + '">' + esc(l.phone) + "</a></p>"
        + '<p class="hours">' + esc(l.hours) + "</p>"
        + "</div>";
    }).join("");
  }

  function renderForm() {
    $("[data-form]").hidden = state.submitted;
    $("[data-thanks]").hidden = !state.submitted;
    var modelField = $('[data-form] input[name="model"]');
    if (modelField && state.modelText && document.activeElement !== modelField) {
      modelField.value = state.modelText;
    }
  }

  function render() {
    renderFilters();
    renderFlagship();
    renderRows();
    renderInlineConfig();
    renderOverlay();
    renderForm();
    writeRoute();
    pulse();
    bindParallax();
  }

  /* ── Motion ─────────────────────────────────────────────────────────── */

  function pulse() {
    var swapped = prev.model !== state.model || prev.color !== state.color;
    var priceChanged = swapped || prev.trim !== state.trim;
    var first = prev.model === -1;

    if (!first && !reduced()) {
      if (swapped) animate("[data-render] img", "dm-swap 540ms cubic-bezier(0.2,0.8,0.2,1) both");
      if (priceChanged) animate("[data-price]", "dm-rise 400ms cubic-bezier(0.2,0.8,0.2,1) both");
    }
    prev.model = state.model; prev.color = state.color; prev.trim = state.trim;
  }

  function animate(sel, anim) {
    $$(sel).forEach(function (el) {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = anim;
    });
  }

  function bindParallax() {
    $$("[data-render]").forEach(function (stageEl) {
      if (stageEl.dataset.bound) return;
      stageEl.dataset.bound = "1";
      stageEl.addEventListener("mousemove", function (e) {
        if (reduced()) return;
        var img = stageEl.querySelector("img");
        if (!img) return;
        var b = stageEl.getBoundingClientRect();
        var dx = (e.clientX - b.left) / b.width - 0.5;
        var dy = (e.clientY - b.top) / b.height - 0.5;
        img.style.transition = "transform 140ms linear";
        img.style.transform = "translate3d(" + (dx * 20).toFixed(1) + "px, " + (dy * 11).toFixed(1) + "px, 0) scale(1.03)";
      });
      stageEl.addEventListener("mouseleave", function () {
        var img = stageEl.querySelector("img");
        if (!img) return;
        img.style.transition = "transform 460ms cubic-bezier(0.2,0.8,0.2,1)";
        img.style.transform = "none";
      });
    });
  }

  /* ── Events ─────────────────────────────────────────────────────────── */

  function openConfigWith(i, opener) {
    lastOpener = opener || null;
    set({ model: i, trim: 0, color: 0, configOpen: true, modelText: CARS[i].name });
    window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
    var back = $("[data-overlay] [data-close-config]");
    if (back) back.focus();
  }

  function closeConfig() {
    set({ configOpen: false });
    if (lastOpener && document.contains(lastOpener)) lastOpener.focus();
    lastOpener = null;
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-pick], [data-open-config], [data-close-config], [data-body], [data-brand], [data-sort], [data-clear], [data-color], [data-photo], [data-trim], [data-rail], [data-config-brand], [data-quote], [data-copy-link], [data-form-reset]");
    if (!t) return;

    if (t.hasAttribute("data-pick"))          return openConfigWith(Number(t.dataset.pick), t);
    if (t.hasAttribute("data-open-config"))   { lastOpener = t; return set({ configOpen: true }); }
    if (t.hasAttribute("data-close-config"))  return closeConfig();
    if (t.hasAttribute("data-body"))          return set({ lineupBody: t.dataset.body });
    if (t.hasAttribute("data-brand"))         return set({ lineupBrand: t.dataset.brand });
    if (t.hasAttribute("data-sort"))          return set({ lineupSort: state.lineupSort === "floor" ? "asc" : state.lineupSort === "asc" ? "desc" : "floor" });
    if (t.hasAttribute("data-clear"))         return set({ lineupBody: "All", lineupBrand: "All" });
    if (t.hasAttribute("data-color"))         return set({ color: Number(t.dataset.color), photo: -1 });
    if (t.hasAttribute("data-trim"))          return set({ trim: Number(t.dataset.trim) });
    if (t.hasAttribute("data-rail"))          return set({ model: Number(t.dataset.rail), trim: 0, color: 0, photo: -1 });
    if (t.hasAttribute("data-photo"))         return set({ photo: Number(t.dataset.photo) === state.photo ? -1 : Number(t.dataset.photo) });
    if (t.hasAttribute("data-config-brand"))  return set({ brand: t.dataset.configBrand });
    if (t.hasAttribute("data-form-reset"))    return set({ submitted: false });

    if (t.hasAttribute("data-copy-link")) {
      var url = window.location.href;
      var confirmCopy = function (ok) {
        t.textContent = ok ? "Link copied" : "Press ⌘C to copy";
        setTimeout(function () { if (document.contains(t)) t.textContent = "Copy link"; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { confirmCopy(true); },
                                                function () { confirmCopy(false); });
      } else {
        confirmCopy(false);
      }
      return;
    }

    if (t.hasAttribute("data-quote")) {
      var c = current();
      set({ modelText: c.car.name + " — " + c.trim.name + ", " + c.color.name, configOpen: false, submitted: false });
      document.getElementById("contact").scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
      return;
    }
  });

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && state.configOpen) closeConfig();
  });

  var nav = $("[data-nav]");
  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, { passive: true });

  // The lineup's filter bar sticks under the nav, and the nav grows as its links
  // wrap on narrow screens. Publish the measured height so CSS offsets against
  // the real bar rather than a number that was true at one width.
  var setNavHeight = function () {
    document.documentElement.style.setProperty("--nav-h", Math.round(nav.getBoundingClientRect().height) + "px");
  };
  window.addEventListener("resize", setNavHeight);
  setNavHeight();

  /* ── Test-drive form ────────────────────────────────────────────────── */

  var form = $("[data-form]");
  var formError = $("[data-form-error]");

  // The number that answers this enquiry: the chosen showroom's own, or the
  // house number. Digits only — wa.me rejects spaces and plus signs.
  function whatsappFor(showroom) {
    var loc = (D.locations || []).filter(function (l) { return l.city === showroom; })[0];
    var n = (loc && loc.whatsapp) || WHATSAPP_NUMBER || "";
    return String(n).replace(/[^0-9]/g, "");
  }

  // What the customer sends. Written as they would write it, not as a form dump.
  function whatsappMessage(d) {
    var lines = ["Hello Dabboussi Motors — I would like to book a test drive."];
    if (d.model) lines.push("Model: " + d.model);
    if (d.showroom) lines.push("Showroom: " + d.showroom);
    lines.push("Name: " + d.name);
    lines.push("Phone: " + d.phone);
    return lines.join("\n");
  }

  // The button says what it does, and only promises WhatsApp when it can deliver.
  function labelSubmit() {
    var btn = $("[data-form] [type=submit]");
    if (!btn) return;
    var showroom = (new FormData(form).get("showroom") || "").trim();
    btn.textContent = whatsappFor(showroom) ? "Send on WhatsApp" : "Request a test drive";
  }
  labelSubmit();
  form.addEventListener("change", labelSubmit);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var name = (data.get("name") || "").trim();
    var phone = (data.get("phone") || "").trim();

    if (!name || !phone) {
      formError.textContent = "Please give us a name and a phone number so we can confirm the slot.";
      formError.hidden = false;
      (name ? form.phone : form.name).focus();
      return;
    }
    formError.hidden = true;

    var done = function () {
      $("[data-thanks-line]").textContent = "Thank you, " + name.split(" ")[0] + ".";
      set({ submitted: true });
      form.reset();
    };

    var wa = whatsappFor((data.get("showroom") || "").trim());
    if (wa) {
      window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(whatsappMessage({
        name: name,
        phone: phone,
        model: (data.get("model") || "").trim(),
        showroom: (data.get("showroom") || "").trim()
      })), "_blank", "noopener");
      done();
      return;
    }

    if (!FORM_ENDPOINT) { done(); return; }

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.fromEntries(data.entries()))
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      done();
    }).catch(function () {
      formError.textContent = "That did not send. Please call the showroom on +599 717 0000 and we will book you in.";
      formError.hidden = false;
    });
  });

  /* ── Boot ───────────────────────────────────────────────────────────── */

  // A shared link opens straight onto that car, paint and trim.
  var route = readRoute();
  if (route) {
    state.model = route.model;
    state.color = route.color;
    state.trim = route.trim;
    state.brand = CARS[route.model].brand;
    state.configOpen = true;
    state.modelText = CARS[route.model].name;
  }

  window.addEventListener("hashchange", function () {
    var r = readRoute();
    if (r) {
      set({ model: r.model, color: r.color, trim: r.trim, configOpen: true });
    } else if (state.configOpen) {
      set({ configOpen: false });
    }
  });

  renderHero();
  renderFeatured();
  renderAvatr();
  renderLocations();
  render();
  onScroll();
})();
