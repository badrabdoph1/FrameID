import type { CustomerIssueStatus } from "./types";

type AdminActor = { id: string };

type WorkflowService = {
  transitionIssue(input: { issueId: string; toStatus: CustomerIssueStatus; actorAdminId: string; note?: string | null }): Promise<unknown>;
  notifyResolved(input: { issueId: string; actorAdminId: string }): Promise<void>;
};

type WorkflowDeps = {
  service: WorkflowService;
  getAdmin: () => Promise<AdminActor>;
  revalidate: (path: string) => void;
};

function revalidateIssue(deps: WorkflowDeps, issueId: string) {
  deps.revalidate("/admin/errors");
  deps.revalidate(`/admin/errors/${issueId}`);
  deps.revalidate("/admin");
}

async function transition(deps: WorkflowDeps, issueId: string, toStatus: CustomerIssueStatus, note?: string | null) {
  const admin = await deps.getAdmin();
  await deps.service.transitionIssue({ issueId, toStatus, actorAdminId: admin.id, ...(note ? { note } : {}) });
  revalidateIssue(deps, issueId);
}

export function createCustomerIssueAdminWorkflow(deps: WorkflowDeps) {
  return {
    async startReview(issueId: string) {
      await transition(deps, issueId, "IN_REVIEW");
    },
    async resolveIssue(issueId: string, note?: string | null) {
      await transition(deps, issueId, "RESOLVED", note);
    },
    async reopenIssue(issueId: string) {
      await transition(deps, issueId, "IN_REVIEW");
    },
    async closeIssue(issueId: string) {
      await transition(deps, issueId, "CLOSED");
    },
    async notifyCustomerResolved(issueId: string) {
      const admin = await deps.getAdmin();
      await deps.service.notifyResolved({ issueId, actorAdminId: admin.id });
      revalidateIssue(deps, issueId);
    },
  };
}
