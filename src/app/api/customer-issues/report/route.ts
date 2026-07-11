import { checkRateLimit } from "@/lib/rate-limiter";
import { prisma } from "@/lib/prisma";
import { createCustomerIssueService } from "@/modules/customer-issues/customer-issue-service";
import { resolveTrustedIssueContext } from "@/modules/customer-issues/context";
import { createCustomerIssueHttpHandlers } from "@/modules/customer-issues/http";
import { createPrismaCustomerIssueRepository } from "@/modules/customer-issues/prisma-customer-issue-repository";

const service = createCustomerIssueService(createPrismaCustomerIssueRepository(prisma));
const handlers = createCustomerIssueHttpHandlers({
  resolveContext: resolveTrustedIssueContext,
  captureOccurrence: service.captureOccurrence,
  reportIssue: service.reportIssue,
  rateLimit: (key) => checkRateLimit(key, 5, 10 * 60_000),
});

export async function POST(request: Request) {
  return handlers.report(request);
}
