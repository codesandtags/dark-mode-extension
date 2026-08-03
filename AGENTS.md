# AGENTS.md

Guidance for AI agents working in this repository. Humans may find it useful too.

## What this is

**Dark Mode Enabler** — a browser extension that applies dark, sepia or grayscale
filters to sites that have no dark mode of their own. Published on the Chrome Web
Store with roughly 400–600 weekly users. Built with [WXT](https://wxt.dev)
(TypeScript, Vite) and targets Chrome, Firefox and Edge from one source.

This repository also contains the small marketing site served at
`codesandtags.github.io/dark-mode-extension`. It is unrelated to the extension
and has its own build — see [Two projects, one repo](#two-projects-one-repo).

## Layout

```
wxt.config.ts                        Manifest + per-browser overrides. The manifest
                                     is generated; there is no manifest.json to edit.
extension/                           srcDir
├── entrypoints/
│   ├── background.ts                Storage migration; native-dark badge.
│   ├── content/
│   │   ├── index.ts                 Sets data-dme-mode on <html> at document_start.
│   │   └── theme.css                Every theme rule. Imported by index.ts.
│   └── popup/
│       ├── index.html               Mode picker markup.
│       ├── main.ts                  Owns persistence.
│       └── style.css
├── lib/
│   ├── settings.ts                  Modes, appearance, storage keys. Source of truth.
│   ├── classify-image.ts            Decides icon vs photograph for the counter-invert.
│   ├── detect-native-dark.ts        Does this site already handle dark mode?
│   └── i18n.ts                      t() and data-i18n resolution.
└── public/
    ├── icon/{16,48,128}.png
    └── _locales/<locale>/messages.json   GENERATED — see scripts/generate-locales.mjs

scripts/generate-locales.mjs         Source of every translation. Edit this, not the JSON.

docs/adrs/                           Architecture decision records.
website/, index.html, vite.config.js Marketing site (not the extension).
```

## How it works

One sentence: **the popup writes a mode to storage, and the content script turns
that into an attribute on `<html>` which a pre-injected stylesheet keys off.**

```
popup/main.ts ──browser.storage.local.set({"site:example.com": "DARK"})
                        │
                        ▼
              storage.onChanged
                        │
                        ▼
content/index.ts ──<html data-dme-mode="dark">──▶ theme.css applies
```

There is **no message passing** between the popup and the content script, and
adding some would be a regression — see the invariants below.

One separate, one-way channel does exist: the content script reports its
native-dark verdict to the service worker via `runtime.sendMessage`, and the
worker badges the toolbar icon and stashes the result in `storage.session` for
the popup to read. That direction is safe because a dropped message costs only a
missing badge, never a lost setting.

## Invariants

These encode bugs that have already been fixed once. Each is cheap to break by
accident and expensive to notice. Do not change them without reading the
reasoning, and if you do change one, update this file.

### 1. Theme CSS ships in the manifest's `css` array

`defineContentScript` sets `cssInjectionMode: "manifest"` and `runAt:
"document_start"`. WXT puts CSS imported by the entrypoint into
`content_scripts.css`, which the browser applies **before the page renders**.

Switching to `cssInjectionMode: "manual"` or moving styles into a JS-injected
`<style>` reintroduces the white flash on every page load, which was the single
most damaging bug in v1.1.

Verify after changing anything in this area:

```bash
npm run build && grep -o '"css":\[[^]]*\]' .output/chrome-mv3/manifest.json
```

### 2. The filter goes on `:root`, never on `body`

Per the Filter Effects spec a filtered element becomes the containing block for
its fixed- and absolute-positioned descendants — **except** when it is the
document root. Filtering `body` therefore detaches every sticky header, nav bar
and modal from the viewport. This was measured, not assumed: with the filter on
`body` a fixed header scrolled to `top: -1000`; on `html` it stayed at `top: 0`.

### 3. Top-layer elements need their own filter

`dialog:modal` and `[popover]:popover-open` render outside the root element's
stacking context and are **not** covered by the root filter. Without explicit
rules they stay bright white on a dark page. Any new mode added to `theme.css`
must include them in its selector list.

### 4. Native dark detection informs; it never overrides

`lib/detect-native-dark.ts` answers two questions: is the page dark *right now*
(sampled background luminance), and does the site ship a dark theme it is not
currently using (`color-scheme`, or a `prefers-color-scheme: dark` rule).

The luminance threshold is **0.15**, and it is measured rather than guessed —
see the table in that file. Real dark themes sit at 0.006–0.015; mid-grey
`#808080` is 0.216. A 0.35 threshold was tried first and wrongly claimed
mid-grey pages were dark themes.

The result is surfaced and never acted on. It badges the toolbar icon, and warns
in the popup when Dark is enabled over an already-dark page. It does **not**
auto-disable: silently overriding an explicit per-site choice is more confusing
than the problem it solves.

Only `active` gets a toolbar badge. Badging `available` too would mark a large
share of the web and train people to ignore it.

### 5. The popup owns persistence, not the content script

v1.1 saved settings from the content script over `tabs.sendMessage`. On pages
with no content script (`chrome://`, the web store, PDFs) the message never
arrived, so the setting was silently discarded — and the `try/catch` around it
never fired, because `sendMessage` reports a missing receiver through
`runtime.lastError` rather than by throwing.

Writing to storage from the popup fixes this and gives cross-tab sync for free.

### 6. Site settings live in `storage.local`, one key per hostname

`storage.sync` caps a single item at `QUOTA_BYTES_PER_ITEM` (8 KB). v1.1 packed
every site into one key and started failing silently at roughly 290 hostnames.
`local` also reads fast enough to beat first paint, which `sync` did not.

Key format is `site:<hostname>` — see `siteKey()` in `extension/lib/settings.ts`.
The mode strings are persisted user data; renaming one requires a migration in
`background.ts`.

### 7. `invert(1)`, not `invert(0.9)`

Media is counter-inverted so photographs are not negatives. That round-trip is
only exact at full strength; at `0.9` images come back visibly muddied. Softening
the result is what the planned brightness/contrast sliders are for, not a lower
invert amount.

Related: inline `<svg>` is deliberately **excluded** from the counter-invert. It
is overwhelmingly monochrome icons, which should flip with the page — v1.1
counter-inverted them and left black icons invisible on black backgrounds. So is
`picture`, which wraps the `<img>` that actually renders; filtering both inverts
that image twice.

### 8. The image classifier is biased towards "photograph"

`lib/classify-image.ts` decides whether an image is a logo/icon (leave it to
invert with the page) or a photograph (counter-invert it). Two signals, both
required for "icon": meaningful transparency **and** near-monochrome opaque
pixels.

The second signal exists because transparency alone misfires. A circular avatar
is mostly transparent too, and calling it an icon leaves it displayed as a
negative — which matters, because circular avatars are everywhere on the social
sites this extension most needs to handle. Photographs sit in the midtones;
artwork is ink at one end of the luminance range.

Keep the bias. A mis-called photograph looks broken to the user; a mis-called
logo is only what already happened before the classifier existed. When this stops
being good enough, the answer is a per-site override list, not looser thresholds.

### 9. Appearance is global, and composes after the mode

Brightness/contrast/warmth live under one `appearance` storage key for the whole
browser, not per site. This is Dark Reader's model and it is a deliberate
rejection of Midnight Lizard's per-site everything, which users find
overwhelming.

Two related rules, both from user testing:

- **There is no grayscale slider.** Grayscale is a display *mode*. Exposing the
  same effect twice led to grabbing the wrong control and being surprised that
  "grayscale" produced a yellow page — that was Warmth.
- **The section is hidden while the mode is Off.** The custom properties only
  feed filters declared inside the per-mode rules, so with the site off the
  sliders move and nothing happens.

In `theme.css` the mode's own transform runs **first** and the adjustments layer
on top, so lowering brightness darkens the inverted result rather than the
original page. Reordering that chain silently changes what every slider does.

### 10. Appearance controls only reduce, and the ranges are load-bearing

Brightness caps at 100 and contrast at 100 for a measured reason, documented in
`lib/settings.ts`. `brightness()` is a multiplier applied after the inversion, and
on an inverted page the dominant surfaces sit at the ends of the range — a white
background becomes 0, black text becomes 255. `0 × 1.25` is still 0 and 255
clamps, so **everything above 100% is a dead zone**:

```
brightness 100%  ->  background 0,   text 255
brightness 125%  ->  background 0,   text 255   (no visible change)
brightness  70%  ->  background 0,   text 179
contrast    80%  ->  background 25,  text 230
```

A 50–150 range shipped briefly and read as broken, because half of each slider
did nothing on a normal page. If someone asks to "let users brighten more", the
answer is not a wider range — it is a different filter function, because
multiplication cannot lift black.

## Translations

Thirteen locales: en (base), es, pt_BR, ru, de, fr, it, ja, ko, zh_CN, tr, pl,
id.

**`extension/public/_locales/**/messages.json` is generated. Never edit it.**
Every string lives in `scripts/generate-locales.mjs`; change it there and run:

```bash
npm run locales
```

The generator is also the validator. It exits non-zero if a locale is missing a
key the English base has, has a key the base does not, or if `extDescription`
exceeds the Chrome Web Store's 132-character limit in any locale. That is why
message names are typed loosely in `lib/i18n.ts` — correctness is enforced at
build time rather than by TypeScript.

Adding a string means: add it to **every** locale in the generator, tag the
markup with `data-i18n="yourKey"` (or `data-i18n-title` for tooltips), or call
`t("yourKey")` from TypeScript.

Two things that are deliberately **not** translated:

- **The extension name.** It is the product name, it is what existing users
  recognise, and renaming a published Chrome Web Store item discards the search
  history it has built up.
- **Anything in the content script.** It has no UI. Keeping i18n out of it keeps
  the `document_start` critical path as small as possible.

The mode tiles sit in a narrow four-column grid. After changing any `mode*`
string, check that no label overflows — every current locale fits, including
`Desligado` and `Выкл.`.

## Conventions

- **WXT auto-imports** `defineContentScript`, `defineBackground`, `browser` and
  `storage`. They have no import statement and that is expected, not an omission.
- **Project code uses explicit imports.** Anything under `extension/lib/` is
  imported by path (`@/lib/settings`), where `@` maps to `extension/`. This is
  deliberate — implicit project-level imports hurt navigability.
- Use `browser.*`, never `chrome.*`. WXT's wrapper is what makes the Firefox
  build work.
- Storage access goes through `browser.storage.local` directly rather than WXT's
  `storage` helper, because the helper prefixes keys and we need exact control
  over the key format for the v1.1 migration.
- Comments explain *why*, especially where the code encodes a spec quirk or a
  past bug. Match that; do not add comments that restate the code.

## Commands

```bash
npm install          # runs `wxt prepare`, which generates .wxt/ types
npm run dev          # Chrome, with HMR
npm run dev:firefox
npm run compile      # tsc --noEmit. Run before declaring work done.
npm run build        # Chrome  -> .output/chrome-mv3/
npm run build:all    # Chrome + Firefox + Edge
npm run zip:all      # Store-ready ZIPs (incl. Firefox sources ZIP)
```

`.output/` and `.wxt/` are generated and git-ignored. Never edit them, and never
edit a `manifest.json` inside them — change `wxt.config.ts` instead.

## Verifying visual behaviour

Filter behaviour is easy to get wrong and hard to catch by reading. There is no
automated test suite yet (adding one is on the roadmap). Until then, verify
changes to `theme.css` in a real browser against a page that has: a
`position: fixed` header, a `position: sticky` element, a modal `<dialog>`, a
`[popover]`, and a photograph. Check the **built** stylesheet, not the source —
the minifier rewrites `invert(1)` to `invert()` and strips whitespace between
filter functions, and that output is what users get.

## Two projects, one repo

The marketing site at the repository root (`index.html`, `website/`,
`vite.config.js`, root `public/`) is separate from the extension and builds with
`npm run site:build` / `site:dev` / `site:deploy`.

They share a `package.json` and a Vite version. One consequence worth knowing:
`publicDir` is set explicitly in `wxt.config.ts` because WXT resolves it relative
to the repository root, so the default picked up the *site's* `public/` folder
and shipped its logo instead of the extension icons.

## Roadmap context

v2.0.0 did two things at once: a correctness pass — fixing the white flash,
broken fixed positioning, unthemed dialogs, silently-lost settings, and the
storage quota ceiling — and the migration from hand-written MV3 to WXT and
TypeScript. It deliberately added no user-facing features.

What is planned next, in order:

1. **Global default mode with per-site opt-out.** Today the extension does
   nothing until the user clicks it on each individual site. Every competitor is
   on-by-default everywhere. This is the largest retention lever available.
2. Keyboard shortcut, brightness/contrast sliders, already-dark-site detection,
   scheduling.
3. A remotely-updatable per-site fix database (the mechanism Dark Reader uses to
   handle sites that filter inversion breaks), then a dynamic theme engine.

Feature work should not regress the invariants above.
