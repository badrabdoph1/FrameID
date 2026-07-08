import type { Metadata } from "next"
import { adminLoginAction } from "@/app/admin/login/actions"

export const metadata: Metadata = {
  title: "تسجيل دخول الإدارة | FrameID",
}

type Props = { searchParams: Promise<{ error?: string }> }

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070707] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-lg font-bold text-[#17120a] shadow-lg">
            F
          </div>
          <h1 className="text-xl font-semibold text-white">لوحة الإدارة</h1>
          <p className="mt-1 text-sm text-white/40">ادخل عشان تتحكم في المنصة</p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-extrabold text-red-400">
            {error}
          </p>
        )}

        <form action={adminLoginAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-extrabold text-white/60">البريد الإلكتروني</label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-500/50 focus:bg-white/8"
              placeholder="admin@frameid.app"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-extrabold text-white/60">كلمة السر</label>
            <input
              id="password" name="password" type="password" autoComplete="current-password" required
              className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-500/50 focus:bg-white/8"
            />
          </div>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] text-sm font-bold text-[#17120a] shadow-lg transition hover:-translate-y-0.5 hover:shadow-amber-500/30"
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  )
}
