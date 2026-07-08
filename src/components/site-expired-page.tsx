export function SiteExpiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4ee] px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-10 w-10 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          الاشتراك منتهي
        </h1>
        <p className="mb-2 leading-relaxed text-gray-600">
          هذا الموقع غير متاح حالياً بسبب انتهاء فترة الاشتراك.
        </p>
        <p className="text-sm text-gray-500">
          إذا كنت صاحب الموقع، يرجى تسجيل الدخول إلى لوحة التحكم لتجديد اشتراكك.
        </p>
      </div>
    </main>
  );
}
