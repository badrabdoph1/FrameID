"use client";

import { Metric } from "@/components/layout/admin-metric";

interface BackupMetricsSectionProps {
  completed: number;
  failed: number;
  storageUsed: number;
  latestBackupDate: string | null;
  latestRestoreDate: string | null;
}

export function BackupMetricsSection({
  completed,
  failed,
  storageUsed,
  latestBackupDate,
  latestRestoreDate,
}: BackupMetricsSectionProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="آخر نسخة" value={latestBackupDate ?? "لم يتم"} />
      <Metric label="آخر استعادة" value={latestRestoreDate ?? "لم يتم"} />
      <Metric label="نسخ سليمة" value={completed} tone="success" />
      <Metric label="المساحة المسجلة" value={formatBytes(storageUsed)} tone={failed ? "warning" : "default"} />
    </section>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}