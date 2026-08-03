import type { Metadata } from "next";
import { Calendar, Download, ExternalLink, FileText, Globe, Users } from "lucide-react";
import Link from "next/link";

import { SEO_CONFIG, SITE_HOST } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

export const metadata: Metadata = {
  title: "Báo Chí",
  description: `Thông tin báo chí về ${SEO_CONFIG.name}. Press kit, tin tức truyền thông và các thông cáo báo chí về dịch vụ Google AI dành cho designer Việt Nam.`,
  keywords: "báo chí figma shop, press kit, tin tức truyền thông, thông cáo báo chí vietnam",
  openGraph: {
    title: `Báo Chí - ${SEO_CONFIG.name}`,
    description: `Thông tin báo chí và truyền thông về ${SEO_CONFIG.name}`,
    url: `${SEO_CONFIG.url}/press`,
  },
};

const pressReleases = [
  {
    title: `${SEO_CONFIG.name} Đạt Mốc 10,000+ Khách Hàng Tin Tưởng`,
    date: "15 Jan 2025",
    excerpt: "Dịch vụ Google AI hàng đầu cho designer Việt Nam đạt cột mốc quan trọng với hơn 10,000 khách hàng đã tin tưởng sử dụng.",
    category: "Milestone"
  },
  {
    title: `${SEO_CONFIG.name} Mở Rộng Dịch Vụ Hỗ Trợ 24/7`,
    date: "10 Jan 2025",
    excerpt: "Ra mắt hệ thống hỗ trợ khách hàng toàn thời gian với đội ngũ technical support chuyên nghiệp, cam kết phản hồi trong 5 phút.",
    category: "Service Update"
  },
  {
    title: "Partnership Với Các Developer Communities Lớn Tại VN",
    date: "5 Jan 2025",
    excerpt: "Hợp tác chiến lược với các cộng đồng developer hàng đầu Việt Nam để mang design tools đến gần hơn với nhà thiết kế.",
    category: "Partnership"
  },
  {
    title: `${SEO_CONFIG.name} Nhận Giải 'Best Design Tools Provider 2024'`,
    date: "28 Dec 2024",
    excerpt: "Được vinh danh tại Vietnam Tech Awards 2024 trong hạng mục nhà cung cấp công cụ thiết kế tốt nhất cho designer.",
    category: "Award"
  }
];

const mediaKit = [
  {
    title: "Logo & Brand Guidelines",
    description: "Logos in various formats, color palettes, and brand usage guidelines",
    fileSize: "2.5 MB",
    format: "ZIP",
    icon: <FileText className="h-6 w-6 text-blue-500" />
  },
  {
    title: "Company Fact Sheet",
    description: "Key statistics, company information, and leadership team details",
    fileSize: "1.2 MB",
    format: "PDF",
    icon: <FileText className="h-6 w-6 text-green-500" />
  },
  {
    title: "Product Screenshots",
    description: "High-resolution product images and interface screenshots",
    fileSize: "15.8 MB",
    format: "ZIP",
    icon: <FileText className="h-6 w-6 text-purple-500" />
  },
  {
    title: "Executive Photos",
    description: "Professional headshots of leadership team",
    fileSize: "8.4 MB",
    format: "ZIP",
    icon: <FileText className="h-6 w-6 text-orange-500" />
  }
];

const stats = [
  { number: "10,000+", label: "Khách hàng tin tưởng" },
  { number: "99.9%", label: "Tỷ lệ hài lòng" },
  { number: "2 phút", label: "Thời gian giao hàng TB" },
  { number: "24/7", label: "Hỗ trợ khách hàng" }
];

const mediaContacts = [
  {
    name: "Nguyễn Văn Minh",
    role: "Head of Communications",
    email: `press@${SITE_HOST}`,
    phone: "+84 346 713 864"
  },
  {
    name: "Trần Thị Lan",
    role: "Marketing Director", 
    email: `marketing@${SITE_HOST}`,
    phone: "+84 346 713 865"
  }
];

export default function PressPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Báo Chí &{" "}
              <span className="text-foreground">
                Truyền Thông
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Thông tin báo chí, press kit và các tin tức về {SEO_CONFIG.name} - 
              công ty tiên phong mang design tools đến nhà thiết kế Việt Nam.
            </p>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full">
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">Phục vụ 10,000+ developers trên toàn quốc</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Thông Cáo Báo Chí
            </h2>
            <p className="text-lg text-muted-foreground">
              Cập nhật tin tức và sự kiện mới nhất từ {SEO_CONFIG.name}
            </p>
          </div>

          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        {release.category}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {release.date}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-3">{release.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{release.excerpt}</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Đọc Đầy Đủ
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Media Kit & Press Resources
            </h2>
            <p className="text-lg text-muted-foreground">
              Download logos, photos và thông tin cần thiết cho báo chí
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {mediaKit.map((item, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  {item.icon}
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{item.format}</span>
                      <span>•</span>
                      <span>{item.fileSize}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">{item.description}</p>
                
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Card className="p-8 inline-block">
              <h3 className="font-semibold text-lg mb-4">Complete Press Kit</h3>
              <p className="text-muted-foreground mb-6">
                Download tất cả tài liệu press trong một file duy nhất
              </p>
              <Button size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download Complete Kit (25.2 MB)
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight mb-6">
                Về {SEO_CONFIG.name}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>{SEO_CONFIG.name}</strong> là nhà bán lẻ độc lập (third-party reseller) tài khoản Google AI, giúp designer Việt Nam tiếp cận công cụ thiết kế với chi phí tối ưu. {SEO_CONFIG.name} không liên kết với Google LLC
                </p>
                <p>
                  Thành lập năm 2021, chúng tôi đã phục vụ hơn 10,000 developers trên toàn quốc 
                  với tỷ lệ hài lòng 99.9% và hệ thống hỗ trợ 24/7.
                </p>
                <p>
                  Sứ mệnh của chúng tôi là nâng cao năng suất và chất lượng coding của 
                  developer Việt Nam thông qua việc cung cấp các công cụ AI tiên tiến 
                  với giá cả hợp lý.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Key Facts</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Thành lập: 2021</li>
                  <li>• Địa điểm: TP. Hồ Chí Minh, Việt Nam</li>
                  <li>• Khách hàng: 10,000+ developers</li>
                  <li>• Thị trường: Việt Nam</li>
                  <li>• Chuyên môn: AI coding tools, Developer experience</li>
                </ul>
              </Card>
              
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Core Values</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Accessibility:</strong> AI tools cho mọi developer</li>
                  <li>• <strong>Quality:</strong> Minh bạch về nguồn gốc và quyền lợi Google AI</li>
                  <li>• <strong>Support:</strong> Hỗ trợ tận tình 24/7</li>
                  <li>• <strong>Innovation:</strong> Luôn cập nhật công nghệ mới</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Media Contacts */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Liên Hệ Báo Chí
            </h2>
            <p className="text-lg text-muted-foreground">
              Liên hệ với đội ngũ truyền thông cho interview, thông tin, hoặc hợp tác
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {mediaContacts.map((contact, index) => (
              <Card key={index} className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{contact.name}</h3>
                <p className="text-primary font-medium mb-4">{contact.role}</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>📧 {contact.email}</p>
                  <p>📱 {contact.phone}</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Press Inquiry Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">For Media Inquiries:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Response time: Trong 2 giờ làm việc</li>
                    <li>• Interview availability: Theo lịch hẹn</li>
                    <li>• Languages: Tiếng Việt, English</li>
                    <li>• Format: Email, phone, video call</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">What We Can Provide:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Executive interviews</li>
                    <li>• Company statistics & data</li>
                    <li>• Product demonstrations</li>
                    <li>• Industry insights & trends</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>📧 Media hotline:</strong> {`press@${SITE_HOST}`} | 
                  <strong> 📱 Urgent:</strong> +84 346 713 864 (24/7)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-4">
              Muốn Biết Thêm Về {SEO_CONFIG.name}?
            </h2>
            <p className="text-muted-foreground mb-6">
              Liên hệ với đội ngũ press của chúng tôi hoặc tìm hiểu thêm về công ty
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg">
                  Liên Hệ Press Team
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  Tìm Hiểu Về Công Ty
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 