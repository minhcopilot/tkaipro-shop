"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { SEO_CONFIG, SYSTEM_CONFIG } from "~/app";
import { signIn, useCurrentUserOrRedirect } from "~/lib/auth-client";
import { GoogleIcon } from "~/ui/components/icons/google";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Separator } from "~/ui/primitives/separator";

export function SignInPageClient() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // redirect về trang chủ nếu user đã đăng nhập (client-side backup)
  useCurrentUserOrRedirect("/auth/sign-in", "/", true);

  const parseErrorMessage = (err: any): string => {
    // Try to extract error message from different possible structures
    let errorString = "";
    
    // Check different error structures
    if (typeof err === "string") {
      errorString = err;
    } else if (err?.message) {
      errorString = err.message;
    } else if (err?.error) {
      errorString = err.error;
    } else if (err?.response?.data?.message) {
      errorString = err.response.data.message;
    } else if (err?.cause?.message) {
      errorString = err.cause.message;
    } else {
      errorString = JSON.stringify(err);
    }
    
    const lowerError = errorString.toLowerCase();
    
    // Better Auth specific errors for sign-in
    if (lowerError.includes("invalid password") || 
        lowerError.includes("password is invalid") ||
        lowerError.includes("incorrect password")) {
      return t("errors.invalidPassword");
    }
    
    if (lowerError.includes("invalid email") || 
        lowerError.includes("email is invalid") ||
        lowerError.includes("email not found")) {
      return t("errors.invalidEmailOrPassword");
    }
    
    if (lowerError.includes("user not found") || 
        lowerError.includes("account not found")) {
      return t("errors.userNotFound");
    }
    
    if (lowerError.includes("account not verified") || 
        lowerError.includes("email not verified")) {
      return t("errors.accountNotVerified");
    }
    
    if (lowerError.includes("account disabled") || 
        lowerError.includes("account suspended")) {
      return t("errors.accountDisabled");
    }
    
    if (lowerError.includes("too many attempts") || 
        lowerError.includes("rate limit")) {
      return t("errors.tooManyAttempts");
    }
    
    if (lowerError.includes("network") || lowerError.includes("fetch")) {
      return t("errors.networkError");
    }
    
    // Check for HTTP status codes
    if (lowerError.includes("401") || lowerError.includes("unauthorized")) {
      return t("errors.invalidEmailOrPassword");
    }
    
    if (lowerError.includes("403") || lowerError.includes("forbidden")) {
      return t("errors.accountDisabled");
    }
    
    if (lowerError.includes("404") || lowerError.includes("not found")) {
      return t("errors.userNotFound");
    }
    
    if (lowerError.includes("422") || lowerError.includes("unprocessable")) {
      return t("errors.invalidEmailOrPassword");
    }
    
    if (lowerError.includes("500") || lowerError.includes("internal server")) {
      return t("errors.serverError");
    }
    
    // Default fallback
    return t("errors.defaultSignIn");
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Gọi API trực tiếp để check response status
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        // Nếu response không ok, đọc error message
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        console.log("Error response:", errorData);
        
        let errorMessage = t("errors.defaultSignIn");
        
        // Check theo code từ Better Auth
        if (typeof errorData === 'object' && errorData && (errorData as any).code) {
          switch ((errorData as any).code) {
            case 'INVALID_EMAIL_OR_PASSWORD':
              errorMessage = t("errors.invalidEmailOrPassword");
              break;
            case 'INVALID_PASSWORD':
              errorMessage = t("errors.invalidPassword");
              break;
            case 'INVALID_EMAIL':
              errorMessage = t("errors.invalidEmailOrPassword");
              break;
            case 'USER_NOT_FOUND':
              errorMessage = t("errors.userNotFound");
              break;
            case 'ACCOUNT_NOT_VERIFIED':
              errorMessage = t("errors.accountNotVerified");
              break;
            case 'TOO_MANY_REQUESTS':
              errorMessage = t("errors.tooManyAttempts");
              break;
            default:
              errorMessage = (errorData as any).message || t("errors.defaultSignIn");
          }
        } else if (response.status === 401) {
          if (typeof errorData === 'string') {
            if (errorData.toLowerCase().includes('invalid password')) {
              errorMessage = t("errors.invalidPassword");
            } else if (errorData.toLowerCase().includes('invalid email')) {
              errorMessage = t("errors.invalidEmailOrPassword");
            } else {
              errorMessage = t("errors.invalidEmailOrPassword");
            }
          }
        } else if (response.status === 404) {
          errorMessage = t("errors.userNotFound");
        } else if (response.status === 422) {
          errorMessage = t("errors.invalidEmailOrPassword");
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Nếu thành công, gọi Better Auth để set session
      await signIn.email({
        email,
        password,
      });

      toast.success(t("success.signIn"));
      router.push(SYSTEM_CONFIG.redirectAfterSignIn);
      
    } catch (err) {
      // Log detailed error for debugging
      console.error("Detailed sign-in error:", {
        error: err,
        type: typeof err,
        message: (err as any)?.message || "No message",
        response: (err as any)?.response || "No response", 
        status: (err as any)?.status || "No status",
        cause: (err as any)?.cause || "No cause",
        stack: (err as any)?.stack || "No stack"
      });
      
      const errorMessage = parseErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Fallback alert nếu toast không hoạt động
      setTimeout(() => {
        if (document.querySelector('[data-sonner-toaster]')?.children.length === 0) {
          alert(`❌ ${t("signIn.title")} Error: ${errorMessage}`);
        }
      }, 100);
      
      console.error("Sign-in error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    try {
      void signIn.social({ provider: "google" });
    } catch (err) {
      setError(t("errors.social.google"));
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        grid h-screen w-screen
        md:grid-cols-2
      `}
    >
      {/* Left side - Image */}
      <div
        className={`
          relative hidden
          md:block
        `}
      >
        <Image
          alt={t("banner.imageAlt")}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 768px) 0vw, 50vw"
          src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
        />
        <div className="absolute inset-0 bg-secondary/80" />
        <div className="absolute bottom-8 left-8 z-10 text-secondary-foreground">
          <h1 className="font-display text-3xl font-black">{t("banner.title")}</h1>
          <p className="mt-2 max-w-md text-sm font-medium text-secondary-foreground/90">
            {t("banner.slogan")}
          </p>
        </div>
      </div>

      {/* Right side - Sign in form */}
      <div
        className={`
          flex items-center justify-center border-l-2 border-border bg-background
          p-4
          md:p-8
        `}
      >
        <div className="w-full max-w-md space-y-4">
          <div
            className={`
              space-y-4 text-center
              md:text-left
            `}
          >
            <h2 className="font-display text-3xl font-black">{t("signIn.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("signIn.subtitle")}
            </p>
          </div>

          <Card>
            <CardContent className="pt-2">
              <form className="space-y-4" onSubmit={handleEmailLogin}>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("signIn.emailLabel")}</Label>
                  <Input
                    id="email"
                    name="email"
                    autoComplete="email"
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    placeholder={t("signIn.emailPlaceholder")}
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("signIn.passwordLabel")}</Label>
                    <Link
                      className={`
                        text-sm text-muted-foreground
                        hover:underline
                      `}
                      href="/auth/forgot-password"
                    >
                      {t("signIn.forgotPassword")}
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    placeholder={t("signIn.passwordPlaceholder")}
                    required
                    type="password"
                    value={password}
                  />
                </div>
                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? t("signIn.submitting") : t("signIn.submit")}
                </Button>
              </form>
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("signIn.orContinueWith")}
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  className="flex w-full items-center justify-center gap-2"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  variant="outline"
                >
                  <GoogleIcon className="h-5 w-5" />
                  Google
                </Button>
              </div>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {t("signIn.noAccount")}{" "}
                <Link
                  className={`
                    text-primary underline-offset-4
                    hover:underline
                  `}
                  href="/auth/sign-up"
                >
                  {t("signIn.signUpLink")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
