"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Phone, Save, User, type LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSiteInfoAction, type AutosaveState } from "@/app/(dashboard)/dashboard/site-info/actions";
import { isPhoneStorageEmail } from "@/modules/auth/auth-identifier";

type SiteInfoClientProps = {
  userName: string;
  userEmail: string;
  userPhone: string | null;
  studioName: string | null;
  bio: string | null;
  longDescription: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  workingHours: Record<string, string> | null;
  bookingMessageTemplate: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  snapchat: string | null;
  youtube: string | null;
  behance: string | null;
  fiveHundredPx: string | null;
  linkedin: string | null;
  telegram: string | null;
  xTwitter: string | null;
  threads: string | null;
  website: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
};

type SectionState = { pending: boolean; result: AutosaveState | null };

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function normalizeWhatsApp(value: string): string {
  const trimmed = normalizeDigits(value).trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  let digits = trimmed.replace(/[^0-9+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("01") && digits.length === 11) digits = `+20${digits.slice(1)}`;
  if (digits.startsWith("1") && digits.length === 10) digits = `+20${digits}`;
  if (!digits.startsWith("+")) digits = `+${digits}`;

  const clean = digits.replace(/[^0-9]/g, "");
  return clean ? `https://wa.me/${clean}` : trimmed;
}

export function SiteInfoClient(props: SiteInfoClientProps) {
  const [, startTransition] = useTransition();
  const [states, setStates] = useState<Record<string, SectionState>>({});
  const [whatsapp, setWhatsapp] = useState(props.whatsapp ?? "");
  const accountEmailForContact = isPhoneStorageEmail(props.userEmail) ? "" : props.userEmail;

  const hasIdentity = Boolean(props.userName || props.studioName || props.bio);
  const hasContact = Boolean(props.phone || props.whatsapp || props.facebook || props.instagram || props.tiktok);
  const completePercent = Math.round(((hasIdentity ? 1 : 0) + (hasContact ? 1 : 0)) / 2 * 100);

  function setPending(key: string, pending: boolean, result: AutosaveState | null = states[key]?.result ?? null) {
    setStates((current) => ({ ...current, [key]: { pending, result } }));
  }

  function saveForm(form: HTMLFormElement, key: string) {
    const formData = new FormData(form);
    setPending(key, true, null);
    startTransition(async () => {
      const result = await updateSiteInfoAction(formData);
      setPending(key, false, result);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>, key: string) {
    event.preventDefault();
    saveForm(event.currentTarget, key);
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-3 pb-4">
      <section className="rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.1),transparent_38%),rgba(255,255,255,0.035)] p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Phone className="size-5" /></span>
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">المرحلة ٢</p>
            <h1 className="mt-1 text-xl font-black text-[#fff7e8] sm:text-2xl">بيانات التواصل</h1>
            <p className="mt-1 text-sm font-bold leading-7 text-white/55">هنا نحط فقط بيانات تعريفك وطرق الحجز. أي خانة بتكتبها وتنتقل للي بعدها بتتحفظ تلقائيًا.</p>
          </div>
        </div>
      </section>

      <form
        className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3"
        onSubmit={(event) => handleSubmit(event, "identity")}
        onBlurCapture={(event) => {
          if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) saveForm(event.currentTarget, "identity");
        }}
      >
        <CardHeader icon={User} title="هويتك" description="البيانات الأساسية اللي تظهر للعميل." state={states.identity} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="اسم المصور"><Input name="userName" defaultValue={props.userName} placeholder="اسمك الشخصي" /></Field>
          <Field label="اسم الاستوديو أو البراند أو الشركة"><Input name="studioName" defaultValue={props.studioName ?? ""} placeholder="مثلاً: Frame Studio" /></Field>
        </div>
        <Field label="نبذة قصيرة"><Input name="bio" defaultValue={props.bio ?? ""} placeholder="مصور زفاف ومنتجات في القاهرة" /></Field>
        <Field label="قصة أو وصف"><Textarea name="longDescription" defaultValue={props.longDescription ?? ""} rows={5} placeholder="احكي للعميل عن أسلوبك وخبرتك بشكل بسيط..." /></Field>
        <SaveLine state={states.identity} />
      </form>

      <form
        className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3"
        onSubmit={(event) => handleSubmit(event, "contact")}
        onBlurCapture={(event) => {
          if (event.target instanceof HTMLInputElement) saveForm(event.currentTarget, "contact");
        }}
      >
        <CardHeader icon={Phone} title="طرق التواصل" description="خلي الحجز سهل وواضح للعميل." state={states.contact} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="رقم الهاتف"><Input name="phone" type="tel" defaultValue={props.phone ?? props.userPhone ?? ""} placeholder="01000000000" /></Field>
          <Field label="رقم الواتساب أو رابط واتساب"><Input name="whatsapp" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} onBlur={() => setWhatsapp(normalizeWhatsApp(whatsapp))} placeholder="01000000000" dir="ltr" /></Field>
          <Field label="رابط فيسبوك"><Input name="facebook" defaultValue={props.facebook ?? ""} placeholder="https://facebook.com/..." dir="ltr" /></Field>
          <Field label="رابط إنستجرام"><Input name="instagram" defaultValue={props.instagram ?? ""} placeholder="https://instagram.com/..." dir="ltr" /></Field>
          <Field label="رابط تيك توك"><Input name="tiktok" defaultValue={props.tiktok ?? ""} placeholder="https://tiktok.com/@..." dir="ltr" /></Field>
          <Field label="البريد الإلكتروني اختياري"><Input name="email" type="email" defaultValue={props.email ?? accountEmailForContact} placeholder="name@example.com" /></Field>
        </div>
        <SaveLine state={states.contact} />
      </form>

      <section className="grid gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div>
          <p className="text-xs font-black text-white/38">اكتمال مرحلة التواصل</p>
          <p className="mt-1 text-lg font-black text-[#fff7e8]">{completePercent}%</p>
        </div>
        <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/70 no-underline">الرئيسية</Link>
        <Link href="/dashboard/gallery" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline">
          روح لمرحلة الصور
          <ArrowLeft className="size-4" />
        </Link>
      </section>
    </main>
  );
}

function CardHeader({ icon: Icon, title, description, state }: { icon: LucideIcon; title: string; description: string; state?: SectionState }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/8 pb-3">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Icon className="size-4" /></span>
        <div><h2 className="text-base font-black text-[#fff7e8]">{title}</h2><p className="mt-1 text-xs font-bold leading-5 text-white/45">{description}</p></div>
      </div>
      {state?.pending ? <Loader2 className="size-4 animate-spin text-[#f3cf73]" /> : state?.result?.ok ? <CheckCircle2 className="size-4 text-emerald-300" /> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black text-white/55">{label}</span>{children}</label>;
}

function SaveLine({ state }: { state?: SectionState }) {
  return (
    <div className="flex min-h-9 items-center gap-2 text-xs font-black text-white/38">
      {state?.pending ? <Loader2 className="size-3.5 animate-spin text-[#f3cf73]" /> : state?.result?.ok ? <CheckCircle2 className="size-3.5 text-emerald-300" /> : <Save className="size-3.5" />}
      {state?.pending ? "بيتحفظ..." : state?.result?.message ?? "الحفظ تلقائي عند الانتقال من خانة للتانية"}
    </div>
  );
}
