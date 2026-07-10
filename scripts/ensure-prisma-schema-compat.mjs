import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

const legacyPaymentQrRelation = 'paymentQRCodes PaymentSettings[] @relation("PaymentQRCode")';
const currentPaymentQrRelation = 'paymentQRCodes PaymentAccount[]  @relation("PaymentQRCode")';
const staleSubscriptionChangeRelations = `

  changesFrom SubscriptionChange[] @relation("FromPlan")
  changesTo   SubscriptionChange[] @relation("ToPlan")`;

let nextSchema = schema
  .replace(legacyPaymentQrRelation, currentPaymentQrRelation)
  .replace(staleSubscriptionChangeRelations, "");

if (nextSchema.includes(legacyPaymentQrRelation)) {
  throw new Error("Prisma schema still references missing PaymentSettings model.");
}

if (nextSchema.includes('changesFrom SubscriptionChange[] @relation("FromPlan")')) {
  throw new Error("Prisma schema still contains stale Subscription.changesFrom relation.");
}

if (nextSchema.includes('changesTo   SubscriptionChange[] @relation("ToPlan")')) {
  throw new Error("Prisma schema still contains stale Subscription.changesTo relation.");
}

if (nextSchema !== schema) {
  writeFileSync(schemaPath, nextSchema);
  console.log("Normalized Prisma schema compatibility relations.");
}
