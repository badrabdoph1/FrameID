import { Banknote, CreditCard, Globe, Plus, Smartphone, type LucideIcon } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-workspace-primitives";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { createPaymentSettingsService } from "@/modules/billing/payment-settings-service";
import { createPrismaPaymentSettingsRepository } from "@/modules/billing/prisma-payment-settings-repository";
import { togglePaymentMethodAction } from "./actions";
import { PaymentAccountForm, type PaymentAccountFormValue } from "./payment-account-form";
import { PaymentAccountList, type PaymentAccountView } from "./payment-account-list";
import { QRCodeSection } from "./qr-code-section";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ success?: string; error?: string; addAccount?: string; editAccount?: string }> };
type MethodMeta = { label: string; icon: LucideIcon; color: string; description: string };

const methodMeta: Record<string, MethodMeta> = {
  INSTAPAY: { label: "إنستا باي", icon: Smartphone, color: "from-rose-500/20 to-rose-500/5 border-rose-500/20", description: "تحويل فوري عبر تطبيق إنستا باي" },
  VODAFONE_CASH: { label: "فودافون كاش", icon: Banknote, color: "from-red-500/20 to-red-500/5 border-red-500/20", description: "تحويل إلى محفظة فودافون كاش" },
  STRIPE: { label: "Stripe", icon: CreditCard, color: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20", description: "دفع بالبطاقات الائتمانية الدولية" },
  PAYPAL: { label: "PayPal", icon: Globe, color: "from-blue-500/20 to-blue-500/5 border-blue-500/20", description: "دفع عبر محفظة PayPal" },
};

const successMessages: Record<string, string> = {
  updated: "تم تحديث إعدادات الدفع",
  toggled: "تم تغيير حالة طريقة الدفع",
  "account-added": "تمت إضافة الحساب بنجاح",
  "account-updated": "تم تحديث الحساب بنجاح",
  "account-deleted": "تم حذف الحساب",
  "qr-updated": "تم تحديث رمز QR",
};

function MethodToggle({ id, isActive, label }: { id: string; isActive: boolean; label: string }) {
  return (
    <form action={togglePaymentMethodAction}>
      <input type="hidden" name="settingsId" value={id} />
      <input type="hidden" name="isActive" value={isActive ? "0" : "1"} />
      <button type="submit" role="switch" aria-checked={isActive} aria-label={`${isActive ? "تعطيل" : "تفعيل"} ${label}`} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-white/20"}`}>
        <span className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${isActive ? "translate-x-[25px]" : "translate-x-[3px]"}`} />
      </button>
    </form>
  );
}

export default async function AdminPaymentSettingsPage({ searchParams }: Props) {
  await requireAdminPermission("payment-settings", "view");
  const params = await searchParams;
  const service = createPaymentSettingsService(createPrismaPaymentSettingsRepository(prisma as never));
  const methods = await service.getAllPaymentMethods();
  const editAccountId = params.editAccount ?? null;
  const editAccountData = methods.flatMap((method) => method.accounts).find((account) => account.id === editAccountId) ?? null;

  return (
    <AdminPageShell badge="المدفوعات" title="إعدادات الدفع" description="فعّل طرق الدفع وحدد الحسابات والتعليمات التي تظهر للعميل." backHref="/admin/settings" backLabel="إعدادات المنصة">
      {params.success && successMessages[params.success] ? <div role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-400">{successMessages[params.success]}</div> : null}
      {params.error ? <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-400">تعذر حفظ التغيير. راجع البيانات وحاول مرة أخرى.</div> : null}

      {methods.length === 0 ? (
        <AdminEmptyState title="لا توجد طرق دفع مهيأة" description="تحتاج قاعدة البيانات إلى تهيئة طرق الدفع قبل إضافة الحسابات." icon={CreditCard} />
      ) : (
        <div className="grid gap-5">
          {methods.map((method) => {
            const meta = methodMeta[method.paymentMethod] ?? { label: method.paymentMethod, icon: CreditCard, color: "from-white/10 to-white/5 border-white/10", description: method.description ?? "" };
            const Icon = meta.icon;
            const showAddForm = params.addAccount === method.id;
            return (
              <section key={method.id} aria-labelledby={`payment-method-${method.id}`} className={`rounded-2xl border bg-gradient-to-br p-4 sm:p-5 ${method.isActive ? meta.color : "border-white/[0.06] from-white/[0.02] to-white/[0.01]"}`}>
                <header className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5"><Icon size={20} className={method.isActive ? "text-white/75" : "text-white/30"} /></span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h2 id={`payment-method-${method.id}`} className={`font-black ${method.isActive ? "text-white" : "text-white/45"}`}>{meta.label}</h2>{!method.isActive ? <span className="rounded-md bg-white/5 px-2 py-1 text-[0.65rem] font-black text-white/35">معطلة</span> : null}</div>
                      <p className="mt-1 text-xs font-bold text-white/45">{meta.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3"><span className="text-xs font-bold text-white/35">{method.accounts.length.toLocaleString("ar-EG")} حساب</span><MethodToggle id={method.id} isActive={method.isActive} label={meta.label} /></div>
                </header>

                {method.isActive && method.accounts.length > 0 ? <PaymentAccountList accounts={method.accounts as PaymentAccountView[]} editAccountId={editAccountId} editAccountData={editAccountData as PaymentAccountFormValue | null} /> : null}

                {method.isActive && !showAddForm ? <a href={`/admin/settings/payment?addAccount=${method.id}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 text-xs font-black text-white/55 no-underline transition hover:bg-white/5 hover:text-white"><Plus size={14} /> إضافة حساب</a> : null}
                {showAddForm ? <div className="mt-4"><PaymentAccountForm settingsId={method.id} /></div> : null}
                {method.isActive ? <div className="mt-4 border-t border-white/[0.06] pt-4"><QRCodeSection settingsId={method.id} qrCodeUrl={method.qrCodeUrl} /></div> : null}
              </section>
            );
          })}
        </div>
      )}
    </AdminPageShell>
  );
}
