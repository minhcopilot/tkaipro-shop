import { NextRequest, NextResponse } from "next/server";

import { NoActiveBankAccountError } from "~/lib/queries/bank-accounts";
import {
  createWalletTopup,
  getRecentTopupsByUser,
  validateTopupAmount,
  WALLET_CURRENCY,
  WALLET_TOPUP_METHOD,
  type WalletCurrency,
  type WalletTopupMethod,
} from "~/lib/queries/wallet";
import { getCurrentUser } from "~/lib/auth";
import { getClientIp, rateLimit } from "~/lib/security/rate-limit";
import { guardBannedRequest } from "~/lib/security/ban-guard";

const VALID_CRYPTO_METHODS = new Set([
  "binance",
  "bybit",
  "usdt-bep20",
  "usdt-trc20",
  "btc",
  "eth",
  "ltc",
]);

/**
 * GET /api/wallet/topup — list topups gần nhất của user (cho dashboard
 * wallet history).
 */
export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const topups = await getRecentTopupsByUser(user.id, 50);
  return NextResponse.json({ topups });
}

/**
 * POST /api/wallet/topup — tạo topup pending mới.
 *
 * Body:
 *   { currency: 'vnd' | 'usd', amount: number, method: 'sepay' | 'crypto',
 *     cryptoMethodId?: string }
 *
 * Constraints (validateTopupAmount):
 *   - VND: 50K - 50M, multiple of 1000.
 *   - USD: 500 - 500000 cents (= $5 - $5000).
 *   - method='sepay' chỉ với currency='vnd'.
 *   - method='crypto' bắt buộc currency='usd' + cryptoMethodId hợp lệ.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? undefined;

  // ban check
  const banResp = await guardBannedRequest(request);
  if (banResp) return banResp;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // rate limit: 5 topup mới / 1 phút / user
  const rl = rateLimit(`wallet-topup:${user.id}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Bạn tạo yêu cầu nạp quá nhanh, thử lại sau ${Math.ceil(rl.resetInMs / 1000)}s`,
      },
      { status: 429 },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const currency = body?.currency as WalletCurrency | undefined;
  const amount = Number(body?.amount);
  const method = body?.method as WalletTopupMethod | undefined;
  const cryptoMethodId = body?.cryptoMethodId as string | undefined;

  if (
    currency !== WALLET_CURRENCY.VND &&
    currency !== WALLET_CURRENCY.USD
  ) {
    return NextResponse.json({ error: "INVALID_CURRENCY" }, { status: 400 });
  }
  if (
    method !== WALLET_TOPUP_METHOD.SEPAY &&
    method !== WALLET_TOPUP_METHOD.CRYPTO
  ) {
    return NextResponse.json({ error: "INVALID_METHOD" }, { status: 400 });
  }
  if (method === WALLET_TOPUP_METHOD.SEPAY && currency !== WALLET_CURRENCY.VND) {
    return NextResponse.json(
      { error: "SEPAY_REQUIRES_VND" },
      { status: 400 },
    );
  }
  if (method === WALLET_TOPUP_METHOD.CRYPTO) {
    if (currency !== WALLET_CURRENCY.USD) {
      return NextResponse.json(
        { error: "CRYPTO_REQUIRES_USD" },
        { status: 400 },
      );
    }
    if (!cryptoMethodId || !VALID_CRYPTO_METHODS.has(cryptoMethodId)) {
      return NextResponse.json(
        { error: "INVALID_CRYPTO_METHOD" },
        { status: 400 },
      );
    }
  }

  const amountCheck = validateTopupAmount(currency, amount);
  if (!amountCheck.ok) {
    return NextResponse.json(
      { error: amountCheck.reason },
      { status: 400 },
    );
  }

  let topup;
  try {
    topup = await createWalletTopup({
      userId: user.id,
      currency,
      amount,
      method,
      cryptoMethodId,
      clientIp: ip,
      userAgent,
    });
  } catch (err) {
    if (err instanceof NoActiveBankAccountError) {
      return NextResponse.json(
        {
          error: "Chưa cấu hình tài khoản ngân hàng nhận thanh toán",
          code: "NO_ACTIVE_BANK_ACCOUNT",
        },
        { status: 503 },
      );
    }
    throw err;
  }
  if (!topup) {
    return NextResponse.json(
      { error: "Failed to create topup" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      id: topup.id,
      currency: topup.currency,
      amount: topup.amount,
      method: topup.method,
      cryptoMethodId: topup.cryptoMethodId,
      status: topup.status,
      transferContent: topup.transferContent,
      expiresAt: topup.expiresAt,
    },
    { status: 201 },
  );
}
