import { adminLoginAction } from "@/app/admin/login/actions";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070707]">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[var(--radius-control)] bg-champagne text-lg font-bold text-ink">
            F
          </div>
          <h1 className="text-xl font-semibold text-white">
            لوحة الإدارة
          </h1>
          <p className="mt-1 text-sm text-white/40">
            تسجيل الدخول للتحكم بالمنصة
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-[var(--radius-panel)] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <form action={adminLoginAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-white/60">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="flex h-11 w-full rounded-[var(--radius-control)] border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50 focus:bg-white/[0.06]"
              placeholder="admin@frameid.app"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-white/60">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="flex h-11 w-full rounded-[var(--radius-control)] border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50 focus:bg-white/[0.06]"
            />
          </div>

          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center rounded-[var(--radius-control)] bg-champagne text-sm font-semibold text-ink transition hover:bg-champagne/90"
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
