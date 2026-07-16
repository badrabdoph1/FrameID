"use client";

import { restoreFromTrashAction, permanentDeleteAction } from "@/app/(admin)/admin/trash/actions";

export function TrashActionButtons({ tenantId, displayName }: { tenantId: string; displayName: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <form action={restoreFromTrashAction}>
        <input type="hidden" name="customerId" value={tenantId} />
        <button
          type="submit"
          title="استعادة العميل وجميع بياناته"
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-black text-emerald-400 transition hover:bg-emerald-500/20"
        >
          ♻️ استعادة
        </button>
      </form>
      <form action={permanentDeleteAction}>
        <input type="hidden" name="customerId" value={tenantId} />
        <button
          type="submit"
          onClick={(e) => {
            if (!confirm(`⚠️ هل تريد حذف "${displayName}" نهائيًا؟ سيتم حذف جميع بياناته ومواقعه وملفاته بشكل دائم ولا يمكن التراجع!`)) {
              e.preventDefault();
            }
          }}
          title="حذف نهائي وجميع البيانات"
          className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/8 px-2.5 py-1.5 text-[11px] font-black text-red-400 transition hover:bg-red-500/15"
        >
          🗑️ حذف نهائي
        </button>
      </form>
    </div>
  );
}

export function TrashActionButtonsMobile({ tenantId, displayName }: { tenantId: string; displayName: string }) {
  return (
    <div className="mt-3 flex gap-2">
      <form action={restoreFromTrashAction} className="flex-1">
        <input type="hidden" name="customerId" value={tenantId} />
        <button type="submit" className="flex w-full items-center justify-center gap-1 rounded-xl border border-emerald-500/25 bg-emerald-500/10 py-2 text-xs font-black text-emerald-400">
          ♻️ استعادة
        </button>
      </form>
      <form action={permanentDeleteAction} className="flex-1">
        <input type="hidden" name="customerId" value={tenantId} />
        <button
          type="submit"
          onClick={(e) => {
            if (!confirm(`⚠️ حذف "${displayName}" نهائيًا؟ لا يمكن التراجع!`)) {
              e.preventDefault();
            }
          }}
          className="flex w-full items-center justify-center gap-1 rounded-xl border border-red-500/20 bg-red-500/8 py-2 text-xs font-black text-red-400"
        >
          🗑️ حذف نهائي
        </button>
      </form>
    </div>
  );
}
