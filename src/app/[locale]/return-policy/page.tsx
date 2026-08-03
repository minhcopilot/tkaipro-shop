import type { Metadata } from "next";
import { RotateCcw, Shield, AlertTriangle, CheckCircle, XCircle, HelpCircle, MessageCircle, FileText } from "lucide-react";
import Link from "next/link";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

type Props = {
  params: Promise<{ locale: string }>;
};

const SUPPORT_EMAIL = SEO_CONFIG.supportContacts.email;
const MESSENGER_URL =
  SEO_CONFIG.supportContacts.messenger || SEO_CONFIG.supportContacts.facebook;
const TELEGRAM_HANDLE = SEO_CONFIG.supportContacts.telegram;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/return-policy`;

  const titles: Record<string, string> = {
    vi: "Chính Sách Đổi Trả - Dịch Vụ Số",
    en: "Return Policy - Digital Services",
    ru: "Политика возврата - Цифровые услуги",
    zh: "退款政策 - 数字服务",
    ar: "سياسة الإرجاع - الخدمات الرقمية",
    es: "Política de Devoluciones - Servicios Digitales",
    fr: "Politique de Retour - Services Numériques",
    de: "Rückgaberichtlinie - Digitale Dienste",
    ja: "返品ポリシー - デジタルサービス",
    ko: "반품 정책 - 디지털 서비스",
    pt: "Política de Devolução - Serviços Digitais",
  };
  
  const descriptions: Record<string, string> = {
    vi: `Chính sách đổi trả cho dịch vụ số tại ${SEO_CONFIG.name}. Sản phẩm kỹ thuật số không hoàn tiền sau khi kích hoạt. Hỗ trợ xử lý lỗi nếu dịch vụ không hoạt động.`,
    en: `Return policy for digital services at ${SEO_CONFIG.name}. Digital products are non-refundable after activation. Support available for technical issues.`,
    ru: `Политика возврата цифровых услуг в ${SEO_CONFIG.name}. Цифровые продукты не подлежат возврату после активации.`,
    zh: `${SEO_CONFIG.name} 数字服务退款政策。数字产品激活后不可退款。如服务无法使用，提供技术支持。`,
    ar: `سياسة الإرجاع للخدمات الرقمية في ${SEO_CONFIG.name}. المنتجات الرقمية غير قابلة للاسترداد بعد التفعيل.`,
    es: `Política de devolución para servicios digitales en ${SEO_CONFIG.name}. Los productos digitales no son reembolsables después de la activación.`,
    fr: `Politique de retour pour les services numériques chez ${SEO_CONFIG.name}. Les produits numériques ne sont pas remboursables après activation.`,
    de: `Rückgaberichtlinie für digitale Dienste bei ${SEO_CONFIG.name}. Digitale Produkte sind nach der Aktivierung nicht erstattungsfähig.`,
    ja: `${SEO_CONFIG.name}のデジタルサービス返品ポリシー。デジタル製品はアクティベーション後の返金不可。`,
    ko: `${SEO_CONFIG.name} 디지털 서비스 반품 정책. 디지털 제품은 활성화 후 환불되지 않습니다.`,
    pt: `Política de devolução para serviços digitais na ${SEO_CONFIG.name}. Produtos digitais não são reembolsáveis após ativação.`,
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    keywords: "return policy figma pro, refund policy digital service, chính sách đổi trả figma, hoàn tiền figma pro, digital product refund",
    openGraph: {
      title: `${titles[locale] || titles.en} - ${SEO_CONFIG.name}`,
      description: descriptions[locale] || descriptions.en,
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "vi": `${baseUrl}/vi/return-policy`,
        "en": `${baseUrl}/en/return-policy`,
        "ru": `${baseUrl}/ru/return-policy`,
        "zh": `${baseUrl}/zh/return-policy`,
        "ar": `${baseUrl}/ar/return-policy`,
        "es": `${baseUrl}/es/return-policy`,
        "fr": `${baseUrl}/fr/return-policy`,
        "de": `${baseUrl}/de/return-policy`,
        "ja": `${baseUrl}/ja/return-policy`,
        "ko": `${baseUrl}/ko/return-policy`,
        "pt": `${baseUrl}/pt/return-policy`,
        "x-default": `${baseUrl}/vi/return-policy`,
      },
    },
  };
}

const returnPolicyFeatures = [
  {
    icon: <FileText className="h-8 w-8 text-blue-500" />,
    title: "Dịch Vụ Số",
    titleEn: "Digital Service",
    description: "Sản phẩm 100% kỹ thuật số",
    descriptionEn: "100% digital products"
  },
  {
    icon: <Shield className="h-8 w-8 text-green-500" />,
    title: "Hỗ Trợ Lỗi",
    titleEn: "Error Support",
    description: "Đổi mới nếu không hoạt động",
    descriptionEn: "Replacement if not working"
  },
  {
    icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
    title: "Không Hoàn Tiền",
    titleEn: "No Refund",
    description: "Sau khi kích hoạt thành công",
    descriptionEn: "After successful activation"
  },
  {
    icon: <MessageCircle className="h-8 w-8 text-primary" />,
    title: "Hỗ Trợ 24/7",
    titleEn: "24/7 Support",
    description: "Xử lý mọi vấn đề nhanh chóng",
    descriptionEn: "Quick issue resolution"
  }
];

export default async function ReturnPolicyPage({ params }: Props) {
  const { locale } = await params;
  const isVi = locale === "vi";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {isVi ? "Chính Sách" : "Return"}{" "}
              <span className="text-foreground">
                {isVi ? "Đổi Trả" : "Policy"}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {isVi 
                ? `${SEO_CONFIG.name} cung cấp dịch vụ số (digital service). Vui lòng đọc kỹ chính sách đổi trả trước khi mua hàng để đảm bảo quyền lợi của bạn.`
                : `${SEO_CONFIG.name} provides digital services. Please read our return policy carefully before purchasing to ensure your rights are protected.`
              }
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full">
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isVi ? "Chính sách áp dụng cho dịch vụ số" : "Policy applies to digital services"}
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {returnPolicyFeatures.map((feature, index) => (
              <Card key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{isVi ? feature.title : feature.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isVi ? feature.description : feature.descriptionEn}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Policy Details */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* Important Notice */}
          <Card className="p-8 mb-8 border-2 border-orange-200 bg-orange-50/50">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                {isVi ? "Lưu Ý Quan Trọng - Dịch Vụ Số" : "Important Notice - Digital Service"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-orange-900 font-medium">
                  {isVi 
                    ? `Tất cả sản phẩm của ${SEO_CONFIG.name} là DỊCH VỤ SỐ (Digital Service), bao gồm:`
                    : `All products from ${SEO_CONFIG.name} are DIGITAL SERVICES, including:`
                  }
                </p>
                <ul className="list-disc list-inside text-orange-800 space-y-2">
                  <li>{isVi ? "Tài khoản Google AI (cấp tài khoản / nâng cấp chính chủ)" : "Google AI accounts (delivery / own-account upgrade)"}</li>
                  <li>{isVi ? "Dịch vụ hỗ trợ thanh toán và kích hoạt" : "Payment and activation support services"}</li>
                  <li>{isVi ? "Hỗ trợ kỹ thuật và hướng dẫn sử dụng" : "Technical support and usage guidance"}</li>
                </ul>
                <div className="bg-orange-100 p-4 rounded-lg border border-orange-300 mt-4">
                  <p className="text-orange-900 text-sm font-semibold">
                    ⚠️ {isVi 
                      ? "Do đặc thù dịch vụ số, sản phẩm KHÔNG THỂ HOÀN TRẢ sau khi đã kích hoạt thành công."
                      : "Due to the nature of digital services, products CANNOT BE REFUNDED after successful activation."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* When Refund/Exchange is Supported */}
          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {isVi ? "Trường Hợp Được Hỗ Trợ Đổi / Xử Lý" : "Cases Eligible for Exchange / Support"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {isVi 
                    ? "Chúng tôi cam kết hỗ trợ khách hàng trong các trường hợp sau:"
                    : "We are committed to supporting customers in the following cases:"
                  }
                </p>
                
                <h4 className="font-semibold text-green-600">
                  {isVi ? "✅ Đổi tài khoản mới (1-đổi-1, trong 24h đầu):" : "✅ Free 1-for-1 replacement (within first 24h):"}
                </h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>{isVi ? "Tài khoản không thể đăng nhập ngay sau khi nhận (lỗi từ phía shop)" : "Account cannot login immediately after receiving (shop's fault)"}</li>
                  <li>{isVi ? "Thiếu tính năng Pro trong 24 giờ đầu sau khi đăng nhập" : "Missing Pro features within first 24h after login"}</li>
                  <li>{isVi ? "Thời gian sử dụng không đúng với gói đã mua (lỗi shop)" : "Usage time does not match purchased package (shop's fault)"}</li>
                </ul>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4">
                  <p className="text-orange-800 text-sm font-medium">
                    {isVi
                      ? "Sau khi credential đã giao / account đã kích hoạt: KHÔNG hoàn tiền (đặc thù hàng số). Không bảo hành nếu Figma suspend/terminate do vi phạm ToS của họ."
                      : "After credentials delivered / account activated: NO refund (digital goods). No warranty if Figma suspends/terminates due to their ToS."}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
                  <h4 className="font-semibold text-green-800 mb-2">
                    {isVi ? "📋 Quy trình xử lý:" : "📋 Processing procedure:"}
                  </h4>
                  <ol className="text-green-700 text-sm space-y-1">
                    <li>1. {isVi ? "Liên hệ hỗ trợ qua Messenger hoặc Telegram" : "Contact support via Messenger or Telegram"}</li>
                    <li>2. {isVi ? "Cung cấp mã đơn hàng và mô tả chi tiết vấn đề" : "Provide order number and detailed problem description"}</li>
                    <li>3. {isVi ? "Đội ngũ kỹ thuật kiểm tra và xác nhận" : "Technical team reviews and confirms"}</li>
                    <li>4. {isVi ? "Xử lý đổi/hoàn trong vòng 2-24 giờ" : "Process exchange/refund within 2-24 hours"}</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* When Refund is NOT Supported */}
          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                {isVi ? "Trường Hợp KHÔNG Hoàn Tiền" : "Cases NOT Eligible for Refund"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <p className="text-red-800 font-medium mb-4">
                    {isVi 
                      ? "Do đặc thù của dịch vụ số, chúng tôi KHÔNG THỂ hoàn tiền trong các trường hợp sau:"
                      : "Due to the nature of digital services, we CANNOT refund in the following cases:"
                    }
                  </p>
                  <ul className="text-red-700 space-y-3">
                    <li className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>{isVi ? "Đã kích hoạt thành công:" : "Successfully activated:"}</strong> {isVi ? "Tài khoản đã được đăng nhập và sử dụng bình thường" : "Account has been logged in and used normally"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>{isVi ? "Thay đổi ý định:" : "Change of mind:"}</strong> {isVi ? "Khách hàng đổi ý sau khi mua (không áp dụng cho dịch vụ số)" : "Customer changes mind after purchase (not applicable for digital services)"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>{isVi ? "Tự thay đổi thông tin:" : "Self-modified info:"}</strong> {isVi ? "Khách hàng tự thay đổi email, mật khẩu, profile" : "Customer changed email, password, profile themselves"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>{isVi ? "Vi phạm điều khoản:" : "Terms violation:"}</strong> {isVi ? "Sử dụng sai mục đích hoặc vi phạm ToS của Figma" : "Misuse or violation of Figma's ToS"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>{isVi ? "Chia sẻ tài khoản:" : "Account sharing:"}</strong> {isVi ? "Chia sẻ cho người khác hoặc sử dụng thương mại" : "Sharing with others or commercial use"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>{isVi ? "Hết thời hạn:" : "Expired:"}</strong> {isVi ? "Tài khoản hết hạn theo đúng gói đã mua" : "Account expired according to purchased package"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span><strong>{isVi ? "Lỗi từ Figma:" : "Figma's issues:"}</strong> {isVi ? "Server down, maintenance từ phía Google LLC" : "Server down, maintenance from Google LLC"}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why No Refund for Digital Services */}
          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                {isVi ? "Tại Sao Dịch Vụ Số Không Hoàn Tiền?" : "Why No Refund for Digital Services?"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {isVi 
                    ? "Không giống như sản phẩm vật lý, dịch vụ số có những đặc điểm riêng:"
                    : "Unlike physical products, digital services have unique characteristics:"
                  }
                </p>
                
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">1</span>
                    <span><strong>{isVi ? "Không thể thu hồi:" : "Cannot be retrieved:"}</strong> {isVi ? "Khi tài khoản đã được kích hoạt và sử dụng, dịch vụ đã được \"giao\" hoàn toàn. Không có cách nào \"lấy lại\" thời gian sử dụng đã qua." : "Once activated and used, the service has been fully \"delivered\". There's no way to \"take back\" used time."}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">2</span>
                    <span><strong>{isVi ? "Chi phí đã phát sinh:" : "Costs incurred:"}</strong> {isVi ? "Chúng tôi đã thanh toán cho nhà cung cấp (Google LLC) ngay khi khách hàng đặt mua, chi phí này không thể hoàn lại." : "We have paid the provider (Google LLC) upon purchase, these costs cannot be recovered."}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">3</span>
                    <span><strong>{isVi ? "Bảo vệ khỏi lạm dụng:" : "Prevent abuse:"}</strong> {isVi ? "Chính sách này giúp ngăn chặn việc lạm dụng - sử dụng xong rồi yêu cầu hoàn tiền." : "This policy helps prevent abuse - using the service then requesting refund."}</span>
                  </li>
                </ul>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>{isVi ? "Lời khuyên:" : "Tip:"}</strong> {isVi 
                      ? "Trước khi mua, hãy tìm hiểu kỹ về Google AI và các tính năng. Bạn có thể liên hệ chúng tôi để được tư vấn miễn phí trước khi quyết định."
                      : "Before purchasing, research Google AI and its features thoroughly. You can contact us for free consultation before making a decision."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Commitment */}
          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                {isVi ? "Cam Kết Của Chúng Tôi" : "Our Commitment"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {isVi 
                    ? "Mặc dù không hoàn tiền sau khi kích hoạt, chúng tôi cam kết:"
                    : "Although no refund after activation, we commit to:"
                  }
                </p>
                
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>{isVi ? "Cung cấp sản phẩm đúng như mô tả 100%" : "Provide products exactly as described 100%"}</li>
                  <li>{isVi ? "Hỗ trợ kỹ thuật suốt thời gian sử dụng" : "Technical support throughout usage period"}</li>
                  <li>{isVi ? "Đổi mới miễn phí nếu sản phẩm có lỗi từ shop (trong 24h đầu)" : "Free replacement if product has shop-side issues (within first 24h)"}</li>
                  <li>{isVi ? "Phản hồi nhanh chóng mọi thắc mắc (trong 5 phút)" : "Quick response to all inquiries (within 5 minutes)"}</li>
                  <li>{isVi ? "Minh bạch về chính sách và điều khoản" : "Transparent about policies and terms"}</li>
                </ul>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
                  <p className="text-green-800 text-sm">
                    ✅ <strong>{isVi ? "Lưu ý:" : "Note:"}</strong> {isVi 
                      ? "Chính sách hoàn tiền thống nhất: không refund sau khi giao credential. Chỉ bảo hành 1-đổi-1 cho lỗi shop trong 24h đầu."
                      : "Unified refund policy: no refund after credential delivery. 1-for-1 replacement only for shop-side errors within first 24h."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact for Support */}
          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{isVi ? "Liên Hệ Hỗ Trợ Đổi Trả" : "Contact for Return Support"}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {isVi 
                    ? "Nếu gặp vấn đề với sản phẩm, vui lòng liên hệ ngay để được hỗ trợ:"
                    : "If you have issues with your product, please contact us immediately for support:"
                  }
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">{isVi ? "Liên hệ khẩn cấp (24/7):" : "Emergency contact (24/7):"}</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {MESSENGER_URL && <li>💬 <strong>Messenger:</strong> {MESSENGER_URL}</li>}
                      {TELEGRAM_HANDLE && <li>📱 <strong>Telegram:</strong> {TELEGRAM_HANDLE}</li>}
                      {SUPPORT_EMAIL && <li>📧 <strong>Email:</strong> {SUPPORT_EMAIL}</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">{isVi ? "Thông tin cần cung cấp:" : "Information needed:"}</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• {isVi ? "Mã đơn hàng hoặc email giao dịch" : "Order number or transaction email"}</li>
                      <li>• {isVi ? "Mô tả chi tiết vấn đề gặp phải" : "Detailed description of the issue"}</li>
                      <li>• {isVi ? "Screenshot lỗi (nếu có)" : "Error screenshots (if any)"}</li>
                      <li>• {isVi ? "Thời gian phát sinh vấn đề" : "Time when issue occurred"}</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                  <p className="text-yellow-800 text-sm">
                    ⏰ <strong>{isVi ? "Thời gian xử lý:" : "Processing time:"}</strong> {isVi 
                      ? "Phản hồi trong 5 phút, xử lý đổi/hoàn trong 2-24 giờ tùy trường hợp."
                      : "Response within 5 minutes, exchange/refund processing within 2-24 hours depending on the case."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-4">
              {isVi ? "Mua Sắm An Tâm Với Chính Sách Rõ Ràng" : "Shop with Confidence with Clear Policies"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isVi 
                ? `${SEO_CONFIG.name} cam kết minh bạch trong mọi giao dịch`
                : `${SEO_CONFIG.name} commits to transparency in all transactions`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg">
                  {isVi ? "Xem Sản Phẩm" : "View Products"}
                </Button>
              </Link>
              <Link href="/warranty">
                <Button size="lg" variant="outline">
                  {isVi ? "Chính Sách Bảo Hành" : "Warranty Policy"}
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  {isVi ? "Liên Hệ Tư Vấn" : "Contact Us"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
