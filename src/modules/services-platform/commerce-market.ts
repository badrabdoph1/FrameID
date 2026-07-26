import type { EligibilityContext } from "./eligibility";

const currencyByMarket: Readonly<Record<string, string>> = {
  EG: "EGP",
  SA: "SAR",
  AE: "AED",
  QA: "QAR",
  KW: "KWD",
  BH: "BHD",
  OM: "OMR",
  US: "USD",
  GB: "GBP",
};

export function resolveCommerceMarket(context: Pick<EligibilityContext, "country">) {
  const marketCode = context.country?.trim().toUpperCase() || "EG";
  return { marketCode, currency: currencyByMarket[marketCode] ?? "USD" };
}
