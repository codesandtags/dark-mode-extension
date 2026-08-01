import { defineConfig } from "wxt";

/**
 * See docs/adrs/0001-adopt-wxt-as-extension-framework.md for why WXT.
 *
 * srcDir is `extension` so the extension stays cleanly separated from the
 * marketing site at the repository root, which keeps its own Vite build.
 */
export default defineConfig({
  srcDir: "extension",
  outDir: ".output",

  /**
   * Set explicitly: WXT resolves publicDir relative to the repository root, not
   * to srcDir, so the default picked up the marketing site's `public/` folder
   * and shipped its logo instead of the extension icons.
   */
  publicDir: "extension/public",

  /**
   * Firefox reviewers need enough source to reproduce the build, and nothing
   * else. Without these exclusions the sources ZIP came to 1.9 MB, almost all of
   * it store promo art and previously released ZIPs.
   */
  zip: {
    excludeSources: [
      "assets/**",
      "releases/**",
      "website/**",
      "public/**",
      "index.html",
      "vite.config.js",
      // README.md and AGENTS.md are kept — they tell a reviewer how to build.
      "CHANGELOG.md",
      "CODE_OF_CONDUCT.md",
      "SECURITY.md",
      "documentation.md",
      "privacy-policy.md",
    ],
  },

  manifest: ({ browser }) => ({
    name: "Dark Mode Enabler",
    description:
      "Enables dark mode and filters on all websites that do not support it natively.",
    /**
     * Chrome MV3 requires an object here; Firefox MV2 requires a plain string
     * and AMO rejects the object form.
     */
    author:
      browser === "firefox"
        ? "codesandtags"
        : { email: "codesandtags@gmail.com" },

    /**
     * Deliberately minimal.
     *
     * `activeTab` was removed in 2.0.0: it was redundant next to the host
     * permissions the content script already requires.
     *
     * There is no `web_accessible_resources` block. Until 2.0.0 this extension
     * exposed manifest.json, popup.html and content-script.js to every site,
     * which let any page fingerprint users who had it installed. Nothing in the
     * codebase needs it — if you are tempted to add one, scope `matches` to the
     * specific origins that need the resource, never `<all_urls>`.
     */
    permissions: ["storage"],

    // Scheme-wildcard host access, deliberately NOT `<all_urls>`.
    //
    // `<all_urls>` additionally covers file: and ftp:, which would make 2.0.0 a
    // permission *increase* over the shipped 1.1.0. Chrome disables an extension
    // for every existing user until they re-approve an increase, and file:
    // access needs its own opt-in toggle regardless — so the broader pattern
    // costs real users and buys nothing.
    //
    // Keeping this narrow means 2.0.0's permission set is a strict subset of
    // 1.1.0's: activeTab dropped, web_accessible_resources dropped, nothing
    // added, so the update installs silently.
    host_permissions: ["*://*/*"],

    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "dark-mode-enabler@codesandtags.io",
              strict_min_version: "115.0",
            },
          },
        }
      : {
          // :popover-open, used by theme.css, landed in Chrome 114.
          minimum_chrome_version: "114",
        }),
  }),
});
