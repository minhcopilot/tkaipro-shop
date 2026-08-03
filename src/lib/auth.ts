// note: run `bun db:auth` to generate the `users.ts`
// schema after making breaking changes to this file

import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { polar } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";


import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from "@getbrevo/brevo";

import type { UserDbType } from "~/lib/auth-types";

import { SEO_CONFIG, SYSTEM_CONFIG } from "~/app";
import { db } from "~/db";
import {
  accountTable,
  sessionTable,
  twoFactorTable,
  userTable,
  verificationTable,
} from "~/db/schema";
import { isEmailBanned, isFingerprintBanned, isIpBanned } from "~/lib/security/ban-list";
import {
  getClientIpFromHeaders,
  getCountryFromHeaders,
  getDeviceIdFromHeaders,
  getFingerprintFromHeaders,
  logUserIp,
} from "~/lib/security/ip-log";
import { validateRegistrationEmail } from "~/lib/security/email-blocklist";
import { enforceActor } from "~/lib/security/abuse-detect";
import { hasRecentVerifiedOtp } from "~/lib/auth/registration-otp";

// khởi tạo brevo client
const brevoEmailAPI = new TransactionalEmailsApi();
brevoEmailAPI.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || "");



interface GitHubProfile {
  [key: string]: unknown;
  email?: string;
  name?: string;
}

interface GoogleProfile {
  [key: string]: unknown;
  email?: string;
  family_name?: string;
  given_name?: string;
}

interface SocialProviderConfig {
  [key: string]: unknown;
  clientId: string;
  clientSecret: string;
  mapProfileToUser: (
    profile: GitHubProfile | GoogleProfile,
  ) => Record<string, unknown>;
  redirectURI?: string;
  scope: string[];
}

const hasGithubCredentials =
  process.env.AUTH_GITHUB_ID &&
  process.env.AUTH_GITHUB_SECRET &&
  process.env.AUTH_GITHUB_ID.length > 0 &&
  process.env.AUTH_GITHUB_SECRET.length > 0;

const hasGoogleCredentials =
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET &&
  process.env.AUTH_GOOGLE_ID.length > 0 &&
  process.env.AUTH_GOOGLE_SECRET.length > 0;

// Build social providers configuration
const socialProviders: Record<string, SocialProviderConfig> = {};

if (hasGithubCredentials) {
  socialProviders.github = {
    clientId: process.env.AUTH_GITHUB_ID ?? "",
    clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
    mapProfileToUser: (profile: GitHubProfile) => {
      let firstName = "";
      let lastName = "";
      if (profile.name) {
        const nameParts = profile.name.split(" ");
        firstName = nameParts[0];
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
      }
      return {
        age: null,
        firstName,
        lastName,
      };
    },
    scope: ["user:email", "read:user"],
  };
}

if (hasGoogleCredentials) {
  socialProviders.google = {
    clientId: process.env.AUTH_GOOGLE_ID ?? "",
    clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    mapProfileToUser: (profile: GoogleProfile) => {
      return {
        age: null,
        firstName: profile.given_name ?? "",
        lastName: profile.family_name ?? "",
      };
    },
    scope: ["openid", "email", "profile"],
  };
}

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: (process.env.POLAR_ENVIRONMENT as "production" | "sandbox") || "production",
});

export const auth = betterAuth({
  account: {
    accountLinking: {
      allowDifferentEmails: false,
      enabled: true,
      trustedProviders: Object.keys(socialProviders),
    },
  },

  // Trust proxy headers so session.ipAddress holds the real client IP behind
  // nginx / Cloudflare instead of the loopback address.
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
    },
  },

  // Forensics + ban enforcement hooks. All logging is fault-tolerant; only the
  // session.create.before guard intentionally blocks (returns false) to stop
  // banned email/IP from logging in.
  databaseHooks: {
    user: {
      create: {
        // CHẶN TRƯỚC KHI TẠO USER:
        //  1) Chỉ cho đăng ký @gmail.com.
        //  2) Heuristic auto-ban: 1 thiết bị/IP tạo nhiều account / spam -> ban
        //     thiết bị+email (vĩnh viễn) + IP (tạm) và từ chối đăng ký.
        before: async (user, context) => {
          const h = context?.headers ?? context?.request?.headers;
          const email = (user as { email?: string })?.email ?? "";
          const ip = getClientIpFromHeaders(h);
          const fingerprint = getFingerprintFromHeaders(h);
          const did = getDeviceIdFromHeaders(h);

          // (0) CHẶN BAN: nếu IP / email / thiết bị (fingerprint hoặc did) đã bị
          // ban -> KHÔNG cho tạo account (đây là lý do trước đây "ban rồi vẫn
          // tạo được": hook tạo user chưa hề check ban list).
          try {
            const [ipB, emailB, fpB, didB] = await Promise.all([
              isIpBanned(ip),
              isEmailBanned(email),
              isFingerprintBanned(fingerprint),
              isFingerprintBanned(did), // did cũng lưu dạng fingerprint-ban
            ]);
            if (ipB || emailB || fpB || didB) {
              throw new APIError("FORBIDDEN", {
                message: "Tài khoản/thiết bị của bạn đã bị chặn.",
              });
            }
          } catch (err) {
            if (err instanceof APIError) throw err;
            console.warn("[auth] ban check (register) failed:", err);
          }

          // (1) Gmail-only
          const emailCheck = validateRegistrationEmail(email);
          if (!emailCheck.ok) {
            throw new APIError("BAD_REQUEST", {
              message: emailCheck.message ?? "Email không hợp lệ",
            });
          }

          // (1b) BẮT BUỘC OTP cho đăng ký email/password: chỉ tạo account khi
          // có OTP đã verified gần đây (luồng /api/register/verify). Đăng ký
          // mạng xã hội (Google/GitHub) có emailVerified=true -> bỏ qua OTP.
          const emailVerified = (user as { emailVerified?: boolean })
            ?.emailVerified;
          if (!emailVerified) {
            try {
              const ok = await hasRecentVerifiedOtp(email);
              if (!ok) {
                throw new APIError("FORBIDDEN", {
                  message:
                    "Vui lòng xác thực email bằng mã OTP để đăng ký.",
                });
              }
            } catch (err) {
              if (err instanceof APIError) throw err;
              // Lỗi tra OTP -> fail-closed cho email/password (an toàn hơn).
              throw new APIError("FORBIDDEN", {
                message: "Không xác thực được email, vui lòng thử lại.",
              });
            }
          }

          // (2) Auto-ban heuristic
          try {
            const { blocked } = await enforceActor(
              {
                ip,
                fingerprint,
                did,
                email,
                userAgent: h?.get("user-agent") ?? null,
              },
              { source: "register" },
            );
            if (blocked) {
              throw new APIError("FORBIDDEN", {
                message:
                  "Đăng ký bị từ chối do hệ thống phát hiện hành vi bất thường.",
              });
            }
          } catch (err) {
            if (err instanceof APIError) throw err;
            // Lỗi detector không được phép chặn đăng ký hợp lệ -> fail-open.
            console.warn("[auth] abuse-detect register failed:", err);
          }
          return;
        },
        after: async (user, context) => {
          const h = context?.headers ?? context?.request?.headers;
          const ip = getClientIpFromHeaders(h);
          await logUserIp({
            userId: user.id,
            email: user.email,
            eventType: "register",
            ip,
            userAgent: h?.get("user-agent") ?? null,
            country: getCountryFromHeaders(h),
            fingerprint: getFingerprintFromHeaders(h),
            did: getDeviceIdFromHeaders(h),
          });
        },
      },
    },
    session: {
      create: {
        // Block session creation for banned email/IP — turns a ban into an
        // actual login block. Fail-open on errors so auth never breaks.
        before: async (session, context) => {
          try {
            const ipBanned = await isIpBanned(session.ipAddress);
            if (ipBanned) return false;

            const fp = getFingerprintFromHeaders(
              context?.headers ?? context?.request?.headers,
            );
            if (fp && (await isFingerprintBanned(fp))) return false;

            const [u] = await db
              .select({ email: userTable.email })
              .from(userTable)
              .where(eq(userTable.id, session.userId))
              .limit(1);
            if (u?.email && (await isEmailBanned(u.email))) return false;
          } catch (err) {
            console.warn("[auth] ban guard check failed:", err);
          }
          return;
        },
        after: async (session, context) => {
          const h = context?.headers ?? context?.request?.headers;
          await logUserIp({
            userId: session.userId,
            eventType: "login",
            ip: session.ipAddress,
            userAgent: session.userAgent,
            country: getCountryFromHeaders(h),
            fingerprint: getFingerprintFromHeaders(h),
            did: getDeviceIdFromHeaders(h),
          });
        },
      },
    },
  },
  baseURL: process.env.NEXT_SERVER_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",

  // allow requests from these origins
  trustedOrigins: [
    SEO_CONFIG.url,
    SEO_CONFIG.url.replace("://", "://www."),
    "http://localhost:3000",
    "http://localhost:3001",
  ],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      account: accountTable,
      session: sessionTable,
      twoFactor: twoFactorTable,
      user: userTable,
      verification: verificationTable,
    },
  }),

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      try {
        // gửi email bằng brevo api mới
        const result = await brevoEmailAPI.sendTransacEmail({
          to: [
            {
              email: user.email,
              name: user.name || user.email
            }
          ],
          subject: `Đặt lại mật khẩu - ${SEO_CONFIG.name}`,
          htmlContent: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <h1 style="color: #333; text-align: center;">Đặt lại mật khẩu</h1>
              <p>Xin chào <strong>${user.name || user.email}</strong>,</p>
              <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
              </div>
              <p><strong>Lưu ý:</strong> Liên kết này sẽ hết hiệu lực sau 1 giờ.</p>
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px; text-align: center;">
                ${SEO_CONFIG.name} - Dịch vụ hỗ trợ đăng ký Figma Pro minh bạch
              </p>
            </div>
          `,
          sender: {
            name: SEO_CONFIG.name,
            email: process.env.BREVO_EMAIL || ""
          }
        });
        
        console.log("Reset password email sent successfully via Brevo:", result.body);
      } catch (error) {
        console.error("Failed to send reset password email via Brevo:", error);
        throw error;
      }
    },
  },

  // Configure OAuth behavior
  oauth: {
    // Default redirect URL after successful login
    defaultCallbackUrl: SYSTEM_CONFIG.redirectAfterSignIn,
    // URL to redirect to on error
    errorCallbackUrl: "/auth/error",
    // Whether to link accounts with the same email
    linkAccountsByEmail: true,
  },

  plugins: [
    twoFactor(),
    // tạm thời disable polar để test role system với db local mới
    // polar({
    //   client: polarClient,
    //   createCustomerOnSignUp: true,
    //   enableCustomerPortal: true,
    //   // Configure checkout
    //   checkout: {
    //     enabled: true,
    //     products: [
    //       {
    //         productId: "pro-plan", // Replace with actual product ID from Polar Dashboard
    //         slug: "pro" // Custom slug for easy reference in Checkout URL
    //       },
    //       {
    //         productId: "premium-plan", // Replace with actual product ID from Polar Dashboard
    //         slug: "premium" // Custom slug for easy reference in Checkout URL
    //       }
    //     ],
    //     successUrl: "/dashboard/billing?checkout_success=true&checkout_id={CHECKOUT_ID}",
    //   },
    //   // Configure webhooks
    //   webhooks: {
    //     secret: process.env.POLAR_WEBHOOK_SECRET || "",
    //     onPayload: async (payload) => {
    //       console.log("Received webhook payload:", payload.type);
    //     },
    //   },
    // }),
  ],

  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,

  // Only include social providers if credentials are available
  socialProviders,

  user: {
    additionalFields: {
      age: {
        input: true,
        required: false,
        type: "number",
      },
      firstName: {
        input: true,
        required: false,
        type: "string",
      },
      lastName: {
        input: true,
        required: false,
        type: "string",
      },
      role: {
        input: false,
        required: false,
        type: "string",
        defaultValue: "USER",
      },
      // Wallet balances. Server-managed only (input:false) — không cho user
      // tự set qua sign-up form; chỉ update qua /api/wallet/topup, webhook
      // SePay, checkout debit, hoặc admin adjust.
      // VND nguyên (vd 500000), USD cents (vd 1000 = $10.00).
      vndBalance: {
        input: false,
        required: false,
        type: "number",
        defaultValue: 0,
      },
      usdBalance: {
        input: false,
        required: false,
        type: "number",
        defaultValue: 0,
      },
    },
  },
});

export const getCurrentUser = async (): Promise<null | UserDbType> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return null;
  }
  return session.user as UserDbType;
};

export const getCurrentUserOrRedirect = async (
  forbiddenUrl = "/auth/sign-in",
  okUrl = "",
  ignoreForbidden = false,
): Promise<null | UserDbType> => {
  const user = await getCurrentUser();

  // if no user is found
  if (!user) {
    // redirect to forbidden url unless explicitly ignored
    if (!ignoreForbidden) {
      redirect(forbiddenUrl);
    }
    // if ignoring forbidden, return the null user immediately
    // (don't proceed to okUrl check)
    return user; // user is null here
  }

  // if user is found and an okUrl is provided, redirect there
  if (okUrl) {
    redirect(okUrl);
  }

  // if user is found and no okUrl is provided, return the user
  return user; // user is UserDbType here
};

// role helper functions
export const isAdmin = (user: UserDbType | null): boolean => {
  return user?.role === "ADMIN";
};

export const isUser = (user: UserDbType | null): boolean => {
  return user?.role === "USER";
};

export const isAffiliate = (user: UserDbType | null): boolean => {
  return user?.role === "AFFILIATE";
};

export const hasRole = (user: UserDbType | null, role: string): boolean => {
  return user?.role === role;
};

export const getCurrentUserWithRole = async (requiredRole: string) => {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, requiredRole)) {
    redirect("/auth/sign-in");
  }
  return user;
};

// get current admin without redirect (for API routes)
export const getCurrentAdmin = async () => {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return null;
  }
  return user;
};

export const getCurrentAdminOrRedirect = async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  if (!isAdmin(user)) {
    redirect("/"); // redirect to home if not admin
  }
  return user;
};
