export const SUPPORTED_BACKUP_TYPES = ["DATABASE", "UPLOADS", "FULL"] as const;

export type SupportedBackupType = (typeof SUPPORTED_BACKUP_TYPES)[number];

export const BACKUP_TYPE_LABELS: Record<SupportedBackupType, string> = {
  DATABASE: "نسخ الداتا",
  UPLOADS: "نسخ الملفات",
  FULL: "نسخ كامل",
};

export const BACKUP_TYPE_DESCRIPTIONS: Record<SupportedBackupType, string> = {
  DATABASE: "قاعدة PostgreSQL بالكامل وكل بيانات العملاء المخزنة داخلها فقط.",
  UPLOADS: "جميع الملفات والصور والمستندات داخل uploads فقط دون قاعدة البيانات.",
  FULL: "قاعدة PostgreSQL بالكامل بالإضافة إلى جميع الملفات والصور والمستندات داخل uploads.",
};

export const BACKUP_POLICY: Record<SupportedBackupType, { schedule: string; intervalHours: number; retentionCount: number }> = {
  DATABASE: { schedule: "كل 12 ساعة", intervalHours: 12, retentionCount: 20 },
  UPLOADS: { schedule: "كل 48 ساعة", intervalHours: 48, retentionCount: 10 },
  FULL: { schedule: "كل 48 ساعة", intervalHours: 48, retentionCount: 10 },
};

export function isSupportedBackupType(value: unknown): value is SupportedBackupType {
  return typeof value === "string" && (SUPPORTED_BACKUP_TYPES as readonly string[]).includes(value);
}

export function getBackupTypeLabel(type: string): string {
  return isSupportedBackupType(type) ? BACKUP_TYPE_LABELS[type] : type;
}

export function getBackupPolicy(type: SupportedBackupType) {
  return BACKUP_POLICY[type];
}

export function getNextAutomaticRun(type: SupportedBackupType, from: Date): Date {
  return new Date(from.getTime() + getBackupPolicy(type).intervalHours * 60 * 60 * 1000);
}
