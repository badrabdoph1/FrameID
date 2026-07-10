import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

const legacyPaymentQrRelation = 'paymentQRCodes PaymentSettings[] @relation("PaymentQRCode")';
const currentPaymentQrRelation = 'paymentQRCodes PaymentAccount[]  @relation("PaymentQRCode")';

let nextSchema = schema.replace(legacyPaymentQrRelation, currentPaymentQrRelation);

if (nextSchema.includes(legacyPaymentQrRelation)) {
  throw new Error("Prisma schema still references missing PaymentSettings model.");
}

if (nextSchema !== schema) {
  writeFileSync(schemaPath, nextSchema);
  console.log("Normalized Prisma PaymentQRCode relation to PaymentAccount.");
}
