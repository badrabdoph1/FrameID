import { Pencil } from "lucide-react";

import { DeleteAccountButton } from "./delete-account-button";
import { MoveAccountButtons } from "./move-account-buttons";
import { PaymentAccountForm, type PaymentAccountFormValue } from "./payment-account-form";

export type PaymentAccountView = PaymentAccountFormValue & { isActive: boolean; sortOrder: number };

export function PaymentAccountList({ accounts, editAccountId, editAccountData }: { accounts: PaymentAccountView[]; editAccountId: string | null; editAccountData: PaymentAccountFormValue | null }) {
  return (
    <div className="mt-4 grid gap-2">
      {accounts.map((account, index) => editAccountId === account.id && editAccountData ? (
        <PaymentAccountForm key={account.id} account={editAccountData} />
      ) : (
        <article key={account.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/[0.1]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {account.label ? <p className="mb-0.5 text-xs font-black tracking-wider text-white/40">{account.label}</p> : null}
              <h4 className="font-black text-white/90">{account.accountName}</h4>
              <p className="mt-0.5 text-left font-mono text-sm text-white/60" dir="ltr">{account.accountNumber}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <MoveAccountButtons accountId={account.id} first={index === 0} last={index === accounts.length - 1} />
              <a aria-label={`تعديل حساب ${account.accountName}`} href={`/admin/settings/payment?editAccount=${account.id}`} className="flex size-11 items-center justify-center rounded-xl border border-white/10 text-white/45 transition hover:bg-white/5 hover:text-white/70"><Pencil size={15} /></a>
              <DeleteAccountButton accountId={account.id} />
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            {account.bankName ? <><dt className="text-white/35">البنك</dt><dd className="text-white/70">{account.bankName}</dd></> : null}
            {account.iban ? <><dt className="text-white/35">IBAN</dt><dd className="break-all text-left font-mono text-white/70" dir="ltr">{account.iban}</dd></> : null}
            {account.swift ? <><dt className="text-white/35">SWIFT</dt><dd className="font-mono text-white/70">{account.swift}</dd></> : null}
            {account.phoneNumber ? <><dt className="text-white/35">رقم الهاتف</dt><dd className="text-white/70">{account.phoneNumber}</dd></> : null}
          </dl>
          {account.instructions ? <p className="mt-2 border-t border-white/[0.04] pt-2 text-xs text-white/45">{account.instructions}</p> : null}
          {account.notes ? <p className="mt-2 border-t border-white/[0.04] pt-2 text-xs italic text-white/30">{account.notes}</p> : null}
        </article>
      ))}
    </div>
  );
}
