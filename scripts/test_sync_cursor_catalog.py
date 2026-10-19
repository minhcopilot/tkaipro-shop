import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("catalog", Path(__file__).with_name("sync-cursor-catalog.py"))
catalog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalog)


class CatalogTests(unittest.TestCase):
    def fixtures(self):
        cfg = catalog.CONFIG["tkaipro"]
        sources, previous = [], []
        for index, (source_id, dest_id) in enumerate(cfg["mapped"].items()):
            sources.append({"id": source_id, "slug": f"source-{index}", "name": "Google", "category": cfg["category"][0], "product_type": "upgrade", "in_stock": True, "price": 149000, "account_credentials": ["never-copy"], "sales_count": 999, "review_count": 42})
            previous.append({"id": dest_id, "slug": f"legacy-{index}", "status": "active", "product_type": "account", "credential_count": 0, "stock_quantity": 0, "sales_count": 2})
        categories = [{"id": cfg["category"][0], "name": "Google AI", "slug": "source-google"}]
        target_categories = [{"id": cfg["category"][1], "name": "Google AI", "slug": "google-ai"}]
        return sources, categories, previous, target_categories

    def test_preserves_destination_identity_and_maps_primary_category(self):
        changes, cats = catalog.plan("tkaipro", *self.fixtures())
        self.assertEqual(cats, [])
        self.assertEqual([c["record"]["sort_order"] for c in changes], [10, 20])
        for change in changes:
            self.assertEqual(change["record"]["slug"], change["old"]["slug"])
            self.assertEqual(change["record"]["category"], catalog.CONFIG["tkaipro"]["category"][1])
            self.assertNotIn("sales_count", change["record"])
            self.assertNotIn("account_credentials", change["record"])

    def test_new_account_never_copies_source_stock_history_or_credentials(self):
        sources, cats, before, target_cats = self.fixtures()
        sources.append({"id": "other", "name": "Other", "slug": "other", "category": sources[0]["category"], "product_type": "account", "in_stock": True, "price": 10, "account_credentials": ["secret"], "stock_quantity": 99, "sales_count": 400, "rating": 5})
        changes, _ = catalog.plan("tkaipro", sources, cats, before, target_cats)
        created = next(c["record"] for c in changes if c["id"] == "other")
        self.assertEqual(created["account_credentials"], [])
        self.assertEqual(created["stock_quantity"], 0)
        self.assertEqual(created["sales_count"], 0)
        self.assertEqual(created["rating"], 0)
        self.assertFalse(created["in_stock"])
        self.assertFalse(created["is_featured"])
        # Rerunning the plan matches the inserted slug and preserves its later local stock.
        before.append({**created, "id": "other", "credential_count": 3, "stock_quantity": 3, "in_stock": True})
        changes, _ = catalog.plan("tkaipro", sources, cats, before, target_cats)
        self.assertTrue(all(c["old"] for c in changes))
        repeated = next(c["record"] for c in changes if c["id"] == "other")
        self.assertNotIn("stock_quantity", repeated)
        self.assertNotIn("in_stock", repeated)

    def test_refuses_type_change_if_local_credentials_exist(self):
        sources, cats, before, target_cats = self.fixtures()
        before[0]["credential_count"] = 1
        with self.assertRaisesRegex(AssertionError, "local credentials"):
            catalog.plan("tkaipro", sources, cats, before, target_cats)

    def test_imports_category_ancestors_before_children(self):
        sources, cats, before, target_cats = self.fixtures()
        sources.append({"id": "other", "name": "Other", "slug": "other", "category": "child", "product_type": "account", "price": 10})
        cats.extend([{"id": "parent", "name": "Parent", "slug": "parent"}, {"id": "child", "name": "Child", "slug": "child", "parent_id": "parent"}])
        _, created = catalog.plan("tkaipro", sources, cats, before, target_cats)
        self.assertEqual([c["id"] for c in created], ["parent", "child"])
        self.assertEqual(created[1]["parent_id"], "parent")

    def test_effective_variant_matches_source_field_fallback(self):
        source = {"name": "Primary", "description": "Keep", "features": ["primary"], "content_variant": "alt", "alt_name": "Alternate", "alt_description": "  ", "alt_features": [], "name_locales": {"en": "old"}, "alt_name_locales": {"en": "new"}, "image": "/uploads/a.png"}
        result = catalog.effective(source)
        self.assertEqual(result["name"], "Alternate")
        self.assertEqual(result["description"], "Keep")
        self.assertEqual(result["features"], ["primary"])
        self.assertEqual(result["name_locales"], {"en": "new"})
        self.assertEqual(result["image"], "https://tkcuso.com/uploads/a.png")
        source["alt_name"] = " "
        self.assertEqual(catalog.effective(source)["name"], "Primary")

    def test_sql_literal_preserves_quotes_unicode_and_json(self):
        self.assertEqual(catalog.literal("L'utilisateur – tài khoản"), "'L''utilisateur – tài khoản'")
        self.assertEqual(catalog.literal({"en": "quote's"}), "'{\"en\": \"quote''s\"}'::json")


if __name__ == "__main__":
    unittest.main()
