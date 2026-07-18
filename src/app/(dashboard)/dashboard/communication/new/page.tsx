import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { NewCustomerConversationForm } from "@/components/communication/customer-composer-form";

import { createCustomerConversationAction } from "../actions";

export default async function NewCustomerConversationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : null;
  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <Link href="/dashboard/communication" className="inline-flex w-fit items-center gap-2 text-xs font-black text-white/50 no-underline hover:text-[#f3cf73]"><ArrowRight className="size-4" /> العودة للرسائل</Link>
      <header>
        <p className="text-xs font-black text-[#f3cf73]">طلب جديد</p>
        <h1 className="mt-1 text-2xl font-black text-[#fff7e8]">كيف نقدر نساعدك؟</h1>
        <p className="mt-2 text-sm font-bold text-white/45">اكتب موضوعًا واحدًا بوضوح، وسنحتفظ بكل المتابعة داخل نفس المحادثة.</p>
      </header>
      {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">{decodeURIComponent(error)}</p> : null}
      <NewCustomerConversationForm action={createCustomerConversationAction} />
    </div>
  );
}
