import type { Metadata } from "next";
import { Zap, Clock, Shield, Package, CheckCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

import { SEO_CONFIG, SITE_HOST } from "~/app";
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
  const canonicalUrl = `${baseUrl}/${locale}/shipping`;

  const titles: Record<string, string> = {
    vi: "Giao Hàng & Đổi Trả",
    en: "Shipping & Returns",
  };
  const descriptions: Record<string, string> = {
    vi: `Chính sách giao hàng tức thì và đổi trả tại ${SEO_CONFIG.name}. Nhận tài khoản Google AI qua email trong 1-5 phút sau thanh toán.`,
    en: `Instant delivery and return policy at ${SEO_CONFIG.name}. Receive Google AI account via email within 1-5 minutes after payment.`,
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    keywords: "giao hàng figma pro, đổi trả figma, giao hàng tức thì, delivery figma pro, shipping",
    openGraph: {
      title: `${titles[locale] || titles.en} - ${SEO_CONFIG.name}`,
      description: descriptions[locale] || descriptions.en,
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "vi": `${baseUrl}/vi/shipping`,
        "en": `${baseUrl}/en/shipping`,
        "ru": `${baseUrl}/ru/shipping`,
        "zh": `${baseUrl}/zh/shipping`,
        "ar": `${baseUrl}/ar/shipping`,
        "es": `${baseUrl}/es/shipping`,
        "fr": `${baseUrl}/fr/shipping`,
        "de": `${baseUrl}/de/shipping`,
        "ja": `${baseUrl}/ja/shipping`,
        "ko": `${baseUrl}/ko/shipping`,
        "pt": `${baseUrl}/pt/shipping`,
        "x-default": `${baseUrl}/vi/shipping`,
      },
    },
  };
}

const shippingFeatures = [
  {
    icon: <Zap className="h-8 w-8 text-yellow-500" />,
    title: "Giao Hàng Tức Thì",
    titleEn: "Instant Delivery",
    description: "1-5 phút sau thanh toán",
    descriptionEn: "1-5 min after payment"
  },
  {
    icon: <Package className="h-8 w-8 text-blue-500" />,
    title: "Giao Hàng Số",
    titleEn: "Digital Delivery",
    description: "Qua email, không cần địa chỉ",
    descriptionEn: "Via email, no address needed"
  },
  {
    icon: <Shield className="h-8 w-8 text-green-500" />,
    title: "Bảo Đảm Giao Hàng",
    titleEn: "Delivery Guarantee",
    description: "Đổi 1-đổi-1 nếu lỗi shop",
    descriptionEn: "1-for-1 if shop-side error"
  },
  {
    icon: <Clock className="h-8 w-8 text-primary" />,
    title: "24/7",
    titleEn: "24/7",
    description: "Giao hàng mọi lúc trong năm",
    descriptionEn: "Delivery year-round"
  }
];

export default async function ShippingPage({ params }: Props) {
  const { locale } = await params;
  const isVi = locale === "vi";
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Giao Hàng{" "}
              <span className="text-foreground">
                & Đổi Trả
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Giao hàng số tức thì qua email với tốc độ nhanh nhất thị trường. 
              Chính sách đổi trả linh hoạt và thân thiện với khách hàng.
            </p>
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Giao hàng nhanh nhất: 1-5 phút</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {shippingFeatures.map((feature, index) => (
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

      {/* Delivery Process */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                Quy Trình Giao Hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-6">
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h4 className="font-semibold mb-2">Thanh Toán</h4>
                    <p className="text-sm text-muted-foreground">SePay/VietQR, crypto, wallet balance</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 font-bold">2</span>
                    </div>
                    <h4 className="font-semibold mb-2">Xử Lý Tự Động</h4>
                    <p className="text-sm text-muted-foreground">Hệ thống tự động verify và chuẩn bị tài khoản</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-yellow-600 font-bold">3</span>
                    </div>
                    <h4 className="font-semibold mb-2">Gửi Email</h4>
                    <p className="text-sm text-muted-foreground">Gửi thông tin tài khoản qua email đã đăng ký</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">4</span>
                    </div>
                    <h4 className="font-semibold mb-2">Sử Dụng Ngay</h4>
                    <p className="text-sm text-muted-foreground">Đăng nhập và trải nghiệm Google AI</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">⚡ Thời gian giao hàng:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• <strong>Giờ hành chính (8h-22h):</strong> 1-3 phút</li>
                    <li>• <strong>Ngoài giờ hành chính:</strong> 3-5 phút</li>
                    <li>• <strong>Cuối tuần & lễ:</strong> 2-5 phút</li>
                    <li>• <strong>Tối đa:</strong> 10 phút (trường hợp đặc biệt)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Thông Tin Giao Hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <h4 className="font-semibold">Email sẽ bao gồm:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Thông tin đăng nhập:</strong> Email và password tài khoản Google AI</li>
                  <li><strong>Hướng dẫn sử dụng:</strong> Step-by-step setup và enable tính năng AI</li>
                  <li><strong>Thông tin gói:</strong> Loại gói, thời hạn sử dụng, tính năng được kích hoạt</li>
                    <li><strong>Support contacts:</strong> Messenger, Telegram để được hỗ trợ</li>
                  <li><strong>Điều khoản sử dụng:</strong> Quy định và lưu ý quan trọng</li>
                </ul>

                <h4 className="font-semibold">Lưu ý quan trọng:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Kiểm tra cả thư mục Spam/Junk nếu không thấy email</li>
                  <li>Email được gửi từ địa chỉ: {`noreply@${SITE_HOST}`}</li>
                  <li>Thời gian giao hàng tính từ khi thanh toán được xác nhận</li>
                  <li>Bảo mật thông tin đăng nhập và không chia sẻ cho người khác</li>
                </ul>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <strong>🔔 Không nhận được email?</strong> Liên hệ ngay Messenger để được gửi lại tức thì!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8 mb-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-500" />
                Chính Sách Đổi Trả
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <h4 className="font-semibold text-green-600">Đổi tài khoản mới (lỗi shop, 24h đầu):</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Tài khoản không đăng nhập được hoặc thiếu Pro trong 24h đầu</li>
                  <li>Thời gian sử dụng không đúng với gói đã mua (lỗi shop)</li>
                </ul>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4">
                  <p className="text-orange-800 text-sm font-medium">
                    Sau khi credential đã giao / kích hoạt: không hoàn tiền (hàng số).
                    Không bảo hành nếu Figma suspend/terminate do vi phạm ToS.
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">Không áp dụng đổi trả khi:</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Khách hàng tự thay đổi thông tin tài khoản</li>
                    <li>• Sử dụng sai mục đích hoặc vi phạm ToS Figma</li>
                    <li>• Chia sẻ tài khoản hoặc sử dụng thương mại</li>
                    <li>• Quá thời hạn đổi trả quy định</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Hỗ Trợ Giao Hàng & Đổi Trả</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Liên hệ nhanh (24/7):</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {MESSENGER_URL && <li>💬 <strong>Messenger:</strong> {MESSENGER_URL}</li>}
                    {TELEGRAM_HANDLE && <li>📱 <strong>Telegram:</strong> {TELEGRAM_HANDLE}</li>}
                    {SUPPORT_EMAIL && <li>📧 <strong>Email:</strong> {SUPPORT_EMAIL}</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Thông tin cần cung cấp:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Email đã sử dụng để đặt hàng</li>
                    <li>• Mã giao dịch hoặc thông tin thanh toán</li>
                    <li>• Thời gian đặt hàng (ước chừng)</li>
                    <li>• Vấn đề gặp phải (nếu có)</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm">
                  <strong>✅ Cam kết dịch vụ:</strong> Phản hồi trong 5 phút, xử lý đổi tài khoản
                  trong 24 giờ nếu lỗi từ phía shop.
                </p>
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
              Trải Nghiệm Giao Hàng Nhanh Nhất
            </h2>
            <p className="text-muted-foreground mb-6">
              Từ thanh toán đến sử dụng chỉ trong vài phút
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products">
                <Button size="lg">
                  Đặt Hàng - Nhận Ngay
                </Button>
              </Link>
              <Link href="/help">
                <Button size="lg" variant="outline">
                  Hướng Dẫn Chi Tiết
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 