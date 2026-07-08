"use client"

import { BookOpen, Trash2, Plus } from "lucide-react"
import type { CustomerAdminNote } from "./customer-types"
import { useState } from "react"

export function CustomerNotesTab({ notes, onAddNote, onDeleteNote }: {
  notes: CustomerAdminNote[]
  onAddNote: (body: string) => void
  onDeleteNote: (noteId: string) => void
}) {
  const [body, setBody] = useState("")
  const formatDateTime = (d: string) => new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white/60">إضافة ملاحظة</h3>
        <div className="grid gap-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب ملاحظة إدارية..."
            rows={4}
            className="w-full rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-500/50 resize-none"
          />
          <button
            onClick={() => { if (body.trim()) { onAddNote(body.trim()); setBody("") } }}
            disabled={!body.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#f3cf73] to-[#f3cf73]/80 px-4 py-2.5 text-sm font-extrabold text-[#17120a] transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <Plus size={16} />
            إضافة ملاحظة
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/3 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white/60">الملاحظات</h3>
        {notes.length > 0 ? (
          <div className="grid gap-2">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border border-white/6 bg-white/3 px-3.5 py-2.5">
                <p className="text-sm text-white/80">{note.body}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-white/35">
                    {note.authorName ?? "النظام"} · {formatDateTime(note.createdAt)}
                  </p>
                  <form action={async (fd) => { fd.set("noteId", note.id); onDeleteNote(note.id) }}>
                    <button type="submit" className="flex items-center gap-1 text-xs text-red-400/60 transition hover:text-red-400">
                      <Trash2 size={11} /> حذف
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen size={24} className="mb-2 text-white/20" />
            <p className="text-sm text-white/35">لا توجد ملاحظات</p>
          </div>
        )}
      </div>
    </div>
  )
}
