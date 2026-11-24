# AVATR 11 — design reference

Source: <https://www.avatr.com/en/11> · captured 2026-11-24 · Chromium 1440×900 @ dsf 1, and
iPhone 14 descriptor (dsf 3) at 390×844.

Every value below was read off the live DOM with `getComputedStyle` / `getBoundingClientRect`,
or out of `document.styleSheets` (no cross-origin sheets were blocked, so CSS rule text is the
site's own). Anything I could not obtain is marked **not measured** rather than guessed.

**Capture notes**

- HTTP 200, no redirect, no region gate, no cookie banner. Nothing to dismiss.
- All imagery, video and the brand webfonts come from `static.avatr.com`. On the first pass that
  host was blocked and the page measured 5864px tall with every `<img>` at 0×0 and the AVATR fonts
  in `status: "error"` (falling back to serif). The host was allowed and the page re-captured;
  the figures here are all from the loaded state — 63/65 images with non-zero intrinsic size and
  `AVATRFont-Light/Regular/Bold` all `loaded`.
- Document height **16072px** at 1440 wide (it grows 13995 → 16072 during the first scroll pass as
  lazy content lands). Mobile document height **9267px** at 390 wide; it varied 8488–9267 between
  runs depending on how much lazy content had resolved, so treat it as approximate.

---

## 1. Page architecture

Top-level bands, in order, as measured on the page's main container. "Dark/Light" is the band's own
`background-color` where it sets one; bands reading `rgba(0, 0, 0, 0)` are transparent over the
white canvas, and several of those are *visually* dark because a full-bleed photo fills them.

| # | Band (class stem) | Top | Height | Background | Tone | Contains |
|---|---|---:|---:|---|---|---|
| 1 | `AvatrHeader_avatr-header` | 0 | 64 | `rgba(0,0,0,0)` + `::after rgba(0,0,0,0.85)` | Dark | Fixed nav, wordmark, EN switch |
| 2 | `Banner_container` | 0 | 900 | `rgba(0,0,0,0)` | Dark (photo) | Full-bleed hero swiper, 5 slides, headline + price + button |
| 3 | *(design section)* | 900 | 2528 | `rgba(0,0,0,0)` | Light | "Across space and time" title band, 5-up design gallery, paint swatch scroller, dimension specs |
| 4 | `FirstTitle_first-title` + `Power_intelligent-ti` | 3548 | 940 | `rgba(0,0,0,0)` | Dark (photo) | Full-bleed photo title band, "A strong run into the wind" |
| 5 | `Power_container-reev` | 4464 | 1058 | `rgba(0,0,0,0)` | Light | REEV / 800V platform carousel, 3 spec numbers |
| 6 | `Power_container-ev` | 5550 | 738 | `rgba(0,0,0,0)` | Light | 800V SiC platform, image + copy card, video, 3-dot pager |
| 7 | `FirstTitle_first-title` + `Luxury_luxury-first-` | 6338 | 940 | `rgba(0,0,0,0)` | Dark (photo) | "New chapter of future and luxury" |
| 8 | `SecondTitle_second-title` + `Luxury_luxury-seco` | 7232 | 76 | `rgba(0,0,0,0)` | Light | "Emotional Intelligent Cockpit" / "Every seat is VIP seat" |
| 9 | `Luxury_luxury-cockpit` | 7368 | 800 | `rgb(0, 0, 0)` | **Dark** | Cockpit photo |
| 10 | `Luxury_interior-texture` | 8168 | 976 | `rgb(0, 0, 0)` | **Dark** | Ambient-light / materials, video + 3 images |
| 11 | `Luxury_interior-seat` | 9144 | 1800 | `rgb(0, 0, 0)` | **Dark** | Zero-gravity seats, two full-bleed photos with overlaid copy |
| 12 | `Luxury_interior-sound` | 10944 | 885 | `rgb(0, 0, 0)` | **Dark** | Meridian™ audio, video |
| 13 | `SoundAlgorithms_algorithms` | 11829 | 698 | `rgb(0, 0, 0)` | **Dark** | 6 sound-algorithm tiles (7 images) |
| 14 | `SoundAlgorithms_HarmonyOS` | 12526 | 500 | `rgb(0, 0, 0)` | **Dark** | HarmonySpace 5 |
| 15 | `Luxury_interior-HarmonyOS` | 13026 | 976 | `rgb(0, 0, 0)` | **Dark** | Super Desktop, ecology |
| 16 | `FirstTitle_first-title` | 14002 | 940 | `rgba(0,0,0,0)` | Dark (photo) | "Smart driving, worry-free Journey." |
| 17 | `HuaweiADS_HuaweiADS-content-section` | 14894 | 895 | `rgba(0,0,0,0)` | Light | HUAWEI ADS 5, 7 images |
| 18 | `AvatrFooter_footer` | 15789 | 283 | `rgb(251, 251, 251)` | Light | Disclaimer + link row |

Also present, outside the flow: `AvatrFloatButton_container` (48px, a back-to-top chip pinned
bottom-right), and the header's mega-menu panel `vehicleMenu_vehicle-menu` — 1440×64 at y=64,
`rgba(0, 0, 0, 0.75)` with `backdrop-filter: blur(20px)`, hidden until the nav is opened.

The macro-rhythm is: **light editorial section → full-bleed photographic title band → light section →
a continuous ~5600px black interior sequence (bands 9–15) → light section → light footer.**

## 2. Colour

Dominant: a near-white canvas and a true-black interior chapter, with one single accent used
sparingly. There is no secondary brand hue anywhere on the page.

| Role | Value | Where |
|---|---|---|
| Canvas | `html` and `body` both compute `background-color: rgba(0, 0, 0, 0)` | Nothing paints it, so it renders as the browser's white |
| Dark section fill | `rgb(0, 0, 0)` | Bands 9–15, the whole interior chapter |
| Footer fill | `rgb(251, 251, 251)` | `AvatrFooter_footer` (#FBFBFB) |
| Nav scrim | `rgba(0, 0, 0, 0.85)` | `.AvatrHeader_header-pc::after` |
| Mega-menu scrim | `rgba(0, 0, 0, 0.75)` + `blur(20px)` | `vehicleMenu_vehicle-menu` |
| Primary text (light bg) | `rgb(24, 24, 24)` (#181818) | All headings, spec numbers, captions |
| Body text | `rgb(51, 51, 51)` (#333) | `body` default, some paragraph copy |
| Muted text | `rgb(153, 153, 153)` (#999) | Sub-labels on dark, e.g. "Full-grain semi-aniline" |
| Dimmed label | `rgba(0, 0, 0, 0.5)` | Inactive gallery labels, e.g. "Body with the golden ratio" |
| Footer text | `rgb(126, 126, 126)` (#7E7E7E) | Disclaimer and every footer link |
| Text on dark/photo | `rgb(255, 255, 255)` | Hero, all interior-chapter copy |
| Nav link, inactive | `rgba(255, 255, 255, 0.7)` | About us, Overseas, Design, Tech |
| Nav link, active | `rgb(255, 255, 255)` | Models |
| **Accent** | **`rgb(180, 215, 25)` (#B4D719)** | Active nav underline, button glow mask, menu card tag |

The accent is a sharp yellow-green. It appears only as: a 1px underline under the active nav item,
an 85×85 rotated tag in the mega-menu, and a blurred glow behind the dark button variant. It is
never used for a fill, a heading, or body text.

**Buttons** carry their colours as custom properties on `.AvatrButton_ava-button`:

```
--btn-link-color: #181818;  --btn-plain-color: #181818;
--btn-plain-hover-color: #fff;  --btn-plain-hover-background: #181818;
```

Variants override: `.light` → `background: rgb(251,251,251); color: rgb(24,24,24)`,
`.dark` → `background: rgb(24,24,24); color: rgb(251,251,251); border: 1px solid rgb(24,24,24)`.
The hero sits on photography and overrides to a white 1px outline on transparent.

## 3. Typography

One superfamily, three weights, no system fallback in the resolved stack — every measured element
reported `font-family: AVATRFont-Light` / `AVATRFont-Regular` / `AVATRFont-Bold` with no comma list.
It is a geometric sans with notably wide, open counters.

**Webfont files loaded** (from the network log; all `font-display: swap`):

```
https://static.avatr.com/assets/fonts/AVATRFont/v1/AVATRFont-Light.woff2?v=4     weight 300
https://static.avatr.com/assets/fonts/AVATRFont/v1/AVATRFont-Regular.woff2?v=4   weight 400
https://static.avatr.com/assets/fonts/AVATRFont/v1/AVATRFont-Bold.woff2?v=4      weight 500
```

Three further faces are *declared* but never fetched, and `document.fonts` reports them `unloaded`:
`AVATRFont-Light-EN`, `AVATRFont-Regular-EN`, `AVATRFont-Bold-EN`
(`//static.avatr.com/assets/fonts/AVATRFont/v1/AVATRFont-*_EN.woff2`). The English page renders in
the CJK-superset faces, not the EN cuts. A fourth, `swiper-icons`, is a base64 data-URI icon font.

Note `AVATRFont-Bold` is declared at `font-weight: 500`, so the heaviest weight on the page is 500.

| Role | Family | Size / line-height | Weight | Tracking | Colour |
|---|---|---|---|---|---|
| Hero headline ("AVATR 11") | AVATRFont-Regular | 38px / 45px | 400 | **4px** | #fff |
| Hero sub ("The Futuristic Luxury SUV") | AVATRFont-Regular | 14px / 16px | 400 | **2px** | #fff |
| Hero "Starting MSRP:" | AVATRFont-Regular | 14px / 20px | 400 | normal | #fff |
| Hero price ("￥ 429,900") | **AVATRFont-Bold** | 20px / 20px | 400 | normal | #fff |
| Chapter title ("Across space and time") | AVATRFont-Regular | **56px / 84px** | 400 | normal | #181818 |
| Section heading ("Innovative design…") | AVATRFont-Light | 42px / 42px | **200** | normal | #181818 |
| Section heading, alt | AVATRFont-Light | 36px / 42px | 200–300 | normal | #181818 or #fff |
| Section sub-heading | AVATRFont-Light | 20px / 24px | 200 | normal | #181818 |
| Card heading ("HUAWEI DriveONE…") | AVATRFont-Light | 30px / 36px | 300 | normal | #181818 |
| Dimension number ("4895mm") | AVATRFont-Regular | 24px / 32px | 400 | normal | #181818 |
| Headline stat ("3C", "225", "1065") | AVATRFont-Regular | **36px / 38px** | 400 | normal | #181818 |
| Stat unit ("km") | AVATRFont-Regular | 12px / 38px | 400 | normal | #181818 |
| Stat caption ("CLTC pure electric range…") | AVATRFont-Light | 16px / 24px | 300 | normal | #181818 |
| Small label / eyebrow ("Length") | AVATRFont-Regular | 12px / 16px | 400 | normal | #181818 |
| Gallery label, active | AVATRFont-Regular | 16px / 24px | **500** | normal | #181818 |
| Gallery label, inactive | AVATRFont-Regular | 16px / 24px | 400 | normal | `rgba(0,0,0,0.5)` |
| Body copy (light) | AVATRFont-Light | 16px / 24px | 300 | normal | #181818 |
| Body copy (dark) | AVATRFont-Light | 16px / 28px | 400 | normal | #fff |
| Nav link | AVATRFont-Regular | 13px / 22px | 400 | normal | #fff / `rgba(255,255,255,.7)` |
| Button label | AVATRFont-Regular | 14px / normal | 400 | normal | inherits variant |
| Footer link | AVATRFont-Regular | 14px / 28px | 400 | normal | #7E7E7E |
| Footer disclaimer | AVATRFont-Regular | 12px / 14px | 400 | normal | #7E7E7E |
| `body` default | AVATRFont-Regular | 13px / 14.95px | 400 | normal | #333 |

`text-transform` is `none` on **every** element measured — nothing is uppercased in CSS. The caps in
"AVATR 11" are authored caps. Letter-spacing is `normal` everywhere except the two hero lines
(4px and 2px).

The `<h1>` is `AVATR 11` at 26px/700 but measures 0×0 — it is a hidden SEO heading, not the visible
hero type, on both desktop and mobile.

## 4. Spacing and layout

- Page is **1440px** wide; main content column is **1280px**, giving **80px** left/right gutters.
  `SecondTitle_second-title` is `padding: 0px 80px` on a 1440 box with a 1280 inner.
- Chapter title block `FirstTitle_section-title`: `padding: 120px 80px`, 1440×324, `text-align: center`.
- Full-bleed photographic bands are a consistent **1440×940**.
- The hero is exactly **1440×900** — one viewport.
- Dimension spec row: a **flex** row, `gap: 40px`, each cell `Design_size-item` is
  `display: list-item` with `padding: 0px 0px 0px 10px` — so each figure is marked by a list bullet
  and a 10px indent, **not** by a border or a box. No `grid-template-columns` is used there.
- Content gallery images render at **1280×640** inside the 1280 column; paint swatch strips at
  **1280×347**.
- Footer: `padding: 50px 0px 0px`; its disclaimer row `AvatrFooter_disclaimers-wrap` is
  `display: flex; justify-content: space-between; padding: 0px 60px` — note the footer uses a
  **60px** gutter where the body uses 80px.
- Alignment is mixed and deliberate: chapter/section headings are `text-align: center` and centred in
  the column, while hero copy and the copy overlaid on interior photography are **left-aligned at
  x=80**, flush to the body gutter.

## 5. Buttons and small UI

The button is a three-layer component: an outer sizing box, an inner `__con` that carries the border
and centres the label, and a `__mask` glow span.

Defaults, as custom properties on `.AvatrButton_ava-button`:

```
--btn-width: 128px;  --btn-height: 36px;  --btn-font-size: 14px;
--btn-radius: 4px;   --btn-font-weight: normal;
```

The hero instance overrides to **112×40**. Measured on it:

| Property | Value |
|---|---|
| Fill | `rgba(0, 0, 0, 0)` (transparent) |
| Border | `1px solid rgb(255, 255, 255)` |
| `border-radius` | **4px** |
| `padding` | `0px` — the label is centred with `display:flex; align-items:center; justify-content:center` |
| Label | 14px AVATRFont-Regular, 400, `rgb(255,255,255)`, `white-space: nowrap` |
| `transition` | `0.2s linear` on `__con`; `0.3s linear` on the mask |

**Border-radius is 4px, not 0** — the only softened corner in an otherwise hard-edged layout.

The outline variant draws its hairline with the classic scale trick rather than a plain border:

```css
.AvatrButton_plain .AvatrButton_ava-button__con { border: 0; position: relative; }
.AvatrButton_plain .AvatrButton_ava-button__con::after {
  content:" "; width:200%; height:200%; position:absolute; top:0; left:0;
  border:1px solid var(--btn-plain-color); transform:scale(.5); transform-origin:0 0;
  border-radius: calc(var(--btn-radius) * 2);
}
```

The `__mask` is the signature detail: an **ellipse of the lime accent** parked at the button's bottom
edge — `background: rgb(180,215,25); border-radius: 100%; width: 90%; height: 18%; bottom: 6px;
box-shadow: rgb(180,215,25) 0 0 15px`, plus a blur. On the `.dark` variant it sits at
`bottom: -33px; width: 84%; height: 50%; filter: blur(8px); opacity: 1` and the hover rule lifts it to
`bottom: -18px` — a green glow rising from under the button.

**Hover:** I could not trigger a visible change. Synthetic hover on the hero button left
`__con` and `__mask` identical (mask stayed `opacity: 0`). Reading the CSS shows why: each hover rule
is immediately followed by a later rule that cancels it, e.g.

```css
.AvatrButton_light:hover .__mask { opacity:1; transform:translate3d(0,8px,0); }
.AvatrButton_light:hover .__mask { opacity:0; transform:none; }   /* wins */
.AvatrButton_plain:hover .__con { background-color:var(--btn-plain-hover-background); color:var(--btn-plain-hover-color); }
.AvatrButton_plain:hover .__con { background:transparent; color:var(--btn-plain-color); }  /* wins */
```

So on this build hover is effectively neutralised and the glow only appears on `:active`
(`:active .__mask { opacity:1; transform:translate3d(0,8px,0) }`). The *designed* hover — label
inverting to `#fff` on `#181818`, glow rising — is in the stylesheet but overridden. The rendered
hover state is therefore **not measured** (it does not change).

Other small UI: the active nav item's underline is `AvatrHeader_menu-name::after` — 1px tall,
`rgb(180, 215, 25)`, width matched to the label (46.9px under "Models"), transitioning
`transform 0.3s cubic-bezier(0.42, 0, 0, 1)`. Carousels use a 3-dot / 3-dash pager; a 48px
back-to-top chip floats bottom-right.

## 6. Motion

No animation library is present. `window` was probed for GSAP, ScrollTrigger, Lenis, Swiper,
LocomotiveScroll, ScrollMagic, AOS, Vue, jQuery, anime, THREE, SplitText, TweenMax and barba —
**every one is `false`**. The only relevant global is `IntersectionObserver: true`. The stack is
**Next.js** (`__NEXT_DATA__` present, `_next/static/chunks/…`) with **Swiper** bundled as a module
(34 elements matching `[class*="swiper"]`, `data-swiper-slide-index` on 20 of them) rather than
exposed globally. Reveal is driven by IntersectionObserver toggling classes, not by a scroll library —
there is no smooth-scroll hijacking (`html { scroll-behavior: auto }`).

Transitions actually in force, by element count:

| Count | Transition |
|---:|---|
| 44 | `opacity 0.2s ease-in-out` |
| 32 | `opacity 0.3s linear` |
| 11 | `all 0.3s cubic-bezier(0.42, 0, 0, 1)` |
| 11 | `border 0.3s cubic-bezier(0.42, 0, 0, 1)` |
| 11 | `opacity 0.3s cubic-bezier(0.42, 0, 0, 1)` |
| 10 | `all 0.2s linear` |
| 10 | `all 0.3s linear` |
| 8 | `transform 0.3s cubic-bezier(0.42, 0, 0, 1)` |
| 6 | `color 0.3s cubic-bezier(0.42, 0, 0, 1)` |
| 3 | `transform 0.5s cubic-bezier(0.77, 0.2, 0.05, 1)`, `opacity 0.55s ease` |
| 3 | `opacity 0.6s ease-in-out` |

**`cubic-bezier(0.42, 0, 0, 1)` at 0.3s is the house easing** — it appears on all, border, opacity,
transform and color. `cubic-bezier(0.77, 0.2, 0.05, 1)` at 0.5s is Swiper's slide easing.

`@keyframes` defined: the complete **animate.css** set (`fadeIn`, `fadeInUp`, `fadeInDown`,
`fadeInLeft/Right`, `zoomIn*`, `slideIn*`, `bounce*`, `flip*`, `rotateIn*`, `lightSpeed*`, `backIn*`,
`hinge`, `jackInTheBox`, `rollIn`, `pulse`, `tada`, `wobble`, `jello`, `heartBeat`, `shakeX/Y`,
`swing`, `rubberBand`, `headShake`, `flash` and their `Out` counterparts), plus
`swiper-preloader-spin`, `adm-spin-loading-rotate`, `adm-skeleton-loading`, `loading-rotate`,
`AvatrLoading3D_aui-loading-box`, `AvatrLoading3D_aui-loading`,
`AvatrPagenation_pager-step-line-ani`, `Toast_loading-rote`.

No element was running an `animation` at rest (`animation-name: none` on every node sampled after a
full scroll) — the animate.css keyframes are applied on reveal and are not continuous.

Transforms held at rest include `Card_btns-wrap` at `matrix(1,0,0,1,0,12)` — translated 12px down,
waiting to slide up with `0.3s cubic-bezier(0.42, 0, 0, 1)` — and `Card_card-tag` at
`matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)`, a 45° rotation for the diagonal menu tag.

No `data-*` reveal attributes are used; the only data attributes are Swiper's and the site's own
(`data-car-type`, `data-name`, `data-multiple`).

## 7. Imagery

Photography is the page. Hero and title bands bleed the full 1440 with no column inset.

| Image role | Intrinsic | Ratio | Rendered | `object-fit` | Bleeds? |
|---|---|---|---|---|---|
| Hero slides (5) | 4320×2400 | **1.800** | 1440×900 | `cover` | yes |
| Chapter title bands | 4320×2820 | **1.532** | 1440×940 | `fill` | yes |
| Gallery / feature images | 3840×1920 | **2.000** | 1280×640 | `fill` | no (1280 column) |
| Paint swatch strips | 4320×1170 | **3.692** | 1280×347 | `fill` | no |

Assets are served at **3× the rendered size** (4320 for a 1440 slot, 3840 for 1280) — retina-grade
source throughout. Note the mix: the hero uses `object-fit: cover`, everything else `fill`, so the
non-hero images are matched to their slot ratio at authoring time rather than cropped by CSS.

Video: `<video>` elements are `loop` + `muted`, `object-fit: cover`, each with a matching `.jpg`
poster from the same directory, e.g.
`/pc-website/videos/car11/v2/power-800v_02.mp4` with poster `…/images/reev11/v1/pc/power-800v_02.jpg`.
They are not `autoplay` as authored. Rendered at 853×262 and 1280-wide.

**There is no gradient or scrim over the photography.** A sweep for `background-image` containing
`gradient` inside the hero returned nothing, and the page-wide sweep returned nothing either. White
text sits directly on the image and stays readable because the photographs are *composed* for it —
the hero art has a dark concrete wall and shadowed forecourt filling the left third exactly where the
headline, price and button sit; the zero-gravity-seat band has its copy over the dark footwell. Text
legibility is an art-direction decision here, not a CSS one.

## 8. Nav and footer

**Nav** — `<header class="AvatrHeader_avatr-header">`, `position: fixed`, `z-index: 99`,
**64px** tall, full 1440 width. The header element itself is `background-color: rgba(0, 0, 0, 0)`;
the bar is painted entirely by a pseudo-element:

```css
.AvatrHeader_header-pc { width:100%; height:64px; padding:0 40px;
  color:rgba(255,255,255,.7); display:flex; justify-content:space-between; align-items:center; }
.AvatrHeader_header-pc::after { content:""; position:absolute; inset:0; z-index:-1;
  width:100%; height:100%;
  background: rgba(0,0,0, var(--backgtound-opacity));
  backdrop-filter: blur(var(--backgtound-blur)); }
```

Both are JS-driven custom properties (the typo `--backgtound-` is theirs). Measured:

| | `::after` background | `backdrop-filter` | Sampled bar pixel |
|---|---|---|---|
| At top (y=0) | `rgba(0, 0, 0, 0.85)` | `blur(0px)` | `rgb(33, 33, 33)` |
| Scrolled, light section (y=4700) | `rgba(0, 0, 0, 0.85)` | **`blur(3px)`** | `rgb(38, 38, 38)` |
| Scrolled, dark section (y=9500) | `rgba(0, 0, 0, 0.85)` | `blur(3px)` | `rgb(25, 28, 31)` |

So the nav is **always an 85%-black scrim** — it does not go transparent over the hero and does not
gain a fill on scroll. The only scroll change is the backdrop blur switching from 0 to 3px. Height,
position, `box-shadow` (`none`) and opacity are identical at every scroll position; there is no
hide-on-scroll-down behaviour.

Nav padding is `0 40px` — half the 80px body gutter, so links sit further out than the content.
Links are 13px/22px, inactive `rgba(255,255,255,0.7)`, active `#fff` with the 1px lime underline.
Layout is `justify-content: space-between`: links left, centred AVATR wordmark, globe + "EN" right.

**Footer** — `AvatrFooter_footer`, 1440×**283**, `background: rgb(251, 251, 251)`,
`padding: 50px 0 0`, two visible rows (a third, `AvatrFooter_mobile-footer`, is `display: none`):

1. `AvatrFooter_disclaimers-wrap` — 1440×74, `display: flex; justify-content: space-between;
   padding: 0 60px`. A 1148px-wide legal disclaimer at 12px/14px `#7E7E7E`
   ("The functions and configuration involved in the videos/pictures…").
2. `AvatrFooter_pc-footer` — 1440×135, a horizontal link row at x=60: *Legal*, *Policy*,
   *Cooperation and joining*, *Avatr Customer Center：951990*, *Email：contactus@avatr.com* — all
   14px/28px `#7E7E7E`.

The footer is quiet by design: one tone of grey text, no headings, no columns, no social icons, no
rules or dividers (`border-top: none` on both rows).

---

## What makes this page feel like it does

1. **One typeface, three weights, and the heavy end is only 500.** Every heading from 20px to 56px is
   AVATRFont at weight 200–400; nothing is bold, nothing is uppercased in CSS, nothing is condensed.
   The hierarchy is carried almost entirely by *size and whitespace*, so the page reads calm even at
   56px. Copying the look means resisting the urge to reach for 600/700.

2. **The chapter title is 56px set on an 84px line — a 1.5 leading ratio on a display size.** That one
   value does more than any other to make the page feel architectural rather than promotional. Compare
   the section headings below it at 42px/42px (1.0) — tight — so the big titles float and the
   sub-heads lock up.

3. **Letter-spacing exists in exactly two places.** `AVATR 11` at 38px/4px and its sub-line at
   14px/2px. Everything else on a 16072px page is `normal`. Tracking is reserved as a badge of the
   brand mark, not used as a decorative texture.

4. **The nav never changes colour — only its blur.** It is `rgba(0,0,0,0.85)` from the first pixel to
   the last, over white sections and black alike, and the sole scroll response is
   `backdrop-filter: blur(0px) → blur(3px)`. That consistency is why the page never feels like it
   "re-sets" as you scroll through eight tonal changes.

5. **White text sits on photography with no scrim at all.** No gradient, no overlay, no tint — the
   legibility comes from art direction (hero copy lands on a shadowed concrete wall; interior copy
   lands in the dark footwell). If you reproduce this layout with stock photography you will have to
   add a scrim, and it will immediately look less expensive.

6. **Spec numbers are plain, not boxed.** "4895mm" is 24px/32px Regular at `#181818` in a flex row with
   `gap: 40px`, each cell a `list-item` with a 10px indent — no borders, no cells, no backgrounds. The
   headline stats ("3C", "225", "1065") step up to 36px/38px with the unit dropped to 12px riding the
   same 38px baseline. Restraint, not instrumentation.

7. **A single accent, `#B4D719`, used three times and never as a fill.** A 1px underline under the
   active nav item, a rotated tag in the menu, and a blurred glow mask under the dark button. One
   acid-green note against black, white and #181818 — the whole palette is otherwise neutral.

8. **Everything eases on `cubic-bezier(0.42, 0, 0, 1)` at 0.3s.** A fast-out, very-long-settle curve
   applied uniformly to colour, border, opacity and transform. Combined with the 4px button radius —
   the only rounded corner on the page — it gives the interface a soft landing inside an otherwise
   rectilinear, hard-edged layout.
