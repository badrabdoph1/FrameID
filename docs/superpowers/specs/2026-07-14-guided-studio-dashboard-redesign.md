# تصميم لوحة التحكم الموجهة (Guided Studio Dashboard)

**التاريخ**: 2026-07-14  
**الحالة**: مسودة للمراجعة  
**النطاق**: إعادة تصميم تجربة لوحة تحكم المصور في FrameID

---

## الملخص التنفيذي

إعادة تصميم لوحة تحكم المصور لتصبح **مساعد ذكي موجه** بدلاً من مجرد dashboard تقليدي. الهدف الأساسي: تمكين المصور غير التقني من فهم المنصة وبناء موقعه الاحترافي بأقل مجهود وأقل ارتباك.

---

## المشاكل الحالية

### 1. الخلط بين لوحة التحكم وموقع العميل
المستخدم العادي لا يفهم أنه داخل لوحة تحكم إدارية، ويظن أن ما يراه هو ما سيظهر للعملاء.

### 2. عدم وضوح نقطة البداية
بعد تسجيل الدخول، لا يعرف المستخدم من أين يبدأ أو ما هي الخطوة التالية.

### 3. غياب التوجيه السياقي
الصفحات الفرعية (باقات، صور، تواصل) لا تشرح للمستخدم لماذا هذا القسم مهم أو ماذا يفعل.

### 4. تجربة Onboarding ضعيفة
الـ Onboarding Wizard الحالي (modal) يعزل المستخدم عن الواجهة الحقيقية ولا يوضح الفرق بين لوحة التحكم وموقع العميل.

### 5. صفحة رئيسية ثابتة
الصفحة الرئيسية لا تتكيف مع مرحلة المستخدم (جديد، نصف مكتمل، جاهز للنشر، مكتمل).

---

## الأهداف التصميمية

1. **الوضوح الفوري**: المستخدم يفهم خلال 5 ثوانٍ أين هو وماذا يفعل
2. **التوجيه الذكي**: النظام يقترح الخطوة الأهم بناءً على حالة الموقع الفعلية
3. **التعلم بالتطبيق**: الجولة الترحيبية لا تعزل المستخدم عن الواجهة الحقيقية
4. **التقدم المرئي**: المستخدم يشعر بإنجازه بدون gamification مفرط
5. **الاستمرارية**: الصفحة الرئيسية تظل مفيدة حتى بعد اكتمال التجهيز
6. **Mobile-First**: كل العناصر تعمل بشكل ممتاز على الهاتف أولاً

---

## الحلول المقترحة

### المرحلة 1: الجولة الترحيبية الذكية (Welcome Tour)

#### المفهوم
4 كروت تعليمية تظهر inline أعلى الصفحة الرئيسية في أول زيارة فقط. كل كارت يشرح فكرة واحدة، والمستخدم يرى الواجهة الحقيقية خلف الكروت.

#### الكروت الأربعة

**الكارت 1: ما هو FrameID**
```
العنوان: أهلاً بيك في FrameID
المحتوى: FrameID هو موقعك الشخصي كـمصور. صفحة واحدة فيها شغلك، باقاتك، 
وطرق التواصل معاك. جاهزة ومبنية — إنت بس بتخصصها.
الأيقونة: Sparkles
```

**الكارت 2: الفرق بين لوحة التحكم وموقع العميل**
```
العنوان: فين إنت دلوقتي؟
المحتوى: دي لوحة التحكم — مكانك إنت بس. بتغير منها الباقات والصور وبياناتك.
عملاؤك مش هيشوفوها أبداً.
زر إضافي: "شوف موقعك كما يراه العميل" (link نصي صغير، ليس زر بارز)
الأيقونة: LayoutDashboard
```

**الكارت 3: موقعك جاهز**
```
العنوان: موقعك جاهز!
المحتوى: موقعك اتبنى تلقائياً بالقالب اللي اخترته. كل اللي عليك تغيّر 
المحتوى لمحتواك الحقيقي: باقاتك، صورك، بياناتك.
الأيقونة: CheckCircle2
```

**الكارت 4: من أين تبدأ**
```
العنوان: ابدأ من هنا
المحتوى: أول خطوة: اكتب باقاتك وأسعارك. بعدها كمّل باقي الخطوات بالترتيب. 
كل خطوة بتاخد دقايق.
زر: "يلا نبدأ" → يوجه لـ /dashboard/services
الأيقونة: ArrowLeft
```

#### السلوك التقني
- **التخزين**: `localStorage` key `frameid:welcome-tour-completed`
- **التخطي**: زر "تخطي" في كل كارت
- **الإعادة**: زر "الجولة التعريفية" في `/dashboard/settings` يعيد تشغيل الجولة
- **الأنيميشن**: 
  - دخول: `fade-in` + `slide-up` (300ms)
  - انتقال بين الكروت: `fade-out` + `slide-left` (200ms) ثم `fade-in` + `slide-right` (200ms)
  - خروج: `fade-out` + `scale-down` (250ms)
- **التصميم**:
  - خلفية: `#131820` مع `border-white/12`
  - Accent: `#f3cf73` (ذهبي)
  - رقم الخطوة: صغير أعلى يمين الكارت
  - Progress bar: 4 segments رفيعة أسفل الكارت

#### Mobile vs Desktop
- **Mobile**: الكارت يأخذ عرض الشاشة كامل مع `padding: 1rem`
- **Desktop**: الكارت في المنتصف بعرض `max-w-lg` مع backdrop blur خفيف

---

### المرحلة 2: الصفحة الرئيسية المعاد تصميمها

#### الهيكل العام

```
┌─────────────────────────────────────────┐
│  Welcome Tour (أول زيارة فقط)          │
└─────────────────────────────────────────┘
              ↓ (بعد الجولة)
┌─────────────────────────────────────────┐
│  Personalized Greeting                  │
│  "أهلاً يا أحمد 👋"                     │
│  "موقعك [منشور / مسودة] • آخر تعديل..." │
├─────────────────────────────────────────┤
│  LifecycleStatusCard (إن وُجد)          │
│  حالة الاشتراك + الأيام المتبقية        │
├─────────────────────────────────────────┤
│  Smart Next Action Card                 │
│  الخطوة الأهم الآن + السبب              │
│  [زر الانتقال للخطوة]                   │
├─────────────────────────────────────────┤
│  Progress Summary                       │
│  "3 من 5 خطوات مكتملة" (نص بسيط)       │
├─────────────────────────────────────────┤
│  Quick Actions                          │
│  زر 1: الخطوة الجاية                    │
│  زر 2: افتح الموقع (شرطي)              │
└─────────────────────────────────────────┘
```

#### المكونات التفصيلية

**1. Personalized Greeting**
```typescript
type GreetingProps = {
  userName: string;
  siteStatus: "PUBLISHED" | "DRAFT";
  lastModified: string; // "منذ 3 ساعات"
};
```
- ترحيب إنساني: "أهلاً يا [الاسم] 👋"
- حالة الموقع: badge صغير (أخضر = منشور، ذهبي = مسودة)
- آخر تعديل: نص صغير رمادي

**2. Smart Next Action Card**

النظام يقيم حالة الموقع ويحدد الخطوة الأهم:

```typescript
type SmartAction = {
  id: string;
  title: string;
  description: string;
  reason: string; // لماذا هذه الخطوة مهمة
  href: string;
  icon: LucideIcon;
  priority: number; // 1 = الأعلى أولوية
};

const actionRules = [
  {
    condition: (state) => !state.hasPackages,
    action: {
      title: "أضف أول باقة",
      reason: "الباقات هي أول حاجة العميل بيدور عليها قبل ما يتواصل معاك",
      href: "/dashboard/services",
      priority: 1,
    },
  },
  {
    condition: (state) => !state.hasContactInfo,
    action: {
      title: "أكمل بيانات التواصل",
      reason: "من غير وسيلة تواصل، العميل مش هيعرف يكلمك",
      href: "/dashboard/site-info",
      priority: 2,
    },
  },
  {
    condition: (state) => !state.hasCoverImage,
    action: {
      title: "ارفع صورة الغلاف",
      reason: "صورة الغلاف هي أول صورة يراها العميل",
      href: "/dashboard/gallery",
      priority: 3,
    },
  },
  {
    condition: (state) => !state.hasAvatar,
    action: {
      title: "أضف صورة المصور",
      reason: "صورة المصور بتظهر جنب اسمك وبتزيد الثقة",
      href: "/dashboard/gallery",
      priority: 4,
    },
  },
  {
    condition: (state) => !state.hasAlbums,
    action: {
      title: "أنشئ أول ألبوم",
      reason: "الألبومات بتنظم شغلك وتخليه أسهل في التصفح",
      href: "/dashboard/gallery",
      priority: 5,
    },
  },
  {
    condition: (state) => !state.isPublished && state.isReadyToPublish,
    action: {
      title: "انشر موقعك",
      reason: "موقعك جاهز! انشره عشان العملاء يلاقوك",
      href: "/dashboard/publish",
      priority: 6,
    },
  },
];
```

**3. Progress Summary**
- نص بسيط: "3 من 5 خطوات مكتملة"
- بدون progress bar منفصل (لتجنب gamification)
- يظهر فقط عندما يكون هناك خطوات ناقصة

**4. Quick Actions (ذكية)**

تتغير حسب حالة المستخدم:

| المرحلة | الزر 1 | الزر 2 |
|---------|--------|--------|
| قبل الاكتمال | "الخطوة الجاية" | "افتح الموقع" (نصي صغير) |
| بعد الاكتمال | "شارك موقعك" | "جرّب قالب جديد" |

**زر "شاهد موقعك" الشرطي**:
- لا يظهر كزر بارز إلا بعد إكمال: باقة واحدة + بيانات تواصل + صورة غلاف
- قبل ذلك: يظهر كـ link نصي صغير في الـ SiteIdentityCard
- السبب: أول انطباع للمستخدم عن موقعه يجب أن يكون إيجابياً

---

### المرحلة 3: Empty States الذكية

كل صفحة فرعية لها Empty State مخصص بشخصية مختلفة.

#### صفحة الباقات (`/dashboard/services`)

**الحالة**: لا توجد باقات

```typescript
const emptyState = {
  icon: Package,
  title: "الباقات هي أول حاجة العميل بيدور عليها",
  description: "لما العميل يدخل موقعك، أول حاجة بيشوفها هي الباقات والأسعار. 
  لو مش لاقيها، ممكن يمشي ويروح لمصور تاني.",
  example: {
    name: "باقة الزفاف الذهبي",
    price: "5,000 جنيه",
    features: ["8 ساعات تصوير", "200 صورة معدلة", "ألبوم فاخر"],
  },
  cta: "أضف أول باقة",
};
```

#### صفحة التواصل (`/dashboard/site-info`)

**الحالة**: لا توجد بيانات تواصل

```typescript
const emptyState = {
  icon: MessageCircle,
  title: "من غير وسيلة تواصل، العميل مش هيعرف يكلمك",
  description: "ضيف رقم واتساب واحد على الأقل. ده أسهل وأسرع طريقة 
  للتواصل في مصر والعالم العربي.",
  hint: "الواتساب أفضل من التليفون العادي لأن العميل يقدر يبعتلك رسالة مباشرة",
  cta: "أضف رقم الواتساب",
};
```

#### صفحة الصور (`/dashboard/gallery`)

**الحالة 1**: لا توجد صورة مصور
```typescript
const emptyState = {
  icon: UserSquare2,
  title: "صورة المصور بتزيد الثقة",
  description: "العميل حابب يعرف مين المصور اللي هيتعامل معاه. 
  صورة واضحة ومهنية بتخلي العميل يثق فيك أكتر.",
  cta: "ارفع صورتك",
};
```

**الحالة 2**: لا توجد صورة غلاف
```typescript
const emptyState = {
  icon: Image,
  title: "صورة الغلاف هي أول انطباع",
  description: "أول صورة يراها العميل لما يدخل موقعك. 
  اختار أقوى صورة عندك تعبر عن أسلوبك.",
  cta: "ارفع صورة الغلاف",
};
```

**الحالة 3**: لا توجد ألبومات
```typescript
const emptyState = {
  icon: FolderOpen,
  title: "الألبومات بتنظم شغلك",
  description: "كل ألبوم بيجمع صور من نفس النوع أو من نفس الجلسة. 
  مثلاً: حفلات، بورتريه، منتجات، عقارات.",
  example: {
    title: "حفل زفاف أحمد وسارة",
    imagesCount: 45,
  },
  cta: "أنشئ أول ألبوم",
};
```

#### صفحة النشر (`/dashboard/publish`)

**الحالة**: الموقع غير منشور

```typescript
const emptyState = {
  icon: Rocket,
  title: "موقعك جاهز للنشر!",
  description: "بعد ما تخلص تجهيز موقعك، اضغط نشر عشان العملاء يلاقوك. 
  تقدر تلغي النشر في أي وقت.",
  readinessChecklist: [...], // الموجودة حالياً
  cta: "انشر موقعك الآن",
};
```

---

### المرحلة 4: Growth Suggestions (بعد الاكتمال)

بعد ما المستخدم يخلص كل الخطوات الأساسية، الصفحة الرئيسية تتحول من "توجيه" إلى "تطوير".

#### Recommendation Engine

النظام يقيم الموقع ويقترح أهم تحسين واحد في كل مرة:

```typescript
type GrowthSuggestion = {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  href: string;
  icon: LucideIcon;
};

const suggestionRules = [
  {
    condition: (state) => state.packagesCount === 1,
    suggestion: {
      title: "ضيف باقة تانية",
      description: "العملاء بيدوروا على خيارات مختلفة. باقتين أو تلاتة 
      بتزيد فرصة إن العميل يلاقي اللي يناسبه.",
      impact: "high",
      href: "/dashboard/services",
    },
  },
  {
    condition: (state) => state.albumsCount < 3,
    suggestion: {
      title: "ضيف ألبوم جديد",
      description: "كل ما تعرض شغل أكتر، كل ما العميل يثق فيك أكتر. 
      أضف أحدث جلساتك.",
      impact: "medium",
      href: "/dashboard/gallery",
    },
  },
  {
    condition: (state) => !state.hasSeoSettings,
    suggestion: {
      title: "حسّن ظهورك في جوجل",
      description: "ضيف عنوان ووصف مخصص لموقعك عشان يظهر أحسن في نتائج البحث.",
      impact: "medium",
      href: "/dashboard/publish",
    },
  },
  {
    condition: (state) => state.daysSinceLastUpdate > 30,
    suggestion: {
      title: "حدّث موقعك",
      description: "الموقع اللي بيتحدث باستمرار بيبان أكتر نشاطاً. 
      أضف صور جديدة أو عدّل باقاتك.",
      impact: "low",
      href: "/dashboard/gallery",
    },
  },
  {
    condition: (state) => true, // fallback
    suggestion: {
      title: "شارك موقعك",
      description: "موقعك جاهز! انسخ الرابط وابعته لعملائك أو شاركه على السوشيال ميديا.",
      impact: "high",
      href: "/dashboard/publish",
    },
  },
];
```

#### السلوك
- **كارت واحد فقط** في كل مرة (مش قائمة طويلة)
- **زر "تخطي"** صغير: يعرض الاقتراح التالي
- **زر "تنفيذ"** بارز: يوجه للصفحة المطلوبة
- بعد تنفيذ الاقتراح، الكارت يتغير للاقتراح التالي في الزيارة التالية

#### بعد كل الاقتراحات
لو المستخدم عمل كل الاقتراحات:
```typescript
const completedState = {
  title: "موقعك جاهز وشغال! 🎉",
  description: "شاركه مع عملائك وابدأ استقبل حجوزات.",
  primaryAction: {
    label: "انسخ الرابط",
    action: () => copyToClipboard(siteUrl),
  },
  secondaryAction: {
    label: "جرّب قالب مختلف",
    href: "/dashboard/templates",
  },
};
```

---

### المرحلة 5: تحسينات إضافية

#### 1. Activity Log (اختياري - يُنفذ لاحقاً)
قسم صغير في الصفحة الرئيسية يعرض آخر 3 إجراءات:
- "أضفت باقة جديدة" - منذ ساعتين
- "غيرت صورة الغلاف" - أمس
- "نشرت الموقع" - منذ 3 أيام

**القرار**: لا يُنفذ في المرحلة الأولى لتجنب التعقيد. يُضاف لاحقاً إذا طلب المستخدمون ذلك.

#### 2. Contextual Tips (ملغاة)
**القرار**: لا نضيف tips في كل صفحة فرعية. فقط Empty States ذكية.
**السبب**: المستخدم طلب عدم الإزعاج، والـ Empty States تكفي.

#### 3. Mobile-Specific Improvements
- **Bottom Navigation**: يبقى كما هو (5 عناصر رئيسية)
- **Quick Actions**: تظهر كأزرار كاملة العرض (stacked)
- **Empty States**: تأخذ عرض الشاشة كامل مع padding مريح

#### 4. Desktop-Specific Improvements
- **Sidebar**: يبقى كما هو مع تحسين الـ active state
- **Layout**: Next Action Card + Progress Summary في صف واحد
- **Quick Actions**: جنب بعض (inline)

---

## القرارات التصميمية النهائية

| القرار | الاختيار | السبب |
|--------|----------|-------|
| **الجولة الترحيبية** | 4 كروت inline أعلى الصفحة | لا تعزل المستخدم، يرى الواجهة الحقيقية |
| **Next Action** | ذكية بالكامل، تتغير حسب حالة الموقع | النظام يحدد الأهم، ليس ثابتاً على الباقات |
| **زر "شاهد موقعي"** | يظهر كزر بارز بعد إكمال الحد الأدنى | أول انطباع يجب أن يكون إيجابياً |
| **Checklist** | نص بسيط "3 من 5 خطوات" | غير مزعج، يحافظ على الإحساس بالتقدم |
| **Progress Bar** | لا يوجد | نتجنب gamification، النص البسيط كافي |
| **Empty States** | ذكية بشخصية مختلفة لكل صفحة | تشرح السبب + تعرض مثال + تقترح إجراء |
| **Growth Suggestions** | Recommendation Engine | كارت واحد متغير، ليس قائمة ثابتة |
| **Quick Actions** | ذكية ومتغيرة | تتغير حسب مرحلة المستخدم |
| **Contextual Tips** | لا توجد | فقط Empty States، لتجنب الإزعاج |
| **Activity Log** | مؤجل | يُضاف لاحقاً إذا طُلب |
| **الهوية البصرية** | نحافظ على الذهبي + الداكن | التصميم فخم ومميز |

---

## خطة التنفيذ

### المرحلة 1: الجولة الترحيبية (أولوية عالية)
1. إنشاء مكون `WelcomeTour` في `src/components/dashboard/`
2. إضافة logic الـ localStorage للتحكم في الظهور
3. إضافة زر "الجولة التعريفية" في `/dashboard/settings`
4. اختبار الأنيميشن على Mobile و Desktop

### المرحلة 2: الصفحة الرئيسية المعاد تصميمها (أولوية عالية)
1. إنشاء مكون `SmartNextAction` مع logic التحديد الذكي
2. إنشاء مكون `PersonalizedGreeting`
3. إنشاء مكون `ProgressSummary`
4. تحديث `DashboardHomeClient` لاستخدام المكونات الجديدة
5. إضافة logic الـ Quick Actions الذكية

### المرحلة 3: Empty States الذكية (أولوية عالية)
1. إنشاء مكون `SmartEmptyState` قابل لإعادة الاستخدام
2. إضافة Empty States مخصصة لكل صفحة:
   - `ServicesEmptyState`
   - `SiteInfoEmptyState`
   - `GalleryEmptyState` (3 حالات)
   - `PublishEmptyState`
3. ربط الحالات الشرطية (conditional rendering)

### المرحلة 4: Growth Suggestions (أولوية متوسطة)
1. إنشاء مكون `GrowthSuggestion` مع Recommendation Engine
2. إضافة logic تقييم الموقع (server-side)
3. ربط الكارت بالصفحة الرئيسية بعد الاكتمال
4. إضافة زر "تخطي" و "تنفيذ"

### المرحلة 5: التحسينات النهائية (أولوية متوسطة)
1. تحسين زر "شاهد موقعك" الشرطي
2. اختبار شامل على Mobile و Desktop
3. تحسين الأنيميشن والأداء
4. مراجعة الـ accessibility

---

## المعايير التقنية

### الأداء
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: لا تزيد المكونات الجديدة عن 50KB (gzipped)

### Accessibility
- كل الأزرار لها `aria-label` واضح
- Empty States تستخدم `role="status"` للإعلان عن الحالة
- الجولة الترحيبية تدعم keyboard navigation
- Focus management صحيح في كل التفاعلات

### Mobile-First
- كل العناصر تعمل على الشاشات الصغيرة أولاً
- Touch targets لا تقل عن 44x44px
- Text readable بدون zoom
- No horizontal scroll

### Browser Support
- Chrome/Edge (آخر إصدارين)
- Safari (آخر إصدارين)
- Firefox (آخر إصدارين)
- Samsung Internet (آخر إصدار)

---

## المعمارية: Guidance Layer

### المفهوم الأساسي
بدلاً من عناصر مدمجة داخل الصفحة الرئيسية فقط، يتم بناء **Guidance Layer** كـ system منفصل قابل لإعادة الاستخدام في أي جزء من FrameID:

- لوحة تحكم المصور
- لوحة الأدمن
- محرر الصفحات
- أي Workspace جديد

### المكونات الأساسية

#### 1. GuidanceContext
```typescript
type GuidanceContext = {
  tour: {
    isActive: boolean;
    currentStep: number;
    totalSteps: number;
    complete: () => void;
    skip: () => void;
    restart: () => void;
  };
  state: {
    showWelcomeTour: boolean;
    showNextAction: boolean;
    showGrowthSuggestions: boolean;
  };
  analytics: {
    trackTourStart: () => void;
    trackTourComplete: (step: number) => void;
    trackTourSkip: (step: number) => void;
    trackActionClick: (actionId: string) => void;
    trackSuggestionClick: (suggestionId: string) => void;
  };
};
```

#### 2. GuidanceProvider
```typescript
// قابل للاستخدام في أي workspace
<DashboardGuidanceProvider>
  <DashboardHome />
</DashboardGuidanceProvider>

<AdminGuidanceProvider>
  <AdminDashboard />
</AdminGuidanceProvider>
```

#### 3. Guidance Hooks
```typescript
// للاستخدام داخل أي صفحة
const { showTour, nextAction, suggestions } = useGuidance();
```

---

## Smart Decision Engine

### المفهوم
بدلاً من سلسلة `if/else` ثابتة، يتم بناء **Recommendation Engine** يقوم بتحليل حالة الموقع بالكامل ويحدد:

1. **أهم خطوة تالية** (Next Action)
2. **أهم اقتراح تطوير** (Growth Suggestion)
3. **أهم مشكلة يجب حلها** (Critical Issue)

### البنية

```typescript
type SiteState = {
  hasPackages: boolean;
  hasContactInfo: boolean;
  hasAvatar: boolean;
  hasCoverImage: boolean;
  hasAlbums: boolean;
  hasSeoSettings: boolean;
  isPublished: boolean;
  packagesCount: number;
  albumsCount: number;
  daysSinceLastUpdate: number;
  subscriptionStatus: string;
};

type Recommendation = {
  id: string;
  type: "action" | "suggestion" | "issue";
  priority: number; // 1 = الأعلى
  title: string;
  description: string;
  reason: string;
  href: string;
  icon: LucideIcon;
  impact: "high" | "medium" | "low";
};

interface RecommendationEngine {
  analyze(state: SiteState): {
    nextAction: Recommendation | null;
    growthSuggestion: Recommendation | null;
    criticalIssues: Recommendation[];
  };
}
```

### الخوارزمية

```typescript
class SmartRecommendationEngine implements RecommendationEngine {
  private rules: RecommendationRule[] = [
    // Critical Issues (priority 1-10)
    {
      type: "issue",
      condition: (state) => state.subscriptionStatus === "EXPIRED",
      recommendation: {
        priority: 1,
        title: "اشتراكك منتهي",
        description: "جدد اشتراكك عشان موقعك يفضل شغال",
        href: "/dashboard/billing",
        impact: "high",
      },
    },
    
    // Next Actions (priority 11-50)
    {
      type: "action",
      condition: (state) => !state.hasPackages,
      recommendation: {
        priority: 11,
        title: "أضف أول باقة",
        reason: "الباقات هي أول حاجة العميل بيدور عليها",
        href: "/dashboard/services",
        impact: "high",
      },
    },
    {
      type: "action",
      condition: (state) => !state.hasContactInfo,
      recommendation: {
        priority: 12,
        title: "أكمل بيانات التواصل",
        reason: "من غير وسيلة تواصل، العميل مش هيعرف يكلمك",
        href: "/dashboard/site-info",
        impact: "high",
      },
    },
    // ... المزيد من القواعد
    
    // Growth Suggestions (priority 51-100)
    {
      type: "suggestion",
      condition: (state) => state.packagesCount === 1,
      recommendation: {
        priority: 51,
        title: "ضيف باقة تانية",
        description: "العملاء بيدوروا على خيارات مختلفة",
        href: "/dashboard/services",
        impact: "medium",
      },
    },
  ];

  analyze(state: SiteState) {
    const applicable = this.rules
      .filter(rule => rule.condition(state))
      .map(rule => ({
        ...rule.recommendation,
        type: rule.type,
      }))
      .sort((a, b) => a.priority - b.priority);

    return {
      nextAction: applicable.find(r => r.type === "action") || null,
      growthSuggestion: applicable.find(r => r.type === "suggestion") || null,
      criticalIssues: applicable.filter(r => r.type === "issue"),
    };
  }
}
```

### المزايا
- **قابل للتوسع**: إضافة قواعد جديدة بدون تعديل الكود الأساسي
- **قابل للاختبار**: كل قاعدة مستقلة
- **قابل للتحليل**: يمكن تتبع أي القواعد يتم تفعيلها أكثر
- **قابل للتخصيص**: يمكن تغيير الأولويات بسهولة

---

## نظام التحكم في الإرشادات (Guidance Control System)

### التخزين متعدد الطبقات

#### 1. Client-Side (localStorage)
```typescript
type GuidancePreferences = {
  welcomeTourCompleted: boolean;
  welcomeTourSkippedAt: number | null;
  hiddenSuggestions: string[]; // IDs of dismissed suggestions
  lastSeenSuggestion: string | null;
};
```

#### 2. Server-Side (Database) - مستقبلاً
```prisma
model UserGuidanceState {
  id                      String   @id @default(cuid())
  userId                  String   @unique
  welcomeTourCompleted    Boolean  @default(false)
  welcomeTourCompletedAt  DateTime?
  welcomeTourSkippedAt    DateTime?
  dismissedSuggestions    String[] // JSON array of suggestion IDs
  lastActiveSuggestion    String?
  analytics               Json?    // для tracking
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}
```

### الـ API

```typescript
// Hooks للاستخدام في الـ UI
const {
  isTourActive,
  startTour,
  completeTour,
  skipTour,
  dismissSuggestion,
  resetGuidance, // لإعادة التشغيل من الإعدادات
} = useGuidanceControl();
```

### الإعدادات
في `/dashboard/settings`:
- زر "إعادة تشغيل الجولة التعريفية"
- زر "إظهار جميع الاقتراحات مرة أخرى"
- (مستقبلاً) سجل النشاط التوجيهي

---

## Analytics-Ready Architecture

### Events جاهزة للتتبع

```typescript
type GuidanceEvent = {
  type: "tour_start" | "tour_complete" | "tour_skip" | "action_click" | "suggestion_click" | "suggestion_dismiss";
  userId: string;
  sessionId: string;
  timestamp: Date;
  metadata: {
    step?: number;
    actionId?: string;
    suggestionId?: string;
    siteState?: SiteState;
  };
};

// حالياً: تكتب في console.log (development) أو تُهمل (production)
// مستقبلاً: تُرسل لـ analytics service
function trackEvent(event: GuidanceEvent) {
  if (process.env.NODE_ENV === "development") {
    console.log("[Guidance Analytics]", event);
  }
  // TODO: إرسال لـ analytics service مستقبلاً
}
```

### الأسئلة التي يمكن الإجابة عليها مستقبلاً

1. **Tour Completion Rate**
   - كم مستخدم أكمل الجولة؟
   - في أي خطوة يتوقف معظم المستخدمين؟

2. **Action Effectiveness**
   - ما أكثر خطوة يتم تنفيذها؟
   - ما أكثر خطوة يتم تجاهلها؟

3. **Suggestion Performance**
   - ما أكثر اقتراح يتم تنفيذه؟
   - ما أكثر اقتراح يتم رفضه؟

4. **User Journey**
   - ما المسار الأكثر شيوعاً لإكمال الموقع؟
   - أين يتعطل المستخدمون عادةً؟

---

## المراجعة والاعتماد

**الحالة**: مسودة للمراجعة  
**المؤلف**: OpenCode AI  
**المراجع**: [في انتظار مراجعة المستخدم]

---

## ملاحظات للمطورين

1. **لا تضيف تعليقات في الكود** إلا إذا طُلب ذلك صراحة
2. **اتبع نفس الأسلوب البصري الحالي** (الذهبي #f3cf73، الخلفية الداكنة، الزوايا المدورة)
3. **اختبر على Mobile أولاً** قبل Desktop
4. **استخدم Server Components** قدر الإمكان للأداء
5. **لا تضيف dependencies جديدة** إلا إذا كانت ضرورية جداً

---

**نهاية الوثيقة**
