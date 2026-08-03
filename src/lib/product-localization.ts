
import { SEO_CONFIG } from "~/app";
import { type Product } from "~/db/schema/products/types";

export const EXCHANGE_RATE = 24000; // 1 USD = 24,000 VND

interface ProductTranslation {
  name: string;
  description?: string;
  shortDescription?: string;
}

interface LocalizedProductTranslation {
  en: ProductTranslation;
  ru: ProductTranslation;
  zh: ProductTranslation;
  ar: ProductTranslation;
  es?: ProductTranslation;
  fr?: ProductTranslation;
  de?: ProductTranslation;
  ja?: ProductTranslation;
  ko?: ProductTranslation;
  pt?: ProductTranslation;
}

// database products with full translations for EN, RU, ZH
const DB_PRODUCT_TRANSLATIONS: Record<string, LocalizedProductTranslation> = {
  // ChatGPT Plus – 1 Tháng – Uy Tín – Tốc Độ Cao
  "chatgpt-plus-1-thang-uy-tin-toc-o-cao": {
    en: {
      name: "ChatGPT Plus – 1 Month – Trusted – High Speed",
      shortDescription: "ChatGPT Plus full speed access, priority processing, unlimited. Much cheaper than buying directly, great for learning, work and business."
    },
    ru: {
      name: "ChatGPT Plus – 1 месяц – Надёжный – Высокая скорость",
      shortDescription: "ChatGPT Plus на полной скорости, приоритетный доступ, без ограничений. Значительно дешевле прямой покупки, подходит для учёбы, работы и бизнеса."
    },
    zh: {
      name: "ChatGPT Plus – 1个月 – 可靠 – 高速",
      shortDescription: "ChatGPT Plus完整速度访问，优先处理，无限制。比直接购买便宜很多，适合学习、工作和商业。"
    },
    ar: {
      name: "ChatGPT Plus – شهر واحد – موثوق – سرعة عالية",
      shortDescription: "وصول ChatGPT Plus بسرعة كاملة، معالجة أولوية، غير محدود. أرخص بكثير من الشراء المباشر، ممتاز للتعلم والعمل والأعمال."
    },
    es: {
      name: "ChatGPT Plus – 1 Mes – Confiable – Alta Velocidad",
      shortDescription: "Acceso ChatGPT Plus a máxima velocidad, procesamiento prioritario, ilimitado. Mucho más barato que compra directa, ideal para estudio, trabajo y negocios."
    }
  ,
    fr: {
      name: "ChatGPT Plus – 1 Mois – Fiable – Haute Vitesse",
      shortDescription: "Accès ChatGPT Plus à pleine vitesse, traitement prioritaire, illimité. Beaucoup moins cher que l'achat direct, idéal pour l'apprentissage, le travail et les affaires."
    },
    de: {
      name: "ChatGPT Plus – 1 Monat – Zuverlässig – Hohe Geschwindigkeit",
      shortDescription: "ChatGPT Plus voller Geschwindigkeitszugang, Prioritätsverarbeitung, unbegrenzt. Viel günstiger als Direktkauf, ideal für Lernen, Arbeit und Geschäft."
    },
    ja: {
      name: "ChatGPT Plus – 1ヶ月 – 信頼 – 高速",
      shortDescription: "ChatGPT Plus フルスピードアクセス、優先処理、無制限。直接購入より大幅にお得、学習・仕事・ビジネスに最適。"
    },
    ko: {
      name: "ChatGPT Plus – 1개월 – 신뢰 – 고속",
      shortDescription: "ChatGPT Plus 풀스피드 액세스, 우선 처리, 무제한. 직접 구매보다 훨씬 저렴, 학습, 업무, 비즈니스에 최적."
    }
  },
  // Cursor Pro 1 Tháng – MAX MODE + MAX MODEL AI Không Giới Hạn (UNLIMITED)
  "cursor-pro-1-thang-max-mode-max-model-ai-khong-gioi-han-unlimited": {
    en: {
      name: "Cursor Pro 1 Month – MAX MODE + Unlimited AI Models",
      shortDescription: "🚀 Cursor Pro account 1 month – unlock MAX MODE + MAX AI MODEL, unlimited usage, coding many times faster, optimized for Developers & IT students."
    },
    ru: {
      name: "Cursor Pro 1 месяц – MAX MODE + Безлимитные AI модели",
      shortDescription: "🚀 аккаунт Cursor Pro 1 месяц – разблокируйте MAX MODE + MAX AI MODEL, неограниченное использование, кодирование в разы быстрее, оптимизировано для разработчиков и IT-студентов."
    },
    zh: {
      name: "Cursor Pro 1个月 – MAX MODE + 无限AI模型",
      shortDescription: "🚀 Cursor Pro账户1个月 – 解锁MAX MODE + MAX AI MODEL，无限使用，编码速度提升数倍，专为开发者和IT学生优化。"
    },
    ar: {
      name: "Cursor Pro شهر واحد – MAX MODE + نماذج AI غير محدودة",
      shortDescription: "🚀 حساب Cursor Pro شهر واحد – افتح MAX MODE + MAX AI MODEL، استخدام غير محدود، برمجة أسرع بمرات، محسن للمطورين وطلاب IT."
    },
    es: {
      name: "Cursor Pro 1 Mes – MAX MODE + Modelos AI Ilimitados",
      shortDescription: "🚀 Cuenta Cursor Pro genuina 1 mes – desbloquea MAX MODE + MAX AI MODEL, uso ilimitado, codificación mucho más rápida, optimizado para desarrolladores y estudiantes IT."
    }
  ,
    fr: {
      name: "Cursor Pro 1 Mois – MAX MODE + Modèles IA Illimités",
      shortDescription: "🚀 Compte Cursor Pro authentique 1 mois – déverrouillez MAX MODE + MAX AI MODEL, utilisation illimitée, codage beaucoup plus rapide, optimisé pour les développeurs et étudiants IT."
    },
    de: {
      name: "Cursor Pro 1 Monat – MAX MODE + Unbegrenzte AI-Modelle",
      shortDescription: "🚀 Cursor Pro Konto 1 Monat – schalten Sie MAX MODE + MAX AI MODEL frei, unbegrenzte Nutzung, viel schneller programmieren, optimiert für Entwickler und IT-Studenten."
    },
    ja: {
      name: "Cursor Pro 1ヶ月 – MAX MODE + 無制限AIモデル",
      shortDescription: "🚀 正規Cursor Proアカウント1ヶ月 – MAX MODE + MAX AI MODELを解放、無制限使用、コーディング速度大幅向上、開発者・IT学生向けに最適化。"
    },
    ko: {
      name: "Cursor Pro 1개월 – MAX MODE + 무제한 AI 모델",
      shortDescription: "🚀 Cursor Pro 계정 1개월 – MAX MODE + MAX AI MODEL 잠금 해제, 무제한 사용, 코딩 속도 대폭 향상, 개발자 및 IT 학생에 최적화."
    }
  },
  // Cursor Pro Plan AI 20$ – Dùng Chung Chính Hãng Giá Rẻ – 1 Tháng
  "cursor-pro-plan-ai-20-dung-chung-chinh-hang-gia-re-1-thang": {
    en: {
      name: "Cursor Pro Plan AI $20 – Shared – 1 Month",
      shortDescription: "Cursor Pro Plan AI $20 shared – experience full AI coding power at budget-friendly cost."
    },
    ru: {
      name: "Cursor Pro Plan AI $20 – Общий оригинал – 1 месяц",
      shortDescription: "Cursor Pro Plan AI $20 общий – полная мощь AI-кодирования по выгодной цене."
    },
    zh: {
      name: "Cursor Pro Plan AI $20 – 共享 – 1个月",
      shortDescription: "Cursor Pro Plan AI $20共享 – 以实惠价格体验完整AI编码能力。"
    },
    ar: {
      name: "Cursor Pro Plan AI $20 – مشترك – شهر واحد",
      shortDescription: "Cursor Pro Plan AI $20 مشترك – جرب قوة برمجة AI الكاملة بتكلفة معقولة."
    },
    es: {
      name: "Cursor Pro Plan AI $20 – Compartido – 1 Mes",
      shortDescription: "Cursor Pro Plan AI $20 genuino compartido – experimenta toda la potencia del codificación IA a costo accesible."
    }
  ,
    fr: {
      name: "Cursor Pro Plan AI $20 – Partagé – 1 Mois",
      shortDescription: "Cursor Pro Plan AI $20 Partagé – expérimentez la pleine puissance du codage IA à un coût abordable."
    },
    de: {
      name: "Cursor Pro Plan AI $20 – Geteilt – 1 Monat",
      shortDescription: "Cursor Pro Plan AI $20 geteilt – erleben Sie volle AI-Coding-Leistung zu günstigen Kosten."
    },
    ja: {
      name: "Cursor Pro Plan AI $20 – 共有 – 1ヶ月",
      shortDescription: "正規Cursor Pro Plan AI $20共有 – お手頃価格で完全なAIコーディング能力を体験。"
    },
    ko: {
      name: "Cursor Pro Plan AI $20 – 공유 – 1개월",
      shortDescription: "Cursor Pro Plan AI $20 공유 – 합리적인 가격으로 완전한 AI 코딩 파워 경험."
    }
  },
  // Cursor Pro plan 20$ AI Chính Hãng Giá Rẻ – Cấp Tài Khoản – 249K (Full Tính Năng)
  "cursor-pro-plan-20-ai-chinh-hang-gia-re-cap-tai-khoan-249k-full-tinh-nang": {
    en: {
      name: "Cursor Pro Plan $20 AI – Account Issue – Full Features",
      shortDescription: "Get Cursor Pro account with full features, smooth speed, unlimited requests. Independent use – super stable and extremely cost-effective for users needing high efficiency at low cost."
    },
    ru: {
      name: "Cursor Pro Plan $20 AI Оригинал – Выдача аккаунта – Полный функционал",
      shortDescription: "Получите аккаунт Cursor Pro с полным функционалом, плавной скоростью, без лимита запросов. Независимое использование – супер стабильный и экономичный для пользователей, которым нужна высокая эффективность при низкой стоимости."
    },
    zh: {
      name: "Cursor Pro Plan $20 AI – 账户发放 – 完整功能",
      shortDescription: "获取完整功能的Cursor Pro账户，流畅速度，无限请求。独立使用 – 超稳定且极具成本效益，适合需要高效率低成本的用户。"
    },
    ar: {
      name: "Cursor Pro Plan $20 AI – إصدار حساب – ميزات كاملة",
      shortDescription: "احصل على حساب Cursor Pro بميزات كاملة، سرعة سلسة، طلبات غير محدودة. استخدام مستقل – مستقر للغاية وفعال من حيث التكلفة."
    },
    es: {
      name: "Cursor Pro Plan $20 AI – Emisión de Cuenta – Funciones Completas",
      shortDescription: "Obtén cuenta Cursor Pro con todas las funciones, velocidad fluida, solicitudes ilimitadas. Uso independiente – super estable y extremadamente rentable."
    }
  ,
    fr: {
      name: "Cursor Pro Plan $20 AI – Émission de Compte – Fonctionnalités Complètes",
      shortDescription: "Obtenez un compte Cursor Pro avec fonctionnalités complètes, vitesse fluide, requêtes illimitées. Utilisation indépendante – super stable et très rentable."
    },
    de: {
      name: "Cursor Pro Plan $20 AI Original – Kontoausgabe – Alle Funktionen",
      shortDescription: "Erhalten Sie ein Cursor Pro Konto mit allen Funktionen, flüssige Geschwindigkeit, unbegrenzte Anfragen. Unabhängige Nutzung – super stabil und äußerst kosteneffektiv."
    },
    ja: {
      name: "Cursor Pro Plan $20 AI 正規 – アカウント発行 – 全機能",
      shortDescription: "全機能搭載のCursor Proアカウントを取得、スムーズな速度、無制限リクエスト。独立使用 – 超安定でコスパ最高。"
    },
    ko: {
      name: "Cursor Pro Plan $20 AI – 계정 발급 – 전체 기능",
      shortDescription: "전체 기능의 Cursor Pro 계정 획득, 부드러운 속도, 무제한 요청. 독립 사용 – 매우 안정적이고 비용 효율적."
    }
  },
  // IntelliJ IDEA - 1 Năm
  "intellij-idea-1-nam": {
    en: {
      name: "IntelliJ IDEA – 1 Year",
      shortDescription: "IntelliJ IDEA License 1 year"
    },
    ru: {
      name: "IntelliJ IDEA – 1 год",
      shortDescription: "Лицензия IntelliJ IDEA 1 год"
    },
    zh: {
      name: "IntelliJ IDEA – 1年",
      shortDescription: "IntelliJ IDEA许可证1年"
    },
    ar: {
      name: "IntelliJ IDEA – سنة واحدة",
      shortDescription: "ترخيص IntelliJ IDEA لسنة واحدة"
    },
    es: {
      name: "IntelliJ IDEA – 1 Año",
      shortDescription: "Licencia IntelliJ IDEA 1 año, el IDE Java más inteligente con funciones avanzadas para desarrollo profesional."
    }
  ,
    fr: {
      name: "IntelliJ IDEA – 1 An",
      shortDescription: "Licence IntelliJ IDEA 1 an, l'IDE Java le plus intelligent avec fonctionnalités avancées pour le développement professionnel."
    },
    de: {
      name: "IntelliJ IDEA – 1 Jahr",
      shortDescription: "IntelliJ IDEA Lizenz 1 Jahr, die intelligenteste Java-IDE mit erweiterten Funktionen für professionelle Entwicklung."
    },
    ja: {
      name: "IntelliJ IDEA – 1年",
      shortDescription: "IntelliJ IDEAライセンス1年、プロフェッショナル開発向け高度な機能を備えた最もスマートなJava IDE。"
    },
    ko: {
      name: "IntelliJ IDEA – 1년",
      shortDescription: "IntelliJ IDEA 라이선스 1년, 전문 개발을 위한 고급 기능이 포함된 가장 스마트한 Java IDE."
    }
  },
  // Nâng Cấp Chính Chủ Tài Khoản Cursor Pro plan 20$ AI Chính Hãng - 299K (Full Tính Năng)
  "nang-cap-chinh-chu-tai-khoan-cursor-pro-plan-20-ai-chinh-hang-299k-full-tinh-nang": {
    en: {
      name: "🔥 Official Upgrade Cursor Pro Plan $20 AI – Full Features",
      shortDescription: "Upgrade your own Cursor account to Pro genuine, full features, fast speed, stable, unlimited queries – powerful Dev support for all projects."
    },
    ru: {
      name: "🔥 Официальное обновление Cursor Pro Plan $20 AI – Полный функционал",
      shortDescription: "Обновите свой аккаунт Cursor до Pro оригинал, полный функционал, быстрая скорость, стабильность, безлимитные запросы – мощная поддержка для всех проектов."
    },
    zh: {
      name: "🔥 官方升级 Cursor Pro Plan $20 AI – 完整功能",
      shortDescription: "将您的Cursor账户升级到Pro，完整功能，高速稳定，无限查询 – 为所有项目提供强力开发支持。"
    },
    ar: {
      name: "🔥 ترقية رسمية Cursor Pro Plan $20 AI – ميزات كاملة",
      shortDescription: "قم بترقية حسابك الخاص إلى Pro ، ميزات كاملة، سرعة عالية، مستقر، استعلامات غير محدودة – دعم قوي للمطورين."
    },
    es: {
      name: "🔥 Actualización Oficial Cursor Pro Plan $20 AI – Funciones Completas",
      shortDescription: "Actualiza tu propia cuenta Cursor a Pro genuino, todas las funciones, alta velocidad, estable, consultas ilimitadas – soporte poderoso para todos los proyectos."
    },
    fr: {
      name: "🔥 Mise à niveau Cursor Pro Plan $20 AI – Fonctionnalités Complètes",
      shortDescription: "Mettez à niveau votre propre compte Cursor vers Pro authentique, toutes les fonctionnalités, vitesse rapide, stable, requêtes illimitées – support puissant pour tous les projets."
    },
    de: {
      name: "🔥 Upgrade Cursor Pro Plan $20 AI – Alle Funktionen",
      shortDescription: "Upgraden Sie Ihr eigenes Cursor-Konto auf Pro Original, alle Funktionen, schnelle Geschwindigkeit, stabil, unbegrenzte Anfragen – leistungsstarke Dev-Unterstützung für alle Projekte."
    },
    ja: {
      name: "🔥 公式アップグレード Cursor Pro Plan $20 AI – 全機能",
      shortDescription: "自分のCursorアカウントを正規Proにアップグレード、全機能、高速、安定、無制限クエリ – すべてのプロジェクトに強力な開発サポート。"
    },
    ko: {
      name: "🔥 공식 업그레이드 Cursor Pro Plan $20 AI – 전체 기능",
      shortDescription: "자신의 Cursor 계정을 Pro로 업그레이드, 전체 기능, 고속, 안정적, 무제한 쿼리 – 모든 프로젝트를 위한 강력한 개발 지원."
    }
  },
  // Nâng Cấp Super Grok Chính Chủ $30 1 Tháng – Full Tính Năng AI X – Giá Rẻ 299K
  "nang-cap-super-grok-chinh-chu-30-1-thang-full-tinh-nang-ai-x-gia-re-299k": {
    en: {
      name: "🔥 Official Upgrade Super Grok $30 – 1 Month – Full AI X Features",
      shortDescription: "Super Grok AI official upgrade $30/1 month package, unlock full AI features on X platform. No sharing, no password change, absolutely safe, fast support, great price."
    },
    ru: {
      name: "🔥 Официальное обновление Super Grok $30 – 1 месяц – Полный функционал AI X",
      shortDescription: "Официальное обновление Super Grok AI пакет $30/1 месяц, разблокируйте полный функционал AI на платформе X. Без общего доступа, без смены пароля, абсолютно безопасно, быстрая поддержка, отличная цена."
    },
    zh: {
      name: "🔥 官方升级 Super Grok $30 – 1个月 – 完整AI X功能",
      shortDescription: "Super Grok AI官方升级$30/1个月套餐，解锁X平台完整AI功能。不共享，不改密码，绝对安全，快速支持，超值价格。"
    },
    ar: {
      name: "🔥 ترقية رسمية Super Grok $30 – شهر واحد – ميزات AI X كاملة",
      shortDescription: "ترقية رسمية Super Grok AI باقة $30/شهر، افتح ميزات AI الكاملة على منصة X. بدون مشاركة، بدون تغيير كلمة المرور، آمن تماماً، دعم سريع، سعر ممتاز."
    },
    es: {
      name: "🔥 Actualización Oficial Super Grok $30 – 1 Mes – Funciones AI X Completas",
      shortDescription: "Actualización oficial Super Grok AI paquete $30/1 mes, desbloquea todas las funciones AI en plataforma X. Sin compartir, sin cambio de contraseña, absolutamente seguro, soporte rápido, gran precio."
    },
    fr: {
      name: "🔥 Mise à niveau Super Grok $30 – 1 Mois – Fonctionnalités AI X Complètes",
      shortDescription: "Mise à niveau officielle Super Grok AI package $30/1 mois, déverrouillez toutes les fonctionnalités AI sur la plateforme X. Sans partage, sans changement de mot de passe, absolument sûr, support rapide, excellent prix."
    },
    de: {
      name: "🔥 Upgrade Super Grok $30 – 1 Monat – Volle AI X Funktionen",
      shortDescription: "Super Grok AI offizielles Upgrade $30/1 Monat Paket, schalten Sie alle AI-Funktionen auf der X-Plattform frei. Kein Teilen, keine Passwortänderung, absolut sicher, schneller Support, toller Preis."
    },
    ja: {
      name: "🔥 公式アップグレード Super Grok $30 – 1ヶ月 – 完全AI X機能",
      shortDescription: "Super Grok AI公式アップグレード$30/1ヶ月パッケージ、Xプラットフォームの全AI機能を解放。共有なし、パスワード変更なし、絶対安全、迅速サポート、お得価格。"
    },
    ko: {
      name: "🔥 공식 업그레이드 Super Grok $30 – 1개월 – 완전한 AI X 기능",
      shortDescription: "Super Grok AI 공식 업그레이드 $30/1개월 패키지, X 플랫폼의 모든 AI 기능 잠금 해제. 공유 없음, 비밀번호 변경 없음, 절대 안전, 빠른 지원, 좋은 가격."
    }
  },
  // Tài Khoản Cursor Pro AI Chính Hãng - 1 Năm
  "tai-khoan-cursor-pro-ai-chinh-hang-1-nam": {
    en: {
      name: "Cursor Pro AI Account – Official 1 Year",
      shortDescription: "💎 BEST VALUE – Save 25% with annual plan, premium support and early access"
    },
    ru: {
      name: "Аккаунт Cursor Pro AI – Официальный 1 год",
      shortDescription: "💎 ЛУЧШАЯ ЦЕНА – Экономия 25% с годовым планом, премиум поддержка и ранний доступ"
    },
    zh: {
      name: "Cursor Pro AI账户 – 官方1年",
      shortDescription: "💎 最佳价值 – 年度套餐节省25%，高级支持和抢先体验"
    },
    ar: {
      name: "حساب Cursor Pro AI – رسمي سنة واحدة",
      shortDescription: "💎 أفضل قيمة – وفر 25% مع الخطة السنوية، دعم متميز ووصول مبكر"
    },
    es: {
      name: "Cuenta Cursor Pro AI – Oficial 1 Año",
      shortDescription: "💎 MEJOR VALOR – Ahorra 25% con plan anual, soporte premium y acceso anticipado"
    },
    fr: {
      name: "Compte Cursor Pro AI – 1 An",
      shortDescription: "💎 MEILLEURE VALEUR – Économisez 25% avec le plan annuel, support premium et accès anticipé"
    },
    de: {
      name: "Cursor Pro AI Konto – 1 Jahr",
      shortDescription: "💎 BESTER WERT – Sparen Sie 25% mit dem Jahresplan, Premium-Support und Frühzugang"
    },
    ja: {
      name: "Cursor Pro AIアカウント – 公式1年",
      shortDescription: "💎 最高価値 – 年間プランで25%節約、プレミアムサポートと先行アクセス"
    },
    ko: {
      name: "Cursor Pro AI 계정 – 공식 1년",
      shortDescription: "💎 최고 가치 – 연간 플랜으로 25% 절약, 프리미엄 지원 및 조기 액세스"
    }
  },
  // Tài Khoản Cursor Pro AI Chính Hãng - 3 Tháng
  "tai-khoan-cursor-pro-ai-chinh-hang-3-thang": {
    en: {
      name: "Cursor Pro AI Account – Official 3 Months",
      shortDescription: "⭐ MOST POPULAR – Save 17% with 3-month plan, full features v1.6"
    },
    ru: {
      name: "Аккаунт Cursor Pro AI – Официальный 3 месяца",
      shortDescription: "⭐ САМЫЙ ПОПУЛЯРНЫЙ – Экономия 17% с 3-месячным планом, полный функционал v1.6"
    },
    zh: {
      name: "Cursor Pro AI账户 – 官方3个月",
      shortDescription: "⭐ 最受欢迎 – 3个月套餐节省17%，完整功能v1.6"
    },
    ar: {
      name: "حساب Cursor Pro AI – رسمي 3 أشهر",
      shortDescription: "⭐ الأكثر شعبية – وفر 17% مع خطة 3 أشهر، ميزات كاملة v1.6"
    },
    es: {
      name: "Cuenta Cursor Pro AI – Oficial 3 Meses",
      shortDescription: "⭐ MÁS POPULAR – Ahorra 17% con plan 3 meses, todas las funciones v1.6"
    },
    fr: {
      name: "Compte Cursor Pro AI – 3 Mois",
      shortDescription: "⭐ LE PLUS POPULAIRE – Économisez 17% avec le plan 3 mois, toutes les fonctionnalités v1.6"
    },
    de: {
      name: "Cursor Pro AI Konto – 3 Monate",
      shortDescription: "⭐ AM BELIEBTESTEN – Sparen Sie 17% mit dem 3-Monats-Plan, volle Funktionen v1.6"
    },
    ja: {
      name: "Cursor Pro AIアカウント – 公式3ヶ月",
      shortDescription: "⭐ 最も人気 – 3ヶ月プランで17%節約、全機能v1.6"
    },
    ko: {
      name: "Cursor Pro AI 계정 – 공식 3개월",
      shortDescription: "⭐ 가장 인기 – 3개월 플랜으로 17% 절약, 전체 기능 v1.6"
    }
  },
  // Tài Khoản Cursor Pro AI Chính Hãng - 6 Tháng
  "tai-khoan-cursor-pro-ai-chinh-hang-6-thang": {
    en: {
      name: "Cursor Pro AI Account – Official 6 Months",
      shortDescription: "Long-term plan save 17% – Perfect for large projects and team development"
    },
    ru: {
      name: "Аккаунт Cursor Pro AI – Официальный 6 месяцев",
      shortDescription: "Долгосрочный план экономия 17% – Идеально для крупных проектов и командной разработки"
    },
    zh: {
      name: "Cursor Pro AI账户 – 官方6个月",
      shortDescription: "长期套餐节省17% – 非常适合大型项目和团队开发"
    },
    ar: {
      name: "حساب Cursor Pro AI – رسمي 6 أشهر",
      shortDescription: "خطة طويلة المدى وفر 17% – مثالي للمشاريع الكبيرة وتطوير الفريق"
    },
    es: {
      name: "Cuenta Cursor Pro AI – Oficial 6 Meses",
      shortDescription: "Plan largo plazo ahorra 17% – Perfecto para grandes proyectos y desarrollo en equipo"
    },
    fr: {
      name: "Compte Cursor Pro AI – 6 Mois",
      shortDescription: "Plan longue durée économisez 17% – Parfait pour les grands projets et le développement en équipe"
    },
    de: {
      name: "Cursor Pro AI Konto – 6 Monate",
      shortDescription: "Langzeitplan 17% sparen – Perfekt für große Projekte und Teamentwicklung"
    },
    ja: {
      name: "Cursor Pro AIアカウント – 公式6ヶ月",
      shortDescription: "長期プラン17%節約 – 大規模プロジェクトとチーム開発に最適"
    },
    ko: {
      name: "Cursor Pro AI 계정 – 공식 6개월",
      shortDescription: "장기 플랜 17% 절약 – 대규모 프로젝트 및 팀 개발에 완벽"
    }
  },
  // Tài Khoản Cursor Pro Trial AI Chính Hãng Giá Rẻ - 1 Tháng
  "tai-khoan-cursor-pro-trial-ai-chinh-hang-gia-re-1-thang": {
    en: {
      name: "Cursor Pro Trial AI Account – Official 1 Month",
      shortDescription: "Complete Cursor Pro v1.6 experience with Custom Slash Commands and Agent Planning"
    },
    ru: {
      name: "Пробный аккаунт Cursor Pro AI – Официальный 1 месяц",
      shortDescription: "Полный опыт Cursor Pro v1.6 с Custom Slash Commands и Agent Planning"
    },
    zh: {
      name: "Cursor Pro Trial AI账户 – 官方1个月",
      shortDescription: "完整体验Cursor Pro v1.6，包含自定义斜杠命令和Agent Planning"
    },
    ar: {
      name: "حساب Cursor Pro Trial AI – رسمي شهر واحد",
      shortDescription: "تجربة Cursor Pro v1.6 كاملة مع Custom Slash Commands و Agent Planning"
    },
    es: {
      name: "Cuenta Cursor Pro Trial AI – Oficial 1 Mes",
      shortDescription: "Experiencia completa Cursor Pro v1.6 con Custom Slash Commands y Agent Planning"
    },
    fr: {
      name: "Compte Cursor Pro Trial AI – 1 Mois",
      shortDescription: "Expérience complète Cursor Pro v1.6 avec Custom Slash Commands et Agent Planning"
    },
    de: {
      name: "Cursor Pro Trial AI Konto – 1 Monat",
      shortDescription: "Komplettes Cursor Pro v1.6 Erlebnis mit Custom Slash Commands und Agent Planning"
    },
    ja: {
      name: "Cursor Pro Trial AIアカウント – 公式1ヶ月",
      shortDescription: "Custom Slash CommandsとAgent Planning付きの完全なCursor Pro v1.6体験"
    },
    ko: {
      name: "Cursor Pro Trial AI 계정 – 공식 1개월",
      shortDescription: "Custom Slash Commands 및 Agent Planning이 포함된 완전한 Cursor Pro v1.6 경험"
    }
  },
  // Tài khoản Cursor Pro Trial – 7 Ngày – Dùng Full Tính Năng - Giá Rẻ
  "tai-khoan-cursor-pro-trial-7-ngay-dung-full-tinh-nang-gia-re": {
    en: {
      name: "Cursor Pro Trial Account – 7 Days – Full Features",
      shortDescription: "Cursor Pro 7-day trial account — full Pro features, smooth speed, powerful AI coding support. Perfect for testing before upgrading to official."
    },
    ru: {
      name: "Пробный аккаунт Cursor Pro – 7 дней – Полный функционал",
      shortDescription: "Пробный аккаунт Cursor Pro 7 дней — полный функционал Pro, плавная скорость, мощная поддержка AI-кодирования. Идеально для тестирования перед официальным обновлением."
    },
    zh: {
      name: "Cursor Pro试用账户 – 7天 – 完整功能",
      shortDescription: "Cursor Pro 7天试用账户 — 完整Pro功能，流畅速度，强力AI编码支持。非常适合升级前测试。"
    },
    ar: {
      name: "حساب Cursor Pro تجريبي – 7 أيام – ميزات كاملة",
      shortDescription: "حساب Cursor Pro تجريبي 7 أيام — ميزات Pro كاملة، سرعة سلسة، دعم برمجة AI قوي. مثالي للاختبار قبل الترقية الرسمية."
    },
    es: {
      name: "Cuenta Cursor Pro Trial – 7 Días – Funciones Completas",
      shortDescription: "Cuenta trial Cursor Pro 7 días — todas las funciones Pro, velocidad fluida, potente soporte de codificación IA. Perfecto para probar antes de actualizar a oficial."
    },
    fr: {
      name: "Compte Cursor Pro Trial – 7 Jours – Fonctionnalités Complètes",
      shortDescription: "Compte trial Cursor Pro 7 jours — toutes les fonctionnalités Pro, vitesse fluide, support puissant de codage IA. Parfait pour tester avant de passer à l'officiel."
    },
    de: {
      name: "Cursor Pro Trial Konto – 7 Tage – Alle Funktionen",
      shortDescription: "Cursor Pro 7-Tage-Testkonto — volle Pro-Funktionen, flüssige Geschwindigkeit, leistungsstarke AI-Coding-Unterstützung. Perfekt zum Testen vor dem offiziellen Upgrade."
    },
    ja: {
      name: "Cursor Pro Trialアカウント – 7日間 – 全機能",
      shortDescription: "Cursor Pro 7日間トライアルアカウント — 完全なPro機能、スムーズな速度、強力なAIコーディングサポート。公式アップグレード前のテストに最適。"
    },
    ko: {
      name: "Cursor Pro Trial 계정 – 7일 – 전체 기능",
      shortDescription: "Cursor Pro 7일 체험 계정 — 전체 Pro 기능, 부드러운 속도, 강력한 AI 코딩 지원. 공식 업그레이드 전 테스트에 완벽."
    }
  },
  // Tài khoản Cursor Pro+ AI – Chính Hãng Giá Rẻ 100% 1 tháng
  "tai-khoan-cursor-pro-ai-chinh-hang-gia-re-100-1-thang": {
    en: {
      name: "Cursor Pro+ AI Account – 1 Month",
      shortDescription: "🚀 Code many times faster with premium AI integrated directly in IDE. Cursor Pro+ AI is the highest version of Cursor – new generation IDE with powerful AI coding, perfect for Developers, IT students, Freelancers, Project teams."
    },
    ru: {
      name: "Аккаунт Cursor Pro+ AI – Оригинал 1 месяц",
      shortDescription: "🚀 Кодируйте в разы быстрее с премиум AI интегрированным прямо в IDE. Cursor Pro+ AI – высшая версия Cursor – IDE нового поколения с мощным AI-кодированием, идеально для разработчиков, IT-студентов, фрилансеров, проектных команд."
    },
    zh: {
      name: "Cursor Pro+ AI账户 – 1个月",
      shortDescription: "🚀 使用直接集成在IDE中的高级AI编码速度提升数倍。Cursor Pro+ AI是Cursor的最高版本 – 新一代强力AI编码IDE，非常适合开发者、IT学生、自由职业者、项目团队。"
    },
    ar: {
      name: "حساب Cursor Pro+ AI – شهر واحد",
      shortDescription: "🚀 برمج أسرع بمرات مع AI متميز مدمج مباشرة في IDE. Cursor Pro+ AI هو أعلى إصدار من Cursor – IDE الجيل الجديد مع برمجة AI قوية، مثالي للمطورين، طلاب IT، المستقلين، فرق المشاريع."
    },
    es: {
      name: "Cuenta Cursor Pro+ AI – 1 Mes",
      shortDescription: "🚀 Codifica mucho más rápido con IA premium integrada directamente en el IDE. Cursor Pro+ AI es la versión más alta de Cursor – IDE de nueva generación con potente codificación IA, perfecto para desarrolladores, estudiantes IT, freelancers, equipos de proyecto."
    },
    fr: {
      name: "Compte Cursor Pro+ AI – 1 Mois",
      shortDescription: "🚀 Codez beaucoup plus vite avec l'IA premium intégrée directement dans l'IDE. Cursor Pro+ AI est la version la plus élevée de Cursor – IDE nouvelle génération avec codage IA puissant, parfait pour les développeurs, étudiants IT, freelancers, équipes projet."
    },
    de: {
      name: "Cursor Pro+ AI Konto – Original 1 Monat",
      shortDescription: "🚀 Programmieren Sie viel schneller mit Premium-AI direkt in der IDE integriert. Cursor Pro+ AI ist die höchste Version von Cursor – IDE der neuen Generation mit leistungsstarkem AI-Coding, perfekt für Entwickler, IT-Studenten, Freelancer, Projektteams."
    },
    ja: {
      name: "Cursor Pro+ AIアカウント – 1ヶ月",
      shortDescription: "🚀 IDEに直接統合されたプレミアムAIで何倍も速くコーディング。Cursor Pro+ AIはCursorの最高バージョン – 強力なAIコーディングを備えた次世代IDE、開発者・IT学生・フリーランサー・プロジェクトチームに最適。"
    },
    ko: {
      name: "Cursor Pro+ AI 계정 – 1개월",
      shortDescription: "🚀 IDE에 직접 통합된 프리미엄 AI로 훨씬 빠르게 코딩. Cursor Pro+ AI는 Cursor의 최고 버전 – 강력한 AI 코딩을 갖춘 차세대 IDE, 개발자, IT 학생, 프리랜서, 프로젝트 팀에 완벽."
    }
  },
  // Tài khoản Cursor Ultra chính hãng – Full quyền AI, tăng tốc code gấp 20 lần
  "tai-khoan-cursor-ultra-chinh-hang-full-quyen-ai-tang-toc-code-gap-20-lan": {
    en: {
      name: "Cursor Ultra Account – Full AI Access, 20x Coding Speed",
      shortDescription: "Cursor Ultra package for developers needing maximum AI performance: full access to all AI models (OpenAI, Claude, Gemini), very high usage limits, priority new features – code faster, smarter, work more efficiently every day."
    },
    ru: {
      name: "Аккаунт Cursor Ultra – Оригинал – Полный доступ AI, скорость кодирования x20",
      shortDescription: "Оригинальный пакет Cursor Ultra для разработчиков, которым нужна максимальная производительность AI: полный доступ ко всем моделям AI (OpenAI, Claude, Gemini), очень высокие лимиты использования, приоритет новых функций – кодируйте быстрее, умнее, работайте эффективнее каждый день."
    },
    zh: {
      name: "Cursor Ultra账户 – 完整AI权限，编码速度提升20倍",
      shortDescription: "Cursor Ultra套餐，专为需要最大AI性能的开发者：完整访问所有AI模型（OpenAI、Claude、Gemini），极高使用限制，优先新功能 – 每天更快、更智能地编码，更高效地工作。"
    },
    ar: {
      name: "حساب Cursor Ultra – وصول AI كامل، سرعة برمجة 20 ضعف",
      shortDescription: "باقة Cursor Ultra ة للمطورين الذين يحتاجون أقصى أداء AI: وصول كامل لجميع نماذج AI (OpenAI, Claude, Gemini)، حدود استخدام عالية جداً، أولوية الميزات الجديدة – برمج أسرع، أذكى، اعمل بكفاءة أكبر كل يوم."
    },
    es: {
      name: "Cuenta Cursor Ultra – Acceso IA Completo, Velocidad de Codificación 20x",
      shortDescription: "Paquete Cursor Ultra genuino para desarrolladores que necesitan máximo rendimiento IA: acceso completo a todos los modelos IA (OpenAI, Claude, Gemini), límites de uso muy altos, prioridad nuevas funciones – codifica más rápido, más inteligente, trabaja más eficientemente cada día."
    },
    fr: {
      name: "Compte Cursor Ultra – Accès IA Complet, Codage 20x Plus Rapide",
      shortDescription: "Package Cursor Ultra authentique pour les développeurs nécessitant des performances IA maximales: accès complet à tous les modèles IA (OpenAI, Claude, Gemini), limites d'utilisation très élevées, priorité sur les nouvelles fonctionnalités – codez plus vite, plus intelligemment, travaillez plus efficacement chaque jour."
    },
    de: {
      name: "Cursor Ultra Konto – Original – Voller AI-Zugang, 20x Coding-Geschwindigkeit",
      shortDescription: "Originales Cursor Ultra Paket für Entwickler, die maximale AI-Leistung benötigen: voller Zugang zu allen AI-Modellen (OpenAI, Claude, Gemini), sehr hohe Nutzungslimits, Priorität bei neuen Funktionen – programmieren Sie schneller, intelligenter, arbeiten Sie jeden Tag effizienter."
    },
    ja: {
      name: "Cursor Ultraアカウント – 完全AI権限、20倍コーディング速度",
      shortDescription: "最大限のAI性能を必要とする開発者向けの正規Cursor Ultraパッケージ：すべてのAIモデル（OpenAI、Claude、Gemini）への完全アクセス、非常に高い使用制限、新機能の優先権 – より速く、よりスマートにコーディング、毎日より効率的に作業。"
    },
    ko: {
      name: "Cursor Ultra 계정 – 완전한 AI 액세스, 20배 코딩 속도",
      shortDescription: "최대 AI 성능이 필요한 개발자를 위한 Cursor Ultra 패키지: 모든 AI 모델(OpenAI, Claude, Gemini)에 완전한 액세스, 매우 높은 사용 한도, 새 기능 우선권 – 매일 더 빠르고 스마트하게 코딩, 더 효율적으로 작업."
    }
  },
  // Tài khoản GitHub Copilot Pro 1 năm Bảo hành 1 tháng
  "tai-khoan-github-copilot-pro-1-nam-bao-hanh-1-thang": {
    en: {
      name: "GitHub Copilot Pro Account – 1 Year – 1 Month Warranty",
      shortDescription: "GitHub Copilot Pro 1 year account – powerful AI programming assistant helping you code faster, smarter on all IDEs like VS Code, JetBrains, Neovim…"
    },
    ru: {
      name: "Аккаунт GitHub Copilot Pro – 1 год – Гарантия 1 месяц",
      shortDescription: "Аккаунт GitHub Copilot Pro 1 год – мощный AI-помощник программиста, помогающий кодировать быстрее и умнее во всех IDE: VS Code, JetBrains, Neovim…"
    },
    zh: {
      name: "GitHub Copilot Pro账户 – 1年 – 保修1个月",
      shortDescription: "GitHub Copilot Pro 1年账户 – 强力AI编程助手，帮助您在所有IDE上更快、更智能地编码，如VS Code、JetBrains、Neovim…"
    },
    ar: {
      name: "حساب GitHub Copilot Pro – سنة واحدة – ضمان شهر",
      shortDescription: "حساب GitHub Copilot Pro سنة واحدة – مساعد برمجة AI قوي يساعدك على البرمجة أسرع وأذكى على جميع IDEs مثل VS Code, JetBrains, Neovim…"
    },
    es: {
      name: "Cuenta GitHub Copilot Pro – 1 Año – Garantía 1 Mes",
      shortDescription: "Cuenta GitHub Copilot Pro 1 año – potente asistente de programación IA que te ayuda a codificar más rápido, más inteligente en todos los IDEs como VS Code, JetBrains, Neovim…"
    },
    fr: {
      name: "Compte GitHub Copilot Pro – 1 An – Garantie 1 Mois",
      shortDescription: "Compte GitHub Copilot Pro 1 an – assistant de programmation IA puissant vous aidant à coder plus vite, plus intelligemment sur tous les IDEs comme VS Code, JetBrains, Neovim…"
    },
    de: {
      name: "GitHub Copilot Pro Konto – 1 Jahr – 1 Monat Garantie",
      shortDescription: "GitHub Copilot Pro 1-Jahres-Konto – leistungsstarker AI-Programmierassistent, der Ihnen hilft, schneller und intelligenter in allen IDEs wie VS Code, JetBrains, Neovim zu programmieren…"
    },
    ja: {
      name: "GitHub Copilot Proアカウント – 1年 – 1ヶ月保証",
      shortDescription: "GitHub Copilot Pro 1年アカウント – VS Code、JetBrains、NeovimなどすべてのIDEでより速く、よりスマートにコーディングできる強力なAIプログラミングアシスタント。"
    },
    ko: {
      name: "GitHub Copilot Pro 계정 – 1년 – 1개월 보증",
      shortDescription: "GitHub Copilot Pro 1년 계정 – VS Code, JetBrains, Neovim 등 모든 IDE에서 더 빠르고 스마트하게 코딩하는 강력한 AI 프로그래밍 어시스턴트."
    }
  },
  // Tài khoản figma pro edu 12 tháng
  "tai-khoan-figma-pro-edu-12-thang": {
    en: {
      name: "Figma Pro Edu Account – 12 Months",
      shortDescription: "Figma Pro 1 year account – unlock all professional design features, efficient team collaboration, unlimited storage and create in-depth projects like a real designer."
    },
    ru: {
      name: "Аккаунт Figma Pro Edu – 12 месяцев",
      shortDescription: "Аккаунт Figma Pro 1 год – разблокируйте все профессиональные функции дизайна, эффективная командная работа, неограниченное хранилище и создавайте глубокие проекты как настоящий дизайнер."
    },
    zh: {
      name: "Figma Pro Edu账户 – 12个月",
      shortDescription: "Figma Pro 1年账户 – 解锁所有专业设计功能，高效团队协作，无限存储，像真正的设计师一样创建深度项目。"
    },
    ar: {
      name: "حساب Figma Pro Edu – 12 شهر",
      shortDescription: "حساب Figma Pro سنة واحدة – افتح جميع ميزات التصميم الاحترافي، تعاون فريق فعال، تخزين غير محدود وإنشاء مشاريع عميقة مثل مصمم حقيقي."
    },
    es: {
      name: "Cuenta Figma Pro Edu – 12 Meses",
      shortDescription: "Cuenta Figma Pro 1 año – desbloquea todas las funciones de diseño profesional, colaboración eficiente en equipo, almacenamiento ilimitado y crea proyectos profundos como un diseñador real."
    },
    fr: {
      name: "Compte Figma Pro Edu – 12 Mois",
      shortDescription: "Compte Figma Pro 1 an – déverrouillez toutes les fonctionnalités de design professionnel, collaboration d'équipe efficace, stockage illimité et créez des projets approfondis comme un vrai designer."
    },
    de: {
      name: "Figma Pro Edu Konto – 12 Monate",
      shortDescription: "Figma Pro 1-Jahres-Konto – schalten Sie alle professionellen Design-Funktionen frei, effiziente Teamzusammenarbeit, unbegrenzter Speicher und erstellen Sie tiefgehende Projekte wie ein echter Designer."
    },
    ja: {
      name: "Figma Pro Eduアカウント – 12ヶ月",
      shortDescription: "Figma Pro 1年アカウント – すべてのプロフェッショナルデザイン機能を解放、効率的なチームコラボレーション、無制限ストレージ、本物のデザイナーのように深いプロジェクトを作成。"
    },
    ko: {
      name: "Figma Pro Edu 계정 – 12개월",
      shortDescription: "Figma Pro 1년 계정 – 모든 전문 디자인 기능 잠금 해제, 효율적인 팀 협업, 무제한 저장소, 진정한 디자이너처럼 심층적인 프로젝트 생성."
    }
  },
  // 🔥 Nâng Cấp Chính Chủ Claude Pro 1 Tháng – Full Model, Bảo Hành Trọn Gói
  "-nang-cap-chinh-chu-claude-pro-1-thang-full-model-bao-hanh-tron-goi": {
    en: {
      name: "🔥 Official Upgrade Claude Pro 1 Month – Full Model, Full Warranty",
      shortDescription: "Claude Pro official upgrade 1 month, full features, full Claude 4.5 Sonnet model, long text processing, powerful coding. Original price 200k – shop supports upgrade only 299k, full warranty."
    },
    ru: {
      name: "🔥 Официальное обновление Claude Pro 1 месяц – Полная модель, Полная гарантия",
      shortDescription: "Официальное обновление Claude Pro 1 месяц, полный функционал, полная модель Claude 4.5 Sonnet, обработка длинных текстов, мощное кодирование. Оригинальная цена 200к – магазин поддерживает обновление всего за 299к, полная гарантия."
    },
    zh: {
      name: "🔥 官方升级 Claude Pro 1个月 – 完整模型，全程保修",
      shortDescription: "Claude Pro官方升级1个月，完整功能，完整Claude 4.5 Sonnet模型，长文本处理，强力编码。原价200k – 店铺支持升级仅299k，全程保修。"
    },
    ar: {
      name: "🔥 ترقية رسمية Claude Pro شهر واحد – نموذج كامل، ضمان كامل",
      shortDescription: "ترقية رسمية Claude Pro شهر واحد، ميزات كاملة، نموذج Claude 4.5 Sonnet كامل، معالجة نصوص طويلة، برمجة قوية. السعر ال 200k – المتجر يدعم الترقية بـ 299k فقط، ضمان كامل."
    },
    es: {
      name: "🔥 Actualización Oficial Claude Pro 1 Mes – Modelo Completo, Garantía Completa",
      shortDescription: "Actualización oficial Claude Pro 1 mes, todas las funciones, modelo Claude 4.5 Sonnet completo, procesamiento de texto largo, codificación potente. Precio original 200k – tienda soporta actualización por solo 299k, garantía completa."
    },
    fr: {
      name: "🔥 Mise à niveau Claude Pro 1 Mois – Modèle Complet, Garantie Complète",
      shortDescription: "Mise à niveau officielle Claude Pro 1 mois, toutes les fonctionnalités, modèle Claude 4.5 Sonnet complet, traitement de longs textes, codage puissant. Prix original 200k – la boutique supporte la mise à niveau pour seulement 299k, garantie complète."
    },
    de: {
      name: "🔥 Upgrade Claude Pro 1 Monat – Volles Modell, Volle Garantie",
      shortDescription: "Claude Pro Upgrade 1 Monat, volle Funktionen, volles Claude 4.5 Sonnet Modell, Langtext-Verarbeitung, leistungsstarkes Coding. Originalpreis 200k – Shop unterstützt Upgrade für nur 299k, volle Garantie."
    },
    ja: {
      name: "🔥 公式アップグレード Claude Pro 1ヶ月 – 完全モデル、完全保証",
      shortDescription: "Claude Pro公式アップグレード1ヶ月、全機能、完全なClaude 4.5 Sonnetモデル、長文処理、強力なコーディング。元価格200k – ショップは299kでのみアップグレードをサポート、完全保証。"
    },
    ko: {
      name: "🔥 공식 업그레이드 Claude Pro 1개월 – 전체 모델, 전체 보증",
      shortDescription: "Claude Pro 공식 업그레이드 1개월, 전체 기능, 전체 Claude 4.5 Sonnet 모델, 긴 텍스트 처리, 강력한 코딩. 원래 가격 200k – 샵은 299k만으로 업그레이드 지원, 전체 보증."
    }
  },
  // 🔥 Nâng Cấp Chính Chủ Figma Pro 1 Tháng – Full Tính Năng, Bảo Hành Trọn Gói
  "-nang-cap-chinh-chu-figma-pro-1-thang-full-tinh-nang-bao-hanh-tron-goi": {
    en: {
      name: "🔥 Official Upgrade Figma Pro 1 Month – Full Features, Full Warranty",
      shortDescription: "Figma Pro official upgrade 1 month, unlock all teamwork features, version history, Dev Mode. Perfect for designers, students, project teams. Full usage time warranty."
    },
    ru: {
      name: "🔥 Официальное обновление Figma Pro 1 месяц – Полный функционал, Полная гарантия",
      shortDescription: "Официальное обновление Figma Pro 1 месяц, разблокируйте все функции командной работы, историю версий, Dev Mode. Идеально для дизайнеров, студентов, проектных команд. Полная гарантия времени использования."
    },
    zh: {
      name: "🔥 官方升级 Figma Pro 1个月 – 完整功能，全程保修",
      shortDescription: "Figma Pro官方升级1个月，解锁所有团队协作功能，版本历史，Dev Mode。非常适合设计师、学生、项目团队。全程使用时间保修。"
    },
    ar: {
      name: "🔥 ترقية رسمية Figma Pro شهر واحد – ميزات كاملة، ضمان كامل",
      shortDescription: "ترقية رسمية Figma Pro شهر واحد، افتح جميع ميزات العمل الجماعي، سجل الإصدارات، Dev Mode. مثالي للمصممين، الطلاب، فرق المشاريع. ضمان وقت الاستخدام الكامل."
    },
    es: {
      name: "🔥 Actualización Oficial Figma Pro 1 Mes – Funciones Completas, Garantía Completa",
      shortDescription: "Actualización oficial Figma Pro 1 mes, desbloquea todas las funciones de trabajo en equipo, historial de versiones, Dev Mode. Perfecto para diseñadores, estudiantes, equipos de proyecto. Garantía completa de tiempo de uso."
    },
    fr: {
      name: "🔥 Mise à niveau Figma Pro 1 Mois – Fonctionnalités Complètes, Garantie Complète",
      shortDescription: "Mise à niveau officielle Figma Pro 1 mois, déverrouillez toutes les fonctionnalités de travail d'équipe, historique des versions, Dev Mode. Parfait pour les designers, étudiants, équipes projet. Garantie complète du temps d'utilisation."
    },
    de: {
      name: "🔥 Upgrade Figma Pro 1 Monat – Alle Funktionen, Volle Garantie",
      shortDescription: "Figma Pro Upgrade 1 Monat, schalten Sie alle Teamwork-Funktionen frei, Versionshistorie, Dev Mode. Perfekt für Designer, Studenten, Projektteams. Volle Nutzungszeit-Garantie."
    },
    ja: {
      name: "🔥 公式アップグレード Figma Pro 1ヶ月 – 全機能、完全保証",
      shortDescription: "Figma Pro公式アップグレード1ヶ月、すべてのチームワーク機能、バージョン履歴、Dev Modeを解放。デザイナー、学生、プロジェクトチームに最適。全使用期間保証。"
    },
    ko: {
      name: "🔥 공식 업그레이드 Figma Pro 1개월 – 전체 기능, 전체 보증",
      shortDescription: "Figma Pro 공식 업그레이드 1개월, 모든 팀워크 기능, 버전 기록, Dev Mode 잠금 해제. 디자이너, 학생, 프로젝트 팀에 완벽. 전체 사용 시간 보증."
    }
  }
};

// legacy english-only translations for backwards compatibility
const LEGACY_PRODUCT_TRANSLATIONS: Record<string, ProductTranslation> = {
  "tai-khoan-cursor-pro-plus-ai": {
    name: "Cursor Pro+ AI Subscription",
    shortDescription: `Cursor Pro subscription resold by ${SEO_CONFIG.name} (independent reseller; not affiliated with Anysphere, Inc.).`
  },
  "tai-khoan-github-copilot-pro-2-nam": {
    name: "GitHub Copilot Pro Account - 2 Years",
    shortDescription: "GitHub Copilot Pro subscription for 2 years."
  },
  "tai-khoan-jetbrains": {
    name: "JetBrains Account",
    shortDescription: "Full JetBrains suite account."
  },
  "tai-khoan-figma-pro-1-nam": {
    name: "Figma Pro Account - 1 Year",
    shortDescription: "Professional Figma account for 1 year."
  },
  "cursor-pro-plan-20-ai": {
    name: "Cursor Pro Plan $20 AI",
    shortDescription: "Cursor Pro AI plan valued at $20."
  },
   "tai-khoan-github-copilot-pro-1-nam": {
    name: "GitHub Copilot Pro Account - 1 Year",
    shortDescription: "GitHub Copilot Pro subscription for 1 year."
   },
   "cursor-pro-1m": {
     name: "Cursor Pro 1 Month",
     shortDescription: "Perfect for quick trial (1 Month)."
   },
   "cursor-pro-3m": {
     name: "Cursor Pro 3 Months",
     shortDescription: "Most popular choice (3 Months)."
   },
   "cursor-pro-6m": {
     name: "Cursor Pro 6 Months",
     shortDescription: "Best value for long term (6 Months)."
   },
   "cursor-pro-12m": {
     name: "Cursor Pro 12 Months",
     shortDescription: "Maximum savings (12 Months)."
    },
    "Tài khoản GitHub Copilot Pro 2 năm": {
      name: "GitHub Copilot Pro Account - 2 Years",
      shortDescription: "Long-term GitHub Copilot Pro subscription (2 years)."
    },
    "Tài khoản figma pro 1 năm": {
      name: "Figma Pro Account - 1 Year",
      shortDescription: "Professional Figma design account for 1 year."
    },
    "Tài khoản JetBrains": {
      name: "JetBrains Account",
      shortDescription: "All Products Pack or single IDE license."
    },
    "Tài khoản ChatGPT Plus": {
       name: "ChatGPT Plus Account",
       shortDescription: "Unlock GPT-4 and faster response speeds."
  }
};

export const formatPrice = (price: number, locale: string) => {
  if (locale === 'vi') {
    return price.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    });
  }
  // Mọi locale khác: hợp nhất hiển thị USD theo format en-US đồng nhất ($4.13).
  const usdPrice = price / EXCHANGE_RATE;
  return usdPrice.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// helper function to translate product name with phrase replacements (fallback)
const translateProductName = (name: string, locale: string): string => {
  let translated = name;
  
  if (locale === 'en') {
    // longer phrases first
    translated = translated.replace(/Nâng Cấp Chính Chủ/gi, "");
    translated = translated.replace(/Full quyền AI/gi, "Full AI Access");
    translated = translated.replace(/tăng tốc code gấp (\d+) lần/gi, "$1x Coding Speed");
    translated = translated.replace(/tăng tốc code/gi, "boost coding speed");
    translated = translated.replace(/Dùng full tính năng/gi, "Full Features");
    translated = translated.replace(/Full tính năng/gi, "Full Features");
    translated = translated.replace(/Full quyền/gi, "Full Access");
    translated = translated.replace(/Bảo Hành Trọn Gói/gi, "Full Warranty");
    translated = translated.replace(/Bảo hành trọn gói/gi, "Full Warranty");
    translated = translated.replace(/Dùng chung/gi, "Shared");
    translated = translated.replace(/Chính hãng/gi, "");
    translated = translated.replace(/Tài Khoản/gi, "Account");
    translated = translated.replace(/Tài khoản/gi, "Account");
    translated = translated.replace(/Giá Rẻ/gi, "Affordable");
    translated = translated.replace(/Giá rẻ/gi, "Affordable");
    translated = translated.replace(/Cấp Tài Khoản/gi, "Account Issue");
    translated = translated.replace(/Cấp tài khoản/gi, "Account Issue");
    translated = translated.replace(/Tốc Độ Cao/gi, "High Speed");
    translated = translated.replace(/Tốc độ cao/gi, "High Speed");
    translated = translated.replace(/Uy Tín/gi, "Trusted");
    translated = translated.replace(/Uy tín/gi, "Trusted");
    translated = translated.replace(/Bảo Hành/gi, "Warranty");
    translated = translated.replace(/Bảo hành/gi, "Warranty");
    translated = translated.replace(/Ko giới hạn/gi, "Unlimited");
    translated = translated.replace(/Không Giới Hạn/gi, "Unlimited");
    translated = translated.replace(/Không giới hạn/gi, "Unlimited");
    translated = translated.replace(/Full Model/gi, "Full Model");
    translated = translated.replace(/Dùng/gi, "Use");
    translated = translated.replace(/(\d+)\s*Tháng/gi, "$1 Month");
    translated = translated.replace(/(\d+)\s*tháng/gi, "$1 Month");
    translated = translated.replace(/(\d+)\s*Năm/gi, "$1 Year");
    translated = translated.replace(/(\d+)\s*năm/gi, "$1 Year");
    translated = translated.replace(/(\d+)\s*Ngày/gi, "$1 Days");
    translated = translated.replace(/(\d+)\s*ngày/gi, "$1 Days");
  } else if (locale === 'ru') {
    // longer phrases first
    translated = translated.replace(/Nâng Cấp Chính Chủ/gi, "");
    translated = translated.replace(/Full quyền AI/gi, "Полный доступ AI");
    translated = translated.replace(/tăng tốc code gấp (\d+) lần/gi, "ускорение кодирования x$1");
    translated = translated.replace(/tăng tốc code/gi, "ускорение кодирования");
    translated = translated.replace(/Dùng full tính năng/gi, "Полный функционал");
    translated = translated.replace(/Full tính năng/gi, "Полный функционал");
    translated = translated.replace(/Full Tính Năng/gi, "Полный функционал");
    translated = translated.replace(/Full quyền/gi, "Полный доступ");
    translated = translated.replace(/Bảo Hành Trọn Gói/gi, "Полная гарантия");
    translated = translated.replace(/Bảo hành trọn gói/gi, "Полная гарантия");
    translated = translated.replace(/Dùng Chung/gi, "Общий");
    translated = translated.replace(/Dùng chung/gi, "Общий");
    translated = translated.replace(/Chính Hãng/gi, "");
    translated = translated.replace(/chính hãng/gi, "");
    translated = translated.replace(/Tài Khoản/gi, "Аккаунт");
    translated = translated.replace(/Tài khoản/gi, "Аккаунт");
    translated = translated.replace(/Cấp Tài Khoản/gi, "Выдача аккаунта");
    translated = translated.replace(/Cấp tài khoản/gi, "Выдача аккаунта");
    translated = translated.replace(/Giá Rẻ/gi, "Выгодно");
    translated = translated.replace(/Giá rẻ/gi, "Выгодно");
    translated = translated.replace(/Tốc Độ Cao/gi, "Высокая скорость");
    translated = translated.replace(/Tốc độ cao/gi, "Высокая скорость");
    translated = translated.replace(/Uy Tín/gi, "Надёжно");
    translated = translated.replace(/Uy tín/gi, "Надёжно");
    translated = translated.replace(/Bảo Hành/gi, "Гарантия");
    translated = translated.replace(/Bảo hành/gi, "Гарантия");
    translated = translated.replace(/Ko giới hạn/gi, "Безлимит");
    translated = translated.replace(/Không Giới Hạn/gi, "Безлимит");
    translated = translated.replace(/Không giới hạn/gi, "Безлимит");
    translated = translated.replace(/Full Model/gi, "Полная модель");
    translated = translated.replace(/Trial/gi, "Пробный");
    translated = translated.replace(/Account/gi, "Аккаунт");
    translated = translated.replace(/(\d+)\s*Tháng/gi, "$1 мес.");
    translated = translated.replace(/(\d+)\s*tháng/gi, "$1 мес.");
    translated = translated.replace(/(\d+)\s*Năm/gi, "$1 год");
    translated = translated.replace(/(\d+)\s*năm/gi, "$1 год");
    translated = translated.replace(/(\d+)\s*Ngày/gi, "$1 дней");
    translated = translated.replace(/(\d+)\s*ngày/gi, "$1 дней");
    translated = translated.replace(/(\d+)\s*Month/gi, "$1 мес.");
    translated = translated.replace(/(\d+)\s*Year/gi, "$1 год");
    translated = translated.replace(/(\d+)\s*Days/gi, "$1 дней");
  } else if (locale === 'zh') {
    // longer phrases first
    translated = translated.replace(/Nâng Cấp Chính Chủ/gi, "");
    translated = translated.replace(/Full quyền AI/gi, "完整AI权限");
    translated = translated.replace(/tăng tốc code gấp (\d+) lần/gi, "编码速度提升$1倍");
    translated = translated.replace(/tăng tốc code/gi, "加速编码");
    translated = translated.replace(/Dùng full tính năng/gi, "完整功能");
    translated = translated.replace(/Full tính năng/gi, "完整功能");
    translated = translated.replace(/Full Tính Năng/gi, "完整功能");
    translated = translated.replace(/Full quyền/gi, "完整权限");
    translated = translated.replace(/Bảo Hành Trọn Gói/gi, "全程保修");
    translated = translated.replace(/Bảo hành trọn gói/gi, "全程保修");
    translated = translated.replace(/Dùng Chung/gi, "共享");
    translated = translated.replace(/Dùng chung/gi, "共享");
    translated = translated.replace(/Chính Hãng/gi, "");
    translated = translated.replace(/chính hãng/gi, "");
    translated = translated.replace(/Tài Khoản/gi, "账户");
    translated = translated.replace(/Tài khoản/gi, "账户");
    translated = translated.replace(/Cấp Tài Khoản/gi, "账户发放");
    translated = translated.replace(/Cấp tài khoản/gi, "账户发放");
    translated = translated.replace(/Giá Rẻ/gi, "实惠");
    translated = translated.replace(/Giá rẻ/gi, "实惠");
    translated = translated.replace(/Tốc Độ Cao/gi, "高速");
    translated = translated.replace(/Tốc độ cao/gi, "高速");
    translated = translated.replace(/Uy Tín/gi, "可靠");
    translated = translated.replace(/Uy tín/gi, "可靠");
    translated = translated.replace(/Bảo Hành/gi, "保修");
    translated = translated.replace(/Bảo hành/gi, "保修");
    translated = translated.replace(/Ko giới hạn/gi, "无限");
    translated = translated.replace(/Không Giới Hạn/gi, "无限");
    translated = translated.replace(/Không giới hạn/gi, "无限");
    translated = translated.replace(/Full Model/gi, "完整模型");
    translated = translated.replace(/Trial/gi, "试用");
    translated = translated.replace(/Account/gi, "账户");
    translated = translated.replace(/(\d+)\s*Tháng/gi, "$1个月");
    translated = translated.replace(/(\d+)\s*tháng/gi, "$1个月");
    translated = translated.replace(/(\d+)\s*Năm/gi, "$1年");
    translated = translated.replace(/(\d+)\s*năm/gi, "$1年");
    translated = translated.replace(/(\d+)\s*Ngày/gi, "$1天");
    translated = translated.replace(/(\d+)\s*ngày/gi, "$1天");
    translated = translated.replace(/(\d+)\s*Month/gi, "$1个月");
    translated = translated.replace(/(\d+)\s*Year/gi, "$1年");
    translated = translated.replace(/(\d+)\s*Days/gi, "$1天");
  } else if (locale === 'ar') {
    // longer phrases first
    translated = translated.replace(/Nâng Cấp Chính Chủ/gi, "");
    translated = translated.replace(/Full quyền AI/gi, "وصول كامل للذكاء الاصطناعي");
    translated = translated.replace(/tăng tốc code gấp (\d+) lần/gi, "تسريع البرمجة x$1");
    translated = translated.replace(/tăng tốc code/gi, "تسريع البرمجة");
    translated = translated.replace(/Dùng full tính năng/gi, "كل الميزات");
    translated = translated.replace(/Full tính năng/gi, "كل الميزات");
    translated = translated.replace(/Full Tính Năng/gi, "كل الميزات");
    translated = translated.replace(/Full quyền/gi, "وصول كامل");
    translated = translated.replace(/Bảo Hành Trọn Gói/gi, "ضمان شامل");
    translated = translated.replace(/Bảo hành trọn gói/gi, "ضمان شامل");
    translated = translated.replace(/Dùng Chung/gi, "مشترك");
    translated = translated.replace(/Dùng chung/gi, "مشترك");
    translated = translated.replace(/Chính Hãng/gi, "");
    translated = translated.replace(/chính hãng/gi, "");
    translated = translated.replace(/Tài Khoản/gi, "حساب");
    translated = translated.replace(/Tài khoản/gi, "حساب");
    translated = translated.replace(/Cấp Tài Khoản/gi, "إصدار الحساب");
    translated = translated.replace(/Cấp tài khoản/gi, "إصدار الحساب");
    translated = translated.replace(/Giá Rẻ/gi, "سعر مناسب");
    translated = translated.replace(/Giá rẻ/gi, "سعر مناسب");
    translated = translated.replace(/Tốc Độ Cao/gi, "سرعة عالية");
    translated = translated.replace(/Tốc độ cao/gi, "سرعة عالية");
    translated = translated.replace(/Uy Tín/gi, "موثوق");
    translated = translated.replace(/Uy tín/gi, "موثوق");
    translated = translated.replace(/Bảo Hành/gi, "ضمان");
    translated = translated.replace(/Bảo hành/gi, "ضمان");
    translated = translated.replace(/Ko giới hạn/gi, "غير محدود");
    translated = translated.replace(/Không Giới Hạn/gi, "غير محدود");
    translated = translated.replace(/Không giới hạn/gi, "غير محدود");
    translated = translated.replace(/Full Model/gi, "نموذج كامل");
    translated = translated.replace(/Trial/gi, "تجريبي");
    translated = translated.replace(/Account/gi, "حساب");
    translated = translated.replace(/(\d+)\s*Tháng/gi, "$1 شهر");
    translated = translated.replace(/(\d+)\s*tháng/gi, "$1 شهر");
    translated = translated.replace(/(\d+)\s*Năm/gi, "$1 سنة");
    translated = translated.replace(/(\d+)\s*năm/gi, "$1 سنة");
    translated = translated.replace(/(\d+)\s*Ngày/gi, "$1 يوم");
    translated = translated.replace(/(\d+)\s*ngày/gi, "$1 يوم");
    translated = translated.replace(/(\d+)\s*Month/gi, "$1 شهر");
    translated = translated.replace(/(\d+)\s*Year/gi, "$1 سنة");
    translated = translated.replace(/(\d+)\s*Days/gi, "$1 يوم");
  } else if (locale === 'es') {
    // longer phrases first
    translated = translated.replace(/Nâng Cấp Chính Chủ/gi, "");
    translated = translated.replace(/Full quyền AI/gi, "Acceso Completo IA");
    translated = translated.replace(/tăng tốc code gấp (\d+) lần/gi, "velocidad de código x$1");
    translated = translated.replace(/tăng tốc code/gi, "acelerar codificación");
    translated = translated.replace(/Dùng full tính năng/gi, "Todas las Funciones");
    translated = translated.replace(/Full tính năng/gi, "Todas las Funciones");
    translated = translated.replace(/Full Tính Năng/gi, "Todas las Funciones");
    translated = translated.replace(/Full quyền/gi, "Acceso Completo");
    translated = translated.replace(/Bảo Hành Trọn Gói/gi, "Garantía Completa");
    translated = translated.replace(/Bảo hành trọn gói/gi, "Garantía Completa");
    translated = translated.replace(/Dùng Chung/gi, "Compartido");
    translated = translated.replace(/Dùng chung/gi, "Compartido");
    translated = translated.replace(/Chính Hãng/gi, "");
    translated = translated.replace(/chính hãng/gi, "");
    translated = translated.replace(/Tài Khoản/gi, "Cuenta");
    translated = translated.replace(/Tài khoản/gi, "Cuenta");
    translated = translated.replace(/Cấp Tài Khoản/gi, "Emisión de Cuenta");
    translated = translated.replace(/Cấp tài khoản/gi, "Emisión de Cuenta");
    translated = translated.replace(/Giá Rẻ/gi, "Asequible");
    translated = translated.replace(/Giá rẻ/gi, "Asequible");
    translated = translated.replace(/Tốc Độ Cao/gi, "Alta Velocidad");
    translated = translated.replace(/Tốc độ cao/gi, "Alta Velocidad");
    translated = translated.replace(/Uy Tín/gi, "Confiable");
    translated = translated.replace(/Uy tín/gi, "Confiable");
    translated = translated.replace(/Bảo Hành/gi, "Garantía");
    translated = translated.replace(/Bảo hành/gi, "Garantía");
    translated = translated.replace(/Ko giới hạn/gi, "Ilimitado");
    translated = translated.replace(/Không Giới Hạn/gi, "Ilimitado");
    translated = translated.replace(/Không giới hạn/gi, "Ilimitado");
    translated = translated.replace(/Full Model/gi, "Modelo Completo");
    translated = translated.replace(/Trial/gi, "Prueba");
    translated = translated.replace(/Account/gi, "Cuenta");
    translated = translated.replace(/(\d+)\s*Tháng/gi, "$1 Mes");
    translated = translated.replace(/(\d+)\s*tháng/gi, "$1 Mes");
    translated = translated.replace(/(\d+)\s*Năm/gi, "$1 Año");
    translated = translated.replace(/(\d+)\s*năm/gi, "$1 Año");
    translated = translated.replace(/(\d+)\s*Ngày/gi, "$1 Días");
    translated = translated.replace(/(\d+)\s*ngày/gi, "$1 Días");
    translated = translated.replace(/(\d+)\s*Month/gi, "$1 Mes");
    translated = translated.replace(/(\d+)\s*Year/gi, "$1 Año");
    translated = translated.replace(/(\d+)\s*Days/gi, "$1 Días");
  } else if (locale === 'de') {
    // german phrases
    translated = translated.replace(/Nâng Cấp Chính Chủ/gi, "");
    translated = translated.replace(/Full quyền AI/gi, "Voller AI-Zugang");
    translated = translated.replace(/tăng tốc code gấp (\d+) lần/gi, "Coding-Geschwindigkeit x$1");
    translated = translated.replace(/tăng tốc code/gi, "Coding beschleunigen");
    translated = translated.replace(/Dùng full tính năng/gi, "Alle Funktionen");
    translated = translated.replace(/Full tính năng/gi, "Alle Funktionen");
    translated = translated.replace(/Full Tính Năng/gi, "Alle Funktionen");
    translated = translated.replace(/Full quyền/gi, "Voller Zugang");
    translated = translated.replace(/Bảo Hành Trọn Gói/gi, "Volle Garantie");
    translated = translated.replace(/Bảo hành trọn gói/gi, "Volle Garantie");
    translated = translated.replace(/Dùng Chung/gi, "Geteilt");
    translated = translated.replace(/Dùng chung/gi, "Geteilt");
    translated = translated.replace(/Chính Hãng/gi, "");
    translated = translated.replace(/chính hãng/gi, "");
    translated = translated.replace(/Tài Khoản/gi, "Konto");
    translated = translated.replace(/Tài khoản/gi, "Konto");
    translated = translated.replace(/Cấp Tài Khoản/gi, "Kontoausgabe");
    translated = translated.replace(/Cấp tài khoản/gi, "Kontoausgabe");
    translated = translated.replace(/Giá Rẻ/gi, "Günstig");
    translated = translated.replace(/Giá rẻ/gi, "Günstig");
    translated = translated.replace(/Tốc Độ Cao/gi, "Hohe Geschwindigkeit");
    translated = translated.replace(/Tốc độ cao/gi, "Hohe Geschwindigkeit");
    translated = translated.replace(/Uy Tín/gi, "Zuverlässig");
    translated = translated.replace(/Uy tín/gi, "Zuverlässig");
    translated = translated.replace(/Bảo Hành/gi, "Garantie");
    translated = translated.replace(/Bảo hành/gi, "Garantie");
    translated = translated.replace(/Ko giới hạn/gi, "Unbegrenzt");
    translated = translated.replace(/Không Giới Hạn/gi, "Unbegrenzt");
    translated = translated.replace(/Không giới hạn/gi, "Unbegrenzt");
    translated = translated.replace(/Full Model/gi, "Volles Modell");
    translated = translated.replace(/Trial/gi, "Test");
    translated = translated.replace(/Account/gi, "Konto");
    translated = translated.replace(/(\d+)\s*Tháng/gi, "$1 Monat");
    translated = translated.replace(/(\d+)\s*tháng/gi, "$1 Monat");
    translated = translated.replace(/(\d+)\s*Năm/gi, "$1 Jahr");
    translated = translated.replace(/(\d+)\s*năm/gi, "$1 Jahr");
    translated = translated.replace(/(\d+)\s*Ngày/gi, "$1 Tage");
    translated = translated.replace(/(\d+)\s*ngày/gi, "$1 Tage");
    translated = translated.replace(/(\d+)\s*Month/gi, "$1 Monat");
    translated = translated.replace(/(\d+)\s*Year/gi, "$1 Jahr");
    translated = translated.replace(/(\d+)\s*Days/gi, "$1 Tage");
  } else if (locale === 'ja') {
    // japanese phrases
    translated = translated.replace(/Nâng Cấp Chính Chủ/gi, "");
    translated = translated.replace(/Full quyền AI/gi, "完全AI権限");
    translated = translated.replace(/tăng tốc code gấp (\d+) lần/gi, "コーディング速度$1倍");
    translated = translated.replace(/tăng tốc code/gi, "コーディング高速化");
    translated = translated.replace(/Dùng full tính năng/gi, "全機能");
    translated = translated.replace(/Full tính năng/gi, "全機能");
    translated = translated.replace(/Full Tính Năng/gi, "全機能");
    translated = translated.replace(/Full quyền/gi, "完全権限");
    translated = translated.replace(/Bảo Hành Trọn Gói/gi, "完全保証");
    translated = translated.replace(/Bảo hành trọn gói/gi, "完全保証");
    translated = translated.replace(/Dùng Chung/gi, "共有");
    translated = translated.replace(/Dùng chung/gi, "共有");
    translated = translated.replace(/Chính Hãng/gi, "");
    translated = translated.replace(/chính hãng/gi, "");
    translated = translated.replace(/Tài Khoản/gi, "アカウント");
    translated = translated.replace(/Tài khoản/gi, "アカウント");
    translated = translated.replace(/Cấp Tài Khoản/gi, "アカウント発行");
    translated = translated.replace(/Cấp tài khoản/gi, "アカウント発行");
    translated = translated.replace(/Giá Rẻ/gi, "お得");
    translated = translated.replace(/Giá rẻ/gi, "お得");
    translated = translated.replace(/Tốc Độ Cao/gi, "高速");
    translated = translated.replace(/Tốc độ cao/gi, "高速");
    translated = translated.replace(/Uy Tín/gi, "信頼");
    translated = translated.replace(/Uy tín/gi, "信頼");
    translated = translated.replace(/Bảo Hành/gi, "保証");
    translated = translated.replace(/Bảo hành/gi, "保証");
    translated = translated.replace(/Ko giới hạn/gi, "無制限");
    translated = translated.replace(/Không Giới Hạn/gi, "無制限");
    translated = translated.replace(/Không giới hạn/gi, "無制限");
    translated = translated.replace(/Full Model/gi, "フルモデル");
    translated = translated.replace(/Trial/gi, "トライアル");
    translated = translated.replace(/Account/gi, "アカウント");
    translated = translated.replace(/(\d+)\s*Tháng/gi, "$1ヶ月");
    translated = translated.replace(/(\d+)\s*tháng/gi, "$1ヶ月");
    translated = translated.replace(/(\d+)\s*Năm/gi, "$1年");
    translated = translated.replace(/(\d+)\s*năm/gi, "$1年");
    translated = translated.replace(/(\d+)\s*Ngày/gi, "$1日");
    translated = translated.replace(/(\d+)\s*ngày/gi, "$1日");
    translated = translated.replace(/(\d+)\s*Month/gi, "$1ヶ月");
    translated = translated.replace(/(\d+)\s*Year/gi, "$1年");
    translated = translated.replace(/(\d+)\s*Days/gi, "$1日");
  } else if (locale === 'ko') {
    // korean phrases
    translated = translated.replace(/Nâng Cấp Chính Chủ/gi, "");
    translated = translated.replace(/Full quyền AI/gi, "완전한 AI 권한");
    translated = translated.replace(/tăng tốc code gấp (\d+) lần/gi, "코딩 속도 $1배");
    translated = translated.replace(/tăng tốc code/gi, "코딩 가속화");
    translated = translated.replace(/Dùng full tính năng/gi, "전체 기능");
    translated = translated.replace(/Full tính năng/gi, "전체 기능");
    translated = translated.replace(/Full Tính Năng/gi, "전체 기능");
    translated = translated.replace(/Full quyền/gi, "완전한 권한");
    translated = translated.replace(/Bảo Hành Trọn Gói/gi, "완전 보증");
    translated = translated.replace(/Bảo hành trọn gói/gi, "완전 보증");
    translated = translated.replace(/Dùng Chung/gi, "공유");
    translated = translated.replace(/Dùng chung/gi, "공유");
    translated = translated.replace(/Chính Hãng/gi, "");
    translated = translated.replace(/chính hãng/gi, "");
    translated = translated.replace(/Tài Khoản/gi, "계정");
    translated = translated.replace(/Tài khoản/gi, "계정");
    translated = translated.replace(/Cấp Tài Khoản/gi, "계정 발급");
    translated = translated.replace(/Cấp tài khoản/gi, "계정 발급");
    translated = translated.replace(/Giá Rẻ/gi, "저렴");
    translated = translated.replace(/Giá rẻ/gi, "저렴");
    translated = translated.replace(/Tốc Độ Cao/gi, "고속");
    translated = translated.replace(/Tốc độ cao/gi, "고속");
    translated = translated.replace(/Uy Tín/gi, "신뢰");
    translated = translated.replace(/Uy tín/gi, "신뢰");
    translated = translated.replace(/Bảo Hành/gi, "보증");
    translated = translated.replace(/Bảo hành/gi, "보증");
    translated = translated.replace(/Ko giới hạn/gi, "무제한");
    translated = translated.replace(/Không Giới Hạn/gi, "무제한");
    translated = translated.replace(/Không giới hạn/gi, "무제한");
    translated = translated.replace(/Full Model/gi, "풀 모델");
    translated = translated.replace(/Trial/gi, "체험");
    translated = translated.replace(/Account/gi, "계정");
    translated = translated.replace(/(\d+)\s*Tháng/gi, "$1개월");
    translated = translated.replace(/(\d+)\s*tháng/gi, "$1개월");
    translated = translated.replace(/(\d+)\s*Năm/gi, "$1년");
    translated = translated.replace(/(\d+)\s*năm/gi, "$1년");
    translated = translated.replace(/(\d+)\s*Ngày/gi, "$1일");
    translated = translated.replace(/(\d+)\s*ngày/gi, "$1일");
    translated = translated.replace(/(\d+)\s*Month/gi, "$1개월");
    translated = translated.replace(/(\d+)\s*Year/gi, "$1년");
    translated = translated.replace(/(\d+)\s*Days/gi, "$1일");
  } else if (locale === 'pt') {
    // portuguese phrases
    translated = translated.replace(/Nâng Cấp Chính Chủ/gi, "");
    translated = translated.replace(/Full quyền AI/gi, "Acesso Completo IA");
    translated = translated.replace(/tăng tốc code gấp (\d+) lần/gi, "codificação $1x mais rápida");
    translated = translated.replace(/tăng tốc code/gi, "codificação acelerada");
    translated = translated.replace(/Dùng full tính năng/gi, "Recursos Completos");
    translated = translated.replace(/Full tính năng/gi, "Recursos Completos");
    translated = translated.replace(/Full Tính Năng/gi, "Recursos Completos");
    translated = translated.replace(/Full quyền/gi, "Acesso Completo");
    translated = translated.replace(/Bảo Hành Trọn Gói/gi, "Garantia Completa");
    translated = translated.replace(/Bảo hành trọn gói/gi, "Garantia Completa");
    translated = translated.replace(/Dùng Chung/gi, "Compartilhado");
    translated = translated.replace(/Dùng chung/gi, "Compartilhado");
    translated = translated.replace(/Chính Hãng/gi, "");
    translated = translated.replace(/chính hãng/gi, "");
    translated = translated.replace(/Tài Khoản/gi, "Conta");
    translated = translated.replace(/Tài khoản/gi, "Conta");
    translated = translated.replace(/Cấp Tài Khoản/gi, "Emissão de Conta");
    translated = translated.replace(/Cấp tài khoản/gi, "Emissão de Conta");
    translated = translated.replace(/Giá Rẻ/gi, "Barato");
    translated = translated.replace(/Giá rẻ/gi, "Barato");
    translated = translated.replace(/Tốc Độ Cao/gi, "Alta Velocidade");
    translated = translated.replace(/Tốc độ cao/gi, "Alta Velocidade");
    translated = translated.replace(/Uy Tín/gi, "Confiável");
    translated = translated.replace(/Uy tín/gi, "Confiável");
    translated = translated.replace(/Bảo Hành/gi, "Garantia");
    translated = translated.replace(/Bảo hành/gi, "Garantia");
    translated = translated.replace(/Ko giới hạn/gi, "Ilimitado");
    translated = translated.replace(/Không Giới Hạn/gi, "Ilimitado");
    translated = translated.replace(/Không giới hạn/gi, "Ilimitado");
    translated = translated.replace(/Full Model/gi, "Modelo Completo");
    translated = translated.replace(/Trial/gi, "Trial");
    translated = translated.replace(/Account/gi, "Conta");
    translated = translated.replace(/(\d+)\s*Tháng/gi, "$1 Mês");
    translated = translated.replace(/(\d+)\s*tháng/gi, "$1 Mês");
    translated = translated.replace(/(\d+)\s*Năm/gi, "$1 Ano");
    translated = translated.replace(/(\d+)\s*năm/gi, "$1 Ano");
    translated = translated.replace(/(\d+)\s*Ngày/gi, "$1 Dias");
    translated = translated.replace(/(\d+)\s*ngày/gi, "$1 Dias");
    translated = translated.replace(/(\d+)\s*Month/gi, "$1 Mês");
    translated = translated.replace(/(\d+)\s*Year/gi, "$1 Ano");
    translated = translated.replace(/(\d+)\s*Days/gi, "$1 Dias");
  }
  
  return translated.replace(/\s+/g, ' ').trim();
};

// Generic type to handle both DB Product and Frontend Product interfaces
export const getLocalizedProduct = <T extends { id?: string; slug?: string; name: string; description?: string | null; shortDescription?: string | null; nameLocales?: Record<string, string> | null; descriptionLocales?: Record<string, string> | null; shortDescriptionLocales?: Record<string, string> | null; features?: string[] | null; featuresLocales?: Record<string, string[]> | null }>(product: T, locale: string): T => {
  if (locale === 'vi') return product;

  // 1. Try DB locale JSON columns first (auto-translated via Gemini)
  const dbName = product.nameLocales?.[locale];
  const dbDesc = product.descriptionLocales?.[locale];
  const dbShort = product.shortDescriptionLocales?.[locale];
  const dbFeatures = product.featuresLocales?.[locale];

  if (dbName) {
    return {
      ...product,
      name: dbName,
      description: dbDesc || product.description,
      shortDescription: dbShort || product.shortDescription,
      ...(dbFeatures ? { features: dbFeatures } : {}),
    };
  }

  // 2. Fallback: hardcoded DB_PRODUCT_TRANSLATIONS
  const slug = product.slug || product.id;
  const dbTranslation = slug ? DB_PRODUCT_TRANSLATIONS[slug] : undefined;
  
  if (dbTranslation) {
    const localeKey = locale as 'en' | 'ru' | 'zh' | 'ar' | 'es' | 'fr' | 'de' | 'ja' | 'ko';
    const translation = dbTranslation[localeKey] || dbTranslation.en;
    if (translation) {
      return {
        ...product,
        name: translation.name,
        description: translation.description || product.description,
        shortDescription: translation.shortDescription || product.shortDescription
      };
    }
  }

  // 3. Fallback: legacy translations (english only)
  if (locale === 'en') {
    const legacyTranslation = slug ? LEGACY_PRODUCT_TRANSLATIONS[slug] : undefined;
    const nameTranslation = product.name ? LEGACY_PRODUCT_TRANSLATIONS[product.name] : undefined;
    const translation = legacyTranslation || nameTranslation;
  
  if (translation) {
    return {
      ...product,
      name: translation.name,
      description: translation.description || product.description,
      shortDescription: translation.shortDescription || product.shortDescription
    };
  }
  }

  // 4. Final fallback: phrase replacement
  const translatedName = translateProductName(product.name, locale);
  const translatedDesc = product.shortDescription ? translateProductName(product.shortDescription, locale) : product.shortDescription;
  
  return {
    ...product,
    name: translatedName,
    shortDescription: translatedDesc
  };
}

export const localizeSocialProof = <T extends { title: string; description?: string | null }>(proof: T, locale: string): T => {
  // return original vietnamese for vi locale
  if (locale === 'vi') return proof;

  let title = proof.title;
  let description = proof.description;

  if (locale === 'en') {
    // english translations
  title = title.replace(/Khách hàng mua thành công/gi, "Verified Purchase:");
  title = title.replace(/Nâng cấp chính chủ/gi, "Upgrade:");
    title = title.replace(/^Tài khoản/gi, "Account");
    title = title.replace(/\sTài khoản/gi, "Account");
  title = title.replace(/(\d+)\s*tháng/gi, "$1 Months");
  title = title.replace(/1\s*Months/gi, "1 Month");
  title = title.replace(/(\d+)\s*năm/gi, "$1 Years");
  title = title.replace(/1\s*Years/gi, "1 Year");
  title = title.replace(/\(Ko giới hạn\)/gi, "(Unlimited)");
  title = title.replace(/Ko giới hạn/gi, "Unlimited");
  title = title.replace(/Chính hãng/gi, "");
  title = title.replace(/Giá rẻ/gi, "Affordable");
  title = title.replace(/Bảo hành/gi, "Warranty");
  title = title.replace(/Cấp/gi, "Issue");
  title = title.replace(/Full tính năng/gi, "Full Features");
  title = title.replace(/Tốc độ cao/gi, "High Speed");
  title = title.replace(/Uy tín/gi, "Trusted");

  if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "Transaction successful, customer received account and is now using");
    description = description.replace(/Gói/gi, "Plan");
    description = description.replace(/Tài khoản chính chủ/gi, "Official Account");
    description = description.replace(/Bảo hành 1 đổi 1/gi, "1-to-1 Warranty");
    description = description.replace(/Hỗ trợ nhiệt tình/gi, "Great Support");
    description = description.replace(/Uy tín/gi, "Trusted");
    description = description.replace(/Giá rẻ/gi, "Affordable");
    description = description.replace(/Full tính năng/gi, "Full Features");
    description = description.replace(/Nâng cấp/gi, "Upgrade");
    description = description.replace(/tốc độ cao/gi, "high speed");
    description = description.replace(/Sử dụng/gi, "Use");
    description = description.replace(/vĩnh viễn/gi, "lifetime");
    description = description.replace(/trọn đời/gi, "lifetime");
    description = description.replace(/(\d+)\s*tháng/gi, "$1 Months");
    description = description.replace(/1\s*Months/gi, "1 Month");
    description = description.replace(/(\d+)\s*năm/gi, "$1 Years");
    description = description.replace(/1\s*Years/gi, "1 Year");
    }
  } else if (locale === 'ru') {
    // russian translations
    title = title.replace(/Khách hàng mua thành công/gi, "Успешная покупка:");
    title = title.replace(/Nâng cấp chính chủ/gi, "Официальное обновление:");
    title = title.replace(/^Tài khoản/gi, "Аккаунт");
    title = title.replace(/\sTài khoản/gi, "Аккаунт");
    title = title.replace(/(\d+)\s*tháng/gi, "$1 мес.");
    title = title.replace(/1\s*мес\./gi, "1 мес.");
    title = title.replace(/(\d+)\s*năm/gi, "$1 год");
    title = title.replace(/1\s*год/gi, "1 год");
    title = title.replace(/\(Ko giới hạn\)/gi, "(Безлимит)");
    title = title.replace(/Ko giới hạn/gi, "Безлимит");
    title = title.replace(/Chính hãng/gi, "");
    title = title.replace(/Giá rẻ/gi, "Выгодно");
    title = title.replace(/Bảo hành/gi, "Гарантия");
    title = title.replace(/Cấp/gi, "Выдача");
    title = title.replace(/Full tính năng/gi, "Полный функционал");
    title = title.replace(/Tốc độ cao/gi, "Высокая скорость");
    title = title.replace(/Uy tín/gi, "Надёжно");
    title = title.replace(/MAX MODE/gi, "MAX MODE");
    title = title.replace(/ACC/gi, "АКК");

    if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "Транзакция успешна, клиент получил аккаунт и использует");
      description = description.replace(/Gói/gi, "Пакет");
      description = description.replace(/Tài khoản chính chủ/gi, "Официальный аккаунт");
      description = description.replace(/Bảo hành 1 đổi 1/gi, "Гарантия 1-к-1");
      description = description.replace(/Hỗ trợ nhiệt tình/gi, "Отличная поддержка");
      description = description.replace(/Uy tín/gi, "Надёжно");
      description = description.replace(/Giá rẻ/gi, "Выгодно");
      description = description.replace(/Full tính năng/gi, "Полный функционал");
      description = description.replace(/Nâng cấp/gi, "Обновление");
      description = description.replace(/tốc độ cao/gi, "высокая скорость");
      description = description.replace(/Sử dụng/gi, "Использование");
      description = description.replace(/vĩnh viễn/gi, "навсегда");
      description = description.replace(/trọn đời/gi, "пожизненно");
      description = description.replace(/(\d+)\s*tháng/gi, "$1 мес.");
      description = description.replace(/1\s*мес\./gi, "1 мес.");
      description = description.replace(/(\d+)\s*năm/gi, "$1 год");
      description = description.replace(/1\s*год/gi, "1 год");
    }
  } else if (locale === 'zh') {
    // chinese translations
    title = title.replace(/Khách hàng mua thành công/gi, "验证购买:");
    title = title.replace(/Nâng cấp chính chủ/gi, "官方升级:");
    title = title.replace(/^Tài khoản/gi, "账户");
    title = title.replace(/\sTài khoản/gi, "账户");
    title = title.replace(/(\d+)\s*tháng/gi, "$1个月");
    title = title.replace(/(\d+)\s*năm/gi, "$1年");
    title = title.replace(/\(Ko giới hạn\)/gi, "(无限)");
    title = title.replace(/Ko giới hạn/gi, "无限");
    title = title.replace(/Chính hãng/gi, "");
    title = title.replace(/Giá rẻ/gi, "实惠");
    title = title.replace(/Bảo hành/gi, "保修");
    title = title.replace(/Cấp/gi, "发放");
    title = title.replace(/Full tính năng/gi, "完整功能");
    title = title.replace(/Tốc độ cao/gi, "高速");
    title = title.replace(/Uy tín/gi, "可靠");
    title = title.replace(/MAX MODE/gi, "MAX MODE");
    title = title.replace(/ACC/gi, "账号");

    if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "交易成功，客户已收到账户并正在使用");
      description = description.replace(/Gói/gi, "套餐");
      description = description.replace(/Tài khoản chính chủ/gi, "官方账户");
      description = description.replace(/Bảo hành 1 đổi 1/gi, "1对1保修");
      description = description.replace(/Hỗ trợ nhiệt tình/gi, "优质支持");
      description = description.replace(/Uy tín/gi, "可靠");
      description = description.replace(/Giá rẻ/gi, "实惠");
      description = description.replace(/Full tính năng/gi, "完整功能");
      description = description.replace(/Nâng cấp/gi, "升级");
      description = description.replace(/tốc độ cao/gi, "高速");
      description = description.replace(/Sử dụng/gi, "使用");
      description = description.replace(/vĩnh viễn/gi, "永久");
      description = description.replace(/trọn đời/gi, "终身");
      description = description.replace(/(\d+)\s*tháng/gi, "$1个月");
      description = description.replace(/(\d+)\s*năm/gi, "$1年");
    }
  } else if (locale === 'ar') {
    // arabic translations
    title = title.replace(/Khách hàng mua thành công/gi, "عملية شراء ناجحة:");
    title = title.replace(/Nâng cấp chính chủ/gi, "ترقية رسمية:");
    title = title.replace(/^Tài khoản/gi, "حساب");
    title = title.replace(/\sTài khoản/gi, "حساب");
    title = title.replace(/(\d+)\s*tháng/gi, "$1 شهر");
    title = title.replace(/(\d+)\s*năm/gi, "$1 سنة");
    title = title.replace(/\(Ko giới hạn\)/gi, "(غير محدود)");
    title = title.replace(/Ko giới hạn/gi, "غير محدود");
    title = title.replace(/Chính hãng/gi, "");
    title = title.replace(/Giá rẻ/gi, "سعر مناسب");
    title = title.replace(/Bảo hành/gi, "ضمان");
    title = title.replace(/Cấp/gi, "إصدار");
    title = title.replace(/Full tính năng/gi, "كل الميزات");
    title = title.replace(/Tốc độ cao/gi, "سرعة عالية");
    title = title.replace(/Uy tín/gi, "موثوق");
    title = title.replace(/MAX MODE/gi, "MAX MODE");
    title = title.replace(/ACC/gi, "حساب");

    if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "تمت المعاملة بنجاح، العميل استلم الحساب ويستخدمه الآن");
      description = description.replace(/Gói/gi, "باقة");
      description = description.replace(/Tài khoản chính chủ/gi, "حساب رسمي");
      description = description.replace(/Bảo hành 1 đổi 1/gi, "ضمان استبدال 1-1");
      description = description.replace(/Hỗ trợ nhiệt tình/gi, "دعم ممتاز");
      description = description.replace(/Uy tín/gi, "موثوق");
      description = description.replace(/Giá rẻ/gi, "سعر مناسب");
      description = description.replace(/Full tính năng/gi, "كل الميزات");
      description = description.replace(/Nâng cấp/gi, "ترقية");
      description = description.replace(/tốc độ cao/gi, "سرعة عالية");
      description = description.replace(/Sử dụng/gi, "استخدام");
      description = description.replace(/vĩnh viễn/gi, "دائم");
      description = description.replace(/trọn đời/gi, "مدى الحياة");
      description = description.replace(/(\d+)\s*tháng/gi, "$1 شهر");
      description = description.replace(/(\d+)\s*năm/gi, "$1 سنة");
    }
  } else if (locale === 'es') {
    // spanish translations
    title = title.replace(/Khách hàng mua thành công/gi, "Compra Verificada:");
    title = title.replace(/Nâng cấp chính chủ/gi, "Actualización :");
    title = title.replace(/^Tài khoản/gi, "Cuenta");
    title = title.replace(/\sTài khoản/gi, "Cuenta");
    title = title.replace(/(\d+)\s*tháng/gi, "$1 Mes");
    title = title.replace(/(\d+)\s*năm/gi, "$1 Año");
    title = title.replace(/\(Ko giới hạn\)/gi, "(Ilimitado)");
    title = title.replace(/Ko giới hạn/gi, "Ilimitado");
    title = title.replace(/Chính hãng/gi, "");
    title = title.replace(/Giá rẻ/gi, "Asequible");
    title = title.replace(/Bảo hành/gi, "Garantía");
    title = title.replace(/Cấp/gi, "Emisión");
    title = title.replace(/Full tính năng/gi, "Todas las Funciones");
    title = title.replace(/Tốc độ cao/gi, "Alta Velocidad");
    title = title.replace(/Uy tín/gi, "Confiable");
    title = title.replace(/MAX MODE/gi, "MAX MODE");
    title = title.replace(/ACC/gi, "CTA");

    if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "Transacción exitosa, el cliente recibió la cuenta y la está usando");
      description = description.replace(/Gói/gi, "Plan");
      description = description.replace(/Tài khoản chính chủ/gi, "Cuenta");
      description = description.replace(/Bảo hành 1 đổi 1/gi, "Garantía 1 por 1");
      description = description.replace(/Hỗ trợ nhiệt tình/gi, "Excelente Soporte");
      description = description.replace(/Uy tín/gi, "Confiable");
      description = description.replace(/Giá rẻ/gi, "Asequible");
      description = description.replace(/Full tính năng/gi, "Todas las Funciones");
      description = description.replace(/Nâng cấp/gi, "Actualización");
      description = description.replace(/tốc độ cao/gi, "alta velocidad");
      description = description.replace(/Sử dụng/gi, "Uso");
      description = description.replace(/vĩnh viễn/gi, "permanente");
      description = description.replace(/trọn đời/gi, "de por vida");
      description = description.replace(/(\d+)\s*tháng/gi, "$1 Mes");
      description = description.replace(/(\d+)\s*năm/gi, "$1 Año");
    }
  } else if (locale === 'fr') {
    // french translations
    title = title.replace(/Khách hàng mua thành công/gi, "Achat vérifié:");
    title = title.replace(/Nâng cấp chính chủ/gi, "Mise à niveau :");
    title = title.replace(/^Tài khoản/gi, "Compte");
    title = title.replace(/\sTài khoản/gi, "Compte");
    title = title.replace(/(\d+)\s*tháng/gi, "$1 Mois");
    title = title.replace(/(\d+)\s*năm/gi, "$1 An");
    title = title.replace(/\(Ko giới hạn\)/gi, "(Illimité)");
    title = title.replace(/Ko giới hạn/gi, "Illimité");
    title = title.replace(/Chính hãng/gi, "");
    title = title.replace(/Giá rẻ/gi, "Abordable");
    title = title.replace(/Bảo hành/gi, "Garantie");
    title = title.replace(/Cấp/gi, "Émission");
    title = title.replace(/Full tính năng/gi, "Fonctionnalités Complètes");
    title = title.replace(/Tốc độ cao/gi, "Haute Vitesse");
    title = title.replace(/Uy tín/gi, "Fiable");
    title = title.replace(/MAX MODE/gi, "MAX MODE");
    title = title.replace(/ACC/gi, "CPT");

    if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "Transaction réussie, le client a reçu le compte et l'utilise");
      description = description.replace(/Gói/gi, "Forfait");
      description = description.replace(/Tài khoản chính chủ/gi, "Compte");
      description = description.replace(/Bảo hành 1 đổi 1/gi, "Garantie 1 pour 1");
      description = description.replace(/Hỗ trợ nhiệt tình/gi, "Excellent Support");
      description = description.replace(/Uy tín/gi, "Fiable");
      description = description.replace(/Giá rẻ/gi, "Abordable");
      description = description.replace(/Full tính năng/gi, "Fonctionnalités Complètes");
      description = description.replace(/Nâng cấp/gi, "Mise à niveau");
      description = description.replace(/tốc độ cao/gi, "haute vitesse");
      description = description.replace(/Sử dụng/gi, "Utilisation");
      description = description.replace(/vĩnh viễn/gi, "permanent");
      description = description.replace(/trọn đời/gi, "à vie");
      description = description.replace(/(\d+)\s*tháng/gi, "$1 Mois");
      description = description.replace(/(\d+)\s*năm/gi, "$1 An");
    }
  } else if (locale === 'de') {
    // german translations
    title = title.replace(/Khách hàng mua thành công/gi, "Verifizierter Kauf:");
    title = title.replace(/Nâng cấp chính chủ/gi, "Upgrade:");
    title = title.replace(/^Tài khoản/gi, "Konto");
    title = title.replace(/\sTài khoản/gi, "Konto");
    title = title.replace(/(\d+)\s*tháng/gi, "$1 Monat");
    title = title.replace(/(\d+)\s*năm/gi, "$1 Jahr");
    title = title.replace(/\(Ko giới hạn\)/gi, "(Unbegrenzt)");
    title = title.replace(/Ko giới hạn/gi, "Unbegrenzt");
    title = title.replace(/Chính hãng/gi, "");
    title = title.replace(/Giá rẻ/gi, "Günstig");
    title = title.replace(/Bảo hành/gi, "Garantie");
    title = title.replace(/Cấp/gi, "Ausgabe");
    title = title.replace(/Full tính năng/gi, "Alle Funktionen");
    title = title.replace(/Tốc độ cao/gi, "Hohe Geschwindigkeit");
    title = title.replace(/Uy tín/gi, "Zuverlässig");
    title = title.replace(/MAX MODE/gi, "MAX MODUS");
    title = title.replace(/ACC/gi, "KONTO");

    if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "Transaktion erfolgreich, Kunde hat das Konto erhalten und nutzt es");
      description = description.replace(/Gói/gi, "Paket");
      description = description.replace(/Tài khoản chính chủ/gi, "Konto");
      description = description.replace(/Bảo hành 1 đổi 1/gi, "1-zu-1-Garantie");
      description = description.replace(/Hỗ trợ nhiệt tình/gi, "Hervorragender Support");
      description = description.replace(/Uy tín/gi, "Zuverlässig");
      description = description.replace(/Giá rẻ/gi, "Günstig");
      description = description.replace(/Full tính năng/gi, "Alle Funktionen");
      description = description.replace(/Nâng cấp/gi, "Upgrade");
      description = description.replace(/tốc độ cao/gi, "hohe Geschwindigkeit");
      description = description.replace(/Sử dụng/gi, "Nutzung");
      description = description.replace(/vĩnh viễn/gi, "dauerhaft");
      description = description.replace(/trọn đời/gi, "lebenslang");
      description = description.replace(/(\d+)\s*tháng/gi, "$1 Monat");
      description = description.replace(/(\d+)\s*năm/gi, "$1 Jahr");
    }
  } else if (locale === 'ja') {
    // japanese translations
    title = title.replace(/Khách hàng mua thành công/gi, "購入確認:");
    title = title.replace(/Nâng cấp chính chủ/gi, "公式アップグレード:");
    title = title.replace(/^Tài khoản/gi, "アカウント");
    title = title.replace(/\sTài khoản/gi, "アカウント");
    title = title.replace(/(\d+)\s*tháng/gi, "$1ヶ月");
    title = title.replace(/(\d+)\s*năm/gi, "$1年");
    title = title.replace(/\(Ko giới hạn\)/gi, "(無制限)");
    title = title.replace(/Ko giới hạn/gi, "無制限");
    title = title.replace(/Chính hãng/gi, "");
    title = title.replace(/Giá rẻ/gi, "お得");
    title = title.replace(/Bảo hành/gi, "保証");
    title = title.replace(/Cấp/gi, "発行");
    title = title.replace(/Full tính năng/gi, "全機能");
    title = title.replace(/Tốc độ cao/gi, "高速");
    title = title.replace(/Uy tín/gi, "信頼");
    title = title.replace(/MAX MODE/gi, "マックスモード");
    title = title.replace(/ACC/gi, "アカウント");

    if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "取引成功、お客様はアカウントを受け取り使用中");
      description = description.replace(/Gói/gi, "プラン");
      description = description.replace(/Tài khoản chính chủ/gi, "公式アカウント");
      description = description.replace(/Bảo hành 1 đổi 1/gi, "1対1保証");
      description = description.replace(/Hỗ trợ nhiệt tình/gi, "優れたサポート");
      description = description.replace(/Uy tín/gi, "信頼");
      description = description.replace(/Giá rẻ/gi, "お得");
      description = description.replace(/Full tính năng/gi, "全機能");
      description = description.replace(/Nâng cấp/gi, "アップグレード");
      description = description.replace(/tốc độ cao/gi, "高速");
      description = description.replace(/Sử dụng/gi, "使用");
      description = description.replace(/vĩnh viễn/gi, "永久");
      description = description.replace(/trọn đời/gi, "生涯");
      description = description.replace(/(\d+)\s*tháng/gi, "$1ヶ月");
      description = description.replace(/(\d+)\s*năm/gi, "$1年");
    }
  } else if (locale === 'ko') {
    // korean translations
    title = title.replace(/Khách hàng mua thành công/gi, "구매 확인:");
    title = title.replace(/Nâng cấp chính chủ/gi, "공식 업그레이드:");
    title = title.replace(/^Tài khoản/gi, "계정");
    title = title.replace(/\sTài khoản/gi, "계정");
    title = title.replace(/(\d+)\s*tháng/gi, "$1개월");
    title = title.replace(/(\d+)\s*năm/gi, "$1년");
    title = title.replace(/\(Ko giới hạn\)/gi, "(무제한)");
    title = title.replace(/Ko giới hạn/gi, "무제한");
    title = title.replace(/Chính hãng/gi, "");
    title = title.replace(/Giá rẻ/gi, "저렴");
    title = title.replace(/Bảo hành/gi, "보증");
    title = title.replace(/Cấp/gi, "발급");
    title = title.replace(/Full tính năng/gi, "전체 기능");
    title = title.replace(/Tốc độ cao/gi, "고속");
    title = title.replace(/Uy tín/gi, "신뢰");
    title = title.replace(/MAX MODE/gi, "맥스 모드");
    title = title.replace(/ACC/gi, "계정");

    if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "거래 성공, 고객이 계정을 받아 사용 중");
      description = description.replace(/Gói/gi, "플랜");
      description = description.replace(/Tài khoản chính chủ/gi, "공식 계정");
      description = description.replace(/Bảo hành 1 đổi 1/gi, "1대1 보증");
      description = description.replace(/Hỗ trợ nhiệt tình/gi, "우수한 지원");
      description = description.replace(/Uy tín/gi, "신뢰");
      description = description.replace(/Giá rẻ/gi, "저렴");
      description = description.replace(/Full tính năng/gi, "전체 기능");
      description = description.replace(/Nâng cấp/gi, "업그레이드");
      description = description.replace(/tốc độ cao/gi, "고속");
      description = description.replace(/Sử dụng/gi, "사용");
      description = description.replace(/vĩnh viễn/gi, "영구");
      description = description.replace(/trọn đời/gi, "평생");
      description = description.replace(/(\d+)\s*tháng/gi, "$1개월");
      description = description.replace(/(\d+)\s*năm/gi, "$1년");
    }
  } else if (locale === 'pt') {
    // portuguese translations
    title = title.replace(/Khách hàng mua thành công/gi, "Confirmação de Compra:");
    title = title.replace(/Nâng cấp chính chủ/gi, "Upgrade :");
    title = title.replace(/^Tài khoản/gi, "Conta");
    title = title.replace(/\sTài khoản/gi, "Conta");
    title = title.replace(/(\d+)\s*tháng/gi, "$1 mês");
    title = title.replace(/(\d+)\s*năm/gi, "$1 ano");
    title = title.replace(/\(Ko giới hạn\)/gi, "(Ilimitado)");
    title = title.replace(/Ko giới hạn/gi, "Ilimitado");
    title = title.replace(/Chính hãng/gi, "");
    title = title.replace(/Giá rẻ/gi, "Barato");
    title = title.replace(/Bảo hành/gi, "Garantia");
    title = title.replace(/Cấp/gi, "Emissão");
    title = title.replace(/Full tính năng/gi, "Recursos Completos");
    title = title.replace(/Tốc độ cao/gi, "Alta Velocidade");
    title = title.replace(/Uy tín/gi, "Confiável");
    title = title.replace(/MAX MODE/gi, "MAX MODE");
    title = title.replace(/ACC/gi, "Conta");

    if (description) {
      description = description.replace(/Giao dịch thành công, khách hàng đã nhận được tài khoản và đang sử dụng/gi, "Transação bem-sucedida, cliente recebeu a conta e está usando");
      description = description.replace(/Gói/gi, "Plano");
      description = description.replace(/Tài khoản chính chủ/gi, "Conta");
      description = description.replace(/Bảo hành 1 đổi 1/gi, "Garantia 1-1");
      description = description.replace(/Hỗ trợ nhiệt tình/gi, "Excelente Suporte");
      description = description.replace(/Uy tín/gi, "Confiável");
      description = description.replace(/Giá rẻ/gi, "Barato");
      description = description.replace(/Full tính năng/gi, "Recursos Completos");
      description = description.replace(/Nâng cấp/gi, "Upgrade");
      description = description.replace(/tốc độ cao/gi, "Alta Velocidade");
      description = description.replace(/Sử dụng/gi, "Uso");
      description = description.replace(/vĩnh viễn/gi, "permanente");
      description = description.replace(/trọn đời/gi, "vitalício");
      description = description.replace(/(\d+)\s*tháng/gi, "$1 mês");
      description = description.replace(/(\d+)\s*năm/gi, "$1 ano");
    }
  }

  // clean up
  title = title.replace(/\s+/g, ' ').trim();
  if (description) {
    description = description.replace(/\s+/g, ' ').trim();
  }

  return {
    ...proof,
    title,
    description: description || proof.description
  };
}

// database category translations from actual database
const DB_CATEGORY_TRANSLATIONS: Record<string, Record<string, string>> = {
  // ChatGPT Plus
  "chatgpt-plus": {
    en: "ChatGPT Plus",
    ru: "ChatGPT Plus",
    zh: "ChatGPT Plus",
    ar: "ChatGPT Plus",
    es: "ChatGPT Plus",
    fr: "ChatGPT Plus",
    de: "ChatGPT Plus",
    ja: "ChatGPT Plus",
    ko: "ChatGPT Plus",
    pt: "ChatGPT Plus"
  },
  // Claude AI Chính Hãng
  "claude-ai-chinh-hang": {
    en: "Claude AI Official",
    ru: "Claude AI Оригинал",
    zh: "Claude AI",
    ar: "Claude AI ال",
    es: "Claude AI Oficial",
    fr: "Claude AI",
    de: "Claude AI",
    ja: "Claude AI公式",
    ko: "Claude AI 공식",
    pt: "Claude AI Oficial"
  },
  // Cursor Pro
  "cursor-pro": {
    en: "Cursor Pro",
    ru: "Cursor Pro",
    zh: "Cursor Pro",
    ar: "Cursor Pro",
    es: "Cursor Pro",
    fr: "Cursor Pro",
    de: "Cursor Pro",
    ja: "Cursor Pro",
    ko: "Cursor Pro",
    pt: "Cursor Pro"
  },
  // Grok AI Pro
  "grok-ai-pro": {
    en: "Grok AI Pro",
    ru: "Grok AI Pro",
    zh: "Grok AI Pro",
    ar: "Grok AI Pro",
    es: "Grok AI Pro",
    fr: "Grok AI Pro",
    de: "Grok AI Pro",
    ja: "Grok AI Pro",
    ko: "Grok AI Pro",
    pt: "Grok AI Pro"
  },
  // IntelliJ IDEA
  "intellij-idea": {
    en: "IntelliJ IDEA",
    ru: "IntelliJ IDEA",
    zh: "IntelliJ IDEA",
    ar: "IntelliJ IDEA",
    es: "IntelliJ IDEA",
    fr: "IntelliJ IDEA",
    de: "IntelliJ IDEA",
    ja: "IntelliJ IDEA",
    ko: "IntelliJ IDEA"
  },
  // Tài khoản GitHub Copilot Pro 2 năm
  "tai-khoan-github-copilot-pro-2-nam": {
    en: "GitHub Copilot Pro 2 Years",
    ru: "GitHub Copilot Pro 2 года",
    zh: "GitHub Copilot Pro 2年",
    ar: "GitHub Copilot Pro سنتان",
    es: "GitHub Copilot Pro 2 Años",
    fr: "GitHub Copilot Pro 2 Ans",
    de: "GitHub Copilot Pro 2 Jahre",
    ja: "GitHub Copilot Pro 2年",
    ko: "GitHub Copilot Pro 2년"
  },
  // Tài khoản JetBrains
  "tai-khoan-jetbrains": {
    en: "JetBrains Account",
    ru: "Аккаунт JetBrains",
    zh: "JetBrains账户",
    ar: "حساب JetBrains",
    es: "Cuenta JetBrains",
    fr: "Compte JetBrains",
    de: "JetBrains-Konto",
    ja: "JetBrainsアカウント",
    ko: "JetBrains 계정"
  },
  // Tài khoản figma pro 1 năm
  "tai-khoan-figma-pro-1-nam": {
    en: "Figma Pro 1 Year",
    ru: "Figma Pro 1 год",
    zh: "Figma Pro 1年",
    ar: "Figma Pro سنة واحدة",
    es: "Figma Pro 1 Año",
    fr: "Figma Pro 1 An",
    de: "Figma Pro 1 Jahr",
    ja: "Figma Pro 1年",
    ko: "Figma Pro 1년"
  }
};

// localize category name from database
export const localizeCategory = <T extends { name: string; slug?: string; nameLocales?: Record<string, string> | null }>(category: T, locale: string): T => {
  if (locale === 'vi') return category;

  // 1. Try DB locale JSON column first
  const dbName = category.nameLocales?.[locale];
  if (dbName) {
    return { ...category, name: dbName };
  }
  
  // 2. Fallback: hardcoded translations by slug
  if (category.slug && DB_CATEGORY_TRANSLATIONS[category.slug]) {
    const translation = DB_CATEGORY_TRANSLATIONS[category.slug][locale];
    if (translation) {
      return { ...category, name: translation };
    }
  }
  
  // fallback: phrase replacement
  let name = category.name;
  
  if (locale === 'en') {
    name = name.replace(/^Tài khoản\s*/gi, "");
    name = name.replace(/\s*Chính [Hh]ãng/gi, "Official");
    name = name.replace(/(\d+)\s*năm/gi, "$1 Year");
    name = name.replace(/(\d+)\s*tháng/gi, "$1 Month");
  } else if (locale === 'ru') {
    if (name.match(/^Tài khoản/i)) {
      name = name.replace(/^Tài khoản\s*/gi, "");
      name = name + "Аккаунт";
    }
    name = name.replace(/\s*Chính [Hh]ãng/gi, "Оригинал");
    name = name.replace(/(\d+)\s*năm/gi, "$1 год");
    name = name.replace(/(\d+)\s*tháng/gi, "$1 мес.");
  } else if (locale === 'zh') {
    if (name.match(/^Tài khoản/i)) {
      name = name.replace(/^Tài khoản\s*/gi, "");
      name = name + "账户";
    }
    name = name.replace(/\s*Chính [Hh]ãng/gi, "");
    name = name.replace(/(\d+)\s*năm/gi, "$1年");
    name = name.replace(/(\d+)\s*tháng/gi, "$1个月");
  } else if (locale === 'ar') {
    if (name.match(/^Tài khoản/i)) {
      name = name.replace(/^Tài khoản\s*/gi, "");
      name = "حساب" + name;
    }
    name = name.replace(/\s*Chính [Hh]ãng/gi, "ال");
    name = name.replace(/(\d+)\s*năm/gi, "$1 سنة");
    name = name.replace(/(\d+)\s*tháng/gi, "$1 شهر");
  } else if (locale === 'es') {
    if (name.match(/^Tài khoản/i)) {
      name = name.replace(/^Tài khoản\s*/gi, "");
      name = "Cuenta" + name;
    }
    name = name.replace(/\s*Chính [Hh]ãng/gi, "Oficial");
    name = name.replace(/(\d+)\s*năm/gi, "$1 Año");
    name = name.replace(/(\d+)\s*tháng/gi, "$1 Mes");
  } else if (locale === 'fr') {
    if (name.match(/^Tài khoản/i)) {
      name = name.replace(/^Tài khoản\s*/gi, "");
      name = "Compte" + name;
    }
    name = name.replace(/\s*Chính [Hh]ãng/gi, "");
    name = name.replace(/(\d+)\s*năm/gi, "$1 An");
    name = name.replace(/(\d+)\s*tháng/gi, "$1 Mois");
  } else if (locale === 'de') {
    if (name.match(/^Tài khoản/i)) {
      name = name.replace(/^Tài khoản\s*/gi, "");
      name = name + "-Konto";
    }
    name = name.replace(/\s*Chính [Hh]ãng/gi, "");
    name = name.replace(/(\d+)\s*năm/gi, "$1 Jahr");
    name = name.replace(/(\d+)\s*tháng/gi, "$1 Monat");
  } else if (locale === 'ja') {
    if (name.match(/^Tài khoản/i)) {
      name = name.replace(/^Tài khoản\s*/gi, "");
      name = name + "アカウント";
    }
    name = name.replace(/\s*Chính [Hh]ãng/gi, "公式");
    name = name.replace(/(\d+)\s*năm/gi, "$1年");
    name = name.replace(/(\d+)\s*tháng/gi, "$1ヶ月");
  } else if (locale === 'ko') {
    if (name.match(/^Tài khoản/i)) {
      name = name.replace(/^Tài khoản\s*/gi, "");
      name = name + "계정";
    }
    name = name.replace(/\s*Chính [Hh]ãng/gi, "공식");
    name = name.replace(/(\d+)\s*năm/gi, "$1년");
    name = name.replace(/(\d+)\s*tháng/gi, "$1개월");
  } else if (locale === 'pt') {
    if (name.match(/^Tài khoản/i)) {
      name = name.replace(/^Tài khoản\s*/gi, "Conta");
    }
    name = name.replace(/\s*Chính [Hh]ãng/gi, "Oficial");
    name = name.replace(/(\d+)\s*năm/gi, "$1 Ano");
    name = name.replace(/(\d+)\s*tháng/gi, "$1 Mês");
  }
  
  return { ...category, name: name.trim() };
}
