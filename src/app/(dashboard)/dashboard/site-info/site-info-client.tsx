"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Clock, ImageIcon, Loader2, MapPin, MessageSquareText, Phone, Share2, User, type LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { SocialLinksEditor, type SocialLinks } from "@/components/dashboard/social-links-editor";
import { WorkingHoursEditor } from "@/components/dashboard/working-hours-editor";
import { BuilderNotice } from "@/components/dashboard/builder-primitives";
import { updateSiteInfoAction, uploadSiteImageAction, type AutosaveState } from "@/app/(dashboard)/dashboard/site-info/actions";

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

type SectionKey = "identity" | "contact" | "social" | "hours" | "avatar" | "cover";
type SectionState = { pending: boolean; result: AutosaveState | null };

const socialKeys: Array<keyof SocialLinks> = ["instagram", "facebook", "tiktok", "snapchat", "youtube", "behance", "fiveHundredPx", "linkedin", "telegram", "xTwitter", "threads", "website", "whatsapp"];

export function SiteInfoClient(props: SiteInfoClientProps) {
  const [, startTransition] = useTransition();
  const [states, setStates] = useState<Record<string, SectionState>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(props.avatarUrl);
  const [coverPreview, setCoverPreview] = useState<string | null>(props.coverUrl);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: props.instagram ?? undefined,
    facebook: props.facebook ?? undefined,
    tiktok: props.tiktok ?? undefined,
    snapchat: props.snapchat ?? undefined,
    youtube: props.youtube ?? undefined,
    behance: props.behance ?? undefined,
    fiveHundredPx: props.fiveHundredPx ?? undefined,
    linkedin: props.linkedin ?? undefined,
    telegram: props.telegram ?? undefined,
    xTwitter: props.xTwitter ?? undefined,
    threads: props.threads ?? undefined,
    website: props.website ?? undefined,
    whatsapp: props.whatsapp ?? undefined,
  });

  const hasContact = Boolean(props.phone || props.whatsapp || props.email);
  const hasLocation = Boolean(props.city || props.country || props.address);
  const hasImages = Boolean(avatarPreview || coverPreview);
  const filledSocials = Object.values(socialLinks).filter(Boolean).length;

  function setPending(key: SectionKey, pending: boolean, result: AutosaveState | null = states[key]?.result ?? null) {
    setStates((current) => ({ ...current, [key]: { pending, result } }));
  }

  function saveForm(event: FormEvent<HTMLFormElement>, key: SectionKey) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(key, true, null);
    startTransition(async () => {
      const result = await updateSiteInfoAction(formData);
      setPending(key, false, result);
    });
  }

  function uploadImage(field: "avatarAssetId" | "coverAssetId") {
    return async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const key: SectionKey = field === "avatarAssetId" ? "avatar" : "cover";
      setPending(key, true, null);
      const fd = new FormData();
      fd.append("image", file);
      fd.append("field", field);
      const result = await uploadSiteImageAction(fd);
      if (result.ok) {
        const url = URL.createObjectURL(file);
        if (field === "avatarAssetId") setAvatarPreview(url);
        else setCoverPreview(url);
      }
      setPending(key, false, result);
    };
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4">
      <section className="rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.14),transparent_36%),rgba(255,255,255,0.035)] p-4 sm:p-5">
        <div>
          <p className="text-[0.72rem] font-black text-[#f3cf73]">بيانات الموقع</p>
          <h1 className="mt-1 text-2xl font-black text-[#fff7e8] sm:text-3xl">عرّف العميل عليك بسرعة</h1>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">
            هنا بتحط الاسم، النبذة، صور الغلاف، طرق التواصل، السوشيال، ومواعيد الشغل. كل قسم مستقل عشان التعديل يبقى سهل من الموبايل.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <MiniStat label="التواصل" value={hasContact ? "جاهز" : "ناقص"} ok={hasContact} />
          <MiniStat label="الموقع" value={hasLocation ? "محدد" : "غير مكتمل"} ok={hasLocation} />
          <MiniStat label="الصور" value={hasImages ? "مرفوعة" : "ناقص صور"} ok={hasImages} />
          <MiniStat label="السوشيال" value={`${filledSocials} رابط`} ok={filledSocials > 0} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
        <Panel icon={User} title="هويتك" description="الاسم والنبذة اللي تظهر للعميل في أول زيارة.">
          <form className="grid gap-3" onSubmit={(event) => saveForm(event, "identity")}>
            <ReadOnly label="اسم الحساب" value={props.userName} />
            <Field label="اسم الاستوديو أو البراند"><Input name="studioName" defaultValue={props.studioName ?? ""} placeholder="مثلاً: Frame Studio" /></Field>
            <Field label="نبذة قصيرة"><Input name="bio" defaultValue={props.bio ?? ""} placeholder="مصور زفاف ومنتجات في القاهرة" /></Field>
            <Field label="قصة أو وصف أطول"><Textarea name="longDescription" defaultValue={props.longDescription ?? ""} rows={5} placeholder="احكي للعميل عن أسلوبك وخبرتك..." /></Field>
            <SaveButton state={states.identity} />
          </form>
        </Panel>

        <Panel icon={ImageIcon} title="الصور الأساسية" description="الصورة الشخصية والغلاف هم أول انطباع للعميل.">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageBox title="الصورة الشخصية" preview={avatarPreview} state={states.avatar}>
              <ImageUploader onUpload={uploadImage("avatarAssetId")} multiple={false} maxFiles={1} maxSizeMB={10} />
            </ImageBox>
            <ImageBox title="صورة الغلاف" preview={coverPreview} state={states.cover} wide>
              <ImageUploader onUpload={uploadImage("coverAssetId")} multiple={false} maxFiles={1} maxSizeMB={15} />
            </ImageBox>
          </div>
        </Panel>
      </section>

      <Panel icon={Phone} title="طرق التواصل والمكان" description="خلي الحجز سهل: رقم، واتساب، بريد، ومدينة.">
        <form className="grid gap-3" onSubmit={(event) => saveForm(event, "contact")}>
          <div className="grid gap-3 lg:grid-cols-3">
            <Field label="رقم الهاتف"><Input name="phone" type="tel" defaultValue={props.phone ?? props.userPhone ?? ""} placeholder="+20 100 000 0000" /></Field>
            <Field label="واتساب"><Input name="whatsapp" defaultValue={props.whatsapp ?? ""} placeholder="https://wa.me/201000000000" dir="ltr" /></Field>
            <Field label="البريد"><Input name="email" type="email" defaultValue={props.email ?? props.userEmail ?? ""} placeholder="photographer@example.com" /></Field>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <Field label="المدينة"><Input name="city" defaultValue={props.city ?? ""} placeholder="القاهرة" /></Field>
            <Field label="الدولة"><Input name="country" defaultValue={props.country ?? ""} placeholder="مصر" /></Field>
            <Field label="Google Maps"><Input name="googleMapsUrl" defaultValue={props.googleMapsUrl ?? ""} placeholder="رابط Google Maps" dir="ltr" /></Field>
          </div>
          <Field label="العنوان"><Input name="address" defaultValue={props.address ?? ""} placeholder="العنوان بالتفصيل لو عندك استوديو" /></Field>
          <Field label="رسالة الحجز الجاهزة"><Textarea name="bookingMessageTemplate" defaultValue={props.bookingMessageTemplate ?? ""} rows={3} placeholder="مثلاً: أهلاً، حابب أحجز جلسة تصوير يوم..." /></Field>
          <SaveButton state={states.contact} />
        </form>
      </Panel>

      <Panel icon={Share2} title="روابط السوشيال" description="ضيف الروابط المهمة فقط عشان العميل مايتشتتش.">
        <form className="grid gap-3" onSubmit={(event) => saveForm(event, "social")}>
          {socialKeys.map((key) => <input key={key} type="hidden" name={key} value={socialLinks[key] ?? ""} />)}
          <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} />
          <SaveButton state={states.social} />
        </form>
      </Panel>

      <Panel icon={Clock} title="مواعيد العمل" description="وضح للعميل إمتى يقدر يتواصل أو يحجز.">
        <form className="grid gap-3" onSubmit={(event) => saveForm(event, "hours")}>
          <WorkingHoursEditor value={props.workingHours} />
          <SaveButton state={states.hours} />
        </form>
      </Panel>
    </main>
  );
}

function Panel({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
      <header className="flex items-start gap-3 border-b border-white/8 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Icon className="size-5" /></span>
        <div><h2 className="text-base font-black text-[#fff7e8]">{title}</h2><p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p></div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black text-white/55">{label}</span>{children}</label>;
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/8 bg-black/15 p-3"><p className="text-xs font-black text-white/40">{label}</p><p className="mt-1 text-sm font-black text-[#fff7e8]">{value}</p></div>;
}

function MiniStat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return <div className="rounded-2xl border border-white/8 bg-black/18 p-3"><p className={ok ? "text-sm font-black text-emerald-300" : "text-sm font-black text-[#f3cf73]"}>{value}</p><p className="mt-1 text-[0.72rem] font-black text-white/38">{label}</p></div>;
}

function SaveButton({ state }: { state?: SectionState }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
      <Button type="submit" variant="luxury" className="min-h-11 rounded-2xl font-black" disabled={state?.pending}>
        {state?.pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        {state?.pending ? "جاري الحفظ..." : "حفظ التعديلات"}
      </Button>
      <SectionFeedback state={state} />
    </div>
  );
}

function SectionFeedback({ state }: { state?: SectionState }) {
  if (!state?.result) return null;
  return <BuilderNotice tone={state.result.ok ? "success" : "error"} title={state.result.message} />;
}

function ImageBox({ title, preview, state, children, wide }: { title: string; preview: string | null; state?: SectionState; children: ReactNode; wide?: boolean }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/8 bg-black/15 p-3">
      <div className={wide ? "aspect-[16/10] overflow-hidden rounded-2xl bg-white/[0.04]" : "aspect-square overflow-hidden rounded-2xl bg-white/[0.04]"}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={title} className="size-full object-cover" />
        ) : <div className="grid size-full place-items-center text-white/28"><ImageIcon className="size-10" /></div>}
      </div>
      <h3 className="text-sm font-black text-[#fff7e8]">{title}</h3>
      {children}
      <SectionFeedback state={state} />
    </div>
  );
}
