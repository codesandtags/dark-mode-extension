# Dark Mode Enabler

<img src="extension/public/icon/128.png" alt="Dark Mode Enabler Logo" width="100px" height="auto"/>

Dark Mode Enabler is an open-source browser extension that applies dark, sepia or grayscale filters to websites that have no dark mode of their own — so you can stop staring into a white screen at night.

Built with [WXT](https://wxt.dev) and TypeScript. Runs on Chrome, Firefox and Edge from a single codebase.

[🧩 Install from the Chrome Web Store](https://chromewebstore.google.com/detail/dark-mode-enabler/jpgjmidladomebfdpanhbeodbmkibdcp)

## Features

- **Four display modes** — Dark, Sepia, Grayscale, or Disabled.
- **Knows when to stay out of the way** — badges sites that already have their own dark theme, so you don't invert a dark page into a light one.
- **13 languages** — English, Spanish, Portuguese (BR), Russian, German, French, Italian, Japanese, Korean, Chinese (Simplified), Turkish, Polish and Indonesian.
- **Tune the look** — brightness, contrast and warmth controls.
- **Per-site memory** — your choice is remembered for each website.
- **No flash of white** — the theme is applied before the page renders.
- **Keeps layouts intact** — sticky headers, modals and popovers keep working.
- **Photos stay photos, logos stay visible** — images are classified so photographs are not shown as negatives and dark logos do not vanish into the background.
- **Instant across tabs** — changing a mode updates every open tab of that site.
- **No tracking** — no analytics, no telemetry, no network requests at all.

## Examples

https://github.com/codesandtags/dark-mode-extension/assets/5404833/081d8ea0-f086-4ee2-81ff-21149e58ff64

## How to use

1. Install from the Chrome Web Store.
2. Open a site you want to theme and click the extension icon.
3. Pick a display mode. It is remembered for that site.

## Permissions

- **storage** — Stores the display mode you picked for each website, so your choice survives restarting the browser. Nothing else is stored, and nothing leaves your device.
- **host permissions (`*://*/*`)** — Required to inject the stylesheet on any site you might want to theme, before the page paints. The extension does not read page content and makes no network requests. See [privacy-policy.md](privacy-policy.md).

---

## Development

### Requirements

Node.js 20 or newer.

### Setup

```bash
npm install
```

This also runs `wxt prepare`, which generates the TypeScript types in `.wxt/`.

### Run in development

```bash
npm run dev
```

WXT builds the extension, launches a fresh browser profile with it already installed, and hot-reloads on save. For Firefox:

```bash
npm run dev:firefox
```

### Build

```bash
npm run build
```

Output goes to `.output/chrome-mv3/`. To build every target:

```bash
npm run build:all
```

### Install a local build manually

The extension **must be built before it can be loaded** — `extension/` is source, not a loadable extension.

**Chrome / Edge / Brave**

1. `npm run build`
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select the `.output/chrome-mv3` folder in this repository.

The Dark Mode Enabler icon appears in your toolbar. After a rebuild, click the reload icon on the extension's card to pick up changes.

**Firefox**

1. `npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…**
4. Select `.output/firefox-mv2/manifest.json`.

Temporary add-ons are removed when Firefox restarts.

### Package for the stores

```bash
npm run zip:all
```

Produces store-ready ZIPs in `.output/`, including the sources ZIP that Firefox reviewers require.

### Type checking

```bash
npm run compile
```

## Architecture

```
wxt.config.ts                Manifest + per-browser overrides (generated, don't hand-edit)
extension/
├── entrypoints/
│   ├── background.ts        Service worker — migrates pre-1.2 settings
│   ├── content/
│   │   ├── index.ts         Sets data-dme-mode on <html> at document_start
│   │   └── theme.css        All theme rules
│   └── popup/               Mode picker; owns persistence
├── lib/settings.ts          Modes and storage keys — single source of truth
└── public/icon/             Extension icons
```

The popup writes the chosen mode to `browser.storage.local`; the content script listens on `storage.onChanged` and sets an attribute on `<html>` that `theme.css` keys off. There is no message passing between them, so there is nothing to fail silently on pages where a content script cannot run.

Two details worth knowing:

- **The filter is applied to `<html>`, not `<body>`.** The Filter Effects spec exempts the document root from the rule that a filtered element becomes the containing block for fixed-position descendants. On `<body>` it breaks every sticky header on the page; on `<html>` it does not.
- **Theme CSS is listed in the manifest's `content_scripts.css` array**, so the browser applies it before the first paint. This is what removes the white flash, and it is why the CSS is imported by the content script entrypoint rather than injected from JavaScript.

More detail, including the invariants that should not be broken, is in [AGENTS.md](AGENTS.md). Design decisions are recorded in [docs/adrs](docs/adrs).

## The marketing site

This repository also hosts the small site published at [codesandtags.github.io/dark-mode-extension](https://codesandtags.github.io/dark-mode-extension/). It is separate from the extension:

```bash
npm run site:dev
npm run site:build
npm run site:deploy
```

## Contributing

Contributions are welcome. If a site renders badly with a mode enabled, please open an issue with the URL and a screenshot — that is the most useful kind of report this project can get.

Before opening a PR, run `npm run compile` and check your change against a page with a fixed header, a modal dialog and a photograph. See [AGENTS.md](AGENTS.md) for the reasoning behind the current design.

## Compatibility

Chrome 114+, Edge 114+, Firefox 115+. Works on any page an extension is allowed to inject into — browser settings pages, the web stores and PDF viewers are excluded by the browser itself, and the popup will tell you when that is the case.

## Disclaimer

Dark Mode Enabler is not affiliated with any website or company. It is an independent project created by Edwin Torres.

## License

Released under the [MIT License](LICENSE).

## Contact

Questions, suggestions or feedback: codesandtags@gmail.com, or the [GitHub issue tracker](https://github.com/codesandtags/dark-mode-extension/issues).
