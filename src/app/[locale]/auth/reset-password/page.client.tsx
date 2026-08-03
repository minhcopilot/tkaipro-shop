"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { toast } from "sonner";

import { SEO_CONFIG } from "~/app";
import { resetPassword } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // kiểm tra token có hợp lệ không
  if (!token) {
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
              <CardTitle className="text-2xl text-red-600">Liên kết không hợp lệ</CardTitle>
              <CardDescription className="text-center">
                Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full" 
                  onClick={() => router.push("/auth/forgot-password")}
                >
                  Yêu cầu liên kết mới
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push("/auth/sign-in")}
                >
                  Quay lại đăng nhập
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // validate passwords match
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    // validate password length
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        newPassword: password,
        token: token,
      });

      toast.success("Đặt lại mật khẩu thành công! Đang chuyển hướng...");
      
      // chuyển hướng về trang đăng nhập sau 2 giây
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 2000);
      
    } catch (err: any) {
      console.error("Reset password error:", err);
      
      let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại sau.";
      
      if (err?.message) {
        if (err.message.toLowerCase().includes("invalid token")) {
          errorMessage = "Liên kết không hợp lệ hoặc đã hết hạn.";
        } else if (err.message.toLowerCase().includes("token expired")) {
          errorMessage = "Liên kết đã hết hạn. Vui lòng yêu cầu liên kết mới.";
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
            <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
            <CardDescription className="text-center">
              Nhập mật khẩu mới cho tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu mới</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <div className="text-xs text-muted-foreground">
                  Mật khẩu phải có ít nhất 8 ký tự
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
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
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
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

export function ResetPasswordPageClient() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">Đang tải...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
} 