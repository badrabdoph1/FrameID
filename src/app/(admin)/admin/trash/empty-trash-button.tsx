"use client";

import { emptyTrashAction } from "@/app/(admin)/admin/trash/actions";

export function EmptyTrashButton() {
  return (
    <form action={emptyTrashAction}>
      <button
        type="submit"
        onClick={(e) => {
          if (
            !confirm(
              "هل أنت متأكد من حذف جميع العملاء في السلة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء."
            )
          ) {
            e.preventDefault();
          }
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-4 text-sm font-black text-red-400 transition hover:border-red-500/40 hover:bg-red-500/15"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
        إفراغ السلة بالكامل
      </button>
    </form>
  );
}
