"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { SEO_CONFIG, SYSTEM_CONFIG } from "~/app";
import { signIn, signUp, useCurrentUserOrRedirect, useSession } from "~/lib/auth-client";
import { GoogleIcon } from "~/ui/components/icons/google";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Checkbox } from "~/ui/primitives/checkbox";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Separator } from "~/ui/primitives/separator";

export function SignUpPageClient() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOver18, setIsOver18] = useState(true);
  // OTP 2 bước: 'form' (nhập thông tin) -> 'otp' (nhập mã gửi về gmail).
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");

  // redirect về trang chủ nếu user đã đăng nhập (client-side backup)
  // tạm thời comment out để debug redirect issue
  // useCurrentUserOrRedirect("/auth/sign-up", "/", true);
  
  // thay thế bằng logic đơn giản hơn chỉ redirect khi đã có user
  const { data, isPending } = useSession();
  const hasUser = data?.user;
  
  useEffect(() => {
    if (!isPending && hasUser) {
      console.log("User already logged in, redirecting to home");
      router.push("/");
    }
  }, [isPending, hasUser, router]);

  const validatePassword = (password: string) => {
    if (password.length === 0) {
      return "";
    }
    if (password.length < 8) {
      return t("signUp.passwordHint");
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate password in real-time
    if (name === "password") {
      setPasswordError(validatePassword(value));
    }
  };

  const parseErrorMessage = (err: any): string => {
    // Try to extract error message from different possible structures
    let errorString = "";
    let errorCode = "";
    
    // Check if error has Better Auth structure with code field
    if (err?.code) {
      errorCode = err.code;
      errorString = err.message || err.code;
    }
    // Check different error structures
    else if (typeof err === "string") {
      errorString = err;
    } else if (err?.message) {
      errorString = err.message;
    } else if (err?.error) {
      if (typeof err.error === "object" && err.error.code) {
        errorCode = err.error.code;
        errorString = err.error.message || err.error.code;
      } else {
        errorString = err.error;
      }
    } else if (err?.response?.data) {
      if (err.response.data.code) {
        errorCode = err.response.data.code;
        errorString = err.response.data.message || err.response.data.code;
      } else {
        errorString = err.response.data.message || JSON.stringify(err.response.data);
      }
    } else if (err?.cause?.message) {
      errorString = err.cause.message;
    } else {
      errorString = JSON.stringify(err);
    }
    
    const lowerError = errorString.toLowerCase();
    const upperCode = errorCode.toUpperCase();
    
    // Better Auth specific error codes
    if (upperCode === "USER_ALREADY_EXISTS" || 
        lowerError.includes("sign-up attempt for existing email") || 
        lowerError.includes("email already exists") || 
        lowerError.includes("user already exists")) {
      return t("errors.userAlreadyExists");
    }
    
    if (upperCode === "WEAK_PASSWORD" ||
        lowerError.includes("password is too short") || 
        lowerError.includes("password too short")) {
      return t("errors.passwordTooShort");
    }
    
    if (upperCode === "INVALID_EMAIL" ||
        lowerError.includes("invalid email") || 
        lowerError.includes("email is invalid")) {
      return t("errors.invalidEmail");
    }
    
    if (lowerError.includes("weak password") || 
        lowerError.includes("password is weak")) {
      return t("errors.weakPassword");
    }
    
    if (lowerError.includes("invalid password") || 
        lowerError.includes("password is invalid")) {
      return t("errors.invalidPassword");
    }
    
    if (lowerError.includes("user not found") || 
        lowerError.includes("account not found")) {
      return t("errors.userNotFound");
    }
    
    if (lowerError.includes("network") || lowerError.includes("fetch")) {
      return t("errors.networkError");
    }
    
    // Check for HTTP status codes
    if (lowerError.includes("422") || lowerError.includes("unprocessable")) {
      return t("errors.invalidEmailOrPassword"); // Or a more generic data error
    }
    
    if (lowerError.includes("401") || lowerError.includes("unauthorized")) {
      return t("errors.defaultSignUp");
    }
    
    if (lowerError.includes("400") || lowerError.includes("bad request")) {
      return t("errors.defaultSignUp");
    }
    
    if (lowerError.includes("500") || lowerError.includes("internal server")) {
      return t("errors.serverError");
    }
    
    // Default fallback
    return t("errors.defaultSignUp");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Check frontend validation
    const passwordValidation = validatePassword(formData.password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    // Chỉ cho đăng ký bằng @gmail.com (server cũng enforce lại).
    if (!/@gmail\.com$/i.test(formData.email.trim())) {
      const msg = "Chỉ chấp nhận email @gmail.com để đăng ký.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!isOver18) {
      const msg = t("signUp.over18Required");
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      // Bước 1: yêu cầu OTP gửi về gmail (chưa tạo account).
      const res = await fetch("/api/register/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const msg = data?.error || t("errors.defaultSignUp");
        setError(msg);
        toast.error(msg);
        return;
      }
      setStep("otp");
      setOtp("");
      toast.success("Đã gửi mã OTP đến email của bạn. Vui lòng kiểm tra hộp thư.");
    } catch (err) {
      const msg = t("errors.networkError");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: xác thực OTP -> tạo account -> đăng nhập.
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Mã OTP gồm 6 số.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          code: otp.trim(),
          password: formData.password,
          name: formData.name,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const msg = data?.error || "Xác thực thất bại";
        setError(msg);
        toast.error(msg);
        return;
      }
      // Account đã tạo -> đăng nhập.
      await signIn.email({
        email: formData.email,
        password: formData.password,
      });
      toast.success(t("success.signUp"));
      router.push(SYSTEM_CONFIG.redirectAfterSignIn);
    } catch (err) {
      const msg = parseErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const msg = data?.error || t("errors.defaultSignUp");
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Đã gửi lại mã OTP.");
    } catch {
      toast.error(t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
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
        <div
          className={`
            absolute inset-0 bg-secondary/80
          `}
        />
        <div className="absolute bottom-8 left-8 z-10 text-secondary-foreground">
          <h1 className="font-display text-3xl font-black">{t("banner.title")}</h1>
          <p className="mt-2 max-w-md text-sm font-medium text-secondary-foreground/90">
            {t("banner.slogan")}
          </p>
        </div>
      </div>

      {/* Right side - Sign up form */}
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
            <h2 className="font-display text-3xl font-black">{t("signUp.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("signUp.subtitle")}
            </p>
          </div>

          <Card>
            <CardContent className="pt-2">
              {step === "form" ? (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("signUp.nameLabel")}</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    onChange={handleChange}
                    placeholder={t("signUp.namePlaceholder")}
                    required
                    type="text"
                    value={formData.name}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("signUp.emailLabel")}</Label>
                  <Input
                    id="email"
                    name="email"
                    autoComplete="email"
                    onChange={handleChange}
                    placeholder={t("signUp.emailPlaceholder")}
                    required
                    type="email"
                    value={formData.email}
                  />
                  <div className="text-xs text-muted-foreground">
                    Chỉ chấp nhận email @gmail.com.
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">{t("signUp.passwordLabel")}</Label>
                  <Input
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    onChange={handleChange}
                    placeholder={t("signUp.passwordPlaceholder")}
                    required
                    type="password"
                    value={formData.password}
                  />
                  {passwordError && (
                    <div className="text-xs text-destructive">
                      {passwordError}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {t("signUp.passwordHint")}
                  </div>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={isOver18}
                    onCheckedChange={(v) => setIsOver18(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-muted-foreground leading-snug">
                    {t("signUp.over18Label")}
                  </span>
                </label>
                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <Button 
                  className="w-full" 
                  disabled={loading || !!passwordError || !isOver18} 
                  type="submit"
                >
                  {loading ? "Đang gửi mã..." : "Gửi mã xác thực"}
                </Button>
              </form>
              ) : (
              <form className="space-y-4" onSubmit={handleVerifyOtp}>
                <div className="grid gap-2">
                  <Label htmlFor="otp">Mã OTP (gửi tới {formData.email})</Label>
                  <Input
                    id="otp"
                    name="otp"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Nhập 6 số"
                    required
                    value={otp}
                    className="text-center text-lg tracking-[6px] font-mono"
                  />
                  <div className="text-xs text-muted-foreground">
                    Mã có hiệu lực 10 phút. Kiểm tra cả mục Spam/Quảng cáo.
                  </div>
                </div>
                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Đang xác thực..." : "Xác nhận & tạo tài khoản"}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => { setStep("form"); setError(""); }}
                    className="text-muted-foreground hover:underline"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    Gửi lại mã
                  </button>
                </div>
              </form>
              )}
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
                  onClick={handleGoogleSignUp}
                  variant="outline"
                >
                  <GoogleIcon className="h-5 w-5" />
                  Google
                </Button>
              </div>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {t("signUp.hasAccount")}{" "}
                <Link
                  className={`
                    text-primary underline-offset-4
                    hover:underline
                  `}
                  href="/auth/sign-in"
                >
                  {t("signUp.signInLink")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
