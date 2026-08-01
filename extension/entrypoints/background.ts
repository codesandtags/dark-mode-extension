import {
  LEGACY_SYNC_KEY,
  MIGRATION_FLAG,
  isKnownMode,
  siteKey,
} from "@/lib/settings";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    migrateLegacySettings()
      .then(({ migrated, skipped }) => {
        if (!skipped) {
          console.info(
            `[dark-mode-enabler] migrated ${migrated} site(s) to local storage`
          );
        }
      })
      .catch((error) => {
        console.error("[dark-mode-enabler] migration failed:", error);
      });
  });
});

/**
 * Moves v1.1 settings into their new home.
 *
 * v1.1 kept every site the user had ever configured inside one
 * chrome.storage.sync key. That key is capped by QUOTA_BYTES_PER_ITEM at 8 KB,
 * which works out to roughly 290 hostnames — past that every write failed, and
 * because the callback never checked runtime.lastError it still logged success.
 *
 * The legacy sync key is intentionally left in place. It costs a few hundred
 * bytes and means a user who rolls back to 1.1 does not lose their sites.
 */
async function migrateLegacySettings(): Promise<{
  migrated: number;
  skipped: boolean;
}> {
  const local = await browser.storage.local.get(MIGRATION_FLAG);

  if (local[MIGRATION_FLAG]) {
    return { migrated: 0, skipped: true };
  }

  const legacy = await browser.storage.sync.get(LEGACY_SYNC_KEY);
  const savedSites = (legacy[LEGACY_SYNC_KEY] ?? {}) as Record<string, unknown>;
  const migrated: Record<string, unknown> = {};
  let count = 0;

  for (const [hostname, mode] of Object.entries(savedSites)) {
    // v1.1 wrote an empty-string hostname for pages served from a null origin.
    if (hostname && isKnownMode(mode)) {
      migrated[siteKey(hostname)] = mode;
      count += 1;
    }
  }

  migrated[MIGRATION_FLAG] = true;
  await browser.storage.local.set(migrated);

  return { migrated: count, skipped: false };
}
