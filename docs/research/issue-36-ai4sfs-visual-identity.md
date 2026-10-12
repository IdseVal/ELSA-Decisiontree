# The visual identity of ai4sfs.org, measured

> Research deliverable for issue #36. Written by the Planner in a headless run.
> Everything below was observed on **2026-09-09, between 22:03 and 22:12 UTC**
> (2026-09-10, 00:03--00:12 local time), against the live site.
> Nothing here is inferred from documentation: every value is followed by the request
> that produced it and the raw bytes, CSS rule or pixel that carries it.
>
> This document is input for two later issues: the Tree-format architecture issue that
> defines what a Tree's **Theme** block may hold (`docs/CORE_DOCUMENT.md` 3.1, 3.2), and
> the theme build issue that copies the assets into the repository. It designs neither.

## 0. Summary for the reader in a hurry

The site is a Joomla installation with the YOOtheme Pro template (UIkit). Its identity is
built from **one yellow (`#ffc600`)**, **one green (`#41ab64`)**, **near-black text
(`#2d2e33`)** on a **white page (`#ffffff`)**, set in **Open Sans** throughout, with
**Nova Square** reserved for one oversized display heading. There are exactly **two logo
image files** on the whole site, both raster, **both with an opaque background baked into
the pixels** -- one white, one yellow. There is no transparent logo and no vector logo.
Both font families are under the SIL Open Font License 1.1; the fonts embedded on the
site carry `fsType = 0`, which permits embedding without restriction.

The role -> value table the architecture and build issues can copy is section 7.

## 1. How this was measured, and with what

The brief for this issue names the `just-scrape` skill. The CLI is installed in this
worktree, but it is **not configured**: it has no API key and, run headless, it blocks on
an interactive prompt.

```
$ just-scrape validate
╔═╗╦ ╦╔═╗╔╦╗   ╔═╗╔═╗╦═╗╔═╗╔═╗╔═╗
...
◆  Enter your ScrapeGraph API key (get one at https://dashboard.scrapegraphai.com):
```

`SGAI_API_KEY` is unset and `~/.scrapegraphai/config.json` does not exist. Per the
Planner's research duties ("never let a missing tool turn into a guess"), the measurement
was done with tools that need no account:

| Tool | Version | Used for |
|---|---|---|
| `curl` | 8.2.1 (x86_64-w64-mingw32), libcurl/8.2.1 | fetching pages, stylesheet, images, fonts; reading response headers |
| Google Chrome, headless (`--headless=new`) | Chrome for Windows, `--screenshot`, `--virtual-time-budget=10000` | rendering the pages as a browser actually paints them |
| Pillow (Python) | PIL, Python 3.13 | reading image dimensions, alpha channels and **sampling rendered pixels** |
| fontTools + brotli | fontTools 4.60.0 | decoding the served `.woff2` files and reading their `name` and `OS/2` tables |

Every `curl` call used `-A "Mozilla/5.0 (research; ELSA-Decisiontree issue 36)"`.

Pages fetched (all with `curl -sS -D <headers> -o <file>`):

| URL | Status | Bytes | Note |
|---|---|---|---|
| `https://ai4sfs.org/` | 200 | 26,505 | English home page |
| `https://ai4sfs.org/nl/` | 200 | 30,202 | Dutch home page |
| `https://ai4sfs.org/about-ai4sfs` | 200 | 26,038 | |
| `https://ai4sfs.org/publications` | 200 | 28,239 | |
| `https://ai4sfs.org/services` | 200 | 24,336 | |
| `https://ai4sfs.org/partners` | **404** | 2,496 | menu entry with no page; this is the theme's 404 page |

Response headers of the home page, quoted in full for the record:

```
$ curl -sS -D - -o home.html https://ai4sfs.org/
HTTP/1.1 200 OK
x-powered-by: PHP/8.1.32
set-cookie: 4ca957b8f9cbc14a0c08ce7edc5db025=...; path=/; secure; HttpOnly
x-frame-options: SAMEORIGIN
referrer-policy: strict-origin-when-cross-origin
content-type: text/html; charset=utf-8
last-modified: Wed, 09 Sep 2026 22:03:48 GMT
server: LiteSpeed
```

The stylesheet that carries the whole identity:

```
$ curl -sS -D - -o theme.9.css "https://ai4sfs.org/templates/yootheme/css/theme.9.css?1788434784"
HTTP/1.1 200 OK
content-type: text/css
content-length: 442869
last-modified: Thu, 03 Sep 2026 11:26:24 GMT
etag: "6c1f5-6a995960-f0824db5c292e703;;;"
```

It is linked from every page as
`<link href="/templates/yootheme/css/theme.9.css?1788434784" rel="stylesheet">`.
The only other stylesheets the page loads are Joomla plumbing
(`/media/plg_system_jcepro/site/css/content.min.css`, 8,484 bytes, and
`/media/vendor/joomla-custom-elements/css/joomla-alert.min.css`, 3,654 bytes); **neither
declares a single `font-family`**, so `theme.9.css` is the sole source of the identity.
Beyond it the home page carries exactly one inline `<style>` block:

```html
<style>#page\#0 .uk-h2,#page\#0 h2{color: #fff;}#page\#1 .uk-h2,#page\#1 h2{color: #fff;}</style>
```

Where this document quotes a CSS rule, the rule was extracted from `theme.9.css` by a
brace-matching parser that also records the enclosing `@media` query; media context is
shown in square brackets, e.g. `[@media (min-width:960px)]`.

Where it quotes a **rendered** colour, that colour was sampled from a headless-Chrome
screenshot with Pillow, by counting pixels in a named region -- so it is what a browser
painted, not what a rule claims.

## 2. The logo

### 2.1 What the site serves

The whole site serves **two** logo images (checked across all six pages above; the only
`uk-logo` elements and the only files matching `LOGO` under `/media/yootheme/cache/`):

**Variant A -- desktop header logo ("LOGO ELSA HR")**

```html
<a href="https://ai4sfs.org/" aria-label="Back to home" class="uk-logo">
  <picture>
    <source type="image/webp" srcset="/media/yootheme/cache/65/LOGO%20ELSA%20HR-65a02c57.webp 479w,
                                      /media/yootheme/cache/2c/LOGO%20ELSA%20HR-2caca510.webp 718w"
            sizes="(min-width: 479px) 479px">
    <img src="/media/yootheme/cache/e9/LOGO%20ELSA%20HR-e95e46c6.png" width="479" height="120" alt>
  </picture>
</a>
```

It sits in `<header class="tm-header uk-visible@m">`, i.e. it is the logo shown from the
`m` breakpoint (960 px) upward.

**Variant B -- mobile header logo ("LOGO ELSA header mobile wit"; Dutch *wit* = white)**

```html
<a href="https://ai4sfs.org/" aria-label="Back to home" class="uk-logo uk-navbar-item">
  <picture>
    <source type="image/webp" srcset="/media/yootheme/cache/2f/LOGO%20ELSA%20header%20mobile%20wit-2fc4fd6f.webp 263w,
                                      /media/yootheme/cache/78/LOGO%20ELSA%20header%20mobile%20wit-786207f9.webp 526w"
            sizes="(min-width: 263px) 263px">
    <img src="/media/yootheme/cache/14/LOGO%20ELSA%20header%20mobile%20wit-14ff19f7.png" width="263" height="70" alt>
  </picture>
</a>
```

It sits in `<header class="tm-header-mobile uk-hidden@m">`, i.e. below 960 px, inside the
navbar.

### 2.2 The files, measured

Every file below was downloaded and opened with Pillow.

| File | URL | Format | Pixels | Bytes | Alpha channel | Pixels actually transparent | Baked background |
|---|---|---|---|---|---|---|---|
| Desktop logo (1x) | `/media/yootheme/cache/e9/LOGO%20ELSA%20HR-e95e46c6.png` | PNG, mode RGBA | 479 x 120 | 53,472 | present | **0 of 57,480 (0.0 %)** | **`#ffffff`** |
| Desktop logo (1x, webp) | `/media/yootheme/cache/65/LOGO%20ELSA%20HR-65a02c57.webp` | WEBP, mode RGB | 479 x 120 | 23,738 | none | -- | `#ffffff` |
| Desktop logo (1.5x, webp) | `/media/yootheme/cache/2c/LOGO%20ELSA%20HR-2caca510.webp` | WEBP, mode RGB | 718 x 180 | 41,978 | none | -- | `#ffffff` |
| Mobile logo (1x) | `/media/yootheme/cache/14/LOGO%20ELSA%20header%20mobile%20wit-14ff19f7.png` | PNG, mode RGBA | 263 x 70 | 14,143 | present | **0 of 18,410 (0.0 %)** | **`#ffc600`** |
| Mobile logo (1x, webp) | `/media/yootheme/cache/2f/LOGO%20ELSA%20header%20mobile%20wit-2fc4fd6f.webp` | WEBP, mode RGB | 263 x 70 | 8,448 | none | -- | `#fec600` (webp is lossy) |
| Mobile logo (2x, webp) | `/media/yootheme/cache/78/LOGO%20ELSA%20header%20mobile%20wit-786207f9.webp` | WEBP, mode RGB | 526 x 140 | 21,388 | none | -- | `#fec600` |
| Favicon | `/images/favicon.png` | PNG, mode RGBA | 184 x 180 | 44,257 | present | 0 of 33,120 (0.0 %) | `#ffffff` |

Corner-pixel probe (the four corners plus the top-centre pixel of each PNG):

```
LOGO_ELSA_HR-e95e46c6.png (479, 120)
   corner (0, 0)     #ffffff (a=255)
   corner (478, 0)   #ffffff (a=255)
   corner (0, 119)   #ffffff (a=255)
   corner (478, 119) #ffffff (a=255)
   background = #ffffff   most saturated marks: #159a2f (1159 px), #eb6620 (149 px), #ef811d (137 px), #f0901c (102 px)

LOGO_ELSA_header_mobile_wit-14ff19f7.png (263, 70)
   corner (0, 0)     #ffc600 (a=255)
   corner (262, 0)   #ffc600 (a=255)
   corner (0, 69)    #ffc600 (a=255)
   corner (262, 69)  #ffc600 (a=255)
   background = #ffc600   most saturated marks: #ffe897, #ea661c, #ee8118, #eca519 (white lettering: 946 px of #ffffff)
```

SHA-256 of the two PNGs as served on 2026-09-09 (so the build issue can prove it vendored
the same bytes):

```
debeef5b5b35ab9571c0b7b4b170fbcc586361c5d94da96c72a9dcb584e1e74d  LOGO ELSA HR-e95e46c6.png
ac5bbdc6996989cde651ec442a49f06f29a67275a6225692570b47c4d2a6c1b7  LOGO ELSA header mobile wit-14ff19f7.png
53d5d494e7efe8e4f3dc9f8c4ed9a1d487d1437605d7f143af897e50802cd15a  favicon.png
```

### 2.3 On which background each variant is meant to be shown

Measured from the CSS and confirmed from rendered pixels:

- **Desktop logo -> white.** The bar it sits in is
  `.tm-headerbar-top.tm-headerbar-default { background:#fff }`. Sampling a 700 x 90 px
  region of the rendered desktop header, to the right of the logo, gives `#ffffff` for
  62,644 of 63,000 pixels. The logo's own baked background is `#ffffff`, so it merges
  with the bar.
- **Mobile logo -> the yellow navbar.** The bar it sits in is
  `.uk-navbar-container:not(.uk-navbar-transparent) { background:#ffc600 }`. Sampling the
  whole 390 x 70 px navbar of the rendered mobile page (27,300 pixels, logo included)
  gives 19,236 pixels of `#ffc600` and its lossy-webp neighbours (`#fec600` 7,472,
  `#fdc600` 598, `#ffc500` 293, ...); the remainder is the menu icon, the apple and the
  white lettering. The logo's own baked background is `#ffc600`, so it merges with the
  navbar.

Both logos show the same mark: an orange apple with a green leaf carrying the letters
"ELSA", beside the words "AI for Sustainable Food Systems" and the line "Ethical, Legal,
Societal Aspects". On the desktop variant the wordmark is green (`#159a2f`); on the
mobile variant it is white (`#ffffff`).

### 2.4 What does **not** exist (the issue asked this explicitly)

- **There is no transparent logo.** Both PNGs have an alpha channel, but not one pixel of
  either is even partially transparent. Placed on any background other than its own, each
  file shows a hard white or hard yellow rectangle.
- **There is no vector (SVG) logo.** Searching all six fetched pages for `.svg` returns
  nothing; the site's only vector graphics are inline data-URI arrows in the stylesheet.
- **There is a dark-on-light variant** (the desktop logo: green and orange marks on
  white), so the theme has something to show on a white page.
- **There is no logo that can be put on the green `#41ab64` sections**, and no
  light-on-dark variant other than the one with yellow baked in.

Consequence for the theme build issue: it will need the owner to supply a
**transparent-background master** (ideally SVG, otherwise a PNG with a real alpha
channel) if the application is to place the logo on anything but a white bar or the exact
yellow `#ffc600`. Until then the honest options are: put the desktop logo on white, or
put the mobile logo on `#ffc600`.

## 3. Typography

### 3.1 Which family is used where

| Where | Rule (verbatim from `theme.9.css`) | Family |
|---|---|---|
| Page default / body text | `html { font-family:'Open Sans';font-size:18px;font-weight:400;line-height:1.5;...;background:#fff;color:#2d2e33;... }` | Open Sans 400, 18 px, line-height 1.5 |
| All headings `h1`--`h6` | `.display-1,...,.uk-h1,...,h1,h2,h3,h4,h5,h6 { margin:0 0 20px 0;font-family:'Open Sans';font-weight:900;color:#41ab64;text-transform:none;letter-spacing:0 }` | Open Sans, **declared weight 900** |
| Large display heading | `.uk-heading-xlarge { font-size:64px;line-height:1;color:#f3eb07;font-family:'Nova Square';letter-spacing:0 }` | **Nova Square** |
| Navigation links | `.uk-navbar-nav>li>a { ...;font-size:20px;color:#2d2e33;font-weight:700;... }` (min-height 70px from `.uk-navbar-item,.uk-navbar-nav>li>a,.uk-navbar-toggle`) | Open Sans 700 |
| Buttons | `.btn,.uk-button { ...;font-size:16px;line-height:28px;font-weight:400;... }` | Open Sans 400 |

Heading sizes, with their media context:

```
.h1,.uk-h1,h1 { font-size:32.4;line-height:1.25 }                      <- note: no unit, see 6.3
.h2,.uk-h2,h2 { font-size:27.3px;line-height:1.5 }
.h3,.uk-h3,h3 { font-size:24px;line-height:1.4;font-style:italic }
.h4,.uk-h4,h4 { font-size:24px;line-height:1.4 }
.h5,.uk-h5,h5 { font-size:18px;line-height:1.4 }
.h6,.uk-h6,h6 { font-size:24px;line-height:1.4;color:#fff }
[@media (min-width:960px)] .h1,.uk-h1,h1 { font-size:40px }
[@media (min-width:960px)] .h2,.uk-h2,h2 { font-size:35px }
.uk-heading-xlarge  { font-size:64px }   [@media (min-width:960px)] 90px   [@media (min-width:1200px)] 120px
.uk-heading-2xlarge { font-size:90px }   [@media (min-width:960px)] 120px  [@media (min-width:1200px)] 11rem
.uk-heading-3xlarge { font-size:120px }  [@media (min-width:960px)] 11rem  [@media (min-width:1200px)] 15rem
.uk-text-large { font-size:20px;line-height:1.5 }
.uk-card-title  { font-size:24px;line-height:1.4 }
```

**Where Nova Square is actually used.** On the six pages fetched, `uk-heading-xlarge`
appears exactly once: the "404" numeral on the theme's not-found page
(`https://ai4sfs.org/partners` returns 404 and renders
`<h1 class="uk-heading-xlarge">404</h1>`). Rendering that page headless and counting
pixels gives `#f3eb07` for 8,233 pixels -- the display yellow of the rule above, which
appears nowhere else. To be sure the glyphs really are Nova Square and not a fallback,
the served `novasquare-abe1f59a.woff2` was converted to TTF with fontTools and "404" was
drawn with Pillow: the squared, open-cornered zero and the angled 4-terminals match the
rendered page. **So: Nova Square is loaded on every page, is part of the identity, and on
the public pages is used only for the 404 numeral.** A Tree Theme that carries a display
font will be carrying a font the source site barely uses.

### 3.2 Weights and styles actually served

There are **52 `@font-face` rules** in `theme.9.css`. Grouped:

| Family | Weight | Style | Subset files | Latin subset (`U+0000-00FF`) file | Bytes (measured with `curl -I`) |
|---|---|---|---|---|---|
| Nova Square | 400 | normal | 2 | `/templates/yootheme/fonts/novasquare-abe1f59a.woff2` | 14,660 |
| Open Sans | 400 | normal | 10 | `/templates/yootheme/fonts/opensans-684814b4.woff2` | 18,640 |
| Open Sans | 500 | normal | 10 | `/templates/yootheme/fonts/opensans-9675725a.woff2` | 18,728 |
| Open Sans | 600 | normal | 10 | `/templates/yootheme/fonts/opensans-30129999.woff2` | 18,620 |
| Open Sans | 700 | normal | 10 | `/templates/yootheme/fonts/opensans-386c78dd.woff2` | 18,204 |
| Open Sans | 800 | normal | 10 | `/templates/yootheme/fonts/opensans-e346a2c5.woff2` | 18,600 |

Nova Square's second file is the latin-extended subset,
`/templates/yootheme/fonts/novasquare-78a14ca3.woff2` (11,268 bytes,
`unicode-range: U+0100-02BA, ...`). The Open Sans subsets are the standard Google Fonts
split (cyrillic, cyrillic-ext, greek, greek-ext, hebrew, math, symbols, vietnamese,
latin-ext, latin).

**No italic face is served at all** (`italic faces: 0` across all 52 rules) and **no
weight 900 is served**. Two consequences, both visible on the rendered pages:

- headings ask for `font-weight:900` but the heaviest file is 800, so the browser uses
  800 (or synthesises the difference);
- `h3` asks for `font-style:italic` with no italic file, so the browser slants the
  upright face. The 404 page's `<p class="uk-h3">Component not found.</p>` renders as a
  synthetic oblique green line.

A Theme that ships fonts therefore needs at most **Open Sans 400 / 600 / 700** (the
weights the pages actually use for body, semibold accents and navigation/bold) plus
**Nova Square 400** if the display style is wanted; shipping all five Open Sans weights x
ten subsets would be 50 files for no gain, since the application's content is English and
Dutch (latin + latin-ext).

Verbatim `@font-face` example (the latin Open Sans 400 face):

```css
@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-stretch: normal;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
                 U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
                 U+2212, U+2215, U+FEFF, U+FFFD;
  src: url(../fonts/opensans-684814b4.woff2) format('woff2');
}
```

Fonts are served from the site's own server -- `/templates/yootheme/fonts/` -- not from
`fonts.googleapis.com`. No third-party font request is made by any page measured.

### 3.3 The licence of each family, from the font files themselves

The served `.woff2` files were decoded with fontTools and their `name` and `OS/2` tables
read. This is the licence as embedded in the exact bytes the site serves:

```
== novasquare-abe1f59a.woff2   flavor=woff2  numGlyphs=216
   OS/2 usWeightClass=400  fsType=0
   [1] family: Nova Square
   [2] subfamily: Book
   [5] version: Version 2.000
   [14] licence URL: http://scripts.sil.org/OFL

== opensans-684814b4.woff2     flavor=woff2  numGlyphs=280
   OS/2 usWeightClass=400  fsType=0
   [1] family: Open Sans
   [2] subfamily: Regular
   [5] version: Version 3.003
   [14] licence URL: http://scripts.sil.org/OFL
```

(The 500/600/700/800 files repeat this with `usWeightClass` 500/600/700/800 and
typographic subfamily Medium / SemiBold / Bold / ExtraBold; all carry `fsType=0` and the
same licence URL.)

`fsType = 0` is the OpenType embedding permission field; the value 0 means *Installable
Embedding* -- no embedding restriction.

The licence text itself was fetched from the upstream Google Fonts repository:

```
$ curl https://raw.githubusercontent.com/google/fonts/main/ofl/opensans/OFL.txt      -> 200, 4,389 bytes
  sha256 fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602
$ curl https://raw.githubusercontent.com/google/fonts/main/ofl/novasquare/OFL.txt    -> 200, 4,273 bytes
  sha256 c0bcb72e68dd416db0bb9fcec7a7fa62321b0147cde00d8c8f82748e33aefd34
$ curl https://raw.githubusercontent.com/google/fonts/main/ofl/opensans/METADATA.pb  -> 200, 5,184 bytes
$ curl https://raw.githubusercontent.com/google/fonts/main/ofl/novasquare/METADATA.pb-> 200,   766 bytes
```

**Open Sans** -- `ofl/opensans/OFL.txt`, first lines:

> Copyright 2020 The Open Sans Project Authors (https://github.com/googlefonts/opensans)
>
> This Font Software is licensed under the SIL Open Font License, Version 1.1.
> This license is copied below, and is also available with a FAQ at:
> https://scripts.sil.org/OFL

`ofl/opensans/METADATA.pb`:

```
name: "Open Sans"
designer: "Steve Matteson"
license: "OFL"
category: "SANS_SERIF"
date_added: "2011-02-02"
```

**Nova Square** -- `ofl/novasquare/OFL.txt`, first lines:

> Copyright (c) 2011, wmk69 (wmk69@o2.pl),
> with Reserved Font Name NovaSquare.
>
> This Font Software is licensed under the SIL Open Font License, Version 1.1.
> This license is copied below, and is also available with a FAQ at:
> http://scripts.sil.org/OFL

`ofl/novasquare/METADATA.pb`:

```
name: "Nova Square"
designer: "Wojciech Kalinowski"
license: "OFL"
category: "DISPLAY"
date_added: "2011-04-14"
```

The clauses that bind us, quoted from the OFL 1.1 text itself:

> PERMISSION & CONDITIONS
> Permission is hereby granted, free of charge, to any person obtaining
> a copy of the Font Software, to use, study, copy, merge, embed,
> modify, redistribute, and sell modified and unmodified copies of the
> Font Software, subject to the following conditions:
>
> 1) Neither the Font Software nor any of its individual components, in
> Original or Modified Versions, may be sold by itself.
>
> 2) Original or Modified Versions of the Font Software may be bundled,
> redistributed and/or sold with any software, provided that each copy
> contains the above copyright notice and this license. [...]
>
> 3) No Modified Version of the Font Software may use the Reserved Font
> Name(s) unless explicit written permission is granted [...]

In plain terms, for this project: **the fonts may be copied into the repository and served
by the application, provided each copy is accompanied by the copyright notice and the full
OFL text.** Renaming or editing the Nova Square files while keeping the name "Nova Square"
or "NovaSquare" is not allowed (Reserved Font Name); subsetting them and keeping the name
is the normal reading of "Modified Version" and should therefore be done under a different
name, or not at all. This answers the font half of core-document **OPEN 10.25**.

## 4. The colour palette

### 4.1 Frequency in the stylesheet

How often each hex colour appears in the 442,869 bytes of `theme.9.css` (three-digit hex
expanded to six; top 20):

```
187 #ffffff    62 #e8ecef    50 #000000    18 #f0f3f7    10 #212529
129 #2d2e33    60 #a3a4a8    27 #e44e56    15 #ff9e45     7 #e9ecef
 68 #ffc600    60 #41ab64    24 #3dc372    11 #f8f9fa     5 #842029 ...
```

`#f8f9fa`, `#212529`, `#e9ecef`, `#842029` and the rest of the tail belong to the
Bootstrap reset that YOOtheme bundles, not to the identity. The identity is the first six
plus a handful named below.

### 4.2 The palette, by role, each with the rule it was read from

| Role | Hex | CSS rule it was read from | Verified in the rendered page |
|---|---|---|---|
| Page background | `#ffffff` | `html { ...;background:#fff;color:#2d2e33;... }` and `.uk-section-default { --uk-inverse:dark;background:#fff }` | 62,644 / 63,000 px of the sampled header region |
| Body text | `#2d2e33` | `html { ...;color:#2d2e33 }` | dominant non-white colour in the sampled paragraph region |
| Headings | `#41ab64` | `...,.uk-h1,...,h1,h2,h3,h4,h5,h6 { ...;color:#41ab64 }` | 5,286 px of `#41ab64` in the sampled "Why ELSA is important..." heading box |
| Links | `#1ca434` | `.uk-link,a { color:#1ca434;text-decoration:underline;cursor:pointer }` | -- |
| Link hover | `#2d2e33` | `.uk-link-toggle:hover .uk-link,.uk-link:hover,a:hover { color:#2d2e33;text-decoration:none }` | -- |
| Primary accent (navbar, primary button, section) | `#ffc600` | `.uk-navbar-container:not(.uk-navbar-transparent) { background:#ffc600 }`; `.btn-info,.btn-primary,.btn-success,.uk-button-primary { background-color:#ffc600;color:#fff;border:1px solid transparent }`; `.uk-section-primary { --uk-inverse:dark;background:#ffc600 }`; `.tm-headerbar-bottom.tm-headerbar-default { background:#ffc600 }` | 46,234 px of the sampled navbar strip; 16,251 px of the mobile navbar |
| Secondary accent (green sections, secondary button) | `#41ab64` | `.btn-dark,.btn-secondary,.uk-button-secondary { background-color:#41ab64;color:#fff;border:1px solid transparent }`; `.uk-section-secondary { --uk-inverse:dark;background:#41ab64 }` | 60,080 / 99,000 px of the sampled green section region |
| Green, hover/lighter | `#45b66a`, `#56bf79`, `#3dc372` | `.uk-card-secondary { --uk-inverse:light;background-color:#45b66a;color:#fff }`, `.uk-card-secondary.uk-card-hover:hover { background-color:#56bf79 }`, `.uk-text-success { color:#3dc372!important }` | -- |
| Yellow, hover/lighter | `#ffc90f`, `#ffd133` | `.uk-card-primary { --uk-inverse:dark;background-color:#ffc90f;color:#2d2e33 }`, `.uk-card-primary.uk-card-hover:hover { background-color:#ffd133 }` | -- |
| Muted surface (page-width) | `#f6f8fb` | `.uk-section-muted { --uk-inverse:dark;background:#f6f8fb }` | -- |
| Muted surface (controls) | `#f0f3f7` | `.btn-light,.uk-button-default { background-color:#f0f3f7;color:#2d2e33;border:1px solid transparent }`; `.uk-progress { ...;background-color:#f0f3f7;... }` | -- |
| Muted text / disabled | `#a3a4a8` | `.uk-text-muted { color:#a3a4a8!important }`; `.uk-button-*:disabled { background-color:#f0f3f7;color:#a3a4a8;... }` | -- |
| Border / divider | `#e8ecef` | `.uk-hr,hr { ...;border-top:1px solid #e8ecef }`; `.uk-heading-divider { ...;border-bottom:calc(.2px + .05em) solid #e8ecef }`; `.uk-card-default .uk-card-header { border-bottom:1px solid #e8ecef }` | -- |
| Border, pressed | `#cad3da` | `.btn-light.uk-active,...,.uk-button-default:active { ...;border-color:#cad3da }` | -- |
| Danger | `#e44e56` | `.btn-danger,.btn-warning,.uk-button-danger { background-color:#e44e56;color:#fff;... }`; `.uk-text-danger { color:#e44e56!important }` | -- |
| Warning / attention | `#ff9e45` | `.uk-text-warning { color:#ff9e45!important }`; `.uk-label-warning { background-color:transparent;color:#ff9e45;border-color:#ff9e45 }` | -- |
| Display heading (404 numeral only) | `#f3eb07` | `.uk-heading-xlarge { font-size:64px;line-height:1;color:#f3eb07;font-family:'Nova Square';letter-spacing:0 }` | 8,233 px on the rendered 404 page |
| Text on a coloured button | `#ffffff` | `...uk-button-primary { ...;color:#fff }`, `...uk-button-secondary { ...;color:#fff }` | -- |
| Card shadow | `rgba(147,162,185,.16)` | `.uk-card-default { --uk-inverse:dark;background-color:#fff;color:#2d2e33;box-shadow:0 8px 40px 0 rgba(147,162,185,.16) }` | -- |
| Logo mark, green | `#159a2f` | not CSS -- pixels of `LOGO ELSA HR-e95e46c6.png` (1,159 px of `#159a2f`, 919 px of `#15992f`) | -- |
| Logo mark, orange | `#eb6620` -- `#f0901c` | pixels of the same file and of `favicon.png` (an orange gradient, not one flat value) | -- |

Two things worth knowing before turning these into theme keys:

- **The theme's own "primary" is not one colour.** `.uk-button-primary` is yellow
  `#ffc600`, but `.uk-text-primary { color:#41ab64!important }` is green -- and
  `.uk-text-secondary` is also green. Buttons and text disagree. When the Architect maps
  roles to keys, take the values from the table above (which name where each colour is
  actually painted), not from the UIkit role names.
- **The wordmark green in the logo (`#159a2f`) is not the interface green (`#41ab64`).**
  They are two different greens; do not "unify" them.

### 4.3 Foreground/background pairs actually painted (rendered evidence)

Sampled from the headless-Chrome screenshots:

| Region sampled | Result |
|---|---|
| Desktop header bar, right of the logo (700 x 90 px) | `#ffffff` 62,644 px |
| Navbar strip, full width (1300 x 40 px) | `#ffc600` 46,234 px; `#2d2e33` 1,822 px (nav labels); `#ffffff` 219 px (the active item, `.uk-navbar-nav>li.uk-active>a { color:#fff }`) |
| Green section, empty right column (330 x 300 px) | `#41ab64` 60,080 px |
| Green section, heading box | `#41ab64` 27,503 px background, `#ffffff` 5,826 px -- **white heading**, which comes from the inline `#page\#0 h2{color:#fff}` override, not from the theme |
| Green section, paragraph box | `#41ab64` 36,908 px background, `#2d2e33` 570 px -- **body text stays near-black on green** |
| Mobile navbar, logo included (390 x 70 px = 27,300 px) | `#ffc600` 8,779 px + lossy-webp neighbours `#fec600` 7,472 px, `#fdc600` 598 px, ... = 19,236 px of that yellow |
| 404 page, whole viewport | `#ffffff` 1,278,896 px; `#f3eb07` 8,233 px; `#ffc600` 3,569 px; `#41ab64` 1,451 px |

Contrast ratios of those pairs, computed by the WCAG 2 formula (relative luminance,
`(L1+0.05)/(L2+0.05)`) -- stated as measurement, not as a judgement of the design:

| Pair | Ratio |
|---|---|
| `#2d2e33` text on `#ffffff` | 13.55 : 1 |
| `#2d2e33` text on `#ffc600` | 8.60 : 1 |
| `#2d2e33` text on `#41ab64` | 4.67 : 1 |
| `#e44e56` on `#ffffff` | 3.80 : 1 |
| `#1ca434` link on `#ffffff` | 3.28 : 1 |
| `#41ab64` heading on `#ffffff` | 2.90 : 1 |
| `#ffffff` on `#41ab64` | 2.90 : 1 |
| `#a3a4a8` muted text on `#ffffff` | 2.49 : 1 |
| `#ffffff` on `#ffc600` | 1.58 : 1 |

Three of these matter for the application, because the frontend will be reusing the
colours for text the user must read: green headings on white (2.90), white on yellow
(1.58, used by `.uk-button-primary`) and muted grey on white (2.49) are all below the
4.5 : 1 that WCAG AA asks of body text (3 : 1 for large text). The Architect should
decide, when the Theme block is defined, whether a Theme names both a background and its
own foreground colour so a Tree cannot produce an unreadable pair by accident.

## 5. Shapes and spacing

| Element | Measured value | Rule |
|---|---|---|
| Button radius | **5 px** (not a pill) | `.btn,.uk-button { ...;border-radius:0;...;border-radius:5px;background-origin:border-box }` -- the second declaration wins |
| Button padding / size | `padding:0 25px`, `line-height:28px`, `font-size:16px`, weight 400 | same rule |
| Button, small / large | `padding:0 10px; font-size:13px` / `padding:0 20px; font-size:16px` | `.btn-sm,.uk-button-small`, `.btn-lg,.uk-button-large` |
| Pill radius (`500px`) -- where it *is* used | icon buttons (36 x 36), badges, labels-as-markers, range sliders, progress bars, navbar search input | `.uk-icon-button`, `.uk-card-badge`, `.uk-badge`, `.uk-marker`, `.uk-progress`, `.uk-search-navbar .uk-search-input` (13 occurrences of `border-radius:500px` in total) |
| Card radius | **0** (square corners) | `.uk-card-default { background-color:#fff;color:#2d2e33;box-shadow:0 8px 40px 0 rgba(147,162,185,.16) }` -- no radius declared anywhere for `.uk-card*` |
| Card elevation | `0 8px 40px 0 rgba(147,162,185,.16)`, tightening to `0 8px 18px 0 ...` on hover | `.uk-card-default`, `.uk-card-default.uk-card-hover:hover` |
| Card padding | 20 px, rising to 40 px at >= 1200 px | `.uk-card-body { display:flow-root;padding:20px 20px }`, `[@media (min-width:1200px)] .uk-card-body { padding:40px 40px }` |
| Section padding (vertical rhythm) | 30 px, rising to 50 px at >= 960 px; `-small` 40 px, `-large` 70 px, `-xlarge` 140 px | `.uk-section { display:flow-root;box-sizing:border-box;padding-top:30px;padding-bottom:30px }` + `[@media (min-width:960px)]` variant |
| Content width | `max-width:1040px` (`content-box`), padding 15 px -> 20 px (>=640) -> 40 px (>=960); variants 750 / 900 / 1300 px | `.uk-container`, `.uk-container-xsmall/-small/-large` |
| Navbar height | `min-height:70px` | `.uk-navbar-item,.uk-navbar-nav>li>a,.uk-navbar-toggle` |
| Header bar padding | 20 px top and bottom | `.tm-headerbar-top`, `.tm-headerbar-bottom` |
| Paragraph rhythm | `margin:0 0 20px 0` for `p`, lists, figures; headings the same | `address,dl,fieldset,figure,ol,p,pre,ul { margin:0 0 20px 0 }` |
| Divider | 1 px `#e8ecef` | `.uk-hr,hr { ...;border-top:1px solid #e8ecef }` |
| Full-bleed coloured sections | Yes, and they are the site's main structural device: a white section, then a full-width `#41ab64` section, then white again, each holding a centred 1040 px container | `<div class="uk-section-secondary uk-section">` on the home page; confirmed in the rendered screenshot, where the green band runs the full 1440 px width |
| Breakpoints | `s 640px, m 960px, l 1200px, xl 1600px` | `:root { --uk-breakpoint-s:640px;--uk-breakpoint-m:960px;--uk-breakpoint-l:1200px;--uk-breakpoint-xl:1600px }` |
| Transitions | `.1s ease-in-out` on colour/background/border/shadow | `.btn,.uk-button`, `.uk-card`, `.uk-navbar-container` |

In one sentence: **square cards with a soft wide shadow, small 5 px button corners, pill
shapes reserved for badges and icons, generous 30--50 px section padding, a 1040 px text
column, and full-width bands of flat yellow or green as the only strong ornament.**

## 6. What may be reused, and what the owner must still confirm

### 6.1 The statement the issue asked for

**The fonts may be copied into this repository and served by the application.** Both
families are under the SIL Open Font License 1.1 (section 3.3): the licence grants the
right to use, embed and redistribute them bundled with software, on the condition that
each copy carries the copyright notice and the full licence text. The files served by
ai4sfs.org also declare `fsType = 0`, i.e. no embedding restriction. What the build issue
must therefore do: copy the `.woff2` files into the Tree's folder, and beside them a
`OFL.txt` (or `LICENSE`) carrying the Open Sans copyright line and the Nova Square
copyright line with its Reserved Font Name, plus the OFL 1.1 text. Do not rename or
re-subset the Nova Square files while keeping the name "Nova Square" / "NovaSquare".

**The logo is the owner's own lab's mark** -- it is the identity of the ELSA-Lab for
sustainable food systems, the lab this project belongs to (core document section 1), and
the owner asked in #35 for it to be displayed. On that instruction the logo files may be
copied into the Tree's folder. Three things are nonetheless **UNKNOWN and cannot be
settled by measurement**, and the theme build issue (#40) should carry them to the owner:

1. **Whether the mark is a registered trademark of Wageningen University & Research**, and
   whether WUR's corporate-identity rules constrain how it is shown (minimum clear space,
   minimum size, permitted backgrounds). Nothing on ai4sfs.org states this: the site
   carries **no copyright line, no colophon, no terms page and no legal notice** anywhere
   in the six pages fetched (the home page's markup simply ends after the last content
   section). The only ownership-ish metadata on the page is
   `<meta name="author" content="Marloes de Heer">` and
   `<meta property="og:site_name" content="ELSA | AI for Sustainable Food Systems">`.
   `robots.txt` is the Joomla default and says nothing about reuse.
2. **Whether the apple artwork inside the logo is itself licensed material** (it is a
   photographic-looking illustration; the site's other imagery is Shutterstock stock, e.g.
   `/images/fotos/shutterstock_1182059182_drone_veld 500x333.jpg`). If the apple came from
   a stock library, the licence that covers it may not cover redistribution inside an
   open-source repository.
3. **A usable master file.** As shown in 2.4, no transparent and no vector logo is served.
   The owner should be asked for the original (SVG or a PNG with a real alpha channel),
   and for a variant that works on a coloured background, if the application is ever to
   place the logo anywhere but a white bar.

These are the logo half of core-document **OPEN 10.25**; this document answers the font
half and leaves the logo half open with the three specific questions above.

### 6.2 What this document does **not** decide

Per the issue's OUT OF SCOPE: it does not design the Theme schema, does not copy any asset
into the repository, and passes no judgement on the design. The contrast ratios in 4.3 are
measurements, offered because the Architect needs to know whether a Theme must name
foreground colours as well as background colours.

### 6.3 Corrections to the starting points quoted in issue #36

The issue listed findings from a first look on 2026-09-09 and asked for them to be
verified. Four need correcting:

| Starting point in #36 | What was measured |
|---|---|
| "Buttons are pill-shaped (`border-radius: 500px`)" | **Wrong.** `.btn,.uk-button` ends with `border-radius:5px`. The `500px` radius belongs to icon buttons, badges, markers, progress bars and the navbar search field (13 rules). |
| The mobile logo's name "wit" says it is "the white-on-transparent version" | **Half wrong.** The lettering is white, but the file is **not transparent**: every one of its 18,410 pixels is opaque and the background is a flat `#ffc600`. The same is true of the desktop logo, whose background is a flat `#ffffff`. |
| "display font `Nova Square`" | **True but narrower than it sounds.** Nova Square 400 is loaded on every page, but the only rule using it is `.uk-heading-xlarge`, which on the pages measured appears solely on the 404 page. |
| "the most-used colours `#2d2e33`, `#ffc600`, `#41ab64`, `#1ca434`, `#3dc372`, `#e8ecef`, `#f0f3f7`, `#a3a4a8`, `#e44e56`, `#ff9e45`" | **Confirmed**, with three additions: `#ffffff` (the most frequent of all, 187 occurrences), `#f6f8fb` (the muted section background) and `#f3eb07` (the display-heading yellow). `#1ca434` is the link colour and occurs only a handful of times, so it is not "most-used" by frequency -- but it is the colour of every link on the site. |

Everything else in the issue's starting list -- Joomla + YOOtheme/UIkit, the stylesheet
path and its ~442 kB size, both logo URLs and their pixel dimensions, Open Sans as body
font, self-hosted woff2 under `/templates/yootheme/fonts/` -- is confirmed exactly as
stated.

## 7. Role -> value table

This is the table the theme architecture issue (#37 and the Tree-format work) and the
theme build issue (#40) can copy. Every value is measured; the source is the section
above.

| Role | Value | Where it came from |
|---|---|---|
| `background` (page) | `#ffffff` | `html { background:#fff }`, `.uk-section-default` |
| `surface` (raised panel/card) | `#ffffff` with shadow `0 8px 40px 0 rgba(147,162,185,.16)`, radius `0` | `.uk-card-default` |
| `surfaceMuted` (quiet band) | `#f6f8fb`; for quiet controls `#f0f3f7` | `.uk-section-muted`; `.uk-button-default` |
| `text` | `#2d2e33` | `html { color:#2d2e33 }` |
| `textMuted` | `#a3a4a8` | `.uk-text-muted` |
| `heading` | `#41ab64` | base `h1..h6` rule |
| `link` | `#1ca434`; hover `#2d2e33` | `.uk-link,a` |
| `accent` (primary) | `#ffc600`; text on it `#2d2e33` (8.60 : 1) rather than the site's own `#ffffff` (1.58 : 1) | `.uk-navbar-container`, `.uk-button-primary`, `.uk-section-primary` |
| `accentSecondary` | `#41ab64`; text on it `#ffffff` for headings (site override) or `#2d2e33` for body (4.67 : 1) | `.uk-button-secondary`, `.uk-section-secondary` |
| `danger` | `#e44e56` | `.uk-button-danger`, `.uk-text-danger` |
| `warning` | `#ff9e45` | `.uk-text-warning`, `.uk-label-warning` |
| `success` | `#3dc372` | `.uk-text-success` |
| `border` | `#e8ecef` (1 px) | `hr`, `.uk-card-default .uk-card-header` |
| `display` (oversized numerals/headline) | `#f3eb07` in Nova Square | `.uk-heading-xlarge` |
| `bodyFont` | **Open Sans**, weight 400, 18 px, line-height 1.5; SIL OFL 1.1; latin file `/templates/yootheme/fonts/opensans-684814b4.woff2` (18,640 B), latin-ext `opensans-39402e3d.woff2` | `html`, `@font-face` |
| `headingFont` | **Open Sans**, declared weight **900** -- heaviest file served is **800**: `/templates/yootheme/fonts/opensans-e346a2c5.woff2` (18,600 B); bold 700 is `opensans-386c78dd.woff2` (18,204 B); semibold 600 is `opensans-30129999.woff2` (18,620 B) | base `h1..h6` rule, `@font-face` |
| `displayFont` | **Nova Square**, weight 400; SIL OFL 1.1 with **Reserved Font Name "NovaSquare"**; latin `/templates/yootheme/fonts/novasquare-abe1f59a.woff2` (14,660 B), latin-ext `novasquare-78a14ca3.woff2` (11,268 B) | `.uk-heading-xlarge`, `@font-face` |
| `italics` | none served -- any italic on the site is browser-synthesised | 0 italic `@font-face` rules |
| `logoOnLight` | `/media/yootheme/cache/e9/LOGO%20ELSA%20HR-e95e46c6.png`, 479 x 120, PNG, 53,472 B, **opaque `#ffffff` background baked in** -- shows correctly only on `#ffffff` | measured, section 2 |
| `logoOnDark` | **does not exist.** The nearest is `/media/yootheme/cache/14/LOGO%20ELSA%20header%20mobile%20wit-14ff19f7.png`, 263 x 70, PNG, 14,143 B, white lettering on an **opaque `#ffc600` background baked in** -- shows correctly only on `#ffc600`. A transparent or vector master must be requested from the owner. | measured, section 2.4 |
| `favicon` | `/images/favicon.png`, 184 x 180, PNG, 44,257 B, white background | measured, section 2.2 |
| `buttonRadius` | `5px` | `.btn,.uk-button` |
| `pillRadius` (badges, icon buttons) | `500px` | `.uk-badge`, `.uk-icon-button`, `.uk-marker` |
| `cardRadius` | `0` | no radius on any `.uk-card*` rule |
| `sectionPadding` | `30px`, `50px` at >= 960 px | `.uk-section` |
| `contentWidth` | `1040px` content-box, side padding 15 / 20 / 40 px | `.uk-container` |
| `breakpoints` | `s 640`, `m 960`, `l 1200`, `xl 1600` px | `:root` |

## 8. Evidence appendix

Files downloaded during this run (not committed -- the theme build issue vendors assets,
this one does not), with the SHA-256 that identifies exactly what was served:

```
debeef5b5b35ab9571c0b7b4b170fbcc586361c5d94da96c72a9dcb584e1e74d  LOGO ELSA HR-e95e46c6.png
ac5bbdc6996989cde651ec442a49f06f29a67275a6225692570b47c4d2a6c1b7  LOGO ELSA header mobile wit-14ff19f7.png
53d5d494e7efe8e4f3dc9f8c4ed9a1d487d1437605d7f143af897e50802cd15a  favicon.png
3e9f9e979097ba64a89b010514cae4d8a984790f7beef6cdd91484822f76f85c  novasquare-abe1f59a.woff2
a97a6ed7ef9f75c495e9224f5c59b2271d826e4a4345b738b390b0c76cc9f412  opensans-30129999.woff2  (600)
594a622208d1dad5d1dd58aef74f212ce7132d8f0aa5bacea6cfeb86d308c17a  opensans-386c78dd.woff2  (700)
0e44026ad31376af1b56593cd4acb4f353f8e8789c51759e18f64578e4ef296a  opensans-684814b4.woff2  (400)
fcb3290e95d43c9427acb996e3c1243c44f003eae5104707b3f5ed65fba7d452  opensans-9675725a.woff2  (500)
fef878a06bd272926ceed713ac28deb89e0a9c59f6680925eaed701f3e8b4913  opensans-e346a2c5.woff2  (800)
fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602  ofl/opensans/OFL.txt
c0bcb72e68dd416db0bb9fcec7a7fa62321b0147cde00d8c8f82748e33aefd34  ofl/novasquare/OFL.txt
```

`theme.9.css` itself is identified by the server's own validator:
`etag: "6c1f5-6a995960-f0824db5c292e703;;;"`, `last-modified: Thu, 03 Sep 2026 11:26:24 GMT`,
`content-length: 442869`.

Screenshots taken for the pixel sampling (headless Chrome, `--virtual-time-budget=10000`):
`https://ai4sfs.org/` at 1440 x 2600 and at 390 x 1800, and `https://ai4sfs.org/partners`
(the 404 page) at 1440 x 900. They were used as measuring instruments and deliberately not
committed: they are third-party page captures, and the numbers taken from them are in
sections 2.3, 4.2 and 4.3.

**Reproducing this.** Every number above can be re-derived with `curl` and Pillow alone;
nothing needed an account, a key or a paid service. If the site changes, the two anchors
to re-check first are the stylesheet's `etag` and the two logo SHA-256 values.
