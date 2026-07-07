import { NextResponse } from "next/server";

const rateStore = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const now = Date.now();

  const entry = rateStore.get(clientIp);

  if (!entry || now > entry.resetAt) {
    rateStore.set(clientIp, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.json({ allowed: true, remaining: MAX_REQUESTS - 1 });
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    return NextResponse.json(
      { allowed: false, message: "Too many requests. Please try again later.", retryAfter: Math.ceil((entry.resetAt - now) / 1000) },
      { status: 429 }
    );
  }

  return NextResponse.json({ allowed: true, remaining: MAX_REQUESTS - entry.count });
}
