"use client";

import { ImagePlus, Send, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const requestTypes = [
  ["support.question", "سؤال"],
  ["support.problem", "مشكلة تقنية"],
  ["billing.question", "الدفع أو الاشتراك"],
  ["feature.request", "طلب ميزة"],
  ["account.change", "تعديل على الحساب"],
  ["feedback.suggestion", "اقتراح"],
  ["report.general", "بلاغ"],
  ["other.request", "أخرى"],
] as const;

type Draft = { typeKey?: string; subject?: string; body: string; idempotencyKey?: string };

function useCommunicationDraft(key: string, clear = false) {
  const storageKey = `frameid:communication-draft:${key}:v1`;
  const pendingKey = `${storageKey}:pending`;
  const [draft, setDraft] = useState<Draft>({ body: "", idempotencyKey: "" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (clear) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(pendingKey);
      setReady(true);
      return;
    }
    const raw = localStorage.getItem(storageKey) ?? localStorage.getItem(pendingKey);
    if (raw) {
      try { setDraft(JSON.parse(raw) as Draft); } catch { localStorage.removeItem(storageKey); }
    }
    setDraft((current) => current.idempotencyKey ? current : { ...current, idempotencyKey: crypto.randomUUID() });
    setReady(true);
  }, [clear, pendingKey, storageKey]);

  useEffect(() => {
    if (!ready || clear) return;
    const timeout = window.setTimeout(() => localStorage.setItem(storageKey, JSON.stringify(draft)), 250);
    return () => window.clearTimeout(timeout);
  }, [clear, draft, ready, storageKey]);

  return {
    draft,
    setDraft,
    clearDraft() {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(pendingKey);
      setDraft({ body: "", idempotencyKey: crypto.randomUUID() });
    },
    prepareSubmit() {
      localStorage.setItem(pendingKey, JSON.stringify(draft));
      localStorage.removeItem(storageKey);
    },
  };
}

function AttachmentPicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function sync(next: File[]) {
    setFiles(next);
    const transfer = new DataTransfer();
    next.forEach((file) => transfer.items.add(file));
    if (inputRef.current) inputRef.current.files = transfer.files;
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-dashed border-white/12 bg-black/10 p-4">
      <label className="grid cursor-pointer gap-2 text-sm font-black text-white/65">
        <span className="flex items-center gap-2"><ImagePlus className="size-4 text-[#f3cf73]" /> صور توضيحية — اختياري</span>
        <input ref={inputRef} type="file" name="attachments" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => sync(Array.from(event.target.files ?? []).slice(0, 5))} className="text-xs font-bold text-white/45 file:ml-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:font-black file:text-white" />
        <small className="text-[0.68rem] font-bold text-white/30">حتى 5 صور، وبحد أقصى 5MB للصورة.</small>
      </label>
      {previews.length > 0 ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{previews.map(({ file, url }, index) => <div key={`${file.name}:${file.lastModified}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/20"><div className="relative aspect-video"><Image src={url} alt={`معاينة ${file.name}`} fill unoptimized className="object-cover" /><button type="button" onClick={() => sync(files.filter((_, fileIndex) => fileIndex !== index))} aria-label={`حذف ${file.name}`} className="absolute left-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-black/75 text-white"><X className="size-4" /></button></div><p className="truncate px-2 py-1.5 text-[0.62rem] font-bold text-white/45">{file.name}</p></div>)}</div> : null}
    </div>
  );
}

export function NewCustomerConversationForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const { draft, setDraft, clearDraft, prepareSubmit } = useCommunicationDraft("new");
  return (
    <form action={action} onSubmit={prepareSubmit} className="grid gap-5 rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <input type="hidden" name="idempotencyKey" value={draft.idempotencyKey ?? ""} />
      <label className="grid gap-2 text-sm font-black text-white/72">نوع الطلب<select name="typeKey" required value={draft.typeKey ?? "support.question"} onChange={(event) => setDraft({ ...draft, typeKey: event.target.value })} className="min-h-12 rounded-2xl border border-white/10 bg-[#11141b] px-4 text-sm font-bold text-white outline-none focus:border-amber-300/35">{requestTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-black text-white/72">العنوان<input name="subject" required maxLength={180} value={draft.subject ?? ""} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} placeholder="مثال: لا أستطيع نشر الموقع" className="min-h-12 rounded-2xl border border-white/10 bg-black/15 px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-amber-300/35" /></label>
      <label className="grid gap-2 text-sm font-black text-white/72">التفاصيل<textarea name="body" required maxLength={20000} rows={7} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="اشرح ما حدث والخطوات التي جرّبتها..." className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm font-bold leading-7 text-white outline-none placeholder:text-white/25 focus:border-amber-300/35" /></label>
      <AttachmentPicker />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between"><button type="button" onClick={clearDraft} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-black text-white/45"><Trash2 className="size-4" /> مسح المسودة</button><button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-5 text-sm font-black text-[#17130a] transition hover:bg-[#ffe39a]"><Send className="size-4" /> إرسال الطلب</button></div>
    </form>
  );
}

export function CustomerReplyForm({ action, conversationId, clearDraft = false }: { action: (formData: FormData) => void | Promise<void>; conversationId: string; clearDraft?: boolean }) {
  const { draft, setDraft, prepareSubmit } = useCommunicationDraft(`reply:${conversationId}`, clearDraft);
  return <form action={action} onSubmit={prepareSubmit} className="sticky bottom-20 grid gap-3 rounded-[1.5rem] border border-white/12 bg-[#10131a]/96 p-4 shadow-2xl backdrop-blur-xl lg:bottom-4"><input type="hidden" name="conversationId" value={conversationId} /><input type="hidden" name="idempotencyKey" value={draft.idempotencyKey ?? ""} /><label className="text-xs font-black text-white/55" htmlFor="reply-body">اكتب ردك</label><textarea id="reply-body" name="body" required rows={4} maxLength={20000} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold leading-7 text-white outline-none placeholder:text-white/25 focus:border-amber-300/35" placeholder="أضف أي تفاصيل جديدة..." /><AttachmentPicker /><button type="submit" disabled={!draft.idempotencyKey} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-5 text-sm font-black text-[#17130a] disabled:opacity-50"><Send className="size-4" /> إرسال الرد</button></form>;
}

export function ClearCustomerCommunicationDraft({ draftKey }: { draftKey: string }) {
  useEffect(() => {
    const key = `frameid:communication-draft:${draftKey}:v1`;
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}:pending`);
  }, [draftKey]);
  return null;
}

export function MarkConversationReadOnMount({ action, conversationId }: { action: (conversationId: string) => Promise<void>; conversationId: string }) {
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void action(conversationId).then(() => router.refresh());
  }, [action, conversationId, router]);
  return null;
}

export function BrowserTimezoneOffset() {
  const [offset, setOffset] = useState("");
  useEffect(() => setOffset(String(new Date().getTimezoneOffset())), []);
  return <input type="hidden" name="timezoneOffsetMinutes" value={offset} />;
}
