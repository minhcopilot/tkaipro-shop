#!/usr/bin/env python3
"""One-time catalog import on the VPS. Dry-run by default; never reads source credentials.

python3 scripts/sync-cursor-catalog.py --target tkaipro
python3 scripts/sync-cursor-catalog.py --target tkaipro --apply --backup-dir /root/catalog-backups/RUN
python3 scripts/sync-cursor-catalog.py --target tkaipro --verify
"""
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess
from urllib.parse import urljoin

SOURCE = "tkcursorprod"
COMMON = "name slug category description short_description price original_price image images duration features specs tags product_type upgrade_email_only linked_upgrade_product_id hidden_from_listing name_locales description_locales short_description_locales features_locales".split()
VARIANT = "content_variant alt_name alt_description alt_short_description alt_features alt_name_locales alt_description_locales alt_short_description_locales alt_features_locales".split()
CONFIG = {
    "tkaipro": {
        "mapped": {"L-AW1AxY9tXE1-U6nu-L5": "prodTkGooglePro000001", "x0NJkIvg7AacZ5WL8O_Ed": "prodTkGoogleUltra00001"},
        "category": ("53_A1Zb47e9lEsINkzjGj", "catTkGoogleAI00000001"),
        "featured": ["L-AW1AxY9tXE1-U6nu-L5", "x0NJkIvg7AacZ5WL8O_Ed"],
    },
    "figmashop": {
        "mapped": {"F60c0OMRdKyPTWTA-oBJf": "nq0rDU76WTlt8e6NfkiEA", "8Vbq50-j6JYAO8j7RC7pP": "FPcBbYzDh28PRSMZP6MYd"},
        "category": ("bLYgSnT7Ait2_h9wMaYTw", "k0CUgWGOMo95Y33ZLjizV"),
        "featured": ["F60c0OMRdKyPTWTA-oBJf", "8Vbq50-j6JYAO8j7RC7pP"],
    },
}


def psql(db, sql):
    result = subprocess.run(["docker", "exec", "-i", "postgres", "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", db], input=sql, text=True, capture_output=True, check=True)
    return result.stdout.strip()


def rows(db, table, columns):
    return json.loads(psql(db, f"SELECT COALESCE(json_agg(t ORDER BY id),'[]'::json) FROM (SELECT {columns} FROM {table}) t;"))


def literal(value):
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (dict, list)):
        return literal(json.dumps(value, ensure_ascii=False)) + "::json"
    return "'" + str(value).replace("'", "''") + "'"


def insert(table, record):
    return f"INSERT INTO {table} ({','.join(record)}) VALUES ({','.join(literal(v) for v in record.values())});"


def update(table, record, row_id):
    return f"UPDATE {table} SET " + ",".join(f"{k}={literal(v)}" for k, v in record.items()) + f" WHERE id={literal(row_id)};"


def effective(source):
    result = {k: source.get(k) for k in COMMON}
    if source.get("content_variant") == "alt" and (source.get("alt_name") or "").strip():
        result["name"] = source["alt_name"]
        result["name_locales"] = source.get("alt_name_locales") or {}
        for field in ["description", "short_description", "features"]:
            alt = source.get("alt_" + field)
            if (isinstance(alt, str) and alt.strip()) or (isinstance(alt, list) and alt):
                result[field] = alt
                result[field + "_locales"] = source.get("alt_" + field + "_locales") or {}
    for key in ("image",):
        if result.get(key):
            result[key] = urljoin("https://tkcuso.com/", result[key])
    if result.get("images"):
        result["images"] = [urljoin("https://tkcuso.com/", value) for value in result["images"]]
    return result


def plan(target, source, categories, before, before_categories):
    cfg = CONFIG[target]
    existing = {p["id"]: p for p in before}
    by_slug = {p["slug"]: p for p in before}
    category_ids = {c["id"]: c for c in before_categories}
    category_slugs = {c["slug"]: c for c in before_categories}
    source_categories = {c["id"]: c for c in categories}
    new_categories, category_map = [], {}
    ordered_categories, visited, visiting = [], set(), set()

    def include_category(category_id):
        if category_id in visited:
            return
        assert category_id not in visiting, "Category cycle"
        visiting.add(category_id)
        cat = source_categories[category_id]
        if cat.get("parent_id"):
            include_category(cat["parent_id"])
        visiting.remove(category_id)
        visited.add(category_id)
        ordered_categories.append(category_id)

    for category_id in sorted({p["category"] for p in source}):
        include_category(category_id)
    for category_id in ordered_categories:
        cat = source_categories[category_id]
        if category_id == cfg["category"][0]:
            dest_id = cfg["category"][1]
            assert dest_id in category_ids, "Required destination category missing"
        elif cat["slug"] in category_slugs:
            dest_id = category_slugs[cat["slug"]]["id"]
        else:
            dest_id = category_id
            assert dest_id not in category_ids, "Category ID conflict"
            new_categories.append({**cat, "id": dest_id, "parent_id": None, "sort_order": 100 + len(new_categories), "is_active": True})
        category_map[category_id] = dest_id
    for cat in new_categories:
        parent = source_categories[cat["id"]].get("parent_id")
        if parent:
            assert parent in category_map, "Parent category outside import"
            cat["parent_id"] = category_map[parent]
    id_map = {}
    for p in source:
        dest_id = cfg["mapped"].get(p["id"])
        if dest_id:
            assert dest_id in existing, "Required destination product missing"
        else:
            dest_id = by_slug.get(p["slug"], {}).get("id", p["id"])
            assert dest_id not in existing or existing[dest_id]["slug"] == p["slug"], "Product ID conflict"
        id_map[p["id"]] = dest_id
    changes = []
    for index, p in enumerate(sorted(source, key=lambda p: p["id"])):
        row_id = id_map[p["id"]]
        old = existing.get(row_id)
        record = effective(p)
        record["category"] = category_map[p["category"]]
        if old:
            record["slug"] = old["slug"]
        if p.get("linked_upgrade_product_id"):
            record["linked_upgrade_product_id"] = id_map[p["linked_upgrade_product_id"]]
        primary = p["id"] in cfg["featured"]
        record.update(status="active", is_featured=primary, is_popular=primary,
                      sort_order=(10 * (cfg["featured"].index(p["id"]) + 1) if primary else 100 + index))
        if old and old["product_type"] != p["product_type"]:
            assert old["credential_count"] == 0, "Cannot change product type with local credentials"
        if p["product_type"] == "upgrade":
            record["in_stock"] = p["in_stock"]
        elif not old:
            record["in_stock"] = False
        if not old:
            record.update(stock_quantity=0, account_credentials=[], rating=0, review_count=0, sales_count=0, cost_price=0)
        changes.append({"source_id": p["id"], "id": row_id, "old": old, "record": record})
    assert len(id_map.values()) == len(set(id_map.values())), "Ambiguous destination mapping"
    assert {p["id"] for p in before if p["status"] == "active"} <= set(id_map.values()), "Unmapped active destination product"
    return changes, new_categories


def verify(target, changes, before, before_categories, new_categories):
    after = json.loads(psql(target, "SELECT COALESCE(json_agg(to_jsonb(p)-'account_credentials' ORDER BY id),'[]'::json) FROM (SELECT *,json_array_length(COALESCE(account_credentials,'[]'::json)) AS credential_count FROM product) p;"))
    after_map = {p["id"]: p for p in after}
    assert len([p for p in after if p["status"] == "active"]) == 16
    for change in changes:
        actual = after_map[change["id"]]
        for field, value in change["record"].items():
            if field == "account_credentials":
                assert actual["credential_count"] == 0
            else:
                assert actual[field] == value, f"Mismatch {change['id']}.{field}"
        old = change["old"]
        if old:
            for key in ("slug", "stock_quantity", "credential_count", "rating", "review_count", "sales_count", "cost_price", "created_at"):
                assert actual[key] == old[key], f"Local history changed: {key}"
    imported = {c["id"] for c in changes}
    for old in before:
        if old["id"] not in imported:
            for key, value in old.items():
                assert after_map[old["id"]][key] == value, f"Unrelated product changed: {key}"
    category_columns = "id,name,slug,description,name_locales,image,parent_id,is_active,sort_order"
    actual_categories = {c["id"]: c for c in rows(target, "product_category", category_columns)}
    for category in before_categories + new_categories:
        assert actual_categories[category["id"]] == category, "Category mismatch"
    print(json.dumps({"target": target, "verified": True, "active": 16, "featured": [c["id"] for c in sorted(changes, key=lambda c: c["record"]["sort_order"]) if c["record"]["is_featured"]]}))


def main():
    import fcntl  # VPS-only locking; keep planning helpers testable on Windows.
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", choices=CONFIG, required=True)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--backup-dir", type=Path)
    args = parser.parse_args()
    os.umask(0o077)
    # Coordinate with deployments and other catalog runs, including dry-run snapshots.
    with open("/var/lock/cursor-shops-deploy.lock", "a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        source = rows(SOURCE, "product WHERE status='active'", ",".join(["id", "in_stock", "status"] + COMMON + VARIANT))
        assert len(source) == 16, "Source active count changed; review before importing"
        columns = "id,name,slug,description,name_locales,image,parent_id,is_active,sort_order"
        categories = rows(SOURCE, "product_category", columns)
        # Exclude local credential material entirely; counts are sufficient for invariants.
        before = json.loads(psql(args.target, "SELECT COALESCE(json_agg(to_jsonb(p)-'account_credentials' ORDER BY id),'[]'::json) FROM (SELECT *,json_array_length(COALESCE(account_credentials,'[]'::json)) AS credential_count FROM product) p;"))
        before_categories = rows(args.target, "product_category", columns)
        changes, new_categories = plan(args.target, source, categories, before, before_categories)
        report = {"target": args.target, "source_active": len(source), "update": sum(c["old"] is not None for c in changes), "insert": sum(c["old"] is None for c in changes), "new_categories": len(new_categories), "products": [{"source_id": c["source_id"], "id": c["id"], "slug": c["record"]["slug"], "price": c["record"]["price"], "type": c["record"]["product_type"], "featured": c["record"]["is_featured"]} for c in changes]}
        print(json.dumps(report, ensure_ascii=False, indent=2))
        if args.verify:
            verify(args.target, changes, before, before_categories, new_categories)
            return
        if not args.apply:
            return
        assert args.backup_dir and args.backup_dir.is_absolute(), "--apply requires absolute --backup-dir"
        backup = args.backup_dir / args.target
        backup.mkdir(parents=True, exist_ok=False, mode=0o700)
        (backup / "before.json").write_text(json.dumps({"products": before, "categories": before_categories}, ensure_ascii=False, indent=2))
        (backup / "plan.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
        with (backup / "database.dump").open("wb") as dest:
            subprocess.run(["docker", "exec", "postgres", "pg_dump", "-U", "postgres", "-Fc", args.target], stdout=dest, check=True)
        with (backup / "database.dump").open("rb") as src:
            subprocess.run(["docker", "exec", "-i", "postgres", "pg_restore", "--list"], stdin=src, stdout=subprocess.DEVNULL, check=True)
        statements = ["BEGIN;", "SET LOCAL lock_timeout='15s';", "SET LOCAL standard_conforming_strings=on;", "LOCK TABLE product,product_category IN SHARE ROW EXCLUSIVE MODE;"]
        # Guard against changes between snapshot/backup and transaction lock.
        snapshot = json.dumps(before, ensure_ascii=False)
        statements.append("DO $guard$ BEGIN IF (SELECT COALESCE(jsonb_agg(to_jsonb(p)-'account_credentials' ORDER BY id),'[]'::jsonb) FROM (SELECT *,json_array_length(COALESCE(account_credentials,'[]'::json)) AS credential_count FROM product) p) IS DISTINCT FROM " + literal(snapshot) + "::jsonb THEN RAISE EXCEPTION 'Destination changed since dry-run snapshot'; END IF; END $guard$;")
        rollback = ["BEGIN;", "SET LOCAL standard_conforming_strings=on;", "LOCK TABLE product,product_category IN SHARE ROW EXCLUSIVE MODE;"]
        for cat in new_categories:
            statements.append(insert("product_category", cat))
        for change in changes:
            record, old = change["record"], change["old"]
            if old:
                patch = {k: v for k, v in record.items() if old.get(k) != v}
                if patch:
                    statements.append(update("product", {**patch, "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()}, change["id"]))
                    rollback.append(update("product", {**{k: old[k] for k in patch}, "updated_at": old["updated_at"]}, change["id"]))
            else:
                statements.append(insert("product", {"id": change["id"], **record}))
                # Preserve any orders made after import: deactivate rather than delete.
                rollback.append(update("product", {"status": "inactive", "is_featured": False, "in_stock": False}, change["id"]))
        for cat in new_categories:
            rollback.append(f"UPDATE product_category SET is_active=false WHERE id={literal(cat['id'])} AND NOT EXISTS (SELECT 1 FROM product WHERE category={literal(cat['id'])} AND status='active');")
        statements.append("DO $check$ BEGIN IF (SELECT count(*) FROM product WHERE status='active') <> 16 THEN RAISE EXCEPTION 'Expected 16 active products'; END IF; END $check$;")
        statements.append("COMMIT;")
        rollback.append("COMMIT;")
        (backup / "apply.sql").write_text("\n".join(statements), encoding="utf-8")
        (backup / "rollback.sql").write_text("\n".join(rollback), encoding="utf-8")
        psql(args.target, "\n".join(statements))
        verify(args.target, changes, before, before_categories, new_categories)
        print(f"Backup and scoped rollback: {backup}")


if __name__ == "__main__":
    main()
