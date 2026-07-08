export const WORKING_DAYS = [
  ["saturday", "السبت"],
  ["sunday", "الأحد"],
  ["monday", "الاثنين"],
  ["tuesday", "الثلاثاء"],
  ["wednesday", "الأربعاء"],
  ["thursday", "الخميس"],
  ["friday", "الجمعة"],
] as const;

export type WorkingDayKey = (typeof WORKING_DAYS)[number][0];

export function parseWorkingHoursFields(
  formData: FormData,
): Record<string, string> | null {
  const hasRows = WORKING_DAYS.some(([key]) =>
    Array.from(formData.keys()).some((name) => name.startsWith(`hours-${key}-`)),
  );

  if (!hasRows) return null;

  const result: Record<string, string> = {};

  for (const [key, label] of WORKING_DAYS) {
    const enabled = formData.get(`hours-${key}-enabled`) === "on";
    const from = read(formData, `hours-${key}-from`);
    const to = read(formData, `hours-${key}-to`);
    const note = read(formData, `hours-${key}-note`);

    if (!enabled) {
      result[label] = "مغلق";
      continue;
    }

    if (note) {
      result[label] = note;
      continue;
    }

    result[label] = from && to ? `${from} - ${to}` : "حسب الحجز";
  }

  return result;
}

function read(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
