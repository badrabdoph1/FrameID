export type AcquisitionLifecycleStatus =
  | "DRAFT" | "REQUESTED" | "QUALIFYING" | "ACCEPTED" | "AWAITING_PAYMENT"
  | "PAID" | "FULFILLING" | "FULFILLED" | "DECLINED" | "CANCELLED" | "REFUNDED";

const transitions: Record<AcquisitionLifecycleStatus, readonly AcquisitionLifecycleStatus[]> = {
  DRAFT: ["REQUESTED", "CANCELLED"],
  REQUESTED: ["QUALIFYING", "ACCEPTED", "AWAITING_PAYMENT", "DECLINED", "CANCELLED"],
  QUALIFYING: ["ACCEPTED", "AWAITING_PAYMENT", "DECLINED", "CANCELLED"],
  ACCEPTED: ["AWAITING_PAYMENT", "FULFILLING", "CANCELLED"],
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["FULFILLING", "REFUNDED"],
  FULFILLING: ["FULFILLED", "CANCELLED", "REFUNDED"],
  FULFILLED: ["REFUNDED"],
  DECLINED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function assertAcquisitionTransition(from: AcquisitionLifecycleStatus, to: AcquisitionLifecycleStatus) {
  if (!transitions[from]?.includes(to)) {
    throw new Error(`Invalid acquisition transition: ${from} -> ${to}`);
  }
}
