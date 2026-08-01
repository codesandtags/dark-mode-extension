# Chrome Web Store listing

The copy that goes in the Developer Dashboard. Kept here so it is versioned with
the code and can be reviewed in a PR rather than edited straight into a form.

## Summary (132 char limit)

Generated from `manifest.description` in `wxt.config.ts`, so change it there and
rebuild — the dashboard field is read-only.

```
Dark mode for websites that don't have one. Dark, sepia and grayscale, with brightness and warmth controls for night reading.
```

## Description

Copy the block below into **Store listing → Description**.

```
Some sites still have no dark mode. Dark Mode Enabler gives them one — and gets out of the way on the sites that already do.

Pick a display mode per site and it is remembered. Reading late at night stops meaning a screen full of white light.

🌙 FOUR DISPLAY MODES
Dark, Sepia, Grayscale, or off. Dark inverts the page for night reading. Sepia warms it down like paper. Grayscale drains colour so you can concentrate. Your choice is saved per website.

🎛️ TUNE IT TO YOUR SCREEN
Brightness, contrast and warmth controls. Take the glare off white text, lift harsh pure black to a softer grey, or cut blue light late at night. Set it once and it applies everywhere.

⚡ NO WHITE FLASH
The theme is in place before the page renders, so you are never blinded by a white screen while a slow site loads.

🧩 PAGES KEEP WORKING
Sticky headers, navigation bars, menus, dialogs and pop-ups all behave normally. Photographs stay photographs instead of turning into negatives, and dark logos do not vanish into the background.

✅ KNOWS WHEN TO STAY OUT OF THE WAY
Plenty of sites ship their own dark theme. Inverting one of those turns a good dark page into a bright one. Dark Mode Enabler spots them and tells you, so you can leave those sites to handle themselves.

🔒 GENUINELY PRIVATE
No analytics. No telemetry. No accounts. No network requests of any kind. The only thing stored is which mode you picked for which site, and it never leaves your device.

🧑‍💻 OPEN SOURCE
Every line is public at github.com/codesandtags/dark-mode-extension. You do not have to take any of the above on trust.

Works on news sites, documentation, dashboards, webmail, forums, wikis and anything else that only ever shipped a light theme.
```

## Screenshots

Export at **exactly 1280×800**, PNG, max five. Order matters — the first is
shown largest and is the only one many people look at.

### Choosing sites to demo on

Demo on sites that are **light-only**. Showing the extension applied to YouTube,
Google Docs or Gmail undercuts the pitch, because those already ship dark themes
— and on YouTube our own "Already dark" pill appears and says so.

Good candidates: Hacker News, long-form documentation, a Substack or newsletter
post, a recipe or personal blog, a local news site, Craigslist.

Keep other companies' logos small and incidental. A browser extension screenshot
naturally shows real sites, but the frame should be about *our* UI, not their
brand.

### Shared style

- Canvas 1280×800, dark neutral background (`#0f1013`) where the capture does
  not fill the frame.
- Caption: bold, ~34px, `#f4d35e` on a `#111` rounded pill, 16px radius,
  20×28px padding.
- Caption anchored **bottom-centre, 56px from the bottom**, max width 80%. Same
  position in every frame — it becomes a through-line across the carousel.
- Crop tight. Full browser chrome wastes half the frame on tabs nobody reads.
- Never cut a window mid-word at the edge.

### Frame 1 — Before / after (hero)

The single most persuasive image. One site, split down the middle.

- Pick one light-only article page with visible text, a heading and one photo.
- Set a fixed viewport so both captures align exactly: DevTools → device toolbar
  → responsive → 1280×800.
- Capture twice at the **identical scroll position**: once with the extension
  Off, once with Dark on. Do not scroll between captures.
- Composite: left 640px from the Off capture, right 640px from the Dark capture,
  with a 2px `#f4d35e` vertical divider at x=640.
- Small labels: `BEFORE` top-left, `AFTER` top-right, 20px, semi-transparent
  white, 24px inset.
- Caption: **Any website, instantly readable at night**

### Frame 2 — The popup doing the work

Proves it is our extension, not the site's own theme.

- Same kind of light-only site, Dark mode on, popup open.
- Crop so the popup occupies roughly the right third and is **fully legible** —
  mode tiles readable, site name readable. Zoom the browser to 110–125% before
  capturing if needed.
- The `Dark` tile must be visibly selected (orange).
- Caption: **One click. Dark, sepia or grayscale.**

### Frame 3 — Appearance controls

- Same site, popup open, Appearance section visible.
- **Move the sliders off their defaults before capturing** — e.g. Brightness 70%,
  Contrast 80%, Warmth 30%. Defaults demonstrate nothing.
- The `Reset` button appears once values are non-default; that is good, it shows
  the controls are live.
- Crop tight on the popup, page content softly visible behind for context.
- Caption: **Tune the brightness, contrast and warmth**

### Frame 4 — Already-dark detection

Our only real differentiator against Dark Reader. It must be *legible*.

- Open a site that has its own dark theme (YouTube is fine here — this is the
  one frame where that is the point).
- Popup open, mode `Off`, the green **ALREADY DARK** pill visible.
- Crop tight around the popup so the pill is unmistakable. This frame should be
  mostly popup, not mostly page.
- If the toolbar badge is showing, include it and add a subtle circular
  highlight around the extension icon.
- Caption: **Knows when a site already has dark mode**

### Frame 5 — Sepia

Reaches the reading-mode audience, who are a real slice of this market.

- A long-form article, Sepia mode on, popup closed or minimally visible.
- Show enough body text that the warm tone is obvious.
- Caption: **Sepia mode for long reading sessions**

## Category

Accessibility. Correct as-is; "Productivity" is more crowded and a worse fit.

## Single purpose

Goes in **Privacy → Single purpose**. Reviewers read this to decide whether the
requested permissions are proportionate, so it must be a *narrow statement of
purpose*, not a marketing description. Keep it one idea.

```
Dark Mode Enabler applies a colour filter chosen by the user — dark, sepia, or grayscale — to websites that do not provide a dark theme of their own, so those pages are easier to read in low light. The filter is applied per site and remembered. The extension has no other function.
```

Do not paste the store description here. The old value was the marketing copy,
which opened by hedging ("or at least, invert colors") and never actually named
a single purpose.

## Permission justifications

Kept in sync with what the manifest actually requests. See `privacy-policy.md`.

**storage**

```
Stores which display mode the user selected for each website, and their global brightness, contrast and warmth settings, so the choices persist between sessions. Nothing else is stored and nothing is transmitted.
```

**Host permissions (`*://*/*`)**

```
The extension applies a colour filter to whichever page the user chooses to theme, so it cannot know the relevant sites in advance. The stylesheet must also be present before the page paints, otherwise every page load flashes white before turning dark.

Its use of this access is limited to two things: injecting a fixed stylesheet that stays inert until the user enables a mode for that site, and setting a single attribute on the page's root element to activate it. The extension does not read page content, form input, cookies or browsing history, and makes no network requests.
```

**Note:** `activeTab` was removed in 2.0.0. Delete its justification if the
dashboard still has one saved.
