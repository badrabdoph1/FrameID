# Folder Structure and Coding Standards

## Folder Structure

هيكل مقترح عند بدء التنفيذ:

```text
src/
  app/
    (marketing)/
      page.tsx
      templates/
      login/
      signup/
      forgot-password/
      privacy/
      terms/
    (dashboard)/
      dashboard/
    (admin)/
      admin/
    p/
      [slug]/
    api/
      webhooks/
      uploads/
  modules/
    auth/
    tenants/
    sites/
    themes/
    dashboard/
    admin/
    billing/
    media/
    seo/
    notifications/
    audit/
  components/
    ui/
    layout/
    feedback/
  themes/
    registry.ts
    noir-gold/
      metadata.ts
      schema.ts
      preview-data.ts
      renderer.tsx
      sections/
  lib/
    db/
    env/
    validation/
    permissions/
    storage/
    cache/
  styles/
  tests/
```

## Architecture Rules

- `app` يحتوي routes فقط وتكوين الصفحات.
- `modules` يحتوي منطق المنتج.
- `themes` يحتوي مكونات القوالب وregistry.
- `components/ui` لمكونات عامة صغيرة.
- `lib/db` يحتوي Prisma client وhelpers.
- لا نضع Prisma queries مباشرة داخل Client Components.
- لا يقرأ Theme بياناته بنفسه؛ يستقبل props من renderer.

## Next.js Rules

- Server Components للقراءات كخيار افتراضي.
- Client Components فقط للتفاعل الحقيقي.
- `params` و`searchParams` في Next.js 15 تعامل كـ async.
- metadata في Server Components فقط.
- Route Handlers للويبهوكس والتكاملات الخارجية.
- Server Actions للتعديلات القادمة من الواجهة.
- عدم تمرير non-serializable props إلى Client Components.

## TypeScript Standards

- strict mode.
- لا `any` إلا بتعليق يشرح السبب.
- Types قريبة من module الذي يستخدمها.
- Validation schemas لمدخلات المستخدم.
- فصل DTOs المعروضة للواجهة عن Prisma models الخام عند الحاجة.

## Prisma Standards

- migrations صغيرة ومراجعة.
- أسماء واضحة للجداول والحقول.
- indexes مع كل query pattern مهم.
- لا JSON إلا عند الحاجة المرنة والمحدودة.
- عدم الاعتماد على cascade delete بلا تفكير في بيانات المستخدم.

## UI Standards

- Mobile first.
- Focus states واضحة.
- Contrast مناسب.
- reduced motion.
- Skeleton loading.
- Empty states مفيدة.
- Icons outline.
- Cards radius لا يتجاوز 8px في Dashboard إلا إذا فرض النظام غير ذلك.
- لا نستخدم زخرفة كثيرة أو gradients كهوية كاملة.

## Content Standards

- الواجهة عربية أولًا مع دعم إنجليزي لاحقًا.
- أسماء الأفعال ثابتة.
- رسائل الخطأ مباشرة.
- لا نصوص تقنية للمستخدم.
- لا نستخدم "اشترك الآن"؛ نستخدم "تفعيل موقعي".

## Testing Standards

- Unit tests للـ validation والpermissions.
- Integration tests للـ auth وtenant isolation.
- Component tests للعناصر الحرجة.
- E2E tests للرحلات:
  - اختيار قالب ثم تسجيل حساب.
  - إنشاء موقع تلقائي.
  - تغيير الرابط مرة واحدة.
  - انتهاء Trial.
  - دفع يدوي وتفعيل Admin.

## Definition of Done

أي ميزة تعتبر مكتملة فقط إذا:

- تعمل على الهاتف أولًا.
- تحقق tenant isolation.
- لديها loading/error/empty states.
- لا تكسر SEO لمواقع المصورين.
- لا تضيف بيانات ثابتة داخل القوالب.
- لديها اختبار مناسب للمخاطر.
- تم قياس الأداء الأساسي عند الحاجة.
