import type { WorkflowHandler } from "./fulfillment-service";

const complete = (key: string): WorkflowHandler => ({
  key,
  async execute() { return { status: "COMPLETED", result: { workflow: key, completed: true } }; },
});

const waitInternal = (key: string): WorkflowHandler => ({
  key,
  async execute() { return { status: "WAITING_INTERNAL", checkpoint: { workflow: key, queue: "services" } }; },
});

export const defaultWorkflowHandlers: readonly WorkflowHandler[] = [
  complete("instant"),
  complete("payment_then_auto"),
  waitInternal("payment_then_manual"),
  waitInternal("manual_service"),
  waitInternal("custom_quote"),
  waitInternal("beta_application"),
];
