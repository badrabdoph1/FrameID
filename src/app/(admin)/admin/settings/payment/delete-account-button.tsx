"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { deletePaymentAccountAction } from "@/app/(admin)/admin/settings/payment/actions";

export function DeleteAccountButton({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-8 items-center justify-center rounded-lg border border-red-500/10 text-red-400/50 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#1a1a1a] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">حذف الحساب</h3>
            <p className="mt-2 text-sm text-white/60">
              هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="mt-6 flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-extrabold text-white/60 transition hover:bg-white/5 hover:text-white/80"
              >
                إلغاء
              </button>
              <form ref={formRef} action={deletePaymentAccountAction}>
                <input type="hidden" name="accountId" value={accountId} />
                <button
                  type="submit"
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-red-600"
                >
                  تأكيد الحذف
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
