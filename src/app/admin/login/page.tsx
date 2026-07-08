import type { Metadata } from "next";

import { AdminLoginForm } from "./admin-login-form";

export const metadata: Metadata = {
  title: "تسجيل دخول الإدارة | FrameID",
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

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

        <AdminLoginForm initialError={error} />
      </div>
    </div>
  );
}
