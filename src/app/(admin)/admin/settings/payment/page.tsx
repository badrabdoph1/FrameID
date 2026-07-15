import { Banknote, Save, Smartphone } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { updatePaymentAccountAction } from "./actions";

const inputClass = "min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition placeholder:text-white/20 focus-visible:ring-2 focus-visible:ring-champagne";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ success?: string; error?: string }> };

const ACCOUNTS = [
  {
    id: "instapay",
    method: "INSTAPAY",
    label: "إنستا باي",
    icon: Smartphone,
    color: "from-rose-500/20 to-rose-500/5 border-rose-500/20",
    description: "تحويل فوري عبر تطبيق إنستا باي",
    defaultName: "Badr A** B** H****",
    defaultNumber: "01011511561",
  },
  {
    id: "vodafone-cash",
    method: "VODAFONE_CASH",
    label: "فودافون كاش",
    icon: Banknote,
    color: "from-red-500/20 to-red-500/5 border-red-500/20",
    description: "تحويل إلى محفظة فودافون كاش",
    defaultName: "Badr A** B** H****",
    defaultNumber: "01038434472",
  },
];

export default async function AdminPaymentSettingsPage({
  searchParams,
}: Props) {
  await requireAdminPermission("payment-settings", "view");
  const params = await searchParams;

  return (
    <AdminPageShell
      badge="المدفوعات"
      title="وسائل الدفع"
      description="حسابان ثابتان للدفع — فودافون كاش وإنستا باي. يمكنك تعديل الاسم والرقم فقط."
      backHref="/admin/settings"
      backLabel="إعدادات المنصة"
    >
      {params.success ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-400"
        >
          تم تحديث بيانات الدفع بنجاح
        </div>
      ) : null}
      {params.error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-400"
        >
          تعذر حفظ التغيير. راجع البيانات وحاول مرة أخرى.
        </div>
      ) : null}

      <div className="grid gap-5">
        {ACCOUNTS.map((account) => {
          const Icon = account.icon;
          return (
            <section
              key={account.id}
              aria-labelledby={`payment-method-${account.id}`}
              className={`rounded-2xl border bg-gradient-to-br p-4 sm:p-5 ${account.color}`}
            >
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5">
                    <Icon size={20} className="text-white/75" />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id={`payment-method-${account.id}`}
                      className="font-black text-white"
                    >
                      {account.label}
                    </h2>
                    <p className="mt-1 text-xs font-bold text-white/45">
                      {account.description}
                    </p>
                  </div>
                </div>
              </header>

              <form
                action={updatePaymentAccountAction}
                className="mt-4 grid gap-4 sm:grid-cols-2"
              >
                <input type="hidden" name="accountId" value={account.id} />
                <input type="hidden" name="method" value={account.method} />

                <label className="grid gap-1.5 text-xs font-black text-white/50">
                  <span>اسم صاحب الحساب</span>
                  <input
                    name="accountName"
                    defaultValue={account.defaultName}
                    className={inputClass}
                    placeholder="الاسم كاملاً"
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-black text-white/50">
                  <span>رقم الهاتف / المحفظة</span>
                  <input
                    name="accountNumber"
                    defaultValue={account.defaultNumber}
                    className={inputClass}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    required
                  />
                </label>

                <div className="sm:col-span-2">
                  <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-champagne px-5 text-sm font-black text-ink transition hover:bg-champagne/90">
                    <Save className="size-4" /> حفظ
                  </button>
                </div>
              </form>
            </section>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
