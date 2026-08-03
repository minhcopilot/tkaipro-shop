"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { SEO_CONFIG } from "~/app";
import { forgetPassword } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

export function ForgotPasswordPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess(false);

    try {
      await forgetPassword({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      setSuccess(true);
      toast.success("Đã gửi liên kết đặt lại mật khẩu đến email của bạn!");
      
    } catch (err: any) {
      console.error("Forgot password error:", err);
      
      let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại sau.";
      
      if (err?.message) {
        if (err.message.toLowerCase().includes("user not found")) {
          errorMessage = "Email không tồn tại trong hệ thống.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-background" />
        </div>
        <div className="relative z-10 w-full max-w-md px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12">
                <Image
                  alt={SEO_CONFIG.name}
                  className="h-full w-full object-contain"
                  height={48}
                  src="/logo.png"
                  width={48}
                />
              </div>
              <CardTitle className="text-2xl">Email đã được gửi!</CardTitle>
              <CardDescription className="text-center">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email của bạn.
                Vui lòng kiểm tra hộp thư (bao gồm cả thư spam).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => router.push("/auth/sign-in")}
                >
                  Quay lại đăng nhập
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                >
                  Gửi lại email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
      </div>
      <div className="relative z-10 w-full max-w-md px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12">
              <Image
                alt={SEO_CONFIG.name}
                className="h-full w-full object-contain"
                height={48}
                src="/logo.png"
                width={48}
              />
            </div>
            <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
            <CardDescription className="text-center">
              Nhập email của bạn để nhận liên kết đặt lại mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600 text-center">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !email}
              >
                {loading ? "Đang gửi..." : "Gửi liên kết đặt lại mật khẩu"}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Nhớ mật khẩu rồi?{" "}
              <Link
                className="text-primary underline-offset-4 hover:underline"
                href="/auth/sign-in"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 