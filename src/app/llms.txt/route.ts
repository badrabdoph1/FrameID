export const dynamic = "force-static";

export async function GET() {
  const text = `# FrameID — منصة المصورين المحترفين

> FrameID بيدي المصور حضور فخم وسريع: قالب حي، رابط خاص، لوحة تحكم بسيطة، وتجربة مجانية قبل الدفع.

## الجمهور المستهدف
المصورين المحترفين والاستوديوهات في العالم العربي.

## المميزات الأساسية
- موقع احترافي في دقايق
- قوالب حية (معاينة قبل الاختيار)
- رابط خاص (زي frameid.app/p/username)
- لوحة تحكم بسيطة: صور، باقات، SEO، تواصل
- فصل تام بين لوحة المصور ولوحة الإدارة
- تجربة مجانية ١٤ يوم من غير بطاقة ائتمان

## صفحات مهمة
- المعاينة الحية: https://frameid.app/templates/noir-gold/preview
- القوالب: https://frameid.app/templates
- إنشاء حساب: https://frameid.app/signup
- تسجيل الدخول: https://frameid.app/login

## التقنيات
Next.js, React, TypeScript, Tailwind CSS, Prisma, PostgreSQL

## التسعير
- تجربة مجانية: ١٤ يوم، من غير بطاقة ائتمان
- بعد التجربة: تفعيل عبر طرق الدفع المتاحة (بتتأكد منه الإدارة)
`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400"
    }
  });
}
