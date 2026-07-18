export function parseLocalBroadcastSchedule(value: string, offsetValue: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  const offset = Number(offsetValue);
  if (!match || !offsetValue.trim() || !Number.isInteger(offset) || offset < -840 || offset > 840) {
    throw new Error("موعد النشر أو المنطقة الزمنية غير صالح.");
  }
  const [, year, month, day, hour, minute] = match;
  const result = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute) + offset * 60_000);
  if (Number.isNaN(result.getTime())) throw new Error("موعد النشر غير صالح.");
  return result;
}
