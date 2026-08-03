import type { Metadata } from "next";
import { Shield, Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

type Props = {
  params: Promise<{ locale: string }>;
};

const MESSENGER_URL =
  SEO_CONFIG.supportContacts.messenger || SEO_CONFIG.supportContacts.facebook;
const TELEGRAM_HANDLE = SEO_CONFIG.supportContacts.telegram;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/warranty`;

  const titles: Record<string, string> = {
    vi: "Bảo Hành",
    en: "Warranty Policy",
  };
  const descriptions: Record<string, string> = {
    vi: `Chính sách bảo hành tài khoản Google AI tại ${SEO_CONFIG.name}. Bảo hành 1 đổi 1 cho lỗi shop trong 24h đầu. Không hoàn tiền sau khi giao credential.`,
    en: `Google AI account warranty at ${SEO_CONFIG.name}. 1-for-1 replacement for shop-side errors within 24h. No refund after credentials delivered.`,
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    keywords: "bảo hành figma pro, chính sách bảo hành figma, đổi trả tài khoản figma, warranty figma pro",
    openGraph: {
      title: `${titles[locale] || titles.en} - ${SEO_CONFIG.name}`,
      description: descriptions[locale] || descriptions.en,
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "vi": `${baseUrl}/vi/warranty`,
        "en": `${baseUrl}/en/warranty`,
        "ru": `${baseUrl}/ru/warranty`,
        "zh": `${baseUrl}/zh/warranty`,
        "ar": `${baseUrl}/ar/warranty`,
        "es": `${baseUrl}/es/warranty`,
        "fr": `${baseUrl}/fr/warranty`,
        "de": `${baseUrl}/de/warranty`,
        "ja": `${baseUrl}/ja/warranty`,
        "ko": `${baseUrl}/ko/warranty`,
        "pt": `${baseUrl}/pt/warranty`,
        "x-default": `${baseUrl}/vi/warranty`,
      },
    },
  };
}

const warrantyFeatures = [
  {
    icon: <Shield className="h-8 w-8 text-green-500" />,
    title: "Bảo Hành 1 Đổi 1",
    titleEn: "1-for-1 Replacement",
    description: "Lỗi shop trong 24h đầu",
    descriptionEn: "Shop-side errors within 24h"
  },
  {
    icon: <Clock className="h-8 w-8 text-primary" />,
    title: "Xử Lý Nhanh",
    titleEn: "Fast Processing",
    description: "Trong vòng 24 giờ",
    descriptionEn: "Within 24 hours"
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-orange-500" />,
    title: "Không Hoàn Tiền",
    titleEn: "No Refund",
    description: "Sau khi giao credential",
    descriptionEn: "After credential delivery"
  },
  {
    icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
    title: "Không Bảo Hành",
    titleEn: "No Warranty",
    description: "Google suspend/terminate",
    descriptionEn: "Google suspend/terminate"
  }
];

export default async function WarrantyPage({ params }: Props) {
  const { locale } = await params;
  const isVi = locale === "vi";
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Chính Sách{" "}
              <span className="text-foreground">
                Bảo Hành
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {SEO_CONFIG.name} cam kết bảo vệ quyền lợi khách hàng với chính sách bảo hành 
              tận tình và minh bạch. An tâm mua sắm với sự đảm bảo tốt nhất.
            </p>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Bảo hành toàn diện cho mọi sản phẩm</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {warrantyFeatures.map((feature, index) => (
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

      {/* Warranty Details */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Bảo Hành 1 Đổi 1 (Lỗi Shop — 24h Đầu)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Trong vòng 24 giờ đầu sau khi nhận credential, nếu gặp lỗi từ phía shop
                  (không đăng nhập được, thiếu Pro), chúng tôi sẽ đổi tài khoản mới miễn phí.
                  Sau khi credential đã giao và kích hoạt thành công, không hoàn tiền (hàng số).
                </p>
                
                <h4 className="font-semibold text-green-600">Được bảo hành 1-đổi-1 khi:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Tài khoản không đăng nhập được ngay sau khi nhận (lỗi shop)</li>
                  <li>Thiếu tính năng Pro trong 24 giờ đầu sau khi đăng nhập</li>
                  <li>Thời gian sử dụng không đúng với gói đã mua (lỗi shop)</li>
                </ul>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Quy trình bảo hành:</h4>
                  <ol className="text-green-700 text-sm space-y-1">
                    <li>1. Liên hệ ngay qua Messenger</li>
                    <li>2. Cung cấp thông tin đơn hàng và mô tả sự cố</li>
                    <li>3. Nhận tài khoản mới trong vòng 2-6 giờ</li>
                    <li>4. Tài khoản cũ sẽ được thu hồi hoặc vô hiệu hóa</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Trường Hợp Không Được Bảo Hành / Không Hoàn Tiền
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <ul className="text-red-700 text-sm space-y-2">
                    <li>• <strong>Đã giao credential / kích hoạt thành công</strong> — hàng số không hoàn tiền</li>
                    <li>• <strong>Google suspend/terminate</strong> do vi phạm ToS của họ</li>
                    <li>• <strong>Khách hàng tự thay đổi thông tin tài khoản</strong> (email, password, profile)</li>
                    <li>• <strong>Sử dụng không đúng mục đích</strong> hoặc vi phạm Terms of Service của Google</li>
                    <li>• <strong>Chia sẻ tài khoản</strong> cho người khác hoặc sử dụng commercial</li>
                    <li>• <strong>Tài khoản hết hạn</strong> theo đúng gói đã mua</li>
                    <li>• <strong>Sự cố từ phía Google</strong> (server down, maintenance...)</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Lưu ý:</strong> Trong các trường hợp đặc biệt, chúng tôi vẫn sẽ hỗ trợ 
                  tối đa có thể dựa trên từng tình huống cụ thể.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Hỗ Trợ Mở Rộng
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <h4 className="font-semibold">Hỗ trợ kỹ thuật suốt đời:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Hướng dẫn cài đặt và setup từ A-Z</li>
                  <li>Giải đáp thắc mắc về tính năng và cách sử dụng</li>
                  <li>Hỗ trợ xử lý sự cố và tối ưu performance</li>
                  <li>Update thông tin về bản cập nhật mới</li>
                  <li>Tư vấn nâng cấp gói phù hợp</li>
                </ul>

                <h4 className="font-semibold">Ưu đãi khách hàng cũ:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Discount 5-10% cho lần gia hạn tiếp theo</li>
                  <li>Ưu tiên hỗ trợ và phản hồi nhanh</li>
                  <li>Thông báo sớm về các chương trình khuyến mãi</li>
                  <li>Chính sách bảo hành mở rộng cho khách VIP</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Liên Hệ Bảo Hành</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Khi cần bảo hành hoặc hỗ trợ, liên hệ ngay qua các kênh sau để được xử lý nhanh nhất:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Liên hệ khẩn cấp (24/7):</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      {MESSENGER_URL && <li>💬 <strong>Messenger:</strong> {MESSENGER_URL}</li>}
                      {TELEGRAM_HANDLE && <li>📱 <strong>Telegram:</strong> {TELEGRAM_HANDLE}</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Thông tin cần cung cấp:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Mã đơn hàng hoặc email giao dịch</li>
                      <li>• Mô tả chi tiết sự cố gặp phải</li>
                      <li>• Screenshot lỗi (nếu có)</li>
                      <li>• Thời gian gặp sự cố</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <strong>💡 Mẹo:</strong> Để được hỗ trợ nhanh nhất, hãy liên hệ qua Messenger 
                    kèm theo thông tin đơn hàng. Chúng tôi cam kết phản hồi 
                    trong vòng 5 phút và xử lý trong 24 giờ.
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
              An Tâm Mua Sắm Với Chính Sách Bảo Hành Tốt Nhất
            </h2>
            <p className="text-muted-foreground mb-6">
              {SEO_CONFIG.name} luôn đặt quyền lợi khách hàng lên hàng đầu
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg">
                  Mua Ngay — Chính Sách Rõ Ràng
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Tư Vấn Bảo Hành
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 