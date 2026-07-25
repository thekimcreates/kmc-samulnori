# Phase 3E — macOS Safari Live Firebase Fix

Upload every included file to the matching location in the project and replace the existing version.

## What changed

- Firestore IndexedDB persistence is disabled only for macOS Safari.
- Chrome, iPhone Safari, and other supported public browsers retain their existing persistence behavior.
- Public Firestore reads contact the server immediately and no longer wait for persistence initialization.
- The shared local data-cache version was changed from v1 to v2, so stale saved records are ignored.
- The public bundle cache version is now `20260725p3e` on all four public pages.

## After deployment

1. Close every open KMC tab in macOS Safari.
2. Open the public website again.
3. A normal refresh should now retrieve current Firebase content.

No Firebase rules or collection changes are required.
