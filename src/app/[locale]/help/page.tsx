import type { Metadata } from "next";
import { Search, HelpCircle, Book, MessageCircle, Mail, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";

type Props = {
  params: Promise<{ locale: string }>;
};

const SUPPORT_EMAIL = SEO_CONFIG.supportContacts.email;
const MESSENGER_URL =
  SEO_CONFIG.supportContacts.messenger || SEO_CONFIG.supportContacts.facebook;
const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = SEO_CONFIG.url;
  const canonicalUrl = `${baseUrl}/${locale}/help`;

  const titles: Record<string, string> = {
    vi: "Trung Tâm Hỗ Trợ",
    en: "Help Center",
  };
  const descriptions: Record<string, string> = {
    vi: `Trung tâm hỗ trợ ${SEO_CONFIG.name}. Câu hỏi thường gặp, hướng dẫn sử dụng, và giải đáp mọi thắc mắc về tài khoản Google AI.`,
    en: `${SEO_CONFIG.name} Help Center. FAQ, guides, and answers for all Google AI questions.`,
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    keywords: "hỗ trợ Google AI, FAQ Google AI, hướng dẫn Gemini, Antigravity, help center",
    openGraph: {
      title: `${titles[locale] || titles.en} - ${SEO_CONFIG.name}`,
      description: descriptions[locale] || descriptions.en,
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "vi": `${baseUrl}/vi/help`,
        "en": `${baseUrl}/en/help`,
        "ru": `${baseUrl}/ru/help`,
        "zh": `${baseUrl}/zh/help`,
        "ar": `${baseUrl}/ar/help`,
        "es": `${baseUrl}/es/help`,
        "fr": `${baseUrl}/fr/help`,
        "de": `${baseUrl}/de/help`,
        "ja": `${baseUrl}/ja/help`,
        "ko": `${baseUrl}/ko/help`,
        "pt": `${baseUrl}/pt/help`,
        "x-default": `${baseUrl}/vi/help`,
      },
    },
  };
}

const helpCategories = [
  {
    icon: <HelpCircle className="h-8 w-8 text-blue-500" />,
    title: "Câu Hỏi Thường Gặp",
    description: "Những câu hỏi được hỏi nhiều nhất",
    count: 15,
    href: "#faq"
  },
  {
    icon: <Book className="h-8 w-8 text-green-500" />,
    title: "Hướng Dẫn Sử Dụng",
    description: "Đăng nhập và sử dụng Google AI từ A-Z",
    count: 8,
    href: "#guides"
  },
  {
    icon: <AlertCircle className="h-8 w-8 text-orange-500" />,
    title: "Xử Lý Sự Cố",
    description: "Giải quyết các vấn đề thường gặp",
    count: 6,
    href: "#troubleshoot"
  },
  {
    icon: <MessageCircle className="h-8 w-8 text-primary" />,
    title: "Liên Hệ Support",
    description: "Chat trực tiếp với đội ngũ hỗ trợ",
    count: "24/7",
    href: "#contact"
  }
];

const faqs = [
  {
    category: "Mua Hàng",
    questions: [
      {
        q: `Google AI mua tại ${SEO_CONFIG.name} có hoạt động bình thường không?`,
      a: `${SEO_CONFIG.name} là nhà bán lẻ độc lập (third-party reseller) - không liên kết với Google LLC Chúng tôi cung cấp tài khoản Google AI được bán lại hợp pháp. Sau khi nhận login qua email, bạn dùng được các tính năng theo quyền edu như collab realtime, thư viện team, version history và Dev Mode tương ứng.`
      },
      {
        q: "Tại sao giá rẻ hơn nhiều so với mua trực tiếp?",
        a: "Chúng tôi gom nhu cầu, tận dụng ưu đãi thanh toán quốc tế và chia sẻ lợi thế tỷ giá. Phí dịch vụ bạn trả bao gồm công hỗ trợ, hướng dẫn và chăm sóc sau kích hoạt nên vẫn tiết kiệm hơn tự xử lý lẻ."
      },
      {
        q: "Có những phương thức thanh toán nào?",
        a: "Hỗ trợ MoMo, ZaloPay, VietQR, chuyển khoản ngân hàng. Tất cả đều an toàn với mã hóa SSL và không lưu thông tin thẻ."
      }
    ]
  },
  {
    category: "Giao Hàng",
    questions: [
      {
        q: "Bao lâu sau thanh toán sẽ nhận được tài khoản?",
        a: "Ngay sau thanh toán thành công (1-5 phút), bạn sẽ nhận email chứa thông tin tài khoản và hướng dẫn đăng nhập chi tiết."
      },
      {
        q: "Nếu không nhận được email thì sao?",
        a: "Kiểm tra spam/junk folder. Nếu vẫn không có, liên hệ ngay Messenger hoặc Telegram để được hỗ trợ tức thì."
      }
    ]
  },
  {
    category: "Sử Dụng",
    questions: [
      {
        q: "Làm sao để đăng nhập Google AI?",
        a: "Mở gemini.google.com hoặc ứng dụng Google AI → đăng nhập bằng email và password được cung cấp trong email giao hàng. Sau đó kiểm tra quyền Pro/Ultra trên tài khoản."
      },
      {
        q: "Tài khoản có thể dùng trên nhiều máy không?",
        a: "Có, nhưng chỉ nên dùng trên 1-2 thiết bị cùng lúc. Đăng nhập quá nhiều nơi có thể khiến tài khoản bị tạm khóa."
      },
      {
        q: "Gói Google AI Pro khác Free như thế nào?",
        a: "Google AI Pro/Ultra mở thêm hạn mức Gemini nâng cao và tính năng Antigravity theo gói — phù hợp học tập và làm việc với AI. Chi tiết quyền lợi có thể thay đổi theo chính sách Google."
      }
    ]
  },
  {
    category: "Bảo Hành",
    questions: [
      {
        q: "Nếu tài khoản gặp sự cố thì sao?",
        a: "Bảo hành 1 đổi 1 cho lỗi shop trong khung đã công bố (thường 24h đầu). Liên hệ ngay kèm mã đơn để được hỗ trợ."
      },
      {
        q: "Có thể hoàn tiền không?",
        a: "Không hoàn tiền sau khi credential đã giao, trừ khi shop không thể bàn giao vì lý do từ phía chúng tôi (xem Điều khoản)."
      }
    ]
  }
];

const guides = [
  {
    title: "Đăng nhập Google AI lần đầu",
    description: "Hướng dẫn mở Gemini/Google AI, đăng nhập email/password và kiểm tra quyền Pro/Ultra",
    duration: "5 phút",
    difficulty: "Dễ"
  },
  {
    title: "Bắt đầu với Google AI & Antigravity",
    description: "Kiểm tra hạn mức Gemini, dùng Pro/Ultra và Antigravity theo gói đã mua",
    duration: "3 phút", 
    difficulty: "Dễ"
  },
  {
    title: "Sử Dụng AI Chat Hiệu Quả",
    description: "Tips và tricks để tận dụng tối đa AI assistant",
    duration: "10 phút",
    difficulty: "Trung bình"
  },
  {
    title: "Troubleshoot Các Lỗi Thường Gặp",
    description: "Giải quyết lỗi đăng nhập, API key, network",
    duration: "15 phút",
    difficulty: "Nâng cao"
  }
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Trung Tâm{" "}
              <span className="text-foreground">
                Hỗ Trợ
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Tìm câu trả lời nhanh chóng cho mọi thắc mắc về Google AI.
              Từ hướng dẫn đăng nhập đến xử lý sự cố, chúng tôi có tất cả!
            </p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm câu hỏi..." 
                className="pl-10 pr-4 py-3 text-lg"
              />
            </div>
          </div>

          {/* Help Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpCategories.map((category, index) => (
              <Link key={index} href={category.href}>
                <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <div className="flex justify-center mb-4">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{category.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                  <div className="text-xs text-primary font-medium">
                    {typeof category.count === 'number' ? `${category.count} bài viết` : category.count}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-background">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Câu Hỏi Thường Gặp
            </h2>
            <p className="text-lg text-muted-foreground">
              Những câu hỏi được khách hàng hỏi nhiều nhất
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-xl font-semibold mb-6 text-primary">{category.category}</h3>
                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <Card key={faqIndex} className="p-6">
                      <h4 className="font-semibold mb-3 text-foreground">{faq.q}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides Section */}
      <section id="guides" className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Hướng Dẫn Sử Dụng
            </h2>
            <p className="text-lg text-muted-foreground">
              Step-by-step guides để bạn dùng Google AI hiệu quả
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {guides.map((guide, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <p className="text-muted-foreground mb-4">{guide.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-green-600">⏱️ {guide.duration}</span>
                      <span className="text-blue-600">📊 {guide.difficulty}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Xem Hướng Dẫn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Troubleshoot Section */}
      <section id="troubleshoot" className="py-16 bg-background">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Xử Lý Sự Cố Thường Gặp
            </h2>
            <p className="text-lg text-muted-foreground">
              Giải pháp nhanh cho các vấn đề phổ biến
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <h3 className="font-semibold">Không đăng nhập được</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Kiểm tra email/password chính xác</li>
                <li>• Thử đăng xuất và đăng nhập lại</li>
                <li>• Xóa cache browser</li>
                <li>• Liên hệ support nếu vẫn lỗi</li>
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                <h3 className="font-semibold">Không thấy quyền Education</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Đăng xuất và đăng nhập lại email đã giao</li>
                <li>• Kiểm tra đúng workspace / team</li>
                <li>• Thử figma.com trên trình duyệt khác</li>
                <li>• Liên hệ support kèm mã đơn nếu vẫn lỗi</li>
              </ul>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                <h3 className="font-semibold">Chậm hoặc lag</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Giảm số file / tab mở cùng lúc</li>
                <li>• Tắt plugin không cần thiết</li>
                <li>• Dùng trình duyệt mới nhất</li>
                <li>• Kiểm tra kết nối mạng</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section id="contact" className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Vẫn Cần Hỗ Trợ?
            </h2>
            <p className="text-lg text-muted-foreground">
              Đội ngũ support chuyên nghiệp sẵn sàng giúp bạn 24/7
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {MESSENGER_URL && (
              <Card className="text-center p-6">
                <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Messenger</h3>
                <p className="text-sm text-muted-foreground mb-4">Facebook Messenger</p>
                <Link href={MESSENGER_URL} target="_blank">
                  <Button className="w-full" variant="outline">
                    Chat Ngay
                  </Button>
                </Link>
              </Card>
            )}

            {TELEGRAM_URL && (
              <Card className="text-center p-6">
                <MessageCircle className="h-8 w-8 text-sky-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Telegram</h3>
                <p className="text-sm text-muted-foreground mb-4">Group hỗ trợ Telegram</p>
                <Link href={TELEGRAM_URL} target="_blank">
                  <Button className="w-full" variant="outline">
                    Tham Gia Group
                  </Button>
                </Link>
              </Card>
            )}

            {SUPPORT_EMAIL && (
              <Card className="text-center p-6">
                <Mail className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-sm text-muted-foreground mb-4">Phản hồi trong 2 giờ</p>
                <Link href={`mailto:${SUPPORT_EMAIL}`}>
                  <Button className="w-full" variant="outline">
                    Gửi Email
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          <Card className="mt-8 p-6 border-sky-200 dark:border-sky-900 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/20 dark:to-indigo-950/20">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-sky-600 mt-0.5" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Giờ hỗ trợ</p>
                <p>Thứ 2 - Chủ nhật: 08:00 - 23:00</p>
                <p>Buổi tối và cuối tuần có thể phản hồi chậm hơn.</p>
                <p>Khung giờ phản hồi nhanh: Thứ 2 - Thứ 6, 08:00-12:00; 13:30-17:00.</p>
                <p>Giờ nghỉ trưa 12:00-13:30 có thể phản hồi chậm hoặc đến chiều.</p>
                <p>
                  Ưu tiên nhắn <strong>Telegram</strong> để được phản hồi nhanh hơn. Khẩn cấp hỗ trợ 24/7 qua
                  Telegram/Facebook.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-6 py-3 rounded-full">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Phản hồi trung bình trong 5 phút</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 