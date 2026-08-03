import { Award, Shield, Clock, Users, RefreshCw, Headphones } from "lucide-react";
import Image from "next/image";

import { SEO_CONFIG } from "~/app";
import { Badge } from "~/ui/primitives/badge";
import { Card, CardContent } from "~/ui/primitives/card";

const trustStats = [
  { number: "10,000+", label: "Khách hàng tin tưởng" },
  { number: "99.9%", label: "Uptime đảm bảo" },
  { number: "4.9/5", label: "Đánh giá trung bình" },
  { number: "24/7", label: "Hỗ trợ không ngừng" },
];

const guarantees = [
  {
    icon: <Shield className="h-8 w-8 text-foreground" />,
    title: "Bảo Hành 1 Đổi 1",
    description: "Tài khoản lỗi trong 30 ngày đầu được đổi miễn phí 100%"
  },
  {
    icon: <RefreshCw className="h-8 w-8 text-foreground" />,
    title: "Hoàn Tiền 100%",
    description: "Không hài lòng? Hoàn tiền đầy đủ trong 7 ngày đầu"
  },
  {
    icon: <Headphones className="h-8 w-8 text-foreground" />,
    title: "Hỗ Trợ 24/7",
    description: "Đội ngũ support luôn sẵn sàng hỗ trợ qua Telegram"
  },
  {
    icon: <Award className="h-8 w-8 text-foreground" />,
    title: "Quy Trình Minh Bạch",
    description: `${SEO_CONFIG.name} là nhà bán lẻ độc lập, không liên kết với Google LLC Tài khoản Google AI được mua hợp pháp và bàn giao minh bạch.`
  }
];

const paymentMethods = [
  { name: "Momo", logo: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" },
  { name: "ZaloPay", logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-ZaloPay-Square.png" },
  { name: "VietQR", logo: "https://46t4h475b1.ufs.sh/f/ALA1IyZl9GRNOVWptkavbMGsF0nCc9YkeJdlwVPfr2uKDT8R" },
  { name: "Banking", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" }
];

export function TrustBadgesSection() {
  return (
    <section className="py-12 md:py-16 bg-muted/50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Trust Stats */}
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl mb-8">
            Được Tin Tưởng Bởi Hàng Ngàn Developer
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.number}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {guarantees.map((guarantee, index) => (
            <Card key={index} className="text-center border-none bg-background/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  {guarantee.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{guarantee.title}</h3>
                <p className="text-sm text-muted-foreground">{guarantee.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security & Payment */}
        <div className="border-t pt-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-foreground" />
                Thanh Toán An Toàn & Bảo Mật
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Thông tin thanh toán được mã hóa SSL 256-bit. Chúng tôi không lưu trữ thông tin thẻ của bạn.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Shield className="h-3 w-3 mr-1" />
                  SSL Secured
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Award className="h-3 w-3 mr-1" />
                  Verified Business
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Users className="h-3 w-3 mr-1" />
                  10K+ Happy Customers
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Phương Thức Thanh Toán</h3>
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-center p-4 bg-background rounded-lg border"
                  >
                    <Image
                      src={method.logo}
                      alt={method.name}
                      width={60}
                      height={30}
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Preview */}
        <div className="mt-12 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-5 h-5 text-yellow-400 fill-current">
                  ⭐
                </div>
              ))}
            </div>
            <span className="font-semibold">4.9/5</span>
            <span className="text-muted-foreground">(2,847 đánh giá)</span>
          </div>
          <p className="text-sm text-muted-foreground">
            "Dịch vụ tuyệt vời! Tài khoản hoạt động ổn định, support nhanh chóng. Highly recommended!" 
            <span className="font-medium"> - Nguyen Van A, Full-stack Developer</span>
          </p>
        </div>
      </div>
    </section>
  );
} 