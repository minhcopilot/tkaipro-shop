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
    const { title, content, linkText } = body as {
      title: string;
      content: string;
      linkText?: string;
    };

    if (!title || !content) {
      return NextResponse.json(
        { error: "Tiêu đề và nội dung tiếng Việt là bắt buộc" },
        { status: 400 }
      );
    }

    if (!hasGeminiApiKey()) {
      return NextResponse.json(
        { error: "GEMINI_API_KEYS chưa được cấu hình" },
        { status: 500 }
      );
    }

    const localeList = TARGET_LOCALES.map(code => `"${code}" (${LOCALE_NAMES[code]})`).join(", ");

    const fieldsDescription = linkText
      ? `- title: "${title}"\n- content: "${content}"\n- linkText: "${linkText}"`
      : `- title: "${title}"\n- content: "${content}"`;

    const fieldKeys = linkText ? `"title", "content", "linkText"` : `"title", "content"`;

    const prompt = `Translate the following Vietnamese text into these languages: ${localeList}.

Source text (Vietnamese):
${fieldsDescription}

Return ONLY a valid JSON object with this exact structure — no markdown, no explanation:
{
  "en": { ${fieldKeys.split(", ").map(k => `${k}: "translated text"`).join(", ")} },
  "ru": { ... },
  ...
}

Rules:
- Translate naturally, not word-by-word. Keep the tone friendly and promotional.
- Keep URLs, brand names, and product names unchanged.
- For linkText, keep it short (2-4 words).
- Return all ${TARGET_LOCALES.length} languages.`;

    const raw = await generateJson({
      system: "You are a professional translator. Return only valid JSON, no markdown fences.",
      user: prompt,
      temperature: 0.3,
    });

    if (!raw) {
      return NextResponse.json(
        { error: "Gemini không trả về kết quả" },
        { status: 500 }
      );
    }

    const translations = JSON.parse(raw) as Record<string, Record<string, string>>;

    const result: Record<string, { title: string; content: string; linkText?: string }> = {};
    for (const locale of TARGET_LOCALES) {
      const t = translations[locale];
      if (t) {
        result[locale] = {
          title: t.title || "",
          content: t.content || "",
          ...(linkText ? { linkText: t.linkText || "" } : {}),
        };
      }
    }

    return NextResponse.json({ translations: result });
  } catch (error) {
    console.error("Error translating announcement:", error);
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
