import Link from "next/link";
import { Facebook, Home, MessageCircle } from "lucide-react";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { Card } from "~/ui/primitives/card";

const FACEBOOK_URL = SEO_CONFIG.supportContacts.facebook;
const FACEBOOK_HANDLE = FACEBOOK_URL
  ? `@${FACEBOOK_URL.replace(/\/$/, "").split("/").pop()}`
  : "";
const TELEGRAM_HANDLE = SEO_CONFIG.supportContacts.telegram;
const TELEGRAM_URL = TELEGRAM_HANDLE
  ? `https://t.me/${TELEGRAM_HANDLE.replace(/^@/, "")}`
  : "";

export default function NotFound() {
  const contactMethods = [
    ...(FACEBOOK_URL
      ? [
          {
            icon: <Facebook className="h-7 w-7" />,
            title: "Fanpage Facebook",
            description: "Theo dõi và liên hệ qua Fanpage",
            value: FACEBOOK_HANDLE,
            action: "Truy cập Fanpage",
            href: FACEBOOK_URL,
            available: "24/7",
            bgGradient: "from-indigo-500/10 to-purple-500/10",
            borderColor: "border-indigo-500/20",
            iconColor: "text-indigo-600",
            buttonColor: "bg-indigo-600 hover:bg-indigo-700",
          },
        ]
      : []),
    ...(TELEGRAM_URL
      ? [
          {
            icon: <MessageCircle className="h-7 w-7" />,
            title: "Telegram",
            description: "Liên hệ hỗ trợ qua Telegram",
            value: TELEGRAM_HANDLE,
            action: "Liên hệ Telegram",
            href: TELEGRAM_URL,
            available: "24/7",
            bgGradient: "from-sky-500/10 to-cyan-500/10",
            borderColor: "border-sky-500/20",
            iconColor: "text-sky-600",
            buttonColor: "bg-sky-600 hover:bg-sky-700",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-3xl w-full text-center space-y-12">
        {/* 404 Visual */}
        <div className="group relative mx-auto w-fit">
          <h1 className="text-9xl md:text-[180px] font-black leading-none tracking-tighter bg-gradient-to-r text-foreground select-none animate-in fade-in zoom-in duration-700">
            404
          </h1>
          <div className="absolute -inset-8 bg-primary/20 blur-3xl rounded-full opacity-20 -z-10 group-hover:opacity-40 transition-opacity duration-500" />
        </div>

        {/* Message */}
        <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-700 delay-100">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Oops! Trang bạn tìm kiếm không tồn tại
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Có vẻ như trang này đã bị di chuyển hoặc xóa. Nhưng đừng lo lắng,
            chúng tôi vẫn ở đây để hỗ trợ bạn!
          </p>
          
          <div className="pt-4">
            <Link href="/">
              <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                <Home className="mr-2 h-5 w-5" />
                Quay Về Trang Chủ
              </Button>
            </Link>
          </div>
        </div>

        {/* Support Section */}
        <div className="pt-8 animate-in slide-in-from-bottom-5 duration-700 delay-200">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-semibold tracking-wider">
                Cần Hỗ Trợ Mua Hàng?
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {contactMethods.map((method, index) => (
              <Link
                key={index}
                href={method.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block group h-full"
              >
                <Card
                  className={`relative h-full overflow-hidden border-2 ${method.borderColor} bg-gradient-to-br ${method.bgGradient} p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group-hover:border-opacity-50`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className={`p-4 rounded-2xl bg-background/80 backdrop-blur-sm ${method.iconColor} ring-1 ring-black/5 dark:ring-white/10 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                    >
                      {method.icon}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-foreground">
                        {method.title}
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground/80">
                        {method.value}
                      </p>
                    </div>

                    <Button
                      className={`w-full mt-2 rounded-xl font-medium ${method.buttonColor} text-white shadow-md group-hover:shadow-lg transition-all`}
                    >
                      {method.action}
                    </Button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
