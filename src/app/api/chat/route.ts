import { NextRequest, NextResponse } from "next/server";

import { getClientIp, rateLimit } from "~/lib/security/rate-limit";
import { getCachedSystemPrompt } from "~/lib/chat-cache";
import type { ChatMessage, SupportedLocale } from "~/lib/chat-context";
import { generateText, hasGeminiApiKey } from "~/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`chat:${ip}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json() as { 
      messages: ChatMessage[];
      locale?: SupportedLocale;
    };
    
    const { messages, locale = "vi" } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    if (!hasGeminiApiKey()) {
      console.error("GEMINI_API_KEYS is not configured");
      return NextResponse.json(
        { error: "Chat service is not configured" },
        { status: 500 }
      );
    }

    // get system prompt from cache with locale
    const systemPrompt = await getCachedSystemPrompt(locale);

    // keep last 10 messages for context
    const recent = messages.slice(-10);

    const assistantMessage = await generateText({
      system: systemPrompt,
      messages: recent.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      maxOutputTokens: 1024,
      temperature: 0.7,
    });

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
