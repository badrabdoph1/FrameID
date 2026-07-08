"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { movePaymentAccountAction } from "@/app/(admin)/admin/settings/payment/actions";

export function MoveAccountButtons({
  accountId,
  first,
  last,
}: {
  accountId: string;
  first: boolean;
  last: boolean;
}) {
  if (first && last) return null;

  return (
    <div className="flex items-center gap-0.5">
      {!first && (
        <form action={movePaymentAccountAction}>
          <input type="hidden" name="accountId" value={accountId} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            className="flex size-7 items-center justify-center rounded-md border border-white/10 text-white/30 transition hover:border-white/20 hover:bg-white/5 hover:text-white/60"
          >
            <ChevronUp size={12} />
          </button>
        </form>
      )}
      {!last && (
        <form action={movePaymentAccountAction}>
          <input type="hidden" name="accountId" value={accountId} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            className="flex size-7 items-center justify-center rounded-md border border-white/10 text-white/30 transition hover:border-white/20 hover:bg-white/5 hover:text-white/60"
          >
            <ChevronDown size={12} />
          </button>
        </form>
      )}
    </div>
  );
}
