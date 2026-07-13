import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { createPaymentSettingsService } from "@/modules/billing/payment-settings-service";
import { createPrismaPaymentSettingsRepository } from "@/modules/billing/prisma-payment-settings-repository";
import {
  togglePaymentMethodAction,
  addPaymentAccountAction,
  updatePaymentAccountAction,
} from "@/app/(admin)/admin/settings/payment/actions";
import { CreditCard, Plus, Pencil, Banknote, Smartphone, Globe } from "lucide-react";
import { DeleteAccountButton } from "./delete-account-button";
import { QRCodeSection } from "./qr-code-section";
import { MoveAccountButtons } from "./move-account-buttons";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    success?: string;
    error?: string;
    addAccount?: string;
    editAccount?: string;
  }>;
};

const methodMeta: Record<string, { label: string; icon: typeof CreditCard; color: string; description: string }> = {
  INSTAPAY: {
    label: "إنستا باي",
    icon: Smartphone,
    color: "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400",
    description: "InstaPay — تحويل فوري عبر التطبيق",
  },
  VODAFONE_CASH: {
    label: "فودافون كاش",
    icon: Banknote,
    color: "from-red-500/20 to-red-500/5 border-red-500/20 text-red-400",
    description: "Vodafone Cash — محفظة فودافون",
  },
  STRIPE: {
    label: "Stripe",
    icon: CreditCard,
    color: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400",
    description: "Stripe — بطاقات ائتمانية دولية",
  },
  PAYPAL: {
    label: "PayPal",
    icon: Globe,
    color: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400",
    description: "PayPal — محفظة إلكترونية عالمية",
  },
};

function ToggleForm({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <form action={togglePaymentMethodAction} className="inline-flex">
      <input type="hidden" name="settingsId" value={id} />
      <input type="hidden" name="isActive" value={isActive ? "0" : "1"} />
      <button
        type="submit"
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
          isActive ? "bg-emerald-500" : "bg-white/20"
        }`}
      >
        <span
          className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isActive ? "translate-x-[22px]" : "translate-x-[4px]"
          }`}
        />
      </button>
    </form>
  );
}

function AccountCard({
  account,
  isFirst,
  isLast,
}: {
  account: {
    id: string;
    label: string | null;
    accountName: string;
    accountNumber: string;
    bankName: string | null;
    iban: string | null;
    swift: string | null;
    phoneNumber: string | null;
    instructions: string | null;
    notes: string | null;
    isActive: boolean;
  };
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-white/[0.1]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {account.label && (
            <p className="mb-0.5 text-xs font-extrabold text-white/40 uppercase tracking-wider">
              {account.label}
            </p>
          )}
          <p className="font-medium text-white/90">{account.accountName}</p>
          <p className="mt-0.5 font-mono text-sm text-white/60 dir-ltr text-left">
            {account.accountNumber}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <MoveAccountButtons accountId={account.id} first={isFirst} last={isLast} />
          <a
            href={`/admin/settings/payment?editAccount=${account.id}`}
            className="flex size-8 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:border-white/20 hover:bg-white/5 hover:text-white/70"
          >
            <Pencil size={14} />
          </a>
          <DeleteAccountButton accountId={account.id} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/50">
        {account.bankName && (
          <>
            <span className="text-white/35">البنك</span>
            <span className="text-white/70">{account.bankName}</span>
          </>
        )}
        {account.iban && (
          <>
            <span className="text-white/35">IBAN</span>
            <span className="font-mono text-white/70 dir-ltr text-left">{account.iban}</span>
          </>
        )}
        {account.swift && (
          <>
            <span className="text-white/35">SWIFT</span>
            <span className="font-mono text-white/70">{account.swift}</span>
          </>
        )}
        {account.phoneNumber && (
          <>
            <span className="text-white/35">رقم الهاتف</span>
            <span className="text-white/70">{account.phoneNumber}</span>
          </>
        )}
      </div>

      {account.instructions && (
        <p className="mt-2 border-t border-white/[0.04] pt-2 text-xs text-white/40">
          {account.instructions}
        </p>
      )}

      {account.notes && (
        <p className="mt-2 border-t border-white/[0.04] pt-2 text-xs text-white/30 italic leading-relaxed">
          {account.notes}
        </p>
      )}
    </div>
  );
}

function AddAccountForm({ settingsId }: { settingsId: string }) {
  return (
    <div className="rounded-xl border border-champagne/20 bg-champagne/[0.03] p-5">
      <h4 className="mb-4 text-sm font-semibold text-champagne">إضافة حساب جديد</h4>
      <form action={addPaymentAccountAction} className="space-y-4">
        <input type="hidden" name="settingsId" value={settingsId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="label" className="mb-1.5 block text-xs font-extrabold text-white/50">
              تسمية (اختياري)
            </label>
            <input
              id="label"
              name="label"
              placeholder="مثال: الحساب الرئيسي"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
            />
          </div>
          <div>
            <label htmlFor="accountName" className="mb-1.5 block text-xs font-extrabold text-white/50">
              اسم صاحب الحساب *
            </label>
            <input
              id="accountName"
              name="accountName"
              required
              placeholder="الاسم كاملاً"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="accountNumber" className="mb-1.5 block text-xs font-extrabold text-white/50">
              رقم الحساب *
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              required
              placeholder="رقم الحساب أو IBAN"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
            />
          </div>
          <div>
            <label htmlFor="bankName" className="mb-1.5 block text-xs font-extrabold text-white/50">
              اسم البنك
            </label>
            <input
              id="bankName"
              name="bankName"
              placeholder="مثال: البنك الأهلي المصري"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="iban" className="mb-1.5 block text-xs font-extrabold text-white/50">
              IBAN
            </label>
            <input
              id="iban"
              name="iban"
              placeholder="EG..."
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
            />
          </div>
          <div>
            <label htmlFor="swift" className="mb-1.5 block text-xs font-extrabold text-white/50">
              SWIFT
            </label>
            <input
              id="swift"
              name="swift"
              placeholder="NBEGEGCX..."
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="mb-1.5 block text-xs font-extrabold text-white/50">
              رقم الهاتف
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              placeholder="010..."
              dir="ltr"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="instructions" className="mb-1.5 block text-xs font-extrabold text-white/50">
            تعليمات الدفع
          </label>
          <textarea
            id="instructions"
            name="instructions"
            rows={2}
            placeholder="أي تعليمات إضافية للعميل عند الدفع..."
            className="h-20 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
          />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-xs font-extrabold text-white/50">
            ملاحظات داخلية
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="ملاحظات الإدارة (لن تظهر للعميل)..."
            className="h-20 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne placeholder:text-white/20"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-xl bg-champagne px-5 py-2.5 text-sm font-extrabold text-ink transition hover:bg-champagne/90"
          >
            إضافة الحساب
          </button>
          <a
            href="/admin/settings/payment"
            className="text-sm font-extrabold text-white/40 transition hover:text-white/60"
          >
            إلغاء
          </a>
        </div>
      </form>
    </div>
  );
}

function EditAccountForm({
  account,
}: {
  account: {
    id: string;
    label: string | null;
    accountName: string;
    accountNumber: string;
    bankName: string | null;
    iban: string | null;
    swift: string | null;
    phoneNumber: string | null;
    instructions: string | null;
    notes: string | null;
  };
}) {
  return (
    <div className="rounded-xl border border-champagne/20 bg-champagne/[0.03] p-5">
      <h4 className="mb-4 text-sm font-semibold text-champagne">تعديل الحساب</h4>
      <form action={updatePaymentAccountAction} className="space-y-4">
        <input type="hidden" name="accountId" value={account.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-label" className="mb-1.5 block text-xs font-extrabold text-white/50">
              تسمية (اختياري)
            </label>
            <input
              id="edit-label"
              name="label"
              defaultValue={account.label ?? ""}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
            />
          </div>
          <div>
            <label htmlFor="edit-accountName" className="mb-1.5 block text-xs font-extrabold text-white/50">
              اسم صاحب الحساب *
            </label>
            <input
              id="edit-accountName"
              name="accountName"
              required
              defaultValue={account.accountName}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-accountNumber" className="mb-1.5 block text-xs font-extrabold text-white/50">
              رقم الحساب *
            </label>
            <input
              id="edit-accountNumber"
              name="accountNumber"
              required
              defaultValue={account.accountNumber}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
            />
          </div>
          <div>
            <label htmlFor="edit-bankName" className="mb-1.5 block text-xs font-extrabold text-white/50">
              اسم البنك
            </label>
            <input
              id="edit-bankName"
              name="bankName"
              defaultValue={account.bankName ?? ""}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="edit-iban" className="mb-1.5 block text-xs font-extrabold text-white/50">
              IBAN
            </label>
            <input
              id="edit-iban"
              name="iban"
              defaultValue={account.iban ?? ""}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
            />
          </div>
          <div>
            <label htmlFor="edit-swift" className="mb-1.5 block text-xs font-extrabold text-white/50">
              SWIFT
            </label>
            <input
              id="edit-swift"
              name="swift"
              defaultValue={account.swift ?? ""}
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
            />
          </div>
          <div>
            <label htmlFor="edit-phoneNumber" className="mb-1.5 block text-xs font-extrabold text-white/50">
              رقم الهاتف
            </label>
            <input
              id="edit-phoneNumber"
              name="phoneNumber"
              defaultValue={account.phoneNumber ?? ""}
              dir="ltr"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
            />
          </div>
        </div>

        <div>
          <label htmlFor="edit-instructions" className="mb-1.5 block text-xs font-extrabold text-white/50">
            تعليمات الدفع
          </label>
          <textarea
            id="edit-instructions"
            name="instructions"
            rows={2}
            defaultValue={account.instructions ?? ""}
            className="h-20 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
          />
        </div>

        <div>
          <label htmlFor="edit-notes" className="mb-1.5 block text-xs font-extrabold text-white/50">
            ملاحظات داخلية
          </label>
          <textarea
            id="edit-notes"
            name="notes"
            rows={2}
            defaultValue={account.notes ?? ""}
            className="h-20 w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus-visible:ring-2 focus-visible:ring-champagne"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-xl bg-champagne px-5 py-2.5 text-sm font-extrabold text-ink transition hover:bg-champagne/90"
          >
            حفظ التعديلات
          </button>
          <a
            href="/admin/settings/payment"
            className="text-sm font-extrabold text-white/40 transition hover:text-white/60"
          >
            إلغاء
          </a>
        </div>
      </form>
    </div>
  );
}

function PaymentMethodCard({
  method,
  showAddForm,
  showEditAccount,
  editAccountData,
}: {
  method: {
    id: string;
    paymentMethod: string;
    isActive: boolean;
    label: string | null;
    description: string | null;
    config: Record<string, unknown>;
    qrCodeUrl: string | null;
    qrCodeAssetId: string | null;
    sortOrder: number;
    accounts: Array<{
      id: string;
      label: string | null;
      accountName: string;
      accountNumber: string;
      bankName: string | null;
      iban: string | null;
      swift: string | null;
      phoneNumber: string | null;
      instructions: string | null;
      notes: string | null;
      isActive: boolean;
      sortOrder: number;
    }>;
  };
  showAddForm: boolean;
  showEditAccount: string | null;
  editAccountData: {
    id: string;
    label: string | null;
    accountName: string;
    accountNumber: string;
    bankName: string | null;
    iban: string | null;
    swift: string | null;
    phoneNumber: string | null;
    instructions: string | null;
    notes: string | null;
  } | null;
}) {
  const meta = methodMeta[method.paymentMethod] ?? {
    label: method.paymentMethod,
    icon: CreditCard,
    color: "from-white/10 to-white/5 border-white/10 text-white/60",
    description: method.description ?? "",
  };
  const Icon = meta.icon;
  const accountCount = method.accounts.length;

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 ${
        method.isActive ? meta.color : "from-white/[0.02] to-white/[0.01] border-white/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
            <Icon size={20} className={method.isActive ? "" : "text-white/30"} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-semibold ${method.isActive ? "text-white" : "text-white/40"}`}>
                {meta.label}
              </h3>
              {!method.isActive && (
                <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.6rem] font-extrabold text-white/30">
                  معطل
                </span>
              )}
            </div>
            <p className={`mt-0.5 text-xs ${method.isActive ? "text-white/50" : "text-white/25"}`}>
              {meta.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-white/30">{accountCount} حساب</span>
          <ToggleForm id={method.id} isActive={method.isActive} />
        </div>
      </div>

      {/* Config Fields */}
      {method.isActive && Object.keys(method.config).length > 0 && (
        <div className="mt-4 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
          <p className="mb-1.5 text-[0.6rem] font-extrabold text-white/30 uppercase tracking-wider">
            الإعدادات
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(method.config).map(([key, val]) => (
              <div key={key} className="text-xs">
                <span className="text-white/35">{key}: </span>
                <span className="text-white/70">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accounts */}
      {method.isActive && accountCount > 0 && (
        <div className="mt-4 space-y-2">
          {method.accounts.map((account, idx) => {
            if (showEditAccount === account.id && editAccountData) {
              return <EditAccountForm key={account.id} account={editAccountData} />;
            }
            return (
              <AccountCard
                key={account.id}
                account={account}
                isFirst={idx === 0}
                isLast={idx === method.accounts.length - 1}
              />
            );
          })}
        </div>
      )}

      {/* Actions */}
      {method.isActive && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!showAddForm && (
            <a
              href={`/admin/settings/payment?addAccount=${method.id}`}
              className="flex h-8 items-center gap-1 rounded-lg border border-dashed border-white/10 px-3 text-xs font-extrabold text-white/40 transition hover:border-white/20 hover:bg-white/5 hover:text-white/70"
            >
              <Plus size={13} />
              إضافة حساب
            </a>
          )}
        </div>
      )}

      {/* Add Account Form */}
      {showAddForm && (
        <div className="mt-4">
          <AddAccountForm settingsId={method.id} />
        </div>
      )}

      {/* QR Code */}
      {method.isActive && (
        <div className="mt-4 border-t border-white/[0.04] pt-4">
          <QRCodeSection settingsId={method.id} qrCodeUrl={method.qrCodeUrl} />
        </div>
      )}
    </div>
  );
}

export default async function AdminPaymentSettingsPage({ searchParams }: Props) {
  await requireAdminPermission("payment-settings", "view");
  const params = await searchParams;

  const service = createPaymentSettingsService(
    createPrismaPaymentSettingsRepository(prisma as never),
  );
  const methods = await service.getAllPaymentMethods();

  const addAccountSettingsId = params.addAccount ?? null;
  const editAccountId = params.editAccount ?? null;

  let editAccountData: {
    id: string;
    label: string | null;
    accountName: string;
    accountNumber: string;
    bankName: string | null;
    iban: string | null;
    swift: string | null;
    phoneNumber: string | null;
    instructions: string | null;
    notes: string | null;
  } | null = null;

  if (editAccountId) {
    for (const m of methods) {
      const found = m.accounts.find((a) => a.id === editAccountId);
      if (found) {
        editAccountData = found;
        break;
      }
    }
  }

  const successMessages: Record<string, string> = {
    updated: "تم تحديث إعدادات الدفع",
    toggled: "تم تغيير حالة طريقة الدفع",
    "account-added": "تم إضافة الحساب بنجاح",
    "account-updated": "تم تحديث الحساب بنجاح",
    "account-deleted": "تم حذف الحساب",
    "qr-updated": "تم تحديث رمز QR",
  };

  return (
    <AdminPageShell
      badge="المدفوعات"
      title="إعدادات الدفع"
      description="إدارة طرق الدفع والحسابات وأكواد QR"
      backHref="/admin/settings"
      backLabel="إعدادات المنصة"
    >
      {/* Flash Messages */}
      {params.success && successMessages[params.success] && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {successMessages[params.success]}
        </div>
      )}
      {params.error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {params.error}
        </div>
      )}

      {/* Payment Methods Grid */}
      {methods.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
          <CreditCard size={40} className="mx-auto text-white/20" />
          <p className="mt-4 text-sm text-white/40">
            لم يتم إعداد أي طرق دفع بعد. يرجى التأكد من تهيئة قاعدة البيانات.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {methods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              showAddForm={addAccountSettingsId === method.id}
              showEditAccount={editAccountId}
              editAccountData={
                editAccountId && editAccountData?.id === editAccountId
                  ? editAccountData
                  : null
              }
            />
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
