import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function GET() {
  try {
    const authHeader = process.env.CRON_SECRET
      ? { Authorization: `Bearer ${process.env.CRON_SECRET}` }
      : undefined;

    if (authHeader) {
      const requestAuth = "";
      if (requestAuth !== authHeader.Authorization) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const results: string[] = [];

    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: { lte: now },
      },
      select: { id: true, tenantId: true },
    });

    for (const sub of expiredSubscriptions) {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        }),
        prisma.tenant.update({
          where: { id: sub.tenantId },
          data: { status: "EXPIRED" },
        }),
      ]);
      results.push(`subscription ${sub.id} expired`);
    }

    const expiredTrials = await prisma.tenant.findMany({
      where: {
        status: "TRIAL",
        trialEndsAt: { lte: now },
        OR: [
          { gracePeriodEndsAt: null },
          { gracePeriodEndsAt: { lte: now } },
        ],
      },
      select: { id: true },
    });

    for (const tenant of expiredTrials) {
      await prisma.$transaction([
        prisma.tenant.update({
          where: { id: tenant.id },
          data: { status: "TRIAL_EXPIRED" },
        }),
        prisma.subscription.updateMany({
          where: { tenantId: tenant.id },
          data: { status: "EXPIRED" },
        }),
      ]);
      results.push(`trial expired for tenant ${tenant.id}`);
    }

    return Response.json({
      ok: true,
      processedSubscriptions: expiredSubscriptions.length,
      processedTrials: expiredTrials.length,
      total: expiredSubscriptions.length + expiredTrials.length,
      details: results,
    });
  } catch (error) {
    console.error("Cron check-expiry failed:", error);
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
