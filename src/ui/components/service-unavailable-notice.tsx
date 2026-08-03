import type { Metadata } from "next";

type SupportedLocale =
  | "vi"
  | "en"
  | "ru"
  | "zh"
  | "ar"
  | "es"
  | "fr"
  | "de"
  | "ja"
  | "ko"
  | "pt";

interface NoticeCopy {
  title: string;
  subtitle: string;
  body: string;
  contactLabel: string;
}

const NOTICE_BY_LOCALE: Record<SupportedLocale, NoticeCopy> = {
  vi: {
    title: "Dịch vụ tạm ngưng",
    subtitle: "Chúng tôi đang cập nhật nội dung",
    body: "Trang này hiện không khả dụng trong thời gian chúng tôi rà soát và cập nhật nội dung. Khách hàng hiện hữu vui lòng liên hệ qua các kênh hỗ trợ phía dưới để được hỗ trợ tiếp tục.",
    contactLabel: "Liên hệ hỗ trợ",
  },
  en: {
    title: "Service temporarily unavailable",
    subtitle: "We are updating our content",
    body: "This page is temporarily unavailable while we review and update our content. Existing customers can continue to receive assistance through the contact channels below.",
    contactLabel: "Contact support",
  },
  ru: {
    title: "Сервис временно недоступен",
    subtitle: "Мы обновляем содержимое",
    body: "Эта страница временно недоступна, пока мы пересматриваем и обновляем содержимое. Существующие клиенты могут продолжать получать поддержку по контактам ниже.",
    contactLabel: "Связаться с поддержкой",
  },
  zh: {
    title: "服务暂时不可用",
    subtitle: "我们正在更新内容",
    body: "我们正在审查和更新内容,本页面暂时不可用。现有客户可通过下面的联系方式继续获得支持。",
    contactLabel: "联系支持",
  },
  ar: {
    title: "الخدمة غير متاحة مؤقتًا",
    subtitle: "نقوم بتحديث المحتوى",
    body: "هذه الصفحة غير متاحة مؤقتًا أثناء قيامنا بمراجعة المحتوى وتحديثه. يمكن للعملاء الحاليين الاستمرار في تلقي المساعدة عبر قنوات الاتصال أدناه.",
    contactLabel: "اتصل بالدعم",
  },
  es: {
    title: "Servicio temporalmente no disponible",
    subtitle: "Estamos actualizando nuestro contenido",
    body: "Esta página no está disponible temporalmente mientras revisamos y actualizamos el contenido. Los clientes actuales pueden seguir recibiendo asistencia a través de los canales de contacto a continuación.",
    contactLabel: "Contactar soporte",
  },
  fr: {
    title: "Service temporairement indisponible",
    subtitle: "Nous mettons à jour notre contenu",
    body: "Cette page est temporairement indisponible pendant que nous révisons et mettons à jour notre contenu. Les clients existants peuvent continuer à recevoir une assistance via les canaux de contact ci-dessous.",
    contactLabel: "Contacter le support",
  },
  de: {
    title: "Dienst vorübergehend nicht verfügbar",
    subtitle: "Wir aktualisieren unsere Inhalte",
    body: "Diese Seite ist vorübergehend nicht verfügbar, während wir unsere Inhalte überprüfen und aktualisieren. Bestehende Kunden erhalten weiterhin Unterstützung über die unten aufgeführten Kontaktkanäle.",
    contactLabel: "Support kontaktieren",
  },
  ja: {
    title: "サービスは一時的にご利用いただけません",
    subtitle: "コンテンツを更新しています",
    body: "コンテンツの見直しと更新のため、このページは一時的にご利用いただけません。既存のお客様は、下記の連絡先よりサポートをお受けいただけます。",
    contactLabel: "サポートに連絡",
  },
  ko: {
    title: "서비스가 일시적으로 제공되지 않습니다",
    subtitle: "콘텐츠를 업데이트하고 있습니다",
    body: "콘텐츠 검토 및 업데이트를 위해 이 페이지는 일시적으로 제공되지 않습니다. 기존 고객은 아래 연락처를 통해 계속 지원을 받으실 수 있습니다.",
    contactLabel: "지원 문의",
  },
  pt: {
    title: "Serviço temporariamente indisponível",
    subtitle: "Estamos atualizando nosso conteúdo",
    body: "Esta página está temporariamente indisponível enquanto revisamos e atualizamos nosso conteúdo. Clientes existentes podem continuar a receber suporte pelos canais de contato abaixo.",
    contactLabel: "Contatar suporte",
  },
};

function resolveCopy(locale: string): NoticeCopy {
  if ((NOTICE_BY_LOCALE as Record<string, NoticeCopy>)[locale]) {
    return (NOTICE_BY_LOCALE as Record<string, NoticeCopy>)[locale];
  }
  return NOTICE_BY_LOCALE.en;
}

export function buildServiceUnavailableMetadata(locale: string): Metadata {
  const copy = resolveCopy(locale);
  return {
    title: copy.title,
    description: copy.subtitle,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
    alternates: { canonical: undefined, languages: {} },
    openGraph: undefined,
    twitter: undefined,
  };
}

interface ServiceUnavailableNoticeProps {
  locale: string;
  supportEmail?: string;
  supportTelegram?: string;
}

export function ServiceUnavailableNotice({
  locale,
  supportEmail,
  supportTelegram,
}: ServiceUnavailableNoticeProps) {
  const copy = resolveCopy(locale);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center"
      data-testid="service-unavailable-notice"
    >
      <div className="mx-auto w-full max-w-xl space-y-6">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {copy.subtitle}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {copy.title}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
          {copy.body}
        </p>

        {(supportEmail || supportTelegram) && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">
              {copy.contactLabel}
            </p>
            <ul className="space-y-1">
              {supportEmail && (
                <li>
                  <a
                    className="underline-offset-2 hover:underline"
                    href={`mailto:${supportEmail}`}
                  >
                    {supportEmail}
                  </a>
                </li>
              )}
              {supportTelegram && (
                <li>
                  Telegram:{" "}
                  <span className="font-mono text-foreground">
                    {supportTelegram}
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
