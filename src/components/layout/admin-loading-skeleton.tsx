import { cn } from "@/lib/utils/cn";

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-white/[0.04]", className)}
    />
  );
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 border-b border-white/[0.06] pb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function AdminCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/[0.06] p-5">
          <Skeleton className="mb-3 h-4 w-20" />
          <Skeleton className="mb-2 h-8 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div role="status" aria-label="جار تحميل الصفحة" aria-busy="true" className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <AdminCardSkeleton />
      <AdminTableSkeleton />
    </div>
  );
}
