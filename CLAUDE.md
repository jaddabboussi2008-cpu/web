# Dabboussi Motors — site

Dealer site for **Changan, Deepal and Avatr** in **Aruba, Bonaire and Curaçao**.
Static: no framework, no build step, no server. `index.html` opens and runs.

Read `README.md` first — it documents deploying, what data is real vs. placeholder,
and the pre-launch checklist. This file is the working agreement for editing the code.

## Layout

```
index.html        whole page — markup, copy, meta, JSON-LD
assets/ds.css     Modernist design system: tokens + components. DO NOT EDIT.
assets/site.css   house palette, layout, motion. :root block at top holds the vars.
assets/data.js    19 vehicles, 3 showrooms, photo maps  ← the file a CMS replaces
assets/site.js    state, rendering, interactions
assets/map.js     showroom locator map (d3-geo + Natural Earth)
photos/           117 files: paint renders, lifestyle shots, brandmark
```

No bundler, no npm runtime deps. Scripts are plain `<script>` tags, ES5-flavoured
(`var`, no modules) so the files stay editable without tooling.

## Invariants — do not break these

- **`assets/ds.css` is vendored.** It is the Modernist design system. Take colour,
  type, spacing and radius from its `var(--*)` tokens; never hard-code a hex or a
  font name a token already carries. Zero border-radius is deliberate.
- **`data.js` shape is the contract.** `site.js` reads it positionally in places.
  Add fields, don't rename them. `window.DM` is the single global.
- **d3 / topojson tags in `index.html` are pinned and SRI-hashed.** Do not change
  their versions, URLs or `integrity` attributes.
- **Geography is never hand-drawn.** The map uses real Natural Earth geometry
  projected with d3-geo. If it needs changing, change the projection or the data.
- **`prefers-reduced-motion` is honoured everywhere** — load sequence, hover
  scaling, pointer parallax all switch off. Keep it that way for anything new.
- **No remote images.** `REMOTE_PHOTOS = false` in `site.js`; everything loads from
  `photos/`. Don't hotlink a distributor's server.
- **Paint renders share one frame ratio per model.** All of a model's plates are
  padded/cropped to the same aspect so the car does not resize as you click through
  colours. A new render must be normalised to its siblings before it goes in.

## Where things live

| Change | File |
|---|---|
| prices, trims, paints, specs, equipment | `assets/data.js` |
| a model's lead photo in the lineup | `rowShot` / `rowFit` in `data.js` |
| a paint's render | `byColor`: `"MODEL\|Paint name": "photos/x.jpg"` |
| lineup card order | `floorOrder` in `data.js` (showroom walking order) |
| featured tile image | `heroShot` / `heroFit` in `data.js` |
| colour + spacing | `:root` in `assets/site.css` |
| hero variant | `data-hero="bleed"` or `"poster"` on `<body>` |

## Key behaviour

- **Lineup** — brand and body filters, sort cycles Showroom order → Cheapest →
  Dearest. Clicking a card opens the configurator without losing scroll position.
- **Configurator** — full page, not a modal: model → paint → trim, with live price,
  specs and equipment. Shareable URL: `#/build/avatr-11/lavender/2`. Only routes
  starting `#/` are configurations; plain anchors (`#lineup`) stay plain.
- **Test-drive form** — posts to WhatsApp. Set `WHATSAPP_NUMBER` at the top of
  `site.js` (digits only, full international) or per-location `whatsapp` in
  `data.js`. Unset, the form still validates and confirms on screen.

## Open before launch

1. Real street addresses and phone numbers for the three showrooms (`data.js`).
2. `WHATSAPP_NUMBER` for the test-drive form.
3. Placeholder domain `https://www.dabboussimotors.com` in the JSON-LD,
   `robots.txt` and `sitemap.xml`. Currency is hardcoded `USD`.
4. Stats band claims six showrooms, three are listed — confirm the count.
5. Missing paint renders: CS95 White, UNI-K (4 of 5 paints), F70 Hunter Silver.
   These fall back to another colour of the same model, so a customer sees the
   right car in the wrong paint.
6. Confirm pickup payload/towing figures against island homologation sheets.

## Run and deploy

```bash
python3 -m http.server 8000     # local preview, correct paths
npx vercel deploy --prod        # or: npx netlify deploy --prod
```

Node is only the deploy CLI; nothing needs it at run time.
