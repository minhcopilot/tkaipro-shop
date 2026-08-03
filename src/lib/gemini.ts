const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-flash-latest";
const KEY_COOLDOWN_MS = 60_000;

export type GeminiRole = "user" | "assistant" | "system" | "model";

export interface GeminiMessage {
  role: GeminiRole;
  content: string;
}

export interface GenerateTextOptions {
  system?: string;
  messages: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

export interface GenerateJsonOptions {
  system?: string;
  user: string;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

interface KeyState {
  key: string;
  cooldownUntil: number;
}

let keyPool: KeyState[] | null = null;
let rrIndex = 0;

function parseKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS ?? "";
  const single = process.env.GEMINI_API_KEY ?? "";
  const raw = [multi, single].filter(Boolean).join(",");
  return [
    ...new Set(
      raw
        .split(/[,\n]+/)
        .map((k) => k.trim())
        .filter(Boolean),
    ),
  ];
}

function getKeyPool(): KeyState[] {
  if (!keyPool) {
    const keys = parseKeys();
    keyPool = keys.map((key) => ({ key, cooldownUntil: 0 }));
  }
  return keyPool;
}

/** True when at least one Gemini API key is configured. */
export function hasGeminiApiKey(): boolean {
  return getKeyPool().length > 0;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 403 || (status >= 500 && status <= 503);
}

function markCooldown(state: KeyState): void {
  state.cooldownUntil = Date.now() + KEY_COOLDOWN_MS;
}

function pickStartIndex(pool: KeyState[]): number {
  const n = pool.length;
  const start = rrIndex % n;
  rrIndex = (rrIndex + 1) % n;
  return start;
}

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message?: string; code?: number; status?: string };
}

function mapMessagesToGemini(messages: GeminiMessage[]): {
  systemInstruction?: { parts: GeminiPart[] };
  contents: GeminiContent[];
} {
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      if (msg.content.trim()) systemParts.push(msg.content);
      continue;
    }
    const role: "user" | "model" =
      msg.role === "assistant" || msg.role === "model" ? "model" : "user";
    contents.push({ role, parts: [{ text: msg.content }] });
  }

  // Gemini requires alternating user/model and typically starts with user.
  // Merge consecutive same-role turns.
  const merged: GeminiContent[] = [];
  for (const c of contents) {
    const last = merged[merged.length - 1];
    if (last && last.role === c.role) {
      last.parts.push(...c.parts);
    } else {
      merged.push({ role: c.role, parts: [...c.parts] });
    }
  }

  return {
    systemInstruction:
      systemParts.length > 0
        ? { parts: [{ text: systemParts.join("\n\n") }] }
        : undefined,
    contents: merged,
  };
}

function extractText(data: GeminiGenerateResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

async function callGeminiOnce(opts: {
  apiKey: string;
  model: string;
  systemInstruction?: { parts: GeminiPart[] };
  contents: GeminiContent[];
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string }> {
  const url = `${GEMINI_API_BASE}/${opts.model}:generateContent`;
  const body: Record<string, unknown> = {
    contents: opts.contents,
    generationConfig: {
      ...(opts.temperature !== undefined
        ? { temperature: opts.temperature }
        : {}),
      ...(opts.maxOutputTokens !== undefined
        ? { maxOutputTokens: opts.maxOutputTokens }
        : {}),
      ...(opts.responseMimeType
        ? { responseMimeType: opts.responseMimeType }
        : {}),
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = opts.systemInstruction;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": opts.apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, body: message };
  }

  const raw = await response.text();
  if (!response.ok) {
    return { ok: false, status: response.status, body: raw };
  }

  let data: GeminiGenerateResponse;
  try {
    data = JSON.parse(raw) as GeminiGenerateResponse;
  } catch {
    return { ok: false, status: 500, body: "Invalid JSON from Gemini" };
  }

  const text = extractText(data);
  if (!text) {
    const finishReason = data.candidates?.[0]?.finishReason ?? "unknown";
    // MAX_TOKENS with empty parts is usually thinking-budget / too-low maxOutputTokens,
    // not a bad API key — do not treat as retryable key failure.
    const status = finishReason === "MAX_TOKENS" ? 400 : 502;
    return {
      ok: false,
      status,
      body:
        raw ||
        `Empty response from Gemini (finishReason=${finishReason})`,
    };
  }

  return { ok: true, text };
}

async function generateWithFailover(opts: {
  system?: string;
  messages: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  responseMimeType?: string;
}): Promise<string> {
  const pool = getKeyPool();
  if (pool.length === 0) {
    throw new Error("GEMINI_API_KEYS is not configured");
  }

  const messages: GeminiMessage[] = opts.system
    ? [{ role: "system", content: opts.system }, ...opts.messages]
    : opts.messages;

  const { systemInstruction, contents } = mapMessagesToGemini(messages);
  if (contents.length === 0) {
    throw new Error("No user/model messages to send to Gemini");
  }

  const model = opts.model ?? DEFAULT_MODEL;
  const start = pickStartIndex(pool);
  const errors: string[] = [];
  const now = Date.now();

  for (let i = 0; i < pool.length; i++) {
    const state = pool[(start + i) % pool.length]!;
    if (state.cooldownUntil > now) {
      errors.push(`key#${(start + i) % pool.length} cooldown`);
      continue;
    }

    const result = await callGeminiOnce({
      apiKey: state.key,
      model,
      systemInstruction,
      contents,
      temperature: opts.temperature,
      maxOutputTokens: opts.maxOutputTokens,
      responseMimeType: opts.responseMimeType,
    });

    if (result.ok) {
      return result.text;
    }

    const retryable = result.status === 0 || isRetryableStatus(result.status);
    if (retryable) {
      markCooldown(state);
    }
    errors.push(
      `key#${(start + i) % pool.length} status=${result.status}: ${result.body.slice(0, 200)}`,
    );

    if (!retryable) {
      // Non-retryable (e.g. 400) — still try next key once in case of bad key,
      // but 400 usually means bad request; break after recording.
      if (result.status === 400) {
        throw new Error(`Gemini request failed: ${result.body.slice(0, 500)}`);
      }
    }
  }

  throw new Error(
    `All Gemini API keys failed (${pool.length} tried): ${errors.join(" | ")}`,
  );
}

export async function generateText(
  options: GenerateTextOptions,
): Promise<string> {
  return generateWithFailover({
    system: options.system,
    messages: options.messages,
    temperature: options.temperature,
    maxOutputTokens: options.maxOutputTokens,
    model: options.model,
  });
}

export async function generateJson(
  options: GenerateJsonOptions,
): Promise<string> {
  return generateWithFailover({
    system: options.system,
    messages: [{ role: "user", content: options.user }],
    temperature: options.temperature,
    maxOutputTokens: options.maxOutputTokens,
    model: options.model,
    responseMimeType: "application/json",
  });
}
