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

Required: 1280x800 or 640x400, at least one, up to five.

The current screenshots are stale — they show the pre-2.0 popup and old version
numbers. Replace them. Worth capturing, in this order:

1. **A well-known light site in Dark mode**, popup open. The money shot.
2. **The appearance controls**, mid-adjustment, so the sliders are legible.
3. **The "Already dark" state** — a site with its own dark theme, badge and pill
   visible. This is the differentiator; no competitor screenshot shows it.
4. **Sepia mode** on an article, for the reading-mode audience.
5. **A before/after split** of the same page.

Avoid screenshots that are mostly a wall of small text — they read as noise at
the size the store renders them.

## Category

Accessibility. Correct as-is; "Productivity" is more crowded and a worse fit.

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
