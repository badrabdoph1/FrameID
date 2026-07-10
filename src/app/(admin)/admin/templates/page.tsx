import { Eye, Layout, Palette, Save, Settings, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";
import type { ReactNode } from "react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { saveTemplateAction, toggleTemplateAction } from "@/app/(admin)/admin/templates/actions";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

type TemplatePackage = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceAmount: number;
  currency: string;
  imageUrl: string;
  features: string[];
  isHighlighted: boolean;
  enabled: boolean;
};

type TemplateExtra = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
  iconKey: string;
  enabled: boolean;
};

const inputClass = "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-4 focus:ring-amber-300/10";
const textareaClass = `${inputClass} py-3`;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFrom(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function numberFrom(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number.parseInt(stringFrom(value), 10);
  return Number.isFinite(number) ? number : fallback;
}

function boolFrom(value: unknown, fallback = false) {
  if (value === true || value === "true" || value === "on") return true;
  if (value === false || value === "false" || value === "off") return false;
  return fallback;
}

function pickText(value: unknown, keys: string[], fallback = "") {
  if (!isRecord(value)) return fallback;
  for (const key of keys) {
    const item = value[key];
    if (typeof item === "string" && item.trim()) return item.trim();
  }
  return fallback;
}

function pickImage(value: unknown) {
  if (!isRecord(value)) return "";
  const direct = value.image ?? value.cover ?? value.previewImage ?? value.heroImage ?? value.thumbnail;
  if (typeof direct === "string") return direct;
  const hero = value.hero;
  if (isRecord(hero)) {
    const heroImage = hero.imageUrl ?? hero.image ?? hero.cover ?? hero.backgroundImage;
    if (typeof heroImage === "string") return heroImage;
  }
  return "";
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "منشور";
  if (status === "ARCHIVED") return "مؤرشف";
  return "مسودة";
}

function readPackages(previewData: unknown): TemplatePackage[] {
  if (!isRecord(previewData) || !Array.isArray(previewData.packages)) return [];
  return previewData.packages.filter(isRecord).map((item, index) => ({
    id: stringFrom(item.id, `package-${index + 1}`),
    name: stringFrom(item.name, `باقة ${index + 1}`),
    subtitle: stringFrom(item.subtitle),
    price: stringFrom(item.price),
    priceAmount: numberFrom(item.priceAmount),
    currency: stringFrom(item.currency, "EGP"),
    imageUrl: stringFrom(item.imageUrl),
    features: Array.isArray(item.features) ? item.features.map((feature) => stringFrom(feature)).filter(Boolean) : [],
    isHighlighted: boolFrom(item.isHighlighted),
    enabled: boolFrom(item.enabled, item.isActive !== false),
  }));
}

function readExtras(previewData: unknown): TemplateExtra[] {
  if (!isRecord(previewData) || !Array.isArray(previewData.extras)) return [];
  return previewData.extras.filter(isRecord).map((item, index) => ({
    id: stringFrom(item.id, `extra-${index + 1}`),
    name: stringFrom(item.name, `إضافة ${index + 1}`),
    description: stringFrom(item.description),
    price: stringFrom(item.price),
    priceAmount: numberFrom(item.priceAmount),
    currency: stringFrom(item.currency, "EGP"),
    iconKey: stringFrom(item.iconKey, "camera"),
    enabled: boolFrom(item.enabled, item.isActive !== false),
  }));
}

function getHero(previewData: unknown): JsonRecord {
  if (!isRecord(previewData) || !isRecord(previewData.hero)) return {};
  return previewData.hero;
}

function jsonText(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function bannerText(params: { saved?: string; toggled?: string; error?: string }) {
  if (params.error) return { tone: "danger" as const, text: decodeURIComponent(params.error) };
  if (params.saved) return { tone: "success" as const, text: "تم حفظ القالب وباقاته التجريبية بنجاح." };
  if (params.toggled) return { tone: "success" as const, text: "تم تغيير حالة القالب." };
  return null;
}

type Props = {
  searchParams: Promise<{ saved?: string; toggled?: string; error?: string }>;
};

export default async function AdminTemplatesPage({ searchParams }: Props) {
  await requireAdminPermission("templates", "view");
  const params = await searchParams;

  const [templates, themesCount, publishedTemplates] = await Promise.all([
    prisma.template.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "desc" }, { showroomOrder: "asc" }, { updatedAt: "desc" }],
      include: { theme: { select: { id: true, name: true, code: true, category: true, status: true } } },
    }),
    prisma.theme.count({ where: { deletedAt: null } }),
    prisma.template.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
  ]);
  const banner = bannerText(params);

  return (
    <AdminPageShell
      badge="المحتوى"
      title="إدارة القوالب الجاهزة"
      description="تحكم كامل في اسم القالب، وصفه، صورته، الحالة، الباقات، الإضافات، ونصوص المعاينة. أي تعديل هنا يظهر في صفحة معاينة القالب."
      breadcrumbs={[{ label: "المحتوى", href: "/admin/content" }, { label: "القوالب" }]}
      actions={[{ label: "الثيمات", href: "/admin/themes", icon: Palette }, { label: "مركز المحتوى", href: "/admin/content", icon: Settings }]}
    >
      {banner ? <div className={banner.tone === "danger" ? "rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300" : "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-300"}>{banner.text}</div> : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="كل القوالب" value={templates.length} />
        <Metric label="قوالب منشورة" value={publishedTemplates} accent />
        <Metric label="الثيمات" value={themesCount} />
      </section>

      {templates.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-16 text-center">
          <Layout className="mb-3 size-10 text-white/20" />
          <h2 className="text-lg font-black text-white/75">لا توجد قوالب حتى الآن</h2>
          <p className="mt-1 max-w-xl text-sm font-bold leading-7 text-white/42">عند إضافة القوالب ستظهر هنا كمعاينات بصرية يمكن إدارتها بسهولة.</p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {templates.map((template) => {
            const hero = getHero(template.previewData);
            const packages = readPackages(template.previewData);
            const extras = readExtras(template.previewData);
            const previewTitle = pickText(template.previewData, ["title", "headline", "name"], template.name);
            const previewSubtitle = pickText(template.previewData, ["subtitle", "description", "tagline"], template.theme.category);
            const image = pickImage(template.previewData);
            const activePackages = packages.filter((item) => item.enabled).length;
            return (
              <article key={template.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/10">
                <div className="relative min-h-56 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(243,207,115,0.18),transparent_42%),linear-gradient(135deg,#171a22,#0d0f14)] p-5">
                  {image ? <img src={image} alt="" className="absolute inset-0 size-full object-cover opacity-35" /> : null}
                  <div className="relative z-10 flex h-full min-h-44 flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f3cf73] px-3 py-1 text-[0.7rem] font-black text-[#17120a]"><Sparkles className="size-3" /> {template.theme.name}</span>
                      <span className={template.status === "PUBLISHED" ? "rounded-full bg-emerald-400/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : "rounded-full bg-white/10 px-2.5 py-1 text-[0.68rem] font-black text-white/48"}>{statusLabel(template.status)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[#fff7e8] drop-shadow">{previewTitle}</h2>
                      <p className="mt-2 line-clamp-2 text-sm font-bold leading-7 text-white/68">{previewSubtitle}</p>
                      <p className="mt-2 text-xs font-black text-white/42">{activePackages} باقات مفعلة من {packages.length}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#fff7e8]">{template.name}</h3>
                      <p className="mt-1 truncate font-mono text-xs font-bold text-white/35">{template.code}</p>
                    </div>
                    <span className="rounded-2xl border border-white/10 bg-black/18 px-3 py-2 text-xs font-black text-white/45">ترتيب {template.showroomOrder}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <form action={toggleTemplateAction}>
                      <input type="hidden" name="id" value={template.id} />
                      <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 text-sm font-black text-[#f3cf73] transition hover:bg-amber-500/15">
                        {template.status === "PUBLISHED" ? <ToggleLeft className="size-4" /> : <ToggleRight className="size-4" />}
                        {template.status === "PUBLISHED" ? "إيقاف القالب" : "تشغيل القالب"}
                      </button>
                    </form>
                    <a href={`/templates/${template.code}/preview`} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/70 no-underline transition hover:bg-white/[0.08]">
                      <Eye className="size-4" /> معاينة
                    </a>
                  </div>

                  <details className="rounded-3xl border border-white/10 bg-black/18 p-4">
                    <summary className="cursor-pointer text-sm font-black text-[#fff7e8]">فتح محرر القالب والباقات والإضافات</summary>
                    <form action={saveTemplateAction} className="mt-4 grid gap-4 border-t border-white/8 pt-4">
                      <input type="hidden" name="id" value={template.id} />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="اسم القالب"><input name="name" defaultValue={template.name} className={inputClass} /></Field>
                        <Field label="كود القالب"><input name="code" defaultValue={template.code} className={inputClass} /></Field>
                        <Field label="حالة القالب">
                          <select name="status" defaultValue={template.status} className={inputClass}>
                            <option value="PUBLISHED">منشور</option>
                            <option value="DRAFT">مسودة</option>
                            <option value="ARCHIVED">مؤرشف</option>
                          </select>
                        </Field>
                        <Field label="ترتيب الظهور"><input name="showroomOrder" type="number" defaultValue={template.showroomOrder} className={inputClass} /></Field>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="عنوان المعاينة"><input name="previewTitle" defaultValue={previewTitle} className={inputClass} /></Field>
                        <Field label="وصف المعاينة"><input name="previewDescription" defaultValue={previewSubtitle} className={inputClass} /></Field>
                        <Field label="صورة كارت القالب"><input name="previewImage" defaultValue={image} className={inputClass} /></Field>
                        <Field label="عنوان Hero داخل القالب"><input name="heroHeadline" defaultValue={stringFrom(hero.headline)} className={inputClass} /></Field>
                        <Field label="وصف Hero داخل القالب"><input name="heroSubheadline" defaultValue={stringFrom(hero.subheadline)} className={inputClass} /></Field>
                        <Field label="صورة Hero داخل القالب"><input name="heroImageUrl" defaultValue={stringFrom(hero.imageUrl)} className={inputClass} /></Field>
                        <Field label="نص زر الحجز"><input name="callToAction" defaultValue={pickText(template.previewData, ["callToAction"], "احجز الآن")} className={inputClass} /></Field>
                      </div>

                      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div>
                          <h4 className="text-sm font-black text-[#fff7e8]">باقات القالب التجريبية</h4>
                          <p className="mt-1 text-xs font-bold leading-6 text-white/42">عدّل كل خانة، ويمكنك إخفاء الباقة بدون حذفها.</p>
                        </div>
                        <input type="hidden" name="packageCount" value={packages.length} />
                        {packages.map((item, index) => <PackageFields key={`${item.id}-${index}`} item={item} index={index} />)}
                        <NewPackageFields />
                      </div>

                      <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <div>
                          <h4 className="text-sm font-black text-[#fff7e8]">الإضافات التجريبية</h4>
                          <p className="mt-1 text-xs font-bold leading-6 text-white/42">تظهر في معاينة القالب فقط، ويمكن إخفاؤها بدون حذفها.</p>
                        </div>
                        <input type="hidden" name="extraCount" value={extras.length} />
                        {extras.map((item, index) => <ExtraFields key={`${item.id}-${index}`} item={item} index={index} />)}
                        <NewExtraFields />
                      </div>

                      <details className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <summary className="cursor-pointer text-xs font-black text-white/55">تحكم متقدم JSON — لتعديل أي حقل لم يظهر كخانة</summary>
                        <div className="mt-3 grid gap-3">
                          <Field label="previewData JSON"><textarea name="previewDataJson" rows={8} defaultValue={jsonText(template.previewData)} className={`${textareaClass} min-h-40 font-mono text-xs`} /></Field>
                          <Field label="settings JSON"><textarea name="settingsJson" rows={5} defaultValue={jsonText(template.settings)} className={`${textareaClass} min-h-28 font-mono text-xs`} /></Field>
                        </div>
                      </details>

                      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-500/45 bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5">
                        <Save className="size-4" /> حفظ كل تعديلات القالب
                      </button>
                    </form>
                  </details>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </AdminPageShell>
  );
}

function PackageFields({ item, index }: { item: TemplatePackage; index: number }) {
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-white/10 bg-black/18 p-3">
      <legend className="px-2 text-xs font-black text-[#f3cf73]">باقة {index + 1}</legend>
      <input type="hidden" name={`package_${index}_id`} value={item.id} />
      <label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name={`package_${index}_enabled`} defaultChecked={item.enabled} /> تشغيل الباقة في المعاينة</label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم الباقة"><input name={`package_${index}_name`} defaultValue={item.name} className={inputClass} /></Field>
        <Field label="وصف قصير"><input name={`package_${index}_subtitle`} defaultValue={item.subtitle} className={inputClass} /></Field>
        <Field label="السعر النصي"><input name={`package_${index}_price`} defaultValue={item.price} className={inputClass} /></Field>
        <Field label="السعر الرقمي"><input name={`package_${index}_priceAmount`} type="number" defaultValue={item.priceAmount} className={inputClass} /></Field>
        <Field label="العملة"><input name={`package_${index}_currency`} defaultValue={item.currency} className={inputClass} /></Field>
        <Field label="صورة الباقة"><input name={`package_${index}_imageUrl`} defaultValue={item.imageUrl} className={inputClass} /></Field>
        <label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name={`package_${index}_isHighlighted`} defaultChecked={item.isHighlighted} /> مميزة</label>
      </div>
      <Field label="المميزات — كل سطر ميزة"><textarea name={`package_${index}_features`} rows={4} defaultValue={item.features.join("\n")} className={`${textareaClass} min-h-28`} /></Field>
    </fieldset>
  );
}

function NewPackageFields() {
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-dashed border-amber-500/25 bg-amber-500/5 p-3">
      <legend className="px-2 text-xs font-black text-[#f3cf73]">إضافة باقة جديدة للقالب</legend>
      <label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name="newPackageEnabled" defaultChecked /> تشغيل الباقة الجديدة</label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم الباقة الجديدة"><input name="newPackageName" className={inputClass} placeholder="اتركها فارغة لو مش عايز تضيف" /></Field>
        <Field label="وصف قصير"><input name="newPackageSubtitle" className={inputClass} /></Field>
        <Field label="السعر النصي"><input name="newPackagePrice" className={inputClass} placeholder="مثال: 5,000 جنيه" /></Field>
        <Field label="السعر الرقمي"><input name="newPackagePriceAmount" type="number" className={inputClass} /></Field>
        <Field label="العملة"><input name="newPackageCurrency" defaultValue="EGP" className={inputClass} /></Field>
        <Field label="صورة الباقة"><input name="newPackageImageUrl" className={inputClass} /></Field>
        <label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name="newPackageIsHighlighted" /> مميزة</label>
      </div>
      <Field label="المميزات"><textarea name="newPackageFeatures" rows={3} className={`${textareaClass} min-h-24`} /></Field>
    </fieldset>
  );
}

function ExtraFields({ item, index }: { item: TemplateExtra; index: number }) {
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-white/10 bg-black/18 p-3">
      <legend className="px-2 text-xs font-black text-white/45">إضافة {index + 1}</legend>
      <input type="hidden" name={`extra_${index}_id`} value={item.id} />
      <label className="flex min-h-10 items-center gap-2 text-sm font-bold text-white/62"><input type="checkbox" name={`extra_${index}_enabled`} defaultChecked={item.enabled} /> تشغيل الإضافة</label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم الإضافة"><input name={`extra_${index}_name`} defaultValue={item.name} className={inputClass} /></Field>
        <Field label="الوصف"><input name={`extra_${index}_description`} defaultValue={item.description} className={inputClass} /></Field>
        <Field label="السعر النصي"><input name={`extra_${index}_price`} defaultValue={item.price} className={inputClass} /></Field>
        <Field label="السعر الرقمي"><input name={`extra_${index}_priceAmount`} type="number" defaultValue={item.priceAmount} className={inputClass} /></Field>
        <Field label="العملة"><input name={`extra_${index}_currency`} defaultValue={item.currency} className={inputClass} /></Field>
        <Field label="الأيقونة"><input name={`extra_${index}_iconKey`} defaultValue={item.iconKey} className={inputClass} /></Field>
      </div>
    </fieldset>
  );
}

function NewExtraFields() {
  return (
    <fieldset className="grid gap-3 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-3">
      <legend className="px-2 text-xs font-black text-white/45">إضافة خدمة جديدة</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="اسم الإضافة"><input name="newExtraName" className={inputClass} /></Field>
        <Field label="الوصف"><input name="newExtraDescription" className={inputClass} /></Field>
        <Field label="السعر النصي"><input name="newExtraPrice" className={inputClass} /></Field>
        <Field label="السعر الرقمي"><input name="newExtraPriceAmount" type="number" className={inputClass} /></Field>
        <Field label="العملة"><input name="newExtraCurrency" defaultValue="EGP" className={inputClass} /></Field>
        <Field label="الأيقونة"><input name="newExtraIconKey" defaultValue="camera" className={inputClass} /></Field>
      </div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-black text-white/42">{label}</span>{children}</label>;
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className={accent ? "text-2xl font-black text-amber-200" : "text-2xl font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</p><p className="mt-1 text-xs font-black text-white/38">{label}</p></div>;
}
