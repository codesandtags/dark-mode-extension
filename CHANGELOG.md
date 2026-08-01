# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-08-01

A correctness release, a rebuild of the toolchain, and the first real controls.

### Added

- **Appearance controls** — brightness, contrast and warmth, layered on top of whichever display mode is active. Settings are global rather than per-site, deliberately: per-site appearance is what makes Midnight Lizard exhausting to configure, and global look plus per-site on/off is the model users actually understand.

  Brightness and contrast stop at 100%. `brightness()` is a multiplier applied after the inversion, so on an inverted page — where the background has become 0 and the text 255 — anything above 100% is arithmetically a no-op. Contrast does the heavier lifting on a dark page, because lowering it lifts the background off pure black and takes the glare off white text at the same time.

  There is no grayscale *amount*: grayscale is already one of the display modes, and offering the same effect twice invited people to grab the wrong slider and then wonder why "grayscale" turned the page yellow.

  The whole section is hidden while the site is set to Off, since the filters it feeds only exist inside the per-mode rules — sliders that visibly move and change nothing read as broken.
- **Redesigned popup** — mode tiles with icons in place of radio buttons, the current site shown in the header, and a reset control that appears only when appearance has been changed.

### Fixed — images

- Logos no longer disappear in dark mode. Dark mode inverts the page and then inverts media back so photographs are not negatives, but that is wrong for logos and icons, which are usually dark ink on a transparent background — counter-inverting one repaints the dark ink onto a now-dark page. Images are now classified and icons are left to invert with the page. The classifier is deliberately biased towards "photograph", since a mis-called photo looks alarming while a mis-called logo is only the status quo.
- Removed `picture` from the counter-invert list. It wraps the `<img>` that actually renders, so filtering both inverted the image twice and cancelled the correction out.

### Changed — permissions

The 2.0.0 permission set is a strict subset of 1.1.0's, so the update installs silently for existing users rather than being disabled pending re-approval:

- Removed `web_accessible_resources` (see below) and the redundant `activeTab`.
- Host access stays `*://*/*` rather than widening to `<all_urls>`, which would have added `file:` and `ftp:` and counted as a permission increase.

### Changed — build system

- Migrated from hand-written MV3 to [WXT](https://wxt.dev) with TypeScript and Vite. The manifest is now generated from `wxt.config.ts`; there is no `manifest.json` to hand-edit. See [docs/adrs/0001](docs/adrs/0001-adopt-wxt-as-extension-framework.md) for why WXT over Plasmo.
- Chrome, Firefox and Edge are now built from one codebase, with the per-browser manifest differences handled by the build instead of by hand.
- Source moved to WXT's entrypoint layout under `extension/`. `extension/` is now source and can no longer be loaded unpacked — build first and load `.output/chrome-mv3/`.
- Added `npm run compile` (`tsc --noEmit`) and `npm run zip:all` for store-ready packages.
- Added `AGENTS.md` documenting the architecture and the invariants that should not be broken.

### Fixed

- Removed the white flash on page load. Theme CSS is now a static stylesheet injected before the page renders, and the content script runs at `document_start` instead of `document_idle`.
- Sticky headers, navigation bars and modals no longer scroll away when a mode is active. The filter moved from `<body>` to `<html>`, which the Filter Effects spec exempts from creating a containing block for fixed-position descendants.
- Modal dialogs and popovers are now themed. They render in the browser's top layer and escape the root filter, so they previously stayed bright white on a dark page.
- Display mode choices are no longer silently lost. The popup writes settings directly instead of delegating to the content script, whose `tabs.sendMessage` failures were being swallowed.
- Settings no longer stop saving after roughly 290 sites. Sites moved from a single `chrome.storage.sync` key (capped at 8 KB) to one `chrome.storage.local` key per hostname. Existing settings are migrated automatically on update.
- Images inside iframes are no longer displayed as negatives.
- Inline `<svg>` icons are no longer counter-inverted, which had been rendering black icons invisible on dark backgrounds.
- Photographs survive inversion far better: the dark filter is now `invert(1)`, which round-trips exactly against the counter-invert applied to media. `invert(0.9)` could not be undone and left images muddied.
- Fixed a typo (`body.sephia`) that meant sepia mode never applied its text-selection colors.
- The popup version number is read from the manifest instead of being hardcoded.

### Added

- Changes propagate to every open tab of the same site immediately, via `chrome.storage.onChanged`.
- The theme is restored automatically if a single-page app overwrites the root element's attributes.
- The popup shows which site the setting applies to, and says so plainly when a page cannot be themed (`chrome://` pages, the Chrome Web Store, and similar).

### Changed

- Removed the `web_accessible_resources` block, which exposed `manifest.json`, `popup.html` and `content-script.js` to every website and let any page fingerprint users who had the extension installed.
- Removed the redundant `activeTab` permission.
- Corrected `privacy-policy.md`, which incorrectly claimed the extension did not have access to all sites.
- Modes and storage keys now live in a single shared module rather than being duplicated, with different representations, across the popup and content script.

## [1.1.0] - 2023-12-18

### Added

- Refactored code to extend styles according to mode selected, instead of only using a filter.
- Added better support to avoid hue shifts when inverting colors for images and videos.
- Added class instead of inline styles to avoid conflicts with other stylesheets.

## [1.0.0] - 2023-12-10

### Added

- First official release of Dark Mode Enabler Chrome Extension.

## [0.0.2] - 2023-12-06

### Added

- Updated styles for the popup.
- Updated documentation for the project.

## [0.0.1] - 2023-12-04

### Added

- Initial release of Dark Mode Enabler Chrome Extension.
- Added `manifest.json` file.
- Added `README.md` file.
- Added `LICENSE` file.
- Added `SECURITY.md` file.
- Added `CHANGELOG.md` file.
- Added basic functionality to invert colors of any website.
