import { addPaymentAccountAction, updatePaymentAccountAction } from "./actions";

export type PaymentAccountFormValue = {
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

const inputClass = "min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition placeholder:text-white/20 focus-visible:ring-2 focus-visible:ring-champagne";

export function PaymentAccountForm({ settingsId, account }: { settingsId?: string; account?: PaymentAccountFormValue }) {
  const isEditing = Boolean(account);
  return (
    <section aria-label={isEditing ? `تعديل حساب ${account?.accountName}` : "إضافة حساب دفع"} className="rounded-2xl border border-champagne/20 bg-champagne/[0.03] p-4 sm:p-5">
      <h4 className="mb-4 text-sm font-black text-champagne">{isEditing ? "تعديل الحساب" : "إضافة حساب جديد"}</h4>
      <form action={isEditing ? updatePaymentAccountAction : addPaymentAccountAction} className="grid gap-4">
        {isEditing ? <input type="hidden" name="accountId" value={account?.id} /> : <input type="hidden" name="settingsId" value={settingsId} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${isEditing ? "edit-" : ""}label`} label="تسمية (اختياري)" name="label" defaultValue={account?.label ?? ""} placeholder="مثال: الحساب الرئيسي" />
          <Field id={`${isEditing ? "edit-" : ""}accountName`} label="اسم صاحب الحساب" name="accountName" defaultValue={account?.accountName ?? ""} placeholder="الاسم كاملاً" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${isEditing ? "edit-" : ""}accountNumber`} label="رقم الحساب" name="accountNumber" defaultValue={account?.accountNumber ?? ""} placeholder="رقم الحساب أو IBAN" required />
          <Field id={`${isEditing ? "edit-" : ""}bankName`} label="اسم البنك" name="bankName" defaultValue={account?.bankName ?? ""} placeholder="مثال: البنك الأهلي المصري" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id={`${isEditing ? "edit-" : ""}iban`} label="IBAN" name="iban" defaultValue={account?.iban ?? ""} placeholder="EG..." dir="ltr" />
          <Field id={`${isEditing ? "edit-" : ""}swift`} label="SWIFT" name="swift" defaultValue={account?.swift ?? ""} placeholder="NBEGEGCX..." dir="ltr" />
          <Field id={`${isEditing ? "edit-" : ""}phoneNumber`} label="رقم الهاتف" name="phoneNumber" defaultValue={account?.phoneNumber ?? ""} placeholder="010..." dir="ltr" />
        </div>
        <TextArea id={`${isEditing ? "edit-" : ""}instructions`} label="تعليمات الدفع" name="instructions" defaultValue={account?.instructions ?? ""} placeholder="تعليمات واضحة تظهر للعميل عند الدفع" />
        <TextArea id={`${isEditing ? "edit-" : ""}notes`} label="ملاحظات داخلية" name="notes" defaultValue={account?.notes ?? ""} placeholder="لن تظهر هذه الملاحظات للعميل" />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="min-h-11 rounded-xl bg-champagne px-5 text-sm font-black text-ink transition hover:bg-champagne/90">{isEditing ? "حفظ التعديلات" : "إضافة الحساب"}</button>
          <a href="/admin/settings/payment" className="inline-flex min-h-11 items-center text-sm font-black text-white/45 transition hover:text-white/70">إلغاء</a>
        </div>
      </form>
    </section>
  );
}

function Field({ id, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return <label htmlFor={id} className="grid gap-1.5 text-xs font-black text-white/50"><span>{label}{props.required ? " *" : ""}</span><input id={id} className={inputClass} {...props} /></label>;
}

function TextArea({ id, label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label: string }) {
  return <label htmlFor={id} className="grid gap-1.5 text-xs font-black text-white/50"><span>{label}</span><textarea id={id} rows={2} className={`${inputClass} min-h-20 resize-y py-2`} {...props} /></label>;
}
