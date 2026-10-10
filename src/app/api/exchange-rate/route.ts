import { NextResponse } from "next/server";
import { getExchangeRateQuote } from "~/lib/exchange-rate-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await getExchangeRateQuote(), { headers: { "Cache-Control": "no-store" } });
}
