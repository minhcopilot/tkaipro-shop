import { NextResponse } from "next/server";

// Lightweight liveness check: must return an instant 200 with NO blocking work
// (no DB, no auth) so the local watchdog probe (10s timeout) never times out.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "healthy",
    pid: process.pid,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
}

export async function POST() {
  return NextResponse.json({
    ok: true,
    status: "healthy",
    method: "POST",
    pid: process.pid,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
}
