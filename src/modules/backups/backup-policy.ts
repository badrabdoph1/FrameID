export const SUPPORTED_BACKUP_TYPES = ["DATABASE", "FULL"] as const;

export type SupportedBackupType = (typeof SUPPORTED_BACKUP_TYPES)[number];

export const BACKUP_TYPE_LABELS: Record<SupportedBackupType, string> = {
  DATABASE: "نسخ الداتا",
  FULL: "نسخ كامل",
};

export const BACKUP_TYPE_DESCRIPTIONS: Record<SupportedBackupType, string> = {
  DATABASE: "قاعدة PostgreSQL بالكامل وكل بيانات العملاء المخزنة داخلها فقط.",
  FULL: "قاعدة PostgreSQL بالكامل بالإضافة إلى جميع الملفات والصور والمستندات داخل uploads.",
};

export const BACKUP_POLICY: Record<SupportedBackupType, { schedule: string; retentionCount: number }> = {
  DATABASE: { schedule: "0 */12 * * *", retentionCount: 20 },
  FULL: { schedule: "0 3 */3 * *", retentionCount: 10 },
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
