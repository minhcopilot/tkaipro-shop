import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "~/db";
import { productTable, productCategoryTable } from "~/db/schema/products/tables";
import { getCurrentAdmin } from "~/lib/auth";
import { generateJson, hasGeminiApiKey } from "~/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Knowledge base "tính năng mới nhất 05/2026" theo từng nhóm AI/SaaS.
 * Detect bằng keyword trong tên sản phẩm — không hard-code productId.
 *
 * Model có thể thiếu kiến thức mới nhất — bắt buộc inject KB vào prompt
 * để mô tả chính xác. Admin có thể override thêm bằng `contextNotes`.
 */
const FEATURE_KB: Array<{ keywords: string[]; label: string; notes: string }> = [
  {
    keywords: ["claude"],
    label: "Claude (Anthropic)",
    notes: `- Claude Opus 4.7 (ra mắt 16/04/2026) — model mạnh nhất hiện tại, context 1M token, vision, lý luận đa bước, coding chuyên sâu, adaptive/extended thinking.
- Claude Sonnet 4.6 (ra mắt 17/02/2026) — default cho Free/Pro, context 1M (beta), tối ưu coding & computer use, văn bản dài, multilingual mạnh.
- Claude Haiku 4.5 — model nhanh, giá rẻ, dùng cho tác vụ đơn giản & realtime.
- Claude Code — agent IDE/CLI build phần mềm chuyên nghiệp, plan + execute tự động, đã bao gồm trong Pro/Team.
- Claude Cowork (Computer Use 2.0) — workspace cộng tác, agent tự thao tác file/app/browser, scheduled tasks, parallel agents.
- Projects — knowledge base persistent context theo dự án, upload nhiều file (PDF, code, docs).
- Artifacts — preview/edit UI, HTML, React, SVG, code, document side-by-side với chat.
- Skills — bột kỹ năng do Anthropic + community xây sẵn, plug vào agent.
- Connectors: Google Drive, Gmail, Calendar, GitHub, Microsoft 365, Slack, Notion, Asana.
- MCP (Model Context Protocol) hỗ trợ native — plug-in tools/data từ bên thứ 3.
- Pro plan $20/tháng (default Sonnet 4.6 + truy cập Opus 4.7 giới hạn). Pro Max $100/tháng — usage cao gấp 5×.
- Team plan từ $25/seat/tháng (annual $20) — admin console, central billing, expanded usage.`,
  },
  {
    keywords: ["cursor"],
    label: "Cursor IDE",
    notes: `- Cursor 1.x (2026) — IDE AI-first dựa trên VS Code, hỗ trợ Composer, Tab, Agent mode multi-file.
- Multi-model: Claude Opus 4.7, Claude Sonnet 4.6, GPT-5/GPT-5.5, Gemini 2.5, Grok, o3, model Auto.
- Pro plan ~$20/tháng — 500 fast requests + unlimited slow + Composer + Tab + Bug Finder.
- Pro+ ($60) / Ultra ($200) — tăng request limits, priority queue, context dài hơn, ưu tiên model mới.
- Background Agents (cloud) — agent chạy nền clone repo, code & PR tự động, không chiếm máy local.
- Memory — Cursor nhớ pattern, file convention, decision của user qua nhiều phiên.
- Rules (.cursorrules / project rules) — declarative guidance cho agent theo dự án/file glob.
- MCP servers — plug-in tools (Linear, GitHub, Sentry, Postgres, Figma, Notion, browser…) chạy local hoặc remote.
- Cursor Tab — AI autocomplete đa dòng, edit prediction, nhảy cursor sang vị trí logic tiếp.
- Composer (Agent mode) — chỉnh sửa multi-file, terminal commands, context-aware diff review.
- Bug Finder, Web search, Image input, Voice input, Hooks (auto-run scripts khi agent done).`,
  },
  {
    keywords: ["chatgpt", "gpt", "openai"],
    label: "ChatGPT (OpenAI)",
    notes: `- GPT-5.5 / GPT-5 family (2026) — multimodal native (text/image/video/audio), reasoning mạnh, code, vision, video.
- o3 / o3-pro — reasoning model chuyên cho toán, khoa học, code phức tạp; suy luận nhiều bước.
- ChatGPT Plus $20/tháng — full GPT-5, Code Interpreter, Custom GPTs, DALL-E 3, browsing, voice (advanced & standard), Tasks, Canvas, Memory, file upload.
- ChatGPT Pro $200/tháng — unlimited GPT-5 + o3-pro, Sora 2 video gen, Operator (browser agent), Deep Research không giới hạn, priority access.
- ChatGPT Team từ $25/user/tháng — Plus features + admin console + workspace data isolation.
- ChatGPT Edu / Enterprise — SSO, audit log, custom data retention, dành cho trường học/doanh nghiệp.
- Tính năng nổi bật: Tasks (scheduled prompts), Memory (cross-conversation), Operator (browser agent tự thao tác web), Canvas (collaborative editing như Google Docs), Projects (group chat + file), MCP support.`,
  },
  {
    keywords: ["antigravity", "google antigravity"],
    label: "Google Antigravity",
    notes: `- Google Antigravity (ra mắt 11/2025, ổn định 2026) — agentic development platform, "spiritual successor" của Project IDX, build trên Code OSS (VS Code fork).
- Hai workspace chính: Editor View (IDE classic) + Manager View (mission control cho nhiều agent chạy song song).
- Multi-model: Gemini 3 Pro, Claude Sonnet 4.6 / Haiku 4.5, GPT-5.5 — admin chuyển model trong từng task.
- Agent có quyền browser (built-in Chromium), terminal, file system — thực thi end-to-end tasks.
- Artifacts — agent log lại task plan, screenshots, command, diff để admin verify (audit trail).
- Knowledge / Memory persistent giữa session, đồng bộ qua Google account.
- Free tier — Gemini 3 Pro với rate limit; Pro plan ($20/tháng) trả phí nâng giới hạn + premium model.
- Cạnh tranh trực tiếp với Cursor & Claude Code, mạnh ở tích hợp Google Cloud + Workspace.
- Hỗ trợ MCP, hooks, notebook (Jupyter-like), terminal multi-tab.`,
  },
  {
    keywords: ["gemini", "google ai"],
    label: "Gemini (Google)",
    notes: `- Gemini 2.5 Pro / Ultra (2026) — context 2M token, multimodal native (text/image/video/audio), code execution.
- Gemini Advanced (Google AI Pro) ~$20/tháng — full Gemini 2.5 + Deep Research + 2TB Drive + NotebookLM Pro.
- Tích hợp sâu Google Workspace (Docs, Gmail, Sheets, Meet) — Gemini summarize/draft inline.
- Veo 3 — model gen video chất lượng cao đã GA.`,
  },
  {
    keywords: ["genspark"],
    label: "Genspark AI",
    notes: `- Genspark AI Plus 2026 — AI agent platform với Sparkpages, Autopilot, Mixture-of-Agents.
- Tích hợp nhiều model (GPT-5, Claude 4, Gemini) chạy song song để cross-verify.
- Tính năng: AI Slides, AI Sheets, AI Phone Call, Deep Research agents.
- Plus plan ~$24.99/tháng — 10,000 credits + premium features.`,
  },
  {
    keywords: ["runway"],
    label: "Runway ML",
    notes: `- Runway Gen-4 / Gen-4 Turbo (2026) — text-to-video & image-to-video chất lượng cao, motion brush, character consistency.
- Standard plan $15/tháng, Pro $35, Unlimited $95.
- Tính năng: Lipsync, Act-One (motion capture), Camera Control, Visual Effects suite.`,
  },
  {
    keywords: ["krea"],
    label: "Krea AI",
    notes: `- Krea Image / Video / Realtime — generate ảnh & video AI với realtime preview.
- Hỗ trợ nhiều model: Flux, Imagen, Veo, Kling, Hailuo, Stable Diffusion.
- Max plan $84 — unlimited credits + commercial license + priority generation.`,
  },
  {
    keywords: ["perplexity"],
    label: "Perplexity AI",
    notes: `- Perplexity Pro 2026 — AI search engine với citations, Pro Search (deep agent), Spaces (collab).
- Multi-model: GPT-5, Claude Opus 4.7, Sonar Huge, Gemini 2.5 — admin chọn theo task.
- File upload + image search + audio responses. $20/tháng.`,
  },
  {
    keywords: ["midjourney"],
    label: "Midjourney",
    notes: `- Midjourney v7 (2026) — image gen chất lượng cao, personalization mode, style references.
- Plans: Basic $10, Standard $30, Pro $60, Mega $120 — fast hours khác nhau.
- Web app + Discord. Hỗ trợ Sref, Cref, niji style anime.`,
  },
];

/**
 * Tìm các nhóm KB liên quan dựa trên keyword trong tên + category.
 */
function pickRelevantNotes(productName: string, categoryName: string): string {
  const haystack = `${productName} ${categoryName}`.toLowerCase();
  const matches = FEATURE_KB.filter(({ keywords }) =>
    keywords.some((kw) => haystack.includes(kw.toLowerCase())),
  );
  if (matches.length === 0) return "";
  return matches
    .map((m) => `### ${m.label}\n${m.notes}`)
    .join("\n\n");
}

const SYSTEM_PROMPT = `Bạn là copywriter Việt Nam chuyên về sản phẩm AI/SaaS upgrade chính chủ.
Phong cách:
- Tiếng Việt tự nhiên, chuyên nghiệp, có cảm xúc, dùng emoji vừa phải (🚀 🔥 ✅ • 🧠 ⚡ 💻 🔬 📁 🎨 🔌 📈 🎯 🔐 🛡️ 👉).
- Cấu trúc rõ ràng theo block: tiêu đề → giới thiệu ngắn → giá → quyền lợi (bullet •) → hình thức nâng cấp → bảo hành → đối tượng phù hợp → CTA.
- Chỉ nêu tính năng CÓ THẬT trong knowledge base được cung cấp; KHÔNG bịa, KHÔNG suy đoán phiên bản chưa có trong KB.
- Giữ nguyên brand name (Cursor, Claude, ChatGPT, GPT-5, Gemini, Antigravity, Anthropic, OpenAI, Google) và emoji có ý nghĩa.
- Mô tả ngắn (shortDescription): 1 câu, ≤ 280 ký tự, súc tích, có model/tính năng nổi bật + lợi ích chính.
- Mô tả chi tiết (description): 250–500 từ, có line break (\\n\\n giữa block), bullet "• " cho danh sách tính năng.
- Tính năng (features): mảng 6–10 mục NGẮN (≤ 90 ký tự/mục), mỗi mục là 1 quyền lợi/tính năng cụ thể của gói (KHÔNG trùng lặp, KHÔNG bullet symbol — chỉ nội dung). Đây là list hiển thị trên trang sản phẩm public.
- KHÔNG đổi tên sản phẩm, KHÔNG thay đổi mức giá đã có trong mô tả gốc trừ khi thấy giá gốc Anthropic/OpenAI/Google bị sai (lúc đó dùng giá tham khảo chính hãng).
- Trả về CHỈ JSON object với 3 keys: "shortDescription" (string), "description" (string), "features" (array of strings). Không markdown fence, không giải thích.`;

interface RefreshBody {
  productId?: string;
  contextNotes?: string;
  autoApply?: boolean;
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as RefreshBody;
    const { productId, contextNotes, autoApply } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "productId là bắt buộc" },
        { status: 400 },
      );
    }

    if (!hasGeminiApiKey()) {
      return NextResponse.json(
        { error: "GEMINI_API_KEYS chưa được cấu hình" },
        { status: 500 },
      );
    }

    // Fetch product với category name để build prompt
    const rows = await db
      .select({
        id: productTable.id,
        name: productTable.name,
        slug: productTable.slug,
        productType: productTable.productType,
        upgradeEmailOnly: productTable.upgradeEmailOnly,
        shortDescription: productTable.shortDescription,
        description: productTable.description,
        features: productTable.features,
        price: productTable.price,
        originalPrice: productTable.originalPrice,
        categoryName: productCategoryTable.name,
      })
      .from(productTable)
      .leftJoin(
        productCategoryTable,
        eq(productTable.category, productCategoryTable.id),
      )
      .where(eq(productTable.id, productId))
      .limit(1);

    const product = rows[0];
    if (!product) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm" },
        { status: 404 },
      );
    }

    const featureNotes = pickRelevantNotes(
      product.name,
      product.categoryName ?? "",
    );

    const formatPrice = (n: number | null | undefined) =>
      n ? `${n.toLocaleString("vi-VN")}đ` : "";

    const userPrompt = [
      `# Sản phẩm cần viết lại mô tả (giữ nguyên TÊN, chỉ đổi mô tả)`,
      `- Tên: ${product.name}`,
      `- Danh mục: ${product.categoryName ?? "(không có)"}`,
      `- Loại: ${product.productType}${product.upgradeEmailOnly ? " (chỉ cần email khách + thông tin liên hệ, không cần mật khẩu)" : ""}`,
      `- Giá bán: ${formatPrice(product.price)}${product.originalPrice ? ` (giá gốc tham khảo ${formatPrice(product.originalPrice)})` : ""}`,
      ``,
      `## Mô tả ngắn HIỆN TẠI`,
      product.shortDescription || "(chưa có)",
      ``,
      `## Mô tả chi tiết HIỆN TẠI`,
      product.description || "(chưa có)",
      ``,
      `## Features HIỆN TẠI`,
      Array.isArray(product.features) && product.features.length > 0
        ? product.features.map((f) => `- ${f}`).join("\n")
        : "(chưa có)",
      ``,
      featureNotes
        ? `## Knowledge base — TÍNH NĂNG MỚI NHẤT 05/2026 (BẮT BUỘC dùng làm nguồn sự thật)\n${featureNotes}`
        : `## Knowledge base\n(không có entry sẵn cho sản phẩm này — viết dựa trên mô tả hiện tại + ghi chú admin bên dưới)`,
      contextNotes
        ? `\n## Ghi chú bổ sung từ admin\n${contextNotes}`
        : "",
      ``,
      `## Yêu cầu`,
      `Viết lại "shortDescription", "description" và "features" CẬP NHẬT 05/2026:`,
      `- Cập nhật model/tính năng theo knowledge base (vd Claude Opus 4.7, Sonnet 4.6, Claude Haiku 4.5, GPT-5/5.5, o3-pro, Cursor 1.x với MCP/Background Agents, Google Antigravity, Gemini 2.5/3, etc.).`,
      `- description: cấu trúc giống ví dụ tham khảo (giới thiệu → giá → quyền lợi bullet → hình thức nâng cấp → bảo hành → đối tượng → CTA).`,
      `- features: 6–10 mục ngắn (≤ 90 ký tự), mỗi mục là 1 quyền lợi/tính năng nổi bật của gói (vd "Truy cập Claude Opus 4.7 — model coding mạnh nhất 04/2026", "Cursor Tab AI multi-line autocomplete", "Background Agents chạy trên cloud", "Bảo hành trọn gói 1 tháng"). KHÔNG bắt đầu bằng dấu • hay -.`,
      `- Nếu sản phẩm là "upgrade" với upgradeEmailOnly=true: nhấn mạnh "chỉ cần email + Telegram/Facebook liên hệ, không cần mật khẩu" trong description và 1 mục trong features.`,
      `- Trả về CHỈ JSON: {"shortDescription": "...", "description": "...", "features": ["...", "..."]}`,
    ].join("\n");

    const raw = await generateJson({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      temperature: 0.6,
    });

    if (!raw) {
      return NextResponse.json(
        { error: "Gemini không trả về kết quả" },
        { status: 500 },
      );
    }

    let parsed: {
      shortDescription?: string;
      description?: string;
      features?: unknown;
    };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      return NextResponse.json(
        { error: "Không parse được JSON từ AI" },
        { status: 500 },
      );
    }

    const shortDescription = (parsed.shortDescription ?? "").trim();
    const description = (parsed.description ?? "").trim();

    // Sanitize features: chỉ nhận array of non-empty strings, trim, bỏ "•/-/*"
    // ở đầu để tránh double-bullet trên UI public.
    const features: string[] = Array.isArray(parsed.features)
      ? parsed.features
          .map((f) => (typeof f === "string" ? f.trim() : ""))
          .map((f) => f.replace(/^[•\-*·]\s*/, "").trim())
          .filter((f) => f.length > 0 && f.length <= 200)
          .slice(0, 12)
      : [];

    if (!shortDescription || !description) {
      return NextResponse.json(
        { error: "AI trả về thiếu shortDescription hoặc description" },
        { status: 500 },
      );
    }

    if (autoApply) {
      await db
        .update(productTable)
        .set({
          shortDescription,
          description,
          // Chỉ ghi đè features nếu AI thực sự trả về list >0; tránh xoá sạch
          // features cũ khi AI hợp lý vì lý do nào đó trả mảng rỗng.
          ...(features.length > 0 ? { features } : {}),
          updatedAt: new Date(),
        })
        .where(eq(productTable.id, productId));
    }

    return NextResponse.json({
      shortDescription,
      description,
      features,
      applied: !!autoApply,
      product: {
        id: product.id,
        name: product.name,
      },
    });
  } catch (error) {
    console.error("[refresh-description] error:", error);
    const message =
      error instanceof Error ? error.message : "Refresh description failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
