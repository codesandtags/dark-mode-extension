# 1. Adopt WXT as the extension framework

- **Status:** Accepted
- **Date:** 2026-08-01
- **Deciders:** Edwin Torres

## Context

Through v1.1.0 the extension was hand-written MV3: a literal `manifest.json`, three
plain `.js` files loaded as-is, and no build step. That was appropriate at ~350
lines, but the roadmap out of the codebase review pushes past what it can carry:

- **Per-site fix database.** A config of URL patterns and CSS overrides, fetched
  and cached at runtime. Needs bundling and a schema.
- **Brightness/contrast/sepia sliders.** Real popup state, not four radios.
- **Scheduling and keyboard shortcuts.** More entrypoints, more shared state.
- **Cross-browser distribution.** Firefox and Edge listings are additional
  acquisition channels for the 1,000 weekly-user target, and maintaining three
  hand-edited manifests that differ in `background`, `browser_action` and
  `author` is exactly the kind of drift that ships broken releases.
- **Localisation.** 34% of the user base is outside `en-US`.

There is also one property the codebase must not lose. The headline fix shipping
in v2.0.0 is removing the white flash on page load, and it works because the theme CSS is
listed in the manifest's `content_scripts.css` array, which the browser applies
before the page renders. Any tooling that moves that CSS to a runtime JS
injection silently reintroduces the flash. **This is the hard constraint on the
decision.**

## Options considered

### Stay hand-written

No new dependencies, nothing to learn, full control of the manifest.

Rejected: every item on the roadmap adds toolchain work we would end up building
ourselves — per-browser manifest generation, a bundler for the fix database, an
i18n layer, store-upload automation. That is a framework, written worse and
maintained by one person.

### Plasmo

React-first, file-based conventions, Parcel under the hood. Its CSUI system for
injecting React components into pages is genuinely best-in-class.

Rejected on three counts:

1. **Maintenance trajectory.** As of early 2026 Plasmo is effectively in
   maintenance mode — commits continue but feature work has slowed, with the team
   focused on the commercial Itero/BPP products. For a solo-maintained extension
   that needs to stay shippable for years, that is the wrong bet.
2. **Wrong shape for this codebase.** Its main advantage is React ergonomics.
   This extension has no React and does not need any: the popup is a handful of
   inputs, and the content script must stay as close to zero-cost as possible
   because it runs at `document_start` on every frame of every page.
3. **Parcel.** 2–3× slower builds than Vite, and the repository is already on
   Vite for the marketing site.

### CRXJS

Rejected: partial cross-browser support, no entrypoint discovery, and it targets
either MV2 or MV3 rather than both.

### WXT (chosen)

Vite-based, framework-agnostic, file-based entrypoints, actively maintained, and
explicitly modelled on Nuxt's conventions.

## Decision

**Adopt WXT.**

It satisfies the hard constraint directly: CSS imported by a content-script
entrypoint is bundled into the manifest's `css` array by default
(`cssInjectionMode: "manifest"`). This was verified against the generated
manifest rather than taken on faith, and the built stylesheet was loaded into a
browser to confirm the minifier's `invert()hue-rotate(180deg)` rewrite still
computes to `invert(1) hue-rotate(180deg)`.

Beyond that:

| Requirement | How WXT covers it |
| --- | --- |
| No frontend framework | Framework-agnostic; vanilla is a first-class target |
| Chrome + Firefox + Edge | One codebase, per-browser manifests, Firefox sources ZIP |
| Already on Vite | Vite-based, so one bundler for extension and site |
| Store publishing | `wxt submit` automates uploads |
| Localisation | Built-in i18n wrapper |
| Maintenance | Actively developed; the 2026 default recommendation |

Two supporting decisions were taken at the same time:

- **TypeScript.** WXT is TS-first and its generated `.wxt/` types only pay off in
  TS. At this size the migration was near-free, and the Phase 2/3 work — fix-database
  schemas, settings objects, slider state — is exactly where types earn their keep.
- **`srcDir: "extension"`.** Keeps the extension separate from the marketing site
  that shares this repository and retains its own Vite build under the `site:*`
  scripts.

## Consequences

### Positive

- Three browser targets from one source, with the manifest differences (MV3
  service worker vs MV2 background scripts, `action` vs `browser_action`, object
  vs string `author`) handled by the framework instead of by hand.
- Typed browser APIs and a compile step (`npm run compile`) that catches the
  class of bug that shipped in v1.1 — the popup and content script had drifted
  into two different representations of the same mode enum.
- HMR in development, and `wxt submit` for releases.
- Entrypoint layout is conventional, which makes the codebase legible to
  contributors and to AI agents (see `AGENTS.md`).

### Negative

- **A build step is now mandatory.** `extension/` can no longer be loaded
  unpacked; `.output/chrome-mv3/` is the loadable artifact. Contributors must run
  `npm install` before they can load anything.
- **WXT is pre-1.0** (0.21.3 at time of writing). Breaking changes between minor
  versions are possible. Mitigation: the version is pinned in `package.json`, and
  the extension's own logic is plain DOM and `browser.*` calls that would port to
  another builder in an afternoon if that became necessary.
- **Auto-imports are implicit.** `defineContentScript`, `defineBackground` and
  `browser` are injected by WXT with no import statement, which reads as magic
  until you know. Mitigated by documenting it in `AGENTS.md`; project code under
  `extension/lib/` uses explicit imports deliberately.
- Vite had to be upgraded from 5 to 8 for WXT 0.21 compatibility, which also
  affects the marketing site build.

### Neutral

- Firefox builds target MV2, which is WXT's default and remains fully supported
  by AMO. Revisit if Firefox MV3 becomes required.
- The theme stylesheet moved from `extension/theme.css` to
  `extension/entrypoints/content/theme.css` so WXT associates it with the content
  script entrypoint.

## References

- [WXT — comparison with Plasmo and CRXJS](https://wxt.dev/guide/resources/compare)
- [WXT — content scripts and CSS](https://wxt.dev/guide/essentials/content-scripts.html)
- [Migrating a browser extension from Plasmo to WXT](https://dev.to/gorvgoyl/the-journey-of-migrating-our-browser-extension-from-plasmo-to-wxt-framework-2c83)
- [Plasmo vs CRXJS vs WXT in 2026](https://dev.to/extensionbooster/plasmo-vs-crxjs-vs-wxt-which-chrome-extension-framework-should-you-use-in-2026-37o4)
