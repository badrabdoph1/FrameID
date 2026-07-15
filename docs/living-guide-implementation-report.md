# Living Guide System — تقرير التنفيذ النهائي

> **التاريخ:** 2026-07-15  
> **الحالة:** ✅ مكتمل — جاهز للاختبار  
> **النطاق:** الموقع العام فقط — لوحة التحكم لم تُمس

---

## ملخص التنفيذ

تم تنفيذ نظام Living Guide بالكامل للموقع العام. النظام يوجّه المستخدم عبر رحلة الموقع بشكل طبيعي دون أن يشعر بوجود طبقة إرشاد منفصلة.

### الملفات المُنشأة (14 ملف)

**البنية التحتية (5 ملفات):**
```
src/lib/living-guide/
├── types.ts              — 81 سطر — أنواع TypeScript + ثوابت
├── messages.ts           — 143 سطر — تعريفات الرسائل الخمس
├── journey-state.ts      — 126 سطر — إدارة الحالة + localStorage
├── behavior-detector.ts  — 137 سطر — اكتشاف السرعة والتردد
└── use-living-guide.ts   — 426 سطر — State Machine كاملة
```

**المكونات (7 ملفات):**
```
src/components/ui/living-guide/
├── guide-provider.tsx      — 54 سطر — Orchestrator
├── guide-card.tsx          — 105 سطر — الكارت الحي
├── guide-breathing.tsx     — 26 سطر — نبضة واحدة
├── guide-light-bridge.tsx  — 98 سطر — حركة ولادة فقط
├── guide-cascade.tsx       — 49 سطر — تدفق البطاقات
├── guide-hint.tsx          — 32 سطر — Inline hint
└── guide-reward.tsx        — 15 سطر — Micro Reward
```

**الراوتر (1 ملف):**
```
src/components/layout/
└── living-guide-router.tsx — 18 سطر — راوتر المسارات
```

### الملفات المُعدّلة (7 ملفات)

**ملفات النظام:**
```
src/app/layout.tsx          — إضافة <LivingGuideRouter />
src/app/globals.css         — إضافة 235 سطر من أنيميشن lg-*
```

**صفحات الموقع العام (إضافة data-guide-target):**
```
src/components/marketing/home-page-renderer.tsx
src/app/(marketing)/templates/page.tsx
src/app/(marketing)/templates/[code]/preview/page.tsx
src/app/(marketing)/signup/page.tsx
src/app/(marketing)/login/page.tsx
```

### ملفات لوحة التحكم

**لم تُمس تمامًا:**
- ❌ لا تغييرات في `src/app/(dashboard)/`
- ❌ لا تغييرات في `src/components/ui/immersive-onboarding.tsx`
- ❌ لا تغييرات في `src/components/ui/smart-tip.tsx`
- ❌ لا تغييرات في `src/lib/smart-tips.ts`
- ❌ لا تغييرات في `src/components/layout/smart-tip-router.tsx`

---

## كيفية عمل النظام

### التسلسل الكامل

```
1. المستخدم يدخل الموقع العام (/)
   ↓
2. LivingGuideRouter يفحص المسار
   - إذا /dashboard أو /admin → return null (لا شيء)
   - إذا مسار موقع عام → يجد الرسالة المناسبة
   ↓
3. GuideProvider يبدأ State Machine:
   - waiting-layout (انتظار استقرار Layout)
   - waitForElement (انتظار ظهور العنصر الهدف)
   - calculateSafeZone (حساب أفضل مكان للكارت)
   - breathing (نبضة واحدة على العنصر)
   - bridge (Light Bridge يتولد ثم يختفي)
   - card-birth (الكارت يتكوّن — 12 مرحلة)
   - visible (الكارت مستقر)
   ↓
4. عند التفاعل:
   - scroll/click/touch/keyboard → cancelAll() فوراً
   - ضغط الزر → dismiss() → returning → halo-fading → idle
   - Checkbox "متظهرش تاني" → markMessageDismissed()
   ↓
5. المستخدم ينتقل لصفحة أخرى → النظام يتكيف:
   - إذا تقدم في الرحلة → لا يعيد الرسائل السابقة
   - إذا كان pace="fast" → يقلل الـ delays
   - إذا visitLevel="familiar" → يعرض Halo فقط
```

### الصفحات المغطاة

| الصفحة | الرسالة | الشخصية | النوع |
|--------|---------|---------|-------|
| `/` (الرئيسية) | "من هنا هتبدأ" | Ignition | from-target |
| `/templates` (القوالب) | "اختار اللي يقرب لشغلك" | Cascade | from-grid |
| `/templates/*/preview` (المعاينة) | "ده الشكل اللي هيشوفه عميلك" | Reflection | from-toolbar |
| `/signup` (التسجيل) | "اسم الموقع بس — بعدها هنكمل الباقي سوا" | Assembly | inline |
| `/login` (الدخول) | "موقعك وصورك وباقاتك مستنينك" | Assembly | inline |

### مستويات الذكاء

| المستوى | الشرط | السلوك |
|---------|-------|--------|
| **first** | زيارة أولى | تسلسل كامل: Breath → Bridge → Card |
| **returning** | زيارة ثانية | تسلسل أسرع + نص مختصر |
| **familiar** | 3+ زيارات | Halo فقط — بدون كارت |

---

## التحقق من سلامة التنفيذ

### ✅ TypeScript
```bash
npx tsc --noEmit
```
**النتيجة:** لا أخطاء في ملفات Living Guide  
**ملاحظة:** خطأ واحد في `.next/types/validator.ts` (pre-existing، غير متعلق بالتعديلات)

### ✅ Lint
```bash
npx next lint
```
**النتيجة:** لا warnings في ملفات Living Guide

### ✅ فصل تام عن لوحة التحكم
- `LivingGuideRouter` يرجع `null` لـ `/dashboard` و `/admin`
- لا مشاركة في أي مكون مع Smart Tips
- لا مشاركة في أي localStorage key
- لا مشاركة في أي CSS class

### ✅ لا تأثير على Immersive Onboarding
- Smart Tips غير مثبتة أصلاً في layout.tsx (rolled back)
- Immersive Onboarding تعمل بشكل مستقل
- لا تعارض في z-index أو DOM order

---

## الميزات المنفذة

### ✅ Core Features
- [x] State Machine كاملة (11 طور)
- [x] Dynamic Timing (يعتمد على جاهزية الصفحة)
- [x] Safe Zones + Collision Detection
- [x] إلغاء فوري عند أي تفاعل
- [x] 3 مستويات ذكاء (first / returning / familiar)
- [x] Per-message suppression (checkbox)

### ✅ Motion System
- [x] Breathing (نبضة واحدة — لا loop)
- [x] Light Bridge (ولادة فقط — يختفي)
- [x] Card Birth (12 مرحلة — يتكوّن)
- [x] Card Return (يعود للعنصر)
- [x] Cascade (تدفق البطاقات)
- [x] Reflection (خط ضوئي على سطح الكارت)
- [x] Micro Reward (ripple + flash)

### ✅ Accessibility
- [x] `prefers-reduced-motion` support
- [x] `role="status"` + `aria-live="polite"`
- [x] Keyboard navigation (Escape للإغلاق)
- [x] No focus trap (ليس modal)
- [x] Color contrast >4.5:1 (AA)

### ✅ Performance
- [x] GPU-accelerated animations (transform + opacity only)
- [x] No layout shift (fixed/absolute positioning)
- [x] Throttled ResizeObserver
- [x] No continuous intervals
- [x] Lazy element detection (MutationObserver)

---

## خطوات الاختبار

### 1. تشغيل المشروع
```bash
npm run dev
```

### 2. اختبار الصفحة الرئيسية
```
1. افتح http://localhost:3000
2. انتظر 500ms — يجب أن ترى Breath واحدة على زر CTA
3. انتظر 4s — يجب أن ترى Breath ثانية
4. انتظر 1.5s — يجب أن يظهر Light Bridge ثم الكارت
5. تحقق من:
   - الكارت يظهر بجانب الزر (ليس في المنتصف)
   - النص: "من هنا هتبدأ"
   - الزر: "يلا نبدأ"
   - Checkbox: "متظهرش الرسالة دي تاني"
6. اضغط "يلا نبدأ" → يجب أن ينتقل لـ /templates
7. ارجع للرئيسية → الكارت لا يظهر مرة أخرى
```

### 3. اختبار صفحة القوالب
```
1. افتح http://localhost:3000/templates
2. تحقق من Cascade — البطاقات تظهر واحدة تلو الأخرى
3. انتظر 3.5s — يجب أن يظهر الكارت
4. تحقق من:
   - الكارت بجانب الشبكة (ليس في المنتصف)
   - النص: "اختار اللي يقرب لشغلك"
   - لا زر (الشبكة نفسها هي الإجراء)
5. اضغط على أي قالب → يجب أن ينتقل للمعاينة
```

### 4. اختبار صفحة المعاينة
```
1. افتح معاينة أي قالب
2. انتظر 4s — يجب أن يظهر الكارت
3. تحقق من:
   - الكارت مربوط بالـ Toolbar السفلي
   - النص: "ده الشكل اللي هيشوفه عميلك"
   - الزر: "استخدم القالب ده"
4. اضغط الزر → يجب أن ينتقل لـ /signup?template=X
```

### 5. اختبار صفحة التسجيل
```
1. افتح http://localhost:3000/signup
2. انتظر 8s بدون كتابة anything
3. يجب أن يظهر Inline hint أسفل الفورم:
   "اسم الموقع بس — بعدها هنكمل الباقي سوا"
4. ابدأ الكتابة → الـ hint يختفي
```

### 6. اختبار صفحة تسجيل الدخول
```
1. افتح http://localhost:3000/login
2. انتظر 10s بدون كتابة anything
3. يجب أن يظهر Inline hint:
   "موقعك وصورك وباقاتك مستنينك"
```

### 7. اختبار الإلغاء الفوري
```
1. في أي صفحة، ابدأ عملية الولادة (breathing)
2. قبل ظهور الكارت، اعمل scroll أو click
3. يجب أن يتوقف كل شيء فوراً
4. لا كارت يظهر
```

### 8. اختبار levels الزيارة
```
1. زر الصفحة الرئيسية 3 مرات
2. في المرة الثالثة، يجب أن ترى Halo فقط (لا كارت)
3. امسح localStorage:
   localStorage.removeItem('frameid:guide-visit-count')
4. اعد التحميل — يجب أن ترى الكارت الكامل
```

### 9. اختبار prefers-reduced-motion
```
1. فعّل "Reduce motion" في إعدادات النظام
2. أعد تحميل الصفحة
3. تحقق من:
   - لا Breathing animation
   - لا Light Bridge
   - لا Card Birth animation
   - الكارت يظهر مباشرة (fade فقط)
```

### 10. اختبار لوحة التحكم
```
1. سجّل دخول → /dashboard
2. تحقق من:
   - لا Living Guide يظهر
   - Immersive Onboarding يعمل بشكل طبيعي
   - لا تعارض بين الأنظمة
```

---

## قرارات التصميم المعتمدة

| # | القرار | التبرير |
|---|--------|---------|
| 1 | لا overlay، لا vignette | المستخدم يبقى داخل الصفحة دائماً |
| 2 | لون واحد (Champagne Gold) | هوية موحدة |
| 3 | الشخصية من الحركة | Ignition / Cascade / Reflection / Assembly |
| 4 | Breath منفردة (لا loop) | نبضة ثم صمت — لا إزعاج |
| 5 | Light Bridge = ولادة فقط | يُولد → يلمع → يختفي |
| 6 | الكارت يتكوّن (12 مرحلة) | Border → Surface → Reflection → Icon → Text → Button → Checkbox |
| 7 | 3 مستويات ذكاء | أول مرة = كامل. ثانية = مختصر. معتاد = Halo فقط |
| 8 | Micro Reward | Ripple + Flash خفيف بعد CTA |
| 9 | Dynamic Timing | لا أرقام ثابتة — يعتمد على جاهزية الصفحة |
| 10 | Safe Zones + Collision Detection | لا يغطي CTA أو Hero أو Navbar |
| 11 | إلغاء فوري | أي تفاعل → إيقاف كل الأنيميشن فوراً |
| 12 | الكارت أضعف من CTA | التوجيه فقط — الفعل في الصفحة |
| 13 | Mobile First | يُبنى للموبايل ثم يتوسع |
| 14 | الجودة > الكمية | أقل تأثيرات بأعلى جودة |
| 15 | الموقع هو الدليل | لا يشعر المستخدم بوجود "نظام tips" |

---

## المخاطر المعروفة

| المخاطرة | الاحتمال | التخفيف |
|----------|----------|---------|
| Safe Zone calculation خاطئة على شاشات صغيرة | متوسط | اختبار على موبايل حقيقي |
| ResizeObserver يسبب re-render loop | منخفض | throttling بـ requestAnimationFrame |
| localStorage ممتلئ | منخفض | try/catch حول كل读写 |
| `prefers-reduced-motion` لا يعمل | منخفض | اختبار على iOS + Android |
| Light Bridge SVG على RTL | متوسط | اختبار على RTL layout |

---

## ما لم يُنفذ بعد

### ⏳ تحسينات اختيارية
- [ ] Thumbnail القالب في صفحة التسجيل (عند `?template=X`)
- [ ] استمرارية الرحلة بين الصفحات (خيط بصري خفيف)
- [ ] Compact mode للكارت عند عدم وجود مساحة كافية
- [ ] تحسين Bezier curve للـ Light Bridge

### ⏳ Runtime Testing
- [ ] اختبار شامل على المتصفحات (Chrome, Safari, Firefox)
- [ ] اختبار على الموبايل (iOS Safari, Android Chrome)
- [ ] Core Web Vitals audit
- [ ] Screen reader testing (VoiceOver, NVDA)

---

## الاستنتاج

✅ **النظام مكتمل وجاهز للاختبار**  
✅ **لوحة التحكم لم تُمس**  
✅ **لا تعارض مع Immersive Onboarding**  
✅ **TypeScript + Lint نظيفان**  
✅ **فصل تام عن Smart Tips**  

**الخطوة التالية:** اختبار شامل على المتصفح والتأكد من أن كل شيء يعمل كما هو متوقع.

---

*الوثيقة كاملة في: `docs/archive/living-guide/`*
