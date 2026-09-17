# Dabboussi Motors — static site

The design handoff, built as a real site. No framework, no build step, no server.
Open `index.html` in a browser and it runs; upload the folder to any static host and
it is live.

```
index.html          the whole page — markup, copy, meta tags
favicon.svg
assets/ds.css       Modernist design system tokens and components (unchanged)
assets/site.css     house palette, layout, motion
assets/data.js      the 19 vehicles, showrooms, photo maps  ← the file a CMS replaces
assets/site.js      state, rendering, interactions
assets/map.js       the showroom locator map
photos/             113 photographs + the Avatr brandmark
```

## Deploying

Any static host works. Drag the folder onto **Netlify Drop**, or:

```bash
npx vercel deploy --prod      # Vercel
npx netlify deploy --prod     # Netlify
```

For GitHub Pages, push the folder to a repo and enable Pages on the branch root.
For ordinary hosting, upload the folder by FTP. Nothing needs Node at run time —
Node above is only the deploy CLI.

To preview locally with correct paths:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

## What was carried over, and what changed

Everything the handoff called design — layout, type scale, colour, copy, the load
sequence, the interaction model — is reproduced against the documented token values.
The vehicle data is verbatim: prices, trim names, paint names, specs and equipment
lists are the dealer's own.

Four deliberate changes:

- **The prototype runtime is gone.** `support.js` and `image-slot.js` were scaffolding.
  Template holes became DOM rendering; `<image-slot>` became `<img>` with the
  `object-fit` each slot called for.
- **Inline styles became classes.** Same values, in `assets/site.css`, so they can be
  changed in one place.
- **The Lumin paint map was fixed.** In the prototype, Mint Green pointed at
  `lumin-light-cyan.jpg`, Light Cyan at `lumin-lavender.jpg`, and so on — the map was
  rotated by one. Every correctly named file exists, so paints now match their renders.
- **Missing photography is labelled, not blank.** Where no render exists, the panel
  reads "Photograph to come" rather than showing an empty box.

## Three things to do before launch

**1. Give the test-drive form a WhatsApp number.** Requests go to WhatsApp: set
`WHATSAPP_NUMBER` at the top of `assets/site.js` to the house number in full
international form, digits only (`599717XXXX`), or give a location its own
`whatsapp` in `assets/data.js` so each island answers its own enquiries. Submitting
then opens WhatsApp with the name, phone, model and chosen showroom already written
out, and the button reads "Send on WhatsApp" rather than "Request a test drive".

Until a number is set the form validates and confirms on screen and the button keeps
the neutral label — nothing looks broken, it simply has nowhere to send. `FORM_ENDPOINT`
is still there if you would rather POST the fields to Formspree, Basin or your own
handler; a WhatsApp number takes precedence over it.

The phone numbers in `assets/data.js` and the `tel:` link beside the submit button are
still placeholders — replace them at the same time.

**2. Two models still have no photograph.** The hotlinked images are already off
(`REMOTE_PHOTOS = false` in `assets/site.js`): nothing on the page now loads from
Wikimedia or from a distributor's server, and a model whose exact paint has no render
falls back to the dealer's own photograph of that model in another paint. Every model now has photography. **CS95** has one photograph, used both as its lineup
card and for its Black paint; its White paint falls back to that car until a white
render arrives. **X7 PLUS** is now photographed in all three paints, its
swatches corrected to the real colours (Silver, White, Sky Blue — the placeholder navy
was nothing like the car).

**CS75 PLUS** is now fully photographed: five paints, each with its own exterior render,
plus three interior trims in its configurator gallery. Its paint list in `assets/data.js`
was rewritten to match the renders the dealer supplied — Champagne Gold, Sky Blue, Andes
Grey, Dark Grey and Noble Black — replacing the earlier Silver / Blue / Beige placeholders.

**3. Replace the placeholder details.** Showroom street addresses and phone numbers in
`assets/data.js` are placeholders, as flagged in the handoff. The about section still
waits on a showroom photograph. The stats band claims six showrooms while three are
listed — confirm the real count.

## Which paints have their own render

Fully rendered, every paint: **LUMIN, ALSVIN, ALSVIN PLUS, CS35 PLUS, CS35 MAX,
CS55 PLUS, CS55 NEW PLUS, CS75 PLUS, X7 PLUS, UNI-T, F70 HUNTER, HUNTER PLUS,
DEEPAL S05, DEEPAL S07, DEEPAL G318 HYBRID, AVATR 07, AVATR 11**.

Still short — these paints fall back to another colour of the same model, so a
customer sees the right car in the wrong paint:

- **CS95** — 1/2: White
- **UNI-K** — 4/5: Silver, White, Blue, Dark grey

**CS35 MAX** is a mixed set: Red, White and Dark Grey are side-profile studio plates,
Black is a front three-quarter from another shoot, and Silver is a location photograph
(cropped to the same frame ratio for the chooser, shown wide on the lineup card). All
five sit in one frame so nothing resizes, but the camera angle changes between colours
— replace Black and Silver with side profiles when the dealer has them.

Two notes from the paint audit: **F70 HUNTER** Silver points at the dark-grey render
as a stand-in until a silver one arrives, and **CS95** has no photograph at all.
Every other mapped paint was checked against its render and shows the right colour.

## Seats, payload and towing

Every trim's spec map now carries `Seats`, and the two pickups (**F70 HUNTER**,
**HUNTER PLUS**) also carry `Payload` and `Towing`. The seat counts are the dealer's
own lineup (Lumin 4, CS95 and X7 Plus 7, everything else 5).

The pickup figures are the manufacturer's published payload and braked towing —
1,000 kg payload for both, 2,500 kg towing on the F70 and 3,000 kg on the Hunter Plus.
**Confirm these against the island homologation sheets before launch**, since towing
ratings vary by market and by whether the trailer is braked.

## Shareable configuration links

A built car has its own URL: `#/build/avatr-11/lavender/2` — model, paint, trim.
Open that link and the configurator opens on exactly that combination, so a salesperson
can send a customer the car they just configured. **Copy link** sits in the configurator's
summary bar. Plain anchors (`#lineup`, `#contact`) are untouched; only routes beginning
`#/` are treated as configurations, and a clean URL stays clean.

Unknown models or paints in a link fall back to the first available rather than erroring,
so a stale link still opens something sensible.

## Search

`index.html` carries a JSON-LD `AutoDealer` block: the three showrooms, the three brands,
and all 19 models as `Offer`s with price, currency and fuel type. Fuel type is derived from
each model's own specs — the G318 and Avatr 07 are marked `Hybrid` rather than `Electric`,
because both pair a combustion engine with a battery.

Three things to fix there before launch: the placeholder domain
(`https://www.dabboussimotors.com`) in the JSON-LD, `robots.txt` and `sitemap.xml`; the
currency, which is hardcoded `USD`; and the block itself, which is a snapshot — regenerate
it whenever prices or the lineup change in `assets/data.js`.

## Changing things

- **Prices, trims, paints, equipment** → `assets/data.js`. It is one array of 19 records;
  the shape is the contract the rest of the site reads. This is the file to swap for a
  CMS or API call when there is one.
- **A model's lead photograph in the lineup** → `rowShot` in `assets/data.js`
  (CS35 PLUS already overrides its studio render with a lifestyle shot).
- **A paint's render** → add `"MODEL|Paint name": "photos/file.jpg"` to `byColor`.
- **The hero** → the ruled hero ships by default. Add `data-hero="bleed"` or
  `data-hero="poster"` to `<body>` for the two alternates; bleed uses
  `photos/hero-hunter-bonaire.jpg`.
- **Colour and spacing** → the `:root` block at the top of `assets/site.css`.

`photos/` also holds 22 files the site does not currently use — spare angles for the
Alsvin, Alsvin Plus, G318 and Avatr 11. They are there for when a model needs a
different shot.

## Opening hours

Mon–Fri 08:00–12:30 and 14:00–18:00, closed over midday, on all three islands — in
`assets/data.js` per location, and in the JSON-LD `openingHours` in `index.html`.
No Saturday hours are published; add a `Sa` entry in both places if the showrooms open.

## The locator map

The showrooms section carries a locator map of the three islands. Geography is never
drawn by hand: the coastline is Natural Earth geometry (world-atlas 110m, public
domain) projected with d3-geo, and each island is marked at its real coordinates —
the three are smaller than that dataset resolves, so they are pinned rather than
outlined. The scale bar is measured on the sphere, so it stays honest at any width.

d3 and topojson-client load from pinned, hash-verified tags at the end of
`index.html` — do not change their versions, URLs or hashes. The map draws only once
the geometry arrives; until then the panel keeps its placeholder label, so the page
never shows a broken frame. Styling lives in the `.map-panel` block of
`assets/site.css`.

## Notes

Reduced motion is honoured throughout: the load sequence, hover scaling and the
pointer parallax all switch off under `prefers-reduced-motion`. The layout is fluid
down to about 360px, with the lineup rows restacking below 820px. Archivo loads from
Google Fonts; self-host it if you would rather not depend on that.
