import Link from "next/link";
import { FileEdit, Search, Share2 } from "lucide-react";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";
const tools = [
  { href: "/admin/content", title: "صفحات المنصة", description: "افتح الصفحة الحقيقية وعدّل محتواها مباشرة.", icon: FileEdit },
  { href: "/admin/content/seo/metadata", title: "بيانات البحث", description: "العناوين والأوصاف الأساسية لمحركات البحث.", icon: Search },
  { href: "/admin/social-preview", title: "معاينة المشاركة", description: "صورة وعنوان الروابط عند مشاركتها على الشبكات الاجتماعية.", icon: Share2 },
];
export default async function AdminMarketingPage() {
  await requireAdminPermission("marketing", "view");
  return <AdminPageShell badge="المحتوى" title="أدوات التسويق" description="بوابة عملية للأدوات التسويقية الموجودة بالفعل، دون وعود أو صفحات فارغة." breadcrumbs={[{ label: "المحتوى", href: "/admin/content" }, { label: "التسويق" }]}><nav aria-label="أدوات التسويق" className="grid gap-3 md:grid-cols-3">{tools.map((tool) => { const Icon = tool.icon; return <Link key={tool.href} href={tool.href} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 no-underline transition hover:border-amber-300/30 hover:bg-amber-300/8"><Icon className="size-5 text-[#f3cf73]" /><h2 className="mt-4 font-black text-[#fff7e8]">{tool.title}</h2><p className="mt-1 text-sm font-bold leading-6 text-white/48">{tool.description}</p></Link>; })}</nav></AdminPageShell>;
}
