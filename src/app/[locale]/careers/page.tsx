import type { Metadata } from "next";
import { Briefcase, Users, Zap, Heart, Code, MessageCircle } from "lucide-react";
import Link from "next/link";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

export const metadata: Metadata = {
  title: "Tuyển Dụng",
  description: `Cơ hội nghề nghiệp tại ${SEO_CONFIG.name}. Tham gia đội ngũ phát triển công nghệ thiết kế và mang giá trị đến cộng đồng designer Việt Nam.`,
  keywords: "tuyển dụng figma shop, careers vietnam, việc làm tech, tuyển developer",
  openGraph: {
    title: `Tuyển Dụng - ${SEO_CONFIG.name}`,
    description: "Tham gia đội ngũ và xây dựng tương lai thiết kế số tại Việt Nam",
    url: `${SEO_CONFIG.url}/careers`,
  },
};

const SUPPORT_EMAIL = SEO_CONFIG.supportContacts.email;
const MESSENGER_URL =
  SEO_CONFIG.supportContacts.messenger || SEO_CONFIG.supportContacts.facebook;

const benefits = [
  {
    icon: <Zap className="h-6 w-6 text-yellow-500" />,
    title: "Công Nghệ Tiên Tiến",
    description: "Làm việc với AI, automation và các tech stack hiện đại nhất"
  },
  {
    icon: <Users className="h-6 w-6 text-blue-500" />,
    title: "Team Tài Năng",
    description: "Cộng tác với những người giỏi nhất trong ngành"
  },
  {
    icon: <Heart className="h-6 w-6 text-red-500" />,
    title: "Môi Trường Thân Thiện",
    description: "Văn hóa cởi mở, học hỏi và phát triển bản thân"
  },
  {
    icon: <Code className="h-6 w-6 text-green-500" />,
    title: "Sản Phẩm Ý Nghĩa",
    description: "Tạo ra giá trị thực cho cộng đồng developer Việt Nam"
  }
];

const openPositions = [
  {
    title: "Senior Full-stack Developer",
    department: "Engineering",
    location: "TP. Hồ Chí Minh",
    type: "Full-time",
    description: `Phát triển và tối ưu hệ thống backend, frontend cho platform ${SEO_CONFIG.name}`,
    requirements: [
      "3+ năm kinh nghiệm Full-stack development",
      "Thành thạo React, Node.js, TypeScript",
      "Kinh nghiệm với NextJS, tRPC, Drizzle ORM",
      "Hiểu biết về CI/CD, Docker, cloud deployment"
    ],
    salary: "25-40M VND"
  },
  {
    title: "Customer Success Specialist",
    department: "Support",
    location: "Remote/Hybrid",
    type: "Full-time",
    description: "Hỗ trợ khách hàng và đảm bảo trải nghiệm tốt nhất với sản phẩm",
    requirements: [
      "Kỹ năng giao tiếp xuất sắc",
      "Kinh nghiệm customer support 2+ năm",
      "Hiểu biết về dev tools và coding",
      "Khả năng làm việc shift tối/cuối tuần"
    ],
    salary: "12-18M VND"
  },
  {
    title: "DevOps Engineer",
    department: "Infrastructure", 
    location: "TP. Hồ Chí Minh",
    type: "Full-time",
    description: "Xây dựng và vận hành hạ tầng scalable, reliable cho high-traffic platform",
    requirements: [
      "2+ năm kinh nghiệm DevOps/SRE",
      "Thành thạo AWS/GCP, Kubernetes, Docker",
      "Kinh nghiệm monitoring, logging, alerting",
      "Hiểu biết về security và compliance"
    ],
    salary: "22-35M VND"
  }
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Tham Gia{" "}
              <span className="text-foreground">
                {SEO_CONFIG.name}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Xây dựng tương lai của thiết kế số tại Việt Nam. Tham gia đội ngũ đầy nhiệt huyết 
              và tạo ra những sản phẩm có ý nghĩa cho cộng đồng developer.
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full">
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-medium">3 vị trí đang tuyển dụng</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Tại Sao Chọn {SEO_CONFIG.name}?
            </h2>
            <p className="text-lg text-muted-foreground">
              Chúng tôi không chỉ là nơi làm việc, mà là nơi bạn phát triển sự nghiệp
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">🚀 Sứ Mệnh Ý Nghĩa</h3>
                <p className="text-muted-foreground">
                  Democratize AI coding tools cho developer Việt Nam. Giúp hàng ngàn 
                  developer nâng cao năng suất và chất lượng công việc.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">📈 Tăng Trưởng Nhanh</h3>
                <p className="text-muted-foreground">
                  Công ty đang scale rapidly với 10,000+ customers. Cơ hội học hỏi 
                  và phát triển cùng với sự tăng trưởng của công ty.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">🎯 Impact Thực Tế</h3>
                <p className="text-muted-foreground">
                  Công việc của bạn trực tiếp ảnh hưởng đến trải nghiệm của hàng ngàn 
                  developer. Thấy được kết quả và feedback tích cực mỗi ngày.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Card className="p-6">
                <h4 className="font-semibold mb-3">💰 Lương thưởng cạnh tranh</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Lương cơ bản competitive với thị trường</li>
                  <li>• Bonus performance hàng quý</li>
                  <li>• Thưởng Tết và các dịp lễ</li>
                  <li>• Review lương 2 lần/năm</li>
                </ul>
              </Card>
              
              <Card className="p-6">
                <h4 className="font-semibold mb-3">🏥 Phúc lợi toàn diện</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bảo hiểm y tế cao cấp</li>
                  <li>• 20 ngày phép/năm + nghỉ sinh nhật</li>
                  <li>• Hỗ trợ học tập và certification</li>
                  <li>• Team building, company trip</li>
                </ul>
              </Card>
              
              <Card className="p-6">
                <h4 className="font-semibold mb-3">⚡ Công nghệ & tools</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• MacBook Pro/high-end laptop</li>
                  <li>• Google AI / công cụ thiết kế hỗ trợ công việc</li>
                  <li>• Budget cho courses, books, tools</li>
                  <li>• Latest tech stack và frameworks</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Vị Trí Đang Tuyển
            </h2>
            <p className="text-lg text-muted-foreground">
              Tìm vị trí phù hợp và bắt đầu hành trình với chúng tôi
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-xl font-semibold">{position.title}</h3>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {position.department}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {position.type}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{position.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Yêu cầu:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {position.requirements.map((req, i) => (
                            <li key={i}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Thông tin:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>📍 {position.location}</li>
                          <li>💰 {position.salary}</li>
                          <li>⏰ {position.type}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Link href="/contact">
                      <Button size="lg" className="w-full lg:w-auto">
                        Ứng Tuyển Ngay
                      </Button>
                    </Link>
                    <Link href="/contact">
                      <Button size="lg" variant="outline" className="w-full lg:w-auto">
                        Tìm Hiểu Thêm
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold tracking-tight mb-4">
              Quy Trình Tuyển Dụng
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple, transparent và tôn trọng thời gian của bạn
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Ứng Tuyển</h4>
              <p className="text-sm text-muted-foreground">Gửi CV + cover letter qua email hoặc form</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Screening</h4>
              <p className="text-sm text-muted-foreground">Phone/video call 30 phút để tìm hiểu lẫn nhau</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Technical</h4>
              <p className="text-sm text-muted-foreground">Bài test hoặc pair programming (tech roles)</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">4</span>
              </div>
              <h4 className="font-semibold mb-2">Final</h4>
              <p className="text-sm text-muted-foreground">Meet the team và thỏa thuận offer</p>
            </div>
          </div>

          <Card className="p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Liên Hệ HR
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Gửi CV trực tiếp:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    {SUPPORT_EMAIL && <li>📧 <strong>Email:</strong> {SUPPORT_EMAIL}</li>}
                    {MESSENGER_URL && <li>💬 <strong>Messenger:</strong> {MESSENGER_URL}</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Tips ứng tuyển:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Customize CV cho từng vị trí</li>
                    <li>• Highlight relevant projects</li>
                    <li>• Show passion for developer tools</li>
                    <li>• Đề cập tại sao muốn join CPS</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>💡 Lưu ý:</strong> Chúng tôi đánh giá cao attitude và growth mindset 
                  hơn là perfect skillset. Don't hesitate to apply!
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
              Sẵn Sàng Tham Gia Hành Trình?
            </h2>
            <p className="text-muted-foreground mb-6">
              Hãy kể cho chúng tôi về bạn và cùng xây dựng tương lai AI coding
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg">
                  Ứng Tuyển Ngay
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  Tìm Hiểu Về CPS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 