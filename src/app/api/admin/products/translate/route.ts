import { NextResponse } from "next/server";

import { getCurrentAdmin } from "~/lib/auth";
import { generateJson, hasGeminiApiKey } from "~/lib/gemini";

const TARGET_LOCALES = ["en", "ru", "zh", "ar", "es", "fr", "de", "ja", "ko", "pt"] as const;

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  zh: "Chinese (Simplified)",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese (Brazil)",
};

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, shortDescription, features } = body as {
      name: string;
      description?: string;
      shortDescription?: string;
      features?: string[];
    };

    if (!name) {
      return NextResponse.json(
        { error: "Tên sản phẩm tiếng Việt là bắt buộc" },
        { status: 400 },
      );
    }

    if (!hasGeminiApiKey()) {
      return NextResponse.json(
        { error: "GEMINI_API_KEYS chưa được cấu hình" },
        { status: 500 },
      );
    }

    const localeList = TARGET_LOCALES.map(
      (code) => `"${code}" (${LOCALE_NAMES[code]})`,
    ).join(", ");

    const fields: string[] = [`- name: "${name}"`];
    const fieldKeys: string[] = ['"name"'];

    if (description) {
      fields.push(`- description: "${description}"`);
      fieldKeys.push('"description"');
    }
    if (shortDescription) {
      fields.push(`- shortDescription: "${shortDescription}"`);
      fieldKeys.push('"shortDescription"');
    }
    if (features && features.length > 0) {
      fields.push(`- features: ${JSON.stringify(features)}`);
      fieldKeys.push('"features"');
    }

    const exampleFields = fieldKeys
      .map((k) => (k === '"features"' ? `${k}: ["translated", "..."]` : `${k}: "translated text"`))
      .join(", ");

    const prompt = `Translate the following Vietnamese product information into these languages: ${localeList}.

Source text (Vietnamese):
${fields.join("\n")}

Return ONLY a valid JSON object with this exact structure — no markdown, no explanation:
{
  "en": { ${exampleFields} },
  "ru": { ... },
  ...
}

Rules:
- Translate naturally, not word-by-word. Keep the tone professional and commercial.
- Keep URLs, brand names (Cursor, Claude, ChatGPT, GitHub, JetBrains, Figma, etc.), and product names unchanged.
- For features array, translate each item in the array individually.
- Return all ${TARGET_LOCALES.length} languages.`;

    const raw = await generateJson({
      system:
        "You are a professional translator specializing in software/tech product descriptions. Return only valid JSON, no markdown fences.",
      user: prompt,
      temperature: 0.3,
    });

    if (!raw) {
      return NextResponse.json(
        { error: "Gemini không trả về kết quả" },
        { status: 500 },
      );
    }

    const translations = JSON.parse(raw) as Record<string, Record<string, string | string[]>>;

    const result: Record<
      string,
      { name: string; description?: string; shortDescription?: string; features?: string[] }
    > = {};

    for (const locale of TARGET_LOCALES) {
      const t = translations[locale];
      if (t) {
        result[locale] = {
          name: (t.name as string) || "",
          ...(description ? { description: (t.description as string) || "" } : {}),
          ...(shortDescription ? { shortDescription: (t.shortDescription as string) || "" } : {}),
          ...(features && features.length > 0
            ? { features: Array.isArray(t.features) ? t.features as string[] : [] }
            : {}),
        };
      }
    }

    return NextResponse.json({ translations: result });
  } catch (error) {
    console.error("Error translating product:", error);
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
