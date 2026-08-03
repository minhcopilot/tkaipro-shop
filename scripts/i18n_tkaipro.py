#!/usr/bin/env python3
"""TKAIPro i18n helpers: clean brand leftovers, translate messages, fill product locales.

Usage:
  # Clean vi/en brand leftovers (local):
  python3 scripts/i18n_tkaipro.py clean-messages

  # Translate 9 locales from cleaned vi.json via Gemini:
  python3 scripts/i18n_tkaipro.py translate-messages [--locales ru,zh,...]

  # Fill product/category locales on VPS (needs DATABASE_URL + GEMINI + docker postgres):
  python3 scripts/i18n_tkaipro.py fill-product-locales

Env:
  GEMINI_API_KEYS or GEMINI_API_KEY
  DATABASE_URL (for fill-product-locales; also reads /app/tkaipro-shop/.env)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MESSAGES_DIR = ROOT / "messages"


def write_json_atomic(path: Path, data: Any) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    payload = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    for attempt in range(5):
        try:
            tmp.write_text(payload, encoding="utf-8")
            tmp.replace(path)
            return
        except OSError as e:
            time.sleep(0.5 + attempt)
            if attempt == 4:
                raise e
TARGET_LOCALES = ["ru", "zh", "ar", "es", "fr", "de", "ja", "ko", "pt"]
ALL_NON_VI = ["en", *TARGET_LOCALES]
LOCALE_NAMES = {
    "en": "English",
    "ru": "Russian",
    "zh": "Chinese (Simplified)",
    "ar": "Arabic",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "ja": "Japanese",
    "ko": "Korean",
    "pt": "Portuguese (Brazil)",
}
PRODUCT_SLUGS = [
    "google-pro",
    "google-ultra",
    "google-antigravity-pro",
    "google-antigravity-ultra",
]
CATEGORY_SLUG = "google-ai"
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")


def load_dotenv(path: Path, *, override: bool = False) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if not k:
            continue
        if override or k not in os.environ:
            os.environ[k] = v


def gemini_keys() -> list[str]:
    raw = ",".join(
        filter(None, [os.environ.get("GEMINI_API_KEYS", ""), os.environ.get("GEMINI_API_KEY", "")])
    )
    return list(dict.fromkeys(k.strip() for k in re.split(r"[,\n]+", raw) if k.strip()))


_key_idx = 0
_key_cooldown: dict[str, float] = {}


def gemini_json(system: str, user: str, temperature: float = 0.2, max_tokens: int = 8192) -> Any:
    keys = gemini_keys()
    if not keys:
        raise RuntimeError("GEMINI_API_KEYS / GEMINI_API_KEY not configured")

    global _key_idx
    errors: list[str] = []
    for attempt in range(max(len(keys) * 3, 6)):
        now = time.time()
        # If every key is cooling down, wait for the nearest one.
        soonest = min((_key_cooldown.get(k, 0) for k in keys), default=0)
        if soonest > now and all(_key_cooldown.get(k, 0) > now for k in keys):
            wait = min(90, soonest - now + 1)
            time.sleep(wait)
            now = time.time()
        key = keys[_key_idx % len(keys)]
        _key_idx += 1
        if _key_cooldown.get(key, 0) > now:
            errors.append("cooldown")
            continue
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{GEMINI_MODEL}:generateContent"
        )
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "responseMimeType": "application/json",
            },
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "X-goog-api-key": key},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")[:300]
            if e.code in (429, 403) or 500 <= e.code <= 503:
                _key_cooldown[key] = time.time() + 60
            errors.append(f"http{e.code}:{err_body}")
            time.sleep(1.5)
            continue
        except Exception as e:  # noqa: BLE001
            _key_cooldown[key] = time.time() + 30
            errors.append(str(e)[:200])
            continue

        parts = (((data.get("candidates") or [{}])[0].get("content") or {}).get("parts")) or []
        text = "".join(p.get("text") or "" for p in parts).strip()
        if not text:
            errors.append("empty")
            continue
        # Strip accidental fences
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # try extract object
            m = re.search(r"\{[\s\S]*\}|\[[\s\S]*\]", text)
            if m:
                try:
                    return json.loads(m.group(0))
                except json.JSONDecodeError:
                    pass
            errors.append("bad_json")
            continue
    raise RuntimeError(f"Gemini failed: {' | '.join(errors[:5])}")


# ── Brand cleanup ────────────────────────────────────────────────────────────

VI_REPLACEMENTS: list[tuple[str, str]] = [
    ("TKCuso AI Tools", "TKAIPro"),
    ("TKCuso", "TKAIPro"),
    ("tkcuso.com", "tkaipro.shop"),
    ("m.me/tkcuso", "tkaipro.shop/contact"),
    ("t.me/tkcuso_support", "tkaipro.shop/contact"),
    ("@tkcuso_support", "hỗ trợ TKAIPro"),
    ("tkcuso_support", "tkaipro"),
    ("tkcuso", "tkaipro"),
    ("FigmaEdu", "TKAIPro"),
    ("figmaedu.shop", "tkaipro.shop"),
    ("Figma Education", "Google AI"),
    ("Figma Pro Edu", "Google AI Pro"),
    ("Figma Pro", "Google AI Pro"),
    ("Figma, Inc.", "Google LLC"),
    ("www.figma.com/legal", "www.gemini.google.com/legal"),
    ("www.figma.com", "gemini.google.com"),
    ("figma.com", "gemini.google.com"),
    ("Cursor AI Pro", "Google AI"),
    ("Cursor Pro", "Google AI"),
    ("Anysphere, Inc.", "Google LLC"),
    ("Anysphere/Cursor", "Google LLC"),
    ("Anysphere", "Google LLC"),
    ("cursor.com/terms-of-service", "www.gemini.google.com/legal"),
    ("cursor.com/terms", "www.gemini.google.com/legal"),
    ("cursor.com/privacy", "www.gemini.google.com/legal"),
    ("cursor.com", "gemini.google.com"),
    ("Điều khoản Figma", "Điều khoản Google AI"),
    ("điều khoản Figma", "điều khoản Google AI"),
    ("tài khoản Figma", "tài khoản Google AI"),
    ("Tài khoản Figma", "Tài khoản Google AI"),
    ("gói Figma Education", "gói Google AI"),
    ("gói Figma", "gói Google AI"),
    ("Figma Fanpage", "TKAIPro Fanpage"),
    ("Cursor Fanpage", "TKAIPro Fanpage"),
    ("Figma", "Google AI"),
    ("Cursor", "Google AI"),
    ("Nâng cấp trải nghiệm thiết kế", "Nâng cấp trải nghiệm AI"),
    ("trải nghiệm thiết kế", "trải nghiệm AI"),
    ("trải nghiệm coding", "trải nghiệm AI"),
    ("AI code editor", "công cụ AI"),
    ("AI editor", "công cụ AI"),
    ("công cụ thiết kế", "công cụ AI"),
    ("sinh viên thiết kế", "người dùng AI"),
    ("developers", "người dùng AI"),
    ("developer", "người dùng AI"),
    ("Developers", "người dùng AI"),
    ("Developer", "người dùng AI"),
    ("support@figmaedu.shop", "support@tkaipro.shop"),
    ("taikhoancursor9999@gmail.com", "support@tkaipro.shop"),
]

EN_REPLACEMENTS: list[tuple[str, str]] = [
    ("TKCuso AI Tools", "TKAIPro"),
    ("TKCuso", "TKAIPro"),
    ("tkcuso.com", "tkaipro.shop"),
    ("m.me/tkcuso", "tkaipro.shop/contact"),
    ("t.me/tkcuso_support", "tkaipro.shop/contact"),
    ("@tkcuso_support", "@tkaipro_support"),
    ("tkcuso_support", "tkaipro_support"),
    ("tkcuso", "tkaipro"),
    ("FigmaEdu", "TKAIPro"),
    ("figmaedu.shop", "tkaipro.shop"),
    ("Figma Education", "Google AI"),
    ("Figma Pro Edu", "Google AI Pro"),
    ("Figma Pro", "Google AI Pro"),
    ("Figma, Inc.", "Google LLC"),
    ("www.figma.com/legal", "www.gemini.google.com/legal"),
    ("www.figma.com", "gemini.google.com"),
    ("figma.com", "gemini.google.com"),
    ("Cursor AI Pro", "Google AI"),
    ("Cursor Pro", "Google AI"),
    ("Anysphere, Inc.", "Google LLC"),
    ("Anysphere/Cursor", "Google LLC"),
    ("Anysphere", "Google LLC"),
    ("cursor.com/terms-of-service", "www.gemini.google.com/legal"),
    ("cursor.com/terms", "www.gemini.google.com/legal"),
    ("cursor.com/privacy", "www.gemini.google.com/legal"),
    ("cursor.com", "gemini.google.com"),
    ("Figma Fanpage", "TKAIPro Fanpage"),
    ("Cursor Fanpage", "TKAIPro Fanpage"),
    ("Figma terms", "Google AI terms"),
    ("Figma Terms", "Google AI Terms"),
    ("Figma account", "Google AI account"),
    ("Cursor terms", "Google AI terms"),
    ("Cursor Terms", "Google AI Terms"),
    ("Cursor account", "Google AI account"),
    ("Figma", "Google AI"),
    ("Cursor", "Google AI"),
    ("Upgrade your design experience", "Upgrade your AI experience"),
    ("Upgrade your coding experience", "Upgrade your AI experience"),
    ("design experience", "AI experience"),
    ("coding experience", "AI experience"),
    ("AI code-editor", "AI tool"),
    ("AI code editor", "AI tool"),
    ("AI editor", "AI tool"),
    ("design tool", "AI tool"),
    ("design students", "AI users"),
    ("design student", "AI user"),
    ("Design students", "AI users"),
    ("Design student", "AI user"),
    ("developers", "AI users"),
    ("developer", "AI user"),
    ("Developers", "AI users"),
    ("Developer", "AI user"),
    ("support@figmaedu.shop", "support@tkaipro.shop"),
    ("taikhoancursor9999@gmail.com", "support@tkaipro.shop"),
    ("not affiliated with Figma, Inc.", "not affiliated with Google LLC"),
    ("not affiliated with Anysphere", "not affiliated with Google LLC"),
]


def apply_replacements(text: str, pairs: list[tuple[str, str]]) -> str:
    out = text
    for old, new in pairs:
        out = out.replace(old, new)
    return out


def walk_strings(obj: Any, fn) -> Any:
    if isinstance(obj, str):
        return fn(obj)
    if isinstance(obj, list):
        return [walk_strings(x, fn) for x in obj]
    if isinstance(obj, dict):
        return {k: walk_strings(v, fn) for k, v in obj.items()}
    return obj


BAD_RE = re.compile(
    r"FigmaEdu|Figma Education|figmaedu|www\.figma\.com|figma\.com|TKCuso|tkcuso|Cursor Pro|Anysphere|(?<![A-Za-z])Figma(?![A-Za-z])",
    re.I,
)


def count_bad(obj: Any) -> int:
    n = 0

    def visit(o: Any) -> None:
        nonlocal n
        if isinstance(o, str):
            if BAD_RE.search(o):
                n += 1
        elif isinstance(o, list):
            for x in o:
                visit(x)
        elif isinstance(o, dict):
            for v in o.values():
                visit(v)

    visit(obj)
    return n


def cmd_clean_messages(_: argparse.Namespace) -> None:
    for locale, pairs in (("vi", VI_REPLACEMENTS), ("en", EN_REPLACEMENTS)):
        path = MESSAGES_DIR / f"{locale}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        before = count_bad(data)
        cleaned = walk_strings(data, lambda s, p=pairs: apply_replacements(s, p))
        # Extra targeted fixes after remap
        if locale == "vi":
            cleaned = walk_strings(
                cleaned,
                lambda s: s.replace(
                    "Tôi hiểu TKAIPro là reseller độc lập, không phải Google LLC/Google AI.",
                    "Tôi hiểu TKAIPro là nhà bán lẻ độc lập, không liên kết với Google LLC.",
                )
                .replace(
                    "Tôi đồng ý tuân thủ Điều khoản Google AI (<link>www.gemini.google.com/legal</link>).",
                    "Tôi đồng ý tuân thủ Điều khoản Google AI (<link>www.gemini.google.com/legal</link>).",
                )
                .replace(
                    "gói Google AI mong muốn",
                    "gói Google AI mong muốn",
                ),
            )
        if locale == "en":
            cleaned = walk_strings(
                cleaned,
                lambda s: s.replace(
                    "I understand TKAIPro is an independent reseller, not affiliated with Google LLC/Google AI.",
                    "I understand TKAIPro is an independent reseller, not affiliated with Google LLC.",
                ).replace(
                    "I agree to comply with Google AI terms (<link>www.gemini.google.com/legal</link>).",
                    "I agree to comply with Google AI terms (<link>www.gemini.google.com/legal</link>).",
                ),
            )
        after = count_bad(cleaned)
        path.write_text(
            json.dumps(cleaned, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"{locale}: bad strings {before} -> {after}")


# ── Message translation ──────────────────────────────────────────────────────

def same_structure(a: Any, b: Any) -> bool:
    if type(a) is not type(b):
        return False
    if isinstance(a, dict):
        if set(a) != set(b):
            return False
        return all(same_structure(a[k], b[k]) for k in a)
    if isinstance(a, list):
        if len(a) != len(b):
            return False
        return all(same_structure(x, y) for x, y in zip(a, b))
    return isinstance(b, (str, int, float, bool)) or b is None


def translate_namespace(ns: str, payload: Any, locale: str) -> Any:
    lang = LOCALE_NAMES[locale]
    user = (
        f"Translate the following JSON object from Vietnamese to {lang} ({locale}).\n"
        f"Namespace: {ns}\n"
        "Rules:\n"
        "- Keep the exact same JSON key structure and array lengths.\n"
        "- Do NOT translate JSON keys.\n"
        "- Keep brand names unchanged: TKAIPro, Google AI, Google AI Pro, Google AI Ultra, Antigravity, Gemini, Google LLC, tkaipro.shop.\n- NEVER mention Figma, FigmaEdu, Figma Education, Cursor, or TKCuso.\n"
        "- Keep placeholders like {name}, {productName}, {orderNumber}, {amount}, <contact>, <products>, <terms>, <privacy>, <link>, <highlight>, <b> unchanged.\n"
        "- Keep URLs unchanged except they should remain tkaipro.shop / gemini.google.com.\n"
        "- Tone: professional ecommerce for AI users / Gemini subscribers.\n"
        "- Return ONLY the translated JSON object (same shape).\n\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )
    result = gemini_json(
        system=(
            "You are a professional localization engine for a Google AI / Antigravity reseller storefront (TKAIPro). "
            "Return valid JSON only, matching the input structure exactly."
        ),
        user=user,
        temperature=0.2,
        max_tokens=16384,
    )
    if not same_structure(payload, result):
        # One retry with stronger instruction
        result = gemini_json(
            system=(
                "Return ONLY valid JSON with EXACTLY the same keys and array lengths as the input. "
                "Do not add or remove keys."
            ),
            user=user + "\n\nIMPORTANT: Output must mirror the input structure exactly.",
            temperature=0.1,
            max_tokens=16384,
        )
    if not same_structure(payload, result):
        raise RuntimeError(f"Structure mismatch for {ns}/{locale}")
    return result


def translate_namespace_batch(batch: dict[str, Any], locale: str) -> dict[str, Any]:
    lang = LOCALE_NAMES[locale]
    user = (
        f"Translate the following JSON object from Vietnamese to {lang} ({locale}).\n"
        "The object contains multiple top-level namespaces.\n"
        "Rules:\n"
        "- Keep the exact same JSON key structure and array lengths.\n"
        "- Do NOT translate JSON keys.\n"
        "- Keep brand names unchanged: TKAIPro, Google AI, Google AI Pro, Google AI Ultra, Antigravity, Gemini, Google LLC, tkaipro.shop.\n- NEVER mention Figma, FigmaEdu, Figma Education, Cursor, or TKCuso.\n"
        "- Keep placeholders like {name}, {productName}, {orderNumber}, {amount}, <contact>, <products>, <terms>, <privacy>, <link>, <highlight>, <b> unchanged.\n"
        "- Keep URLs unchanged except they should remain tkaipro.shop / gemini.google.com.\n"
        "- Tone: professional ecommerce for AI users / Gemini subscribers.\n"
        "- Return ONLY the translated JSON object (same shape).\n\n"
        f"{json.dumps(batch, ensure_ascii=False)}"
    )
    result = gemini_json(
        system=(
            "You are a professional localization engine for a Google AI / Antigravity reseller storefront (TKAIPro). "
            "Return valid JSON only, matching the input structure exactly."
        ),
        user=user,
        temperature=0.2,
        max_tokens=65536,
    )
    if not isinstance(result, dict) or not same_structure(batch, result):
        result = gemini_json(
            system="Return ONLY valid JSON with EXACTLY the same keys/arrays as input.",
            user=user + "\n\nIMPORTANT: mirror input structure exactly.",
            temperature=0.1,
            max_tokens=65536,
        )
    if not isinstance(result, dict) or not same_structure(batch, result):
        raise RuntimeError("Batch structure mismatch")
    return result


def cmd_translate_messages_batched(args: argparse.Namespace) -> None:
    """Faster path: translate ~6-8 namespaces per Gemini call."""
    locales = (
        [x.strip() for x in args.locales.split(",") if x.strip()]
        if args.locales
        else TARGET_LOCALES
    )
    vi = json.loads((MESSAGES_DIR / "vi.json").read_text(encoding="utf-8"))
    namespaces = list(vi.keys())
    chunk_size = max(1, int(args.chunk_size or 6))

    for locale in locales:
        out_path = MESSAGES_DIR / f"{locale}.json"
        existing: dict[str, Any] = {}
        if out_path.is_file():
            try:
                existing = json.loads(out_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                existing = {}

        result: dict[str, Any] = {}
        todo: list[str] = []
        for ns in namespaces:
            if (
                not args.force
                and ns in existing
                and same_structure(vi[ns], existing[ns])
                and count_bad(existing[ns]) == 0
                and json.dumps(existing[ns], ensure_ascii=False, sort_keys=True)
                != json.dumps(vi[ns], ensure_ascii=False, sort_keys=True)
            ):
                result[ns] = existing[ns]
            else:
                todo.append(ns)

        # Pack namespaces into chunks by approximate JSON size; isolate huge ones.
        packed: list[list[str]] = []
        current: list[str] = []
        current_size = 0
        max_chars = 12000
        for ns in todo:
            size = len(json.dumps(vi[ns], ensure_ascii=False))
            if size > max_chars:
                if current:
                    packed.append(current)
                    current, current_size = [], 0
                packed.append([ns])
                continue
            if current and (len(current) >= chunk_size or current_size + size > max_chars):
                packed.append(current)
                current, current_size = [], 0
            current.append(ns)
            current_size += size
        if current:
            packed.append(current)

        print(
            f"=== Batched translate -> {locale}: keep={len(result)} todo={len(todo)} chunks={len(packed)} ===",
            flush=True,
        )
        for i, chunk_ns in enumerate(packed):
            batch = {ns: vi[ns] for ns in chunk_ns}
            print(f"  chunk {i+1}/{len(packed)}: {', '.join(chunk_ns)}", flush=True)
            for attempt in range(6):
                try:
                    translated = translate_namespace_batch(batch, locale)
                    result.update(translated)
                    time.sleep(1.2)
                    break
                except Exception as e:  # noqa: BLE001
                    wait = min(90, 10 * (attempt + 1))
                    print(f"    retry {attempt+1}: {e} (sleep {wait}s)")
                    time.sleep(wait)
            else:
                # fallback per-namespace
                for ns in chunk_ns:
                    if ns in existing and same_structure(vi[ns], existing[ns]):
                        result[ns] = existing[ns]
                        print(f"    keep previous {ns}")
                    else:
                        try:
                            result[ns] = translate_namespace(ns, vi[ns], locale)
                            print(f"    single ok {ns}")
                        except Exception as e:  # noqa: BLE001
                            print(f"    FAIL {ns}: {e}")
                            if ns in existing:
                                result[ns] = existing[ns]
            out_path.write_text(
                json.dumps({**existing, **result}, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )

        final = {}
        missing = []
        for ns in namespaces:
            if ns in result and same_structure(vi[ns], result[ns]) and json.dumps(result[ns], ensure_ascii=False, sort_keys=True) != json.dumps(vi[ns], ensure_ascii=False, sort_keys=True):
                final[ns] = result[ns]
            elif ns in existing and same_structure(vi[ns], existing[ns]) and json.dumps(existing[ns], ensure_ascii=False, sort_keys=True) != json.dumps(vi[ns], ensure_ascii=False, sort_keys=True):
                final[ns] = existing[ns]
            else:
                missing.append(ns)
                final[ns] = result.get(ns) or existing.get(ns) or vi[ns]
        out_path.write_text(json.dumps(final, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {out_path} bad={count_bad(final)} missing_or_stale={len(missing)}")
        if missing:
            print("  stale/missing:", ", ".join(missing[:30]))


def cmd_translate_messages(args: argparse.Namespace) -> None:
    locales = (
        [x.strip() for x in args.locales.split(",") if x.strip()]
        if args.locales
        else TARGET_LOCALES
    )
    vi = json.loads((MESSAGES_DIR / "vi.json").read_text(encoding="utf-8"))
    namespaces = list(vi.keys())
    for locale in locales:
        out_path = MESSAGES_DIR / f"{locale}.json"
        existing: dict[str, Any] = {}
        if out_path.is_file() and not args.force:
            try:
                existing = json.loads(out_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                existing = {}
        result: dict[str, Any] = {}
        print(f"=== Translating → {locale} ({len(namespaces)} namespaces) ===")
        for i, ns in enumerate(namespaces, 1):
            if (
                not args.force
                and ns in existing
                and same_structure(vi[ns], existing[ns])
                and count_bad(existing[ns]) == 0
                and json.dumps(existing[ns], ensure_ascii=False, sort_keys=True)
                != json.dumps(vi[ns], ensure_ascii=False, sort_keys=True)
                and args.skip_ok
            ):
                result[ns] = existing[ns]
                print(f"  [{i}/{len(namespaces)}] {ns}: keep")
                continue
            print(f"  [{i}/{len(namespaces)}] {ns}: translating...", flush=True)
            for attempt in range(6):
                try:
                    result[ns] = translate_namespace(ns, vi[ns], locale)
                    time.sleep(0.8)
                    break
                except Exception as e:  # noqa: BLE001
                    wait = min(90, 8 * (attempt + 1))
                    print(f"    retry {attempt+1}: {e} (sleep {wait}s)")
                    time.sleep(wait)
            else:
                # fallback: keep previous if structure matches — never copy vi into other locales
                if ns in existing and same_structure(vi[ns], existing[ns]):
                    print(f"    FAIL -> keep previous {ns}")
                    result[ns] = existing[ns]
                else:
                    print(f"    FAIL -> leave unset for later resume ({ns})")
                    if ns in existing:
                        result[ns] = existing[ns]
            # checkpoint after each namespace (include prior keys already done)
            merged_checkpoint = {**existing, **result}
            out_path.write_text(
                json.dumps(merged_checkpoint, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
        # ensure all namespaces present (prefer translated result, then existing, never force-copy vi)
        final: dict[str, Any] = {}
        missing = []
        for ns in namespaces:
            if ns in result and same_structure(vi[ns], result[ns]):
                final[ns] = result[ns]
            elif ns in existing and same_structure(vi[ns], existing[ns]):
                final[ns] = existing[ns]
                missing.append(ns)
            else:
                missing.append(ns)
                final[ns] = existing.get(ns, vi[ns])
        out_path.write_text(
            json.dumps(final, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {out_path} bad={count_bad(final)} missing_or_stale={len(missing)}")
        if missing:
            print("  stale/missing:", ", ".join(missing[:20]), ("..." if len(missing) > 20 else ""))


# ── Product locales ──────────────────────────────────────────────────────────

def parse_database_url() -> tuple[str, str, str]:
    raw = os.environ.get("DATABASE_URL", "")
    if not raw:
        raise RuntimeError("DATABASE_URL missing")
    u = urllib.parse.urlparse(raw.strip().strip('"').strip("'"))
    return u.username or "", urllib.parse.unquote(u.password or ""), (u.path or "/").lstrip("/")


def psql(sql: str, tuples_only: bool = False) -> str:
    user, password, db = parse_database_url()
    cmd = [
        "docker",
        "exec",
        "-e",
        f"PGPASSWORD={password}",
        "postgres",
        "psql",
        "-U",
        user,
        "-d",
        db,
        "-v",
        "ON_ERROR_STOP=1",
    ]
    if tuples_only:
        cmd += ["-At"]
    cmd += ["-c", sql]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr or proc.stdout or "psql failed")
    return proc.stdout


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def translate_product_fields(
    name: str,
    description: str | None,
    short_description: str | None,
    features: list[str],
) -> dict[str, dict[str, Any]]:
    fields = [f'- name: "{name}"']
    if description:
        fields.append(f"- description: {json.dumps(description, ensure_ascii=False)}")
    if short_description:
        fields.append(f"- shortDescription: {json.dumps(short_description, ensure_ascii=False)}")
    if features:
        fields.append(f"- features: {json.dumps(features, ensure_ascii=False)}")
    locale_list = ", ".join(f'"{c}" ({LOCALE_NAMES[c]})' for c in ALL_NON_VI)
    user = f"""Translate the following Vietnamese product information into: {locale_list}.

Source (Vietnamese):
{chr(10).join(fields)}

Return ONLY a JSON object:
{{
  "en": {{ "name": "...", "description": "...", "shortDescription": "...", "features": ["..."] }},
  "ru": {{ ... }},
  ...
}}

Rules:
- Natural commercial translation for a Google AI / Antigravity reseller (TKAIPro).
- Keep brand names: TKAIPro, Google AI, Antigravity, Gemini, Google LLC.
- NEVER mention Figma / FigmaEdu / Cursor.
- Translate all {len(ALL_NON_VI)} languages.
- features must be an array of the same length.
"""
    raw = gemini_json(
        system="Professional tech ecommerce translator. Return valid JSON only.",
        user=user,
        temperature=0.3,
        max_tokens=8192,
    )
    if not isinstance(raw, dict):
        raise RuntimeError("Unexpected Gemini shape")
    return raw


GT_LANG = {
    "en": "en",
    "ru": "ru",
    "zh": "zh-CN",
    "ar": "ar",
    "es": "es",
    "fr": "fr",
    "de": "de",
    "ja": "ja",
    "ko": "ko",
    "pt": "pt",
}


_PROTECT_PATTERNS = [
    r"\{[a-zA-Z0-9_]+\}",
    r"</?[a-zA-Z0-9]+>",
    r"TKAIPro",
    r"Google AI Ultra",
    r"Google AI Pro",
    r"Google AI",
    r"Antigravity",
    r"Gemini",
    r"Google LLC",
    r"tkaipro\.shop",
    r"gemini\.google\.com(?:/[^\s<]*)?",
    r"https?://[^\s<]+",
    r"@[A-Za-z0-9_]+",
]


def translate_strings_google(strings: list[str], locale: str) -> list[str]:
    """Fallback translator when Gemini quota is exhausted."""
    from deep_translator import GoogleTranslator

    if not strings:
        return []
    target = GT_LANG[locale]
    translator = GoogleTranslator(source="vi", target=target)
    out: list[str] = []
    for s in strings:
        if not s.strip():
            out.append(s)
            continue
        # Keep pure placeholder / brand-only tokens as-is
        if re.fullmatch(r"(?:\{[a-zA-Z0-9_]+\}|</?[a-zA-Z0-9]+>|TKAIPro|Google AI(?: Pro| Ultra)?|Antigravity|Gemini)+", s):
            out.append(s)
            continue
        last_err: Exception | None = None
        translated_ok = False
        for attempt in range(4):
            try:
                t = translator.translate(s)
                if not t or not str(t).strip():
                    raise RuntimeError("empty translation")
                out.append(str(t))
                translated_ok = True
                break
            except Exception as e:  # noqa: BLE001
                last_err = e
                time.sleep(1.5 + attempt)
        if not translated_ok:
            # Keep source string rather than aborting whole namespace
            print(f"      warn: keep source for string ({last_err})")
            out.append(s)
        time.sleep(0.08)
    return out


def collect_strings(obj: Any) -> list[str]:
    found: list[str] = []

    def walk(o: Any) -> None:
        if isinstance(o, str):
            found.append(o)
        elif isinstance(o, list):
            for x in o:
                walk(x)
        elif isinstance(o, dict):
            for v in o.values():
                walk(v)

    walk(obj)
    return found


def rebuild_with_strings(obj: Any, strings: list[str], idx: list[int]) -> Any:
    if isinstance(obj, str):
        val = strings[idx[0]]
        idx[0] += 1
        return val
    if isinstance(obj, list):
        return [rebuild_with_strings(x, strings, idx) for x in obj]
    if isinstance(obj, dict):
        return {k: rebuild_with_strings(v, strings, idx) for k, v in obj.items()}
    return obj


def cmd_translate_messages_google(args: argparse.Namespace) -> None:
    locales = (
        [x.strip() for x in args.locales.split(",") if x.strip()]
        if args.locales
        else TARGET_LOCALES
    )
    vi = json.loads((MESSAGES_DIR / "vi.json").read_text(encoding="utf-8"))
    for locale in locales:
        out_path = MESSAGES_DIR / f"{locale}.json"
        existing: dict[str, Any] = {}
        if out_path.is_file():
            try:
                existing = json.loads(out_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                existing = {}
        print(f"=== Google translate -> {locale} ===", flush=True)
        result: dict[str, Any] = dict(existing)
        for i, (ns, payload) in enumerate(vi.items(), 1):
            looks_vi = False
            if ns in result and locale != "vi":
                sample = " ".join(collect_strings(result[ns])[:8])
                # Vietnamese-specific letters
                if re.search(r"[ăâêôơưđĂÂÊÔƠƯĐ]", sample):
                    looks_vi = True
            if (
                ns in result
                and same_structure(payload, result[ns])
                and json.dumps(result[ns], ensure_ascii=False, sort_keys=True)
                != json.dumps(payload, ensure_ascii=False, sort_keys=True)
                and count_bad(result[ns]) == 0
                and not looks_vi
                and not args.force
            ):
                print(f"  [{i}/{len(vi)}] {ns}: keep", flush=True)
                continue
            strings = collect_strings(payload)
            print(f"  [{i}/{len(vi)}] {ns} ({len(strings)} strings)", flush=True)
            for attempt in range(5):
                try:
                    translated = translate_strings_google(strings, locale)
                    result[ns] = rebuild_with_strings(payload, translated, [0])
                    if not same_structure(payload, result[ns]):
                        raise RuntimeError("structure mismatch after rebuild")
                    break
                except Exception as e:  # noqa: BLE001
                    print(f"    retry {attempt+1}: {e}")
                    time.sleep(3 + attempt * 3)
            else:
                print(f"    FAIL keep previous/skip {ns}")
                if ns not in result:
                    result[ns] = payload
            write_json_atomic(out_path, result)
        # ensure all namespaces
        for ns in vi:
            result.setdefault(ns, vi[ns])
        write_json_atomic(out_path, result)
        print(f"Wrote {out_path} bad={count_bad(result)}")


def cmd_fill_product_locales(_: argparse.Namespace) -> None:
    rows_json = psql(
        "SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)::text FROM ("
        "SELECT slug, name, description, short_description, features "
        "FROM product "
        f"WHERE slug IN ({','.join(sql_literal(s) for s in PRODUCT_SLUGS)}) ORDER BY slug"
        ") t;",
        tuples_only=True,
    ).strip()
    rows = json.loads(rows_json or "[]")
    if not rows:
        raise RuntimeError("No products found for expected slugs")

    for row in rows:
        slug = row["slug"]
        name = row["name"]
        description = row.get("description") or ""
        short_description = row.get("short_description") or ""
        features = row.get("features") or []
        if not isinstance(features, list):
            features = []
        print(f"=== Product {slug} ===")
        translations = translate_product_fields(
            name, description or None, short_description or None, features
        )

        name_locales = {"vi": name}
        desc_locales = {"vi": description or ""}
        short_locales = {"vi": short_description or ""}
        feat_locales: dict[str, list[str]] = {"vi": features}

        for loc in ALL_NON_VI:
            t = translations.get(loc) or {}
            name_locales[loc] = (t.get("name") or name) if isinstance(t, dict) else name
            if description:
                desc_locales[loc] = (t.get("description") or description) if isinstance(t, dict) else description
            if short_description:
                short_locales[loc] = (
                    (t.get("shortDescription") or short_description) if isinstance(t, dict) else short_description
                )
            if features:
                ft = t.get("features") if isinstance(t, dict) else None
                feat_locales[loc] = ft if isinstance(ft, list) and len(ft) == len(features) else features

        update = (
            "UPDATE product SET "
            f"name_locales = {sql_literal(json.dumps(name_locales, ensure_ascii=False))}::json, "
            f"description_locales = {sql_literal(json.dumps(desc_locales, ensure_ascii=False))}::json, "
            f"short_description_locales = {sql_literal(json.dumps(short_locales, ensure_ascii=False))}::json, "
            f"features_locales = {sql_literal(json.dumps(feat_locales, ensure_ascii=False))}::json, "
            "updated_at = NOW() "
            f"WHERE slug = {sql_literal(slug)};"
        )
        psql(update)
        print(f"  updated locales: {sorted(name_locales)}")

    # Category
    cat = psql(
        f"SELECT name FROM product_category WHERE slug = {sql_literal(CATEGORY_SLUG)};",
        tuples_only=True,
    ).strip()
    if cat:
        print(f"=== Category {CATEGORY_SLUG} ===")
        translations = translate_product_fields(cat, None, None, [])
        name_locales = {"vi": cat, "en": "Google AI"}
        for loc in ALL_NON_VI:
            t = translations.get(loc) or {}
            name_locales[loc] = (t.get("name") or "Google AI") if isinstance(t, dict) else "Google AI"
        # Keep brand consistent
        for loc in name_locales:
            if "Google" not in name_locales[loc] and "AI" not in name_locales[loc]:
                name_locales[loc] = "Google AI"
        psql(
            "UPDATE product_category SET "
            f"name_locales = {sql_literal(json.dumps(name_locales, ensure_ascii=False))}::json "
            f"WHERE slug = {sql_literal(CATEGORY_SLUG)};"
        )
        print(f"  category locales: {sorted(name_locales)}")

    print("=== Verify ===")
    print(
        psql(
            "SELECT slug, "
            "(SELECT string_agg(k, ',' ORDER BY k) FROM jsonb_object_keys(COALESCE(name_locales::jsonb,'{}'::jsonb)) k) "
            "FROM product WHERE slug IN "
            f"({','.join(sql_literal(s) for s in PRODUCT_SLUGS)}) ORDER BY 1;"
        )
    )


def main() -> None:
    # Load envs: sibling shop keys as fallback, then this shop (override)
    load_dotenv(ROOT.parent / "cursor-pro-shop" / ".env")
    load_dotenv(ROOT.parent / "figma-shop" / ".env")
    load_dotenv(ROOT / ".env", override=True)
    load_dotenv(Path("/app/tkaipro-shop/.env"), override=True)
    load_dotenv(Path("/app/figma-shop/.env"))
    load_dotenv(Path("/app/cursor-pro-shop/.env"))

    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_clean = sub.add_parser("clean-messages")
    p_clean.set_defaults(func=cmd_clean_messages)

    p_tr = sub.add_parser("translate-messages")
    p_tr.add_argument("--locales", default="")
    p_tr.add_argument("--force", action="store_true")
    p_tr.add_argument("--skip-ok", action="store_true", default=True)
    p_tr.add_argument("--batched", action="store_true")
    p_tr.add_argument("--chunk-size", type=int, default=5)

    def _dispatch_translate(args: argparse.Namespace) -> None:
        if args.batched:
            cmd_translate_messages_batched(args)
        else:
            cmd_translate_messages(args)

    p_tr.set_defaults(func=_dispatch_translate)

    p_gt = sub.add_parser("translate-messages-google")
    p_gt.add_argument("--locales", default="")
    p_gt.add_argument("--force", action="store_true")
    p_gt.set_defaults(func=cmd_translate_messages_google)

    p_fill = sub.add_parser("fill-product-locales")
    p_fill.set_defaults(func=cmd_fill_product_locales)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
