import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: true,
        latencyMs: dbLatency,
      },
      memory: process.memoryUsage(),
      node: process.version,
      platform: process.platform,
    });
  } catch (error) {
    const dbLatency = Date.now() - start;

    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: false,
          latencyMs: dbLatency,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 503 }
    );
  }
}
