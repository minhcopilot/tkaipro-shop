# Import the Cursor Pro Shop catalog

This is an explicit, one-time import of the 16 active products from `tkcursorprod`.
Run on the VPS as an administrator with Docker/PostgreSQL access. No source
credentials, orders, reviews, or sales counters are exported. The Google and
Figma products already in the destination keep their IDs and slugs.

```sh
# Preview only (default); target can also be figmashop.
python3 scripts/sync-cursor-catalog.py --target tkaipro
# Use a fresh absolute run directory; each destination gets its own subfolder.
python3 scripts/sync-cursor-catalog.py --target tkaipro --apply \
  --backup-dir /root/catalog-backups/20261019
python3 scripts/sync-cursor-catalog.py --target tkaipro --verify
```

The script coordinates with the shared deployment lock. It makes a private
database dump, checks the archive with `pg_restore --list`, writes a before
snapshot and plan, then locks the catalog tables and refuses stale snapshots.
All product/category changes for one destination are committed in one transaction.
Dry-running or applying again matches existing products rather than duplicating
them; local stock and counters are preserved for previously imported accounts.

Google Pro/Ultra lead TKAIPro; Figma account/upgrade lead Figma Shop. Other
products start at sort order 100. New account/license/login-link products have
empty, independent inventory and cannot be ordered. Upgrade availability follows
the source. This does not add shared inventory or account/2FA delivery support.
Before stocking products that need delivery features absent in the destination,
implement and test those delivery features separately.

Source effective primary/alternate content is materialized into destination
content and locale fields. Source durations are preserved verbatim (including
the existing 360/367-day Figma values); the import does not reinterpret them.
Relative media links are resolved against `https://tkcuso.com/`.

## Verification and rollback

Run Bun tests and `python3 -m unittest discover -s scripts -p test_sync_cursor_catalog.py`.
Check 16 active products, 2 featured products, old IDs/slugs, prices, translations,
stock flags and public list/detail/homepage/checkout behavior after deployment.

Before deploying, retain the current image ID and Git revision. Existing deploy
scripts also tag the running image as `:previous` and use the VPS deployment lock.
Rollback application images through the same lock, then run the generated
`rollback.sql` with `psql -v ON_ERROR_STOP=1` if reverting catalog data is needed.
Review subsequent admin edits before rollback. Scoped rollback restores changed
fields on pre-existing products and deactivates new products/categories instead
of deleting rows that could be referenced by later orders. The complete
`database.dump` is for disaster recovery; do not restore it over subsequent sales.
