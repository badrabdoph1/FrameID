"use client";

type PersonalizedGreetingProps = {
  userName: string;
  siteStatus: "PUBLISHED" | "DRAFT";
  lastModified: string;
};

export function PersonalizedGreeting({ userName, siteStatus, lastModified }: PersonalizedGreetingProps) {
  const statusLabel = siteStatus === "PUBLISHED" ? "منشور" : "مسودة";
  const statusColor = siteStatus === "PUBLISHED" ? "text-emerald-300" : "text-[#f3cf73]";
  const statusBg = siteStatus === "PUBLISHED" ? "bg-emerald-300/12" : "bg-amber-300/12";

  return (
    <div className="px-4 sm:px-6">
      <h1 className="text-2xl font-black text-[#fff7e8] sm:text-3xl lg:text-4xl">
        أهلاً يا {userName}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${statusColor} ${statusBg}`}>
          <span className={`size-1.5 rounded-full ${siteStatus === "PUBLISHED" ? "bg-emerald-300" : "bg-[#f3cf73]"}`} />
          {statusLabel}
        </span>
        <span className="text-xs font-bold text-white/50 sm:text-sm">
          آخر تعديل {lastModified}
        </span>
      </div>
    </div>
  );
}
