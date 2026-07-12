"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Globe2,
  PauseCircle,
  QrCode,
  Rocket,
  Search,
  Share2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";

import {
  publishSiteAction,
  unpublishSiteAction,
  updatePublishSeoAction,
  uploadShareImageAction,
} from "@/app/(dashboard)/dashboard/publish/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { DashboardSiteActions } from "@/components/dashboard/dashboard-site-actions";
import { BuilderNotice } from "@/components/dashboard/builder-primitives";

type ReadinessItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

type PublishClientProps = {
  siteTitle: string;
  siteUrl: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  robotsIndex: boolean;
  canonicalUrl: string | null;
  updated?: string;
  error?: string;
  isPublished: boolean;
  publishedVersion: number;
  readinessItems: ReadinessItem[];
  canPublish: boolean;
};

export function PublishClient({
  siteTitle,
  siteUrl,
  seoTitle,
  seoDescription,
  ogImageUrl,
  robotsIndex: initialRobots,
  canonicalUrl,
  updated,
  error,
  isPublished,
  publishedVersion,
  readinessItems,
  canPublish,
}: PublishClientProps) {
  const [robots, setRobots] = useState(initialRobots);
  const [ogUrl, setOgUrl] = useState(ogImageUrl ?? "");
  const [shareImageState, setShareImageState] = useState<string | null>(null);
  const [shareImageOk, setShareImageOk] = useState(false);

  const displayTitle = seoTitle || siteTitle;
  const displayDescription = seoDescription || `${siteTitle} — موقع تصوير فوتوغرافي احترافي.`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(siteUrl)}`;
  const doneCount = readinessItems.filter((item) => item.done).length;

  async function handleShareImageUpload(files: File[]) {
    const file = files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    const result = await uploadShareImageAction(fd);
    setShareImageState(result.message);
    setShareImageOk(result.ok);
    if (result.ok && result.url) setOgUrl(result.url);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4">
      <section className="rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.14),transparent_36%),rgba(255,255,255,0.035)] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">Launch Workspace</p>
            <h1 className="mt-1 text-2xl font-black text-[#fff7e8] sm:text-3xl">راجع، انشر، وشارك موقعك من مكان واحد</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">
              دي آخر محطة في رحلة العميل: تأكد من الجاهزية، اضبط شكل المشاركة، انشر الموقع، ثم انسخ الرابط أو QR لعملائك.
            </p>
          </div>
          <DashboardSiteActions siteUrl={siteUrl} />
        </div>
      </section>

      {updated === "published" ? <BuilderNotice tone="success" title="تم نشر الموقع" description="الرابط أصبح جاهزاً للمشاركة مع العملاء." /> : null}
      {updated === "unpublished" ? <BuilderNotice tone="info" title="تم إرجاع الموقع لمسودة" description="يمكنك تعديله ثم نشره مرة أخرى من نفس الصفحة." /> : null}
      {updated === "seo" ? <BuilderNotice tone="success" title="تم تحديث إعدادات المشاركة" description="التغييرات هتظهر في معاينات المشاركة ومحركات البحث." /> : null}
      {error === "readiness" ? <BuilderNotice tone="warning" title="لا يمكن النشر قبل اكتمال الأساسيات" description="أكمل بيانات التواصل، المعرض، الباقات، وشكل المشاركة أولاً." /> : null}
      {error && error !== "readiness" ? <BuilderNotice tone="error" title="مقدرناش نحفظ إعدادات النشر" description="راجع البيانات وجرب تاني." errorId={error} /> : null}

      <section className="grid gap-3 lg:grid-cols-[1fr_0.82fr]">
        <Panel icon={Rocket} title={isPublished ? "الموقع منشور" : "جاهزية النشر"} description="المنصة تمنع النشر قبل وجود أساسيات تجعل الرابط مفيداً للعميل.">
          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/18 p-3">
              <p className={isPublished ? "text-lg font-black text-emerald-300" : canPublish ? "text-lg font-black text-[#f3cf73]" : "text-lg font-black text-white/78"}>
                {isPublished ? `منشور · الإصدار ${publishedVersion}` : canPublish ? "جاهز للنشر" : `${doneCount} من ${readinessItems.length} جاهز`}
              </p>
              <p className="mt-1 text-xs font-bold leading-6 text-white/45">
                {isPublished ? "يمكنك نسخ الرابط أو إرجاعه لمسودة لو محتاج تعديل كبير." : canPublish ? "كل المتطلبات الأساسية مكتملة. اضغط نشر بعد مراجعة المعاينة." : "اضغط على أي خطوة ناقصة لإكمالها قبل النشر."}
              </p>
            </div>

            <div className="grid gap-2">
              {readinessItems.map((item) => (
                <Link key={item.id} href={item.href} className="grid min-h-11 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 no-underline transition hover:border-amber-300/20 hover:bg-amber-300/8">
                  <span className={item.done ? "text-emerald-300" : "text-white/25"}>{item.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}</span>
                  <span className={item.done ? "text-sm font-black text-white/45" : "text-sm font-black text-[#fff7e8]"}>{item.label}</span>
                  <ExternalLink className="size-3.5 text-white/22" />
                </Link>
              ))}
            </div>

            {isPublished ? (
              <form action={unpublishSiteAction}>
                <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-400/24 bg-red-400/10 px-4 text-sm font-black text-red-200 transition hover:bg-red-400/16">
                  <PauseCircle className="size-4" />
                  إرجاع لمسودة
                </button>
              </form>
            ) : (
              <form action={publishSiteAction}>
                <button type="submit" disabled={!canPublish} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">
                  <Rocket className="size-4" />
                  نشر الموقع الآن
                </button>
              </form>
            )}
          </div>
        </Panel>

        <Panel icon={AlertTriangle} title="قبل إرسال الرابط" description="مراجعة سريعة تمنع أغلب مشاكل أول انطباع.">
          <div className="grid gap-2 text-sm font-bold leading-7 text-white/58">
            <p>شاهد الموقع كما يراه العميل وتأكد أن أول شاشة واضحة.</p>
            <p>تأكد أن واتساب أو الهاتف موجودان للحجز السريع.</p>
            <p>اختبر شكل الرابط في واتساب بعد حفظ صورة المشاركة.</p>
            <p>لو الاشتراك Trial، فعّل الاشتراك قبل نهاية التجربة.</p>
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_0.7fr]">
        <Panel icon={Globe2} title="الرابط الذي سترسله لعملائك" description="ده الرابط اللي هتبعته للعملاء أو تحطه في السوشيال.">
          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p dir="ltr" className="break-all text-sm font-black leading-7 text-[#f3cf73]">{siteUrl}</p>
            </div>
            <DashboardSiteActions siteUrl={siteUrl} />
          </div>
        </Panel>

        <Panel icon={QrCode} title="QR Code" description="اطبعه على كارت أو بانر أو ارسله للعميل.">
          <div className="grid justify-items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR Code بتاع الموقع" width={180} height={180} className="rounded-2xl bg-white p-3" />
            <a href={qrUrl} download="frameid-qr.png" className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 no-underline">
              تحميل QR
            </a>
          </div>
        </Panel>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.78fr_1fr]">
        <Panel icon={Share2} title="شكل المشاركة" description="دي المعاينة المتوقعة لما تبعت الرابط على واتساب أو فيسبوك.">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25">
            <div className="aspect-[1.9/1] bg-white/[0.04]">
              {ogUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ogUrl} alt="صورة مشاركة الموقع" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-white/28"><UploadCloud className="size-10" /></div>
              )}
            </div>
            <div className="p-3">
              <h3 className="truncate text-sm font-black text-[#fff7e8]">{displayTitle}</h3>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-white/45">{displayDescription}</p>
              <p className="mt-2 truncate text-[0.7rem] font-bold text-[#f3cf73]" dir="ltr">{siteUrl}</p>
            </div>
          </div>
        </Panel>

        <Panel icon={UploadCloud} title="صورة المشاركة" description="ارفع صورة قوية، يفضل تكون أفقية وواضحة.">
          {shareImageState ? <BuilderNotice tone={shareImageOk ? "success" : "error"} title={shareImageState} /> : null}
          <ImageUploader onUpload={handleShareImageUpload} multiple={false} maxFiles={1} maxSizeMB={20} />
        </Panel>
      </section>

      <form action={updatePublishSeoAction} className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Search className="size-5" /></span>
          <div>
            <h2 className="text-base font-black text-[#fff7e8]">إعدادات الظهور في Google</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/45">اكتب عنوان ووصف بسيطين. سيب الرابط القانوني فاضي لو مش فاهمه.</p>
          </div>
        </div>

        <input type="hidden" name="ogImageUrl" value={ogUrl} />
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="عنوان الموقع"><Input name="title" defaultValue={seoTitle ?? siteTitle} required placeholder={siteTitle} /></Field>
          <Field label="الرابط القانوني Canonical"><Input name="canonicalUrl" defaultValue={canonicalUrl ?? ""} placeholder={siteUrl} dir="ltr" /></Field>
        </div>
        <label className="grid gap-1.5">
          <span className="text-xs font-black text-white/55">وصف الموقع</span>
          <textarea name="description" rows={4} defaultValue={seoDescription ?? ""} placeholder="وصف مختصر يظهر في نتائج البحث ومعاينات المشاركة..." className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-white outline-none placeholder:text-white/28 focus:border-amber-300/40" />
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-3 text-sm font-black text-white/65">
          <input type="checkbox" name="robotsIndex" checked={robots} onChange={(event) => setRobots(event.target.checked)} className="size-4 accent-[#f3cf73]" />
          اسمح لمحركات البحث تظهر موقعي
        </label>
        <Button type="submit" variant="luxury" className="min-h-12 rounded-2xl font-black">حفظ إعدادات النشر</Button>
      </form>
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
