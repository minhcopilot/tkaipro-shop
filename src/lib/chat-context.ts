// system prompt for the AI chatbot with product knowledge

import { SEO_CONFIG } from "~/app";
import type { Product, ProductCategory } from "~/db/schema/products/types";

export type SupportedLocale = "vi" | "en" | "zh" | "ja" | "ko" | "fr" | "de" | "es" | "pt" | "ru" | "ar";

// contact block built from env-driven config - bỏ qua kênh chưa cấu hình
const CONTACT_BLOCK = [
  `- Website: ${SEO_CONFIG.url}`,
  SEO_CONFIG.supportContacts.telegram
    ? `- Telegram: https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
    : "",
  SEO_CONFIG.supportContacts.facebook ? `- Facebook: ${SEO_CONFIG.supportContacts.facebook}` : "",
  SEO_CONFIG.supportContacts.messenger ? `- Messenger: ${SEO_CONFIG.supportContacts.messenger}` : "",
  SEO_CONFIG.supportContacts.email ? `- Email: ${SEO_CONFIG.supportContacts.email}` : "",
]
  .filter(Boolean)
  .join("\n");

// base context without product data - shop info, policies, guidelines (English for AI to understand)
const CHAT_BASE_CONTEXT = `You are the AI assistant of ${SEO_CONFIG.name} - an independent third-party reseller of design-tool subscriptions (including Google AI).

## ABOUT ${SEO_CONFIG.name.toUpperCase()}
- ${SEO_CONFIG.name} is an independent third-party reseller, NOT affiliated with Google LLC
- We resell legitimately-acquired Google AI subscriptions and deliver activation/credentials
- Services include: package consultation, international payment support, setup guidance, customer care

## FIGMA PRO FEATURES
- ✅ Unlimited files and version history
- ✅ Shared team libraries and design systems
- ✅ Dev Mode - inspect, measure and hand off to code
- ✅ Advanced prototyping and branching
- ✅ FigJam collaboration boards

## POLICIES
- 🛡️ 1-for-1 warranty within 30 days
- 💰 100% refund within 7 days if not satisfied
- ⚡ Account delivery within 5-10 minutes after payment confirmation
- 📞 24/7 support via Telegram and Facebook

## PAYMENT & ACTIVATION PROCESS

### Case 1: Buy New Account (Mua tài khoản mới)
1. Select product package on website
2. Complete payment (Bank transfer/MoMo/Binance Pay)
3. Payment confirmation (automatic for VietQR)
4. **New account credentials (email + password) will be sent to your email AND displayed in Order Management page on website**
5. Use the received credentials to log in and start using Google AI

### Case 2: Upgrade Your Own Account (Nâng cấp chính chủ)
1. Select upgrade package on website
2. Complete payment
3. **Customer sends THEIR OWN Google AI account (email + password) to support via Telegram or Facebook**
4. Support team upgrades the customer's account within 5-10 minutes
5. Customer can use their upgraded account immediately

## PAYMENT METHODS
- Bank transfer (VietQR - automatic confirmation)
- MoMo, Binance Pay
- One-time payment, no auto-renew

## CONTACT
${CONTACT_BLOCK}

## IMPORTANT NOTES
- ${SEO_CONFIG.name} is only a purchasing support service, not an official dealer
- Prices may change, advise customers to check the website
- Accounts are legitimately acquired Google AI subscriptions resold by ${SEO_CONFIG.name} (independent reseller, not affiliated with Google LLC)
- For NEW ACCOUNTS: credentials sent via email + order management page
- For UPGRADES: customer provides their account to support for upgrading`;

// language-specific response instructions
const LANGUAGE_INSTRUCTIONS: Record<SupportedLocale, string> = {
  vi: "Trả lời bằng tiếng Việt. Thân thiện, chuyên nghiệp, dùng emoji phù hợp.",
  en: "Respond in English. Be friendly, professional, use appropriate emojis.",
  zh: "用中文回复。友好、专业，适当使用表情符号。",
  ja: "日本語で回答してください。フレンドリーでプロフェッショナルに、適切な絵文字を使用してください。",
  ko: "한국어로 답변해 주세요. 친근하고 전문적으로, 적절한 이모지를 사용하세요.",
  fr: "Répondez en français. Soyez amical, professionnel, utilisez des emojis appropriés.",
  de: "Antworten Sie auf Deutsch. Seien Sie freundlich, professionell, verwenden Sie passende Emojis.",
  es: "Responda en español. Sea amable, profesional, use emojis apropiados.",
  pt: "Responda em português. Seja amigável, profissional, use emojis apropriados.",
  ru: "Отвечайте на русском языке. Будьте дружелюбны, профессиональны, используйте подходящие эмодзи.",
  ar: "أجب باللغة العربية. كن ودودًا ومحترفًا واستخدم الرموز التعبيرية المناسبة.",
};

// helper to format price in VND
function formatPriceVND(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price);
}

// build system prompt with dynamic product data from database
export function buildSystemPrompt(
  products: Product[],
  categories: ProductCategory[],
  locale: SupportedLocale = "vi"
): string {
  // build categories section
  const categoryList = categories
    .map((c) => `- ${c.name}`)
    .join("\n");

  // build products section grouped by category
  const productsByCategory = new Map<string, Product[]>();
  
  for (const product of products) {
    const categoryId = product.category;
    if (!productsByCategory.has(categoryId)) {
      productsByCategory.set(categoryId, []);
    }
    productsByCategory.get(categoryId)!.push(product);
  }

  let productsSection = "";
  
  for (const category of categories) {
    const categoryProducts = productsByCategory.get(category.id) || [];
    if (categoryProducts.length === 0) continue;

    productsSection += `\n### ${category.name}\n`;
    
    for (const product of categoryProducts) {
      const duration = product.duration ? `${product.duration} days` : "";
      const originalPrice = product.originalPrice 
        ? ` (original ~${formatPriceVND(product.originalPrice)} VND)` 
        : "";
      const popular = product.isPopular ? " ⭐ POPULAR" : "";
      const inStock = product.inStock ? "✅ In stock" : "❌ Out of stock";
      
      productsSection += `- **${product.name}**${popular}\n`;
      productsSection += `  - Price: ${formatPriceVND(product.price)} VND${originalPrice}\n`;
      if (duration) productsSection += `  - Duration: ${duration}\n`;
      productsSection += `  - Status: ${inStock}\n`;
      
      if (product.shortDescription) {
        productsSection += `  - Description: ${product.shortDescription}\n`;
      }
      
      if (product.features && product.features.length > 0) {
        productsSection += `  - Features: ${product.features.slice(0, 3).join(", ")}\n`;
      }
    }
  }

  // also include products without category match
  const uncategorizedProducts = products.filter(
    (p) => !categories.some((c) => c.id === p.category)
  );
  
  if (uncategorizedProducts.length > 0) {
    productsSection += "\n### Other Products\n";
    for (const product of uncategorizedProducts) {
      const duration = product.duration ? `${product.duration} days` : "";
      const popular = product.isPopular ? " ⭐ POPULAR" : "";
      
      productsSection += `- **${product.name}**${popular}: ${formatPriceVND(product.price)} VND`;
      if (duration) productsSection += ` - ${duration}`;
      productsSection += "\n";
    }
  }

  const languageInstruction = LANGUAGE_INSTRUCTIONS[locale] || LANGUAGE_INSTRUCTIONS.en;

  return `${CHAT_BASE_CONTEXT}

## RESPONSE LANGUAGE
${languageInstruction}

## RESPONSE GUIDELINES
1. If customer asks about specific products, recommend packages that fit their needs
2. Always emphasize commitments: authentic, warranty, refund
3. For complex technical questions, advise contacting support directly
4. Do not make up information not in the context
5. Keep answers concise and easy to understand
6. Use appropriate emojis to be friendly

## PRODUCT CATEGORIES
${categoryList || "- No categories yet"}

## AVAILABLE PRODUCTS (PRICE IN VND)
${productsSection || "No products available."}`;
}

// fallback static prompt if DB fetch fails
export const CHAT_SYSTEM_PROMPT_FALLBACK = CHAT_BASE_CONTEXT;

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const WELCOME_MESSAGE: Record<SupportedLocale, string> = {
  vi: `Xin chào! 👋 Tôi là trợ lý AI của ${SEO_CONFIG.name}. Tôi có thể giúp bạn:\n\n• Tư vấn chọn gói Google AI phù hợp\n• Giải đáp thắc mắc về sản phẩm\n• Hướng dẫn thanh toán và kích hoạt\n\nBạn cần hỗ trợ gì hôm nay?`,
  en: `Hello! 👋 I'm the AI assistant of ${SEO_CONFIG.name}. I can help you with:\n\n• Choosing the right Google AI package\n• Answering product questions\n• Payment and activation guidance\n\nHow can I help you today?`,
  zh: `你好！👋 我是 ${SEO_CONFIG.name} 的 AI 助手。我可以帮助您：\n\n• 选择合适的 Google AI 套餐\n• 解答产品问题\n• 付款和激活指南\n\n今天我能帮您什么？`,
  ja: `こんにちは！👋 ${SEO_CONFIG.name} の AI アシスタントです。お手伝いできることは：\n\n• 適切な Google AI パッケージの選択\n• 製品に関するご質問への回答\n• お支払いとアクティベーションのご案内\n\n今日は何をお手伝いしましょうか？`,
  ko: `안녕하세요! 👋 ${SEO_CONFIG.name} AI 어시스턴트입니다. 도움드릴 수 있는 것들:\n\n• 적합한 Google AI 패키지 선택\n• 제품 관련 질문 답변\n• 결제 및 활성화 안내\n\n오늘 무엇을 도와드릴까요?`,
  fr: `Bonjour ! 👋 Je suis l'assistant IA de ${SEO_CONFIG.name}. Je peux vous aider à :\n\n• Choisir le bon forfait Google AI\n• Répondre aux questions sur les produits\n• Guider pour le paiement et l'activation\n\nComment puis-je vous aider aujourd'hui ?`,
  de: `Hallo! 👋 Ich bin der KI-Assistent von ${SEO_CONFIG.name}. Ich kann Ihnen helfen bei:\n\n• Auswahl des richtigen Google AI Pakets\n• Beantwortung von Produktfragen\n• Anleitung zu Zahlung und Aktivierung\n\nWie kann ich Ihnen heute helfen?`,
  es: `¡Hola! 👋 Soy el asistente de IA de ${SEO_CONFIG.name}. Puedo ayudarte con:\n\n• Elegir el paquete Google AI adecuado\n• Responder preguntas sobre productos\n• Guía de pago y activación\n\n¿Cómo puedo ayudarte hoy?`,
  pt: `Olá! 👋 Sou o assistente de IA da ${SEO_CONFIG.name}. Posso ajudá-lo com:\n\n• Escolher o pacote Google AI certo\n• Responder perguntas sobre produtos\n• Orientação de pagamento e ativação\n\nComo posso ajudá-lo hoje?`,
  ru: `Привет! 👋 Я AI-ассистент ${SEO_CONFIG.name}. Я могу помочь вам с:\n\n• Выбором подходящего пакета Google AI\n• Ответами на вопросы о продуктах\n• Руководством по оплате и активации\n\nЧем могу помочь сегодня?`,
  ar: `مرحباً! 👋 أنا المساعد الذكي لـ ${SEO_CONFIG.name}. يمكنني مساعدتك في:\n\n• اختيار باقة Google AI المناسبة\n• الإجابة على أسئلة المنتجات\n• إرشادات الدفع والتفعيل\n\nكيف يمكنني مساعدتك اليوم؟`,
};

export const QUICK_ACTIONS: Record<SupportedLocale, Array<{ label: string; message: string }>> = {
  vi: [
    { label: "Tư vấn gói", message: "Tôi muốn được tư vấn chọn gói Google AI phù hợp" },
    { label: "Bảng giá", message: "Cho tôi xem bảng giá các gói Google AI" },
    { label: "Cách thanh toán", message: "Các phương thức thanh toán là gì?" },
    { label: "Chính sách bảo hành", message: "Chính sách bảo hành và hoàn tiền như thế nào?" },
  ],
  en: [
    { label: "Package advice", message: "I need help choosing the right Google AI package" },
    { label: "Pricing", message: "Show me the pricing for Google AI packages" },
    { label: "Payment methods", message: "What are the payment methods?" },
    { label: "Warranty policy", message: "What is the warranty and refund policy?" },
  ],
  zh: [
    { label: "套餐建议", message: "我需要帮助选择合适的 Google AI 套餐" },
    { label: "价格", message: "显示 Google AI 套餐的价格" },
    { label: "付款方式", message: "有哪些付款方式？" },
    { label: "保修政策", message: "保修和退款政策是什么？" },
  ],
  ja: [
    { label: "パッケージ相談", message: "適切な Google AI パッケージを選ぶのを手伝ってください" },
    { label: "価格表", message: "Google AI パッケージの価格を見せてください" },
    { label: "支払い方法", message: "どのような支払い方法がありますか？" },
    { label: "保証ポリシー", message: "保証と返金ポリシーは何ですか？" },
  ],
  ko: [
    { label: "패키지 상담", message: "적합한 Google AI 패키지를 선택하는 데 도움이 필요합니다" },
    { label: "가격표", message: "Google AI 패키지 가격을 보여주세요" },
    { label: "결제 방법", message: "어떤 결제 방법이 있나요?" },
    { label: "보증 정책", message: "보증 및 환불 정책은 무엇인가요?" },
  ],
  fr: [
    { label: "Conseils forfait", message: "J'ai besoin d'aide pour choisir le bon forfait Google AI" },
    { label: "Tarifs", message: "Montrez-moi les tarifs des forfaits Google AI" },
    { label: "Modes de paiement", message: "Quels sont les modes de paiement ?" },
    { label: "Politique de garantie", message: "Quelle est la politique de garantie et de remboursement ?" },
  ],
  de: [
    { label: "Paketberatung", message: "Ich brauche Hilfe bei der Auswahl des richtigen Google AI Pakets" },
    { label: "Preise", message: "Zeigen Sie mir die Preise für Google AI Pakete" },
    { label: "Zahlungsmethoden", message: "Welche Zahlungsmethoden gibt es?" },
    { label: "Garantierichtlinien", message: "Wie sind die Garantie- und Rückerstattungsrichtlinien?" },
  ],
  es: [
    { label: "Asesoramiento", message: "Necesito ayuda para elegir el paquete Google AI adecuado" },
    { label: "Precios", message: "Muéstrame los precios de los paquetes Google AI" },
    { label: "Métodos de pago", message: "¿Cuáles son los métodos de pago?" },
    { label: "Política de garantía", message: "¿Cuál es la política de garantía y reembolso?" },
  ],
  pt: [
    { label: "Consultoria", message: "Preciso de ajuda para escolher o pacote Google AI certo" },
    { label: "Preços", message: "Mostre-me os preços dos pacotes Google AI" },
    { label: "Métodos de pagamento", message: "Quais são os métodos de pagamento?" },
    { label: "Política de garantia", message: "Qual é a política de garantia e reembolso?" },
  ],
  ru: [
    { label: "Консультация", message: "Мне нужна помощь в выборе подходящего пакета Google AI" },
    { label: "Цены", message: "Покажите мне цены на пакеты Google AI" },
    { label: "Способы оплаты", message: "Какие способы оплаты доступны?" },
    { label: "Гарантийная политика", message: "Какова политика гарантии и возврата?" },
  ],
  ar: [
    { label: "استشارة الباقة", message: "أحتاج مساعدة في اختيار باقة Google AI المناسبة" },
    { label: "الأسعار", message: "أرني أسعار باقات Google AI" },
    { label: "طرق الدفع", message: "ما هي طرق الدفع المتاحة؟" },
    { label: "سياسة الضمان", message: "ما هي سياسة الضمان والاسترداد؟" },
  ],
};

// helper to get locale-safe data
export function getWelcomeMessage(locale: string): string {
  return WELCOME_MESSAGE[locale as SupportedLocale] || WELCOME_MESSAGE.en;
}

export function getQuickActions(locale: string): Array<{ label: string; message: string }> {
  return QUICK_ACTIONS[locale as SupportedLocale] || QUICK_ACTIONS.en;
}
