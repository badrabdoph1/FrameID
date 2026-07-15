export type CardType = "welcome" | "guide";

export type OnboardingCardDef = {
  id: string;
  type: CardType;
  order: number;
  label: string;
  route: string;
  routeLabel: string;
  title: string;
  description: string;
};

const welcomeCards: OnboardingCardDef[] = [
  {
    id: "welcome-step-1",
    type: "welcome",
    order: 1,
    label: "الترحيب",
    route: "/dashboard",
    routeLabel: "الصفحة الرئيسية للوحة التحكم",
    title: "أهلاً بيك 👋",
    description: "موقعك جاهز بالفعل… فاضل بس تضبطه على ذوقك.",
  },
  {
    id: "welcome-step-2",
    type: "welcome",
    order: 2,
    label: "لوحة التحكم",
    route: "/dashboard",
    routeLabel: "الصفحة الرئيسية للوحة التحكم",
    title: "دي لوحة التحكم بتاعتك",
    description: "هنا بتعدل كل حاجة… والعميل بيشوف النتيجة على موقعه.",
  },
  {
    id: "welcome-step-3",
    type: "welcome",
    order: 3,
    label: "الموقع شغال",
    route: "/dashboard",
    routeLabel: "الصفحة الرئيسية للوحة التحكم",
    title: "موقعك شغال بالفعل ✅",
    description: "إنت مش بتبدأ من الصفر… الموقع جاهز، وإنت بس هتضيف لمستك.",
  },
  {
    id: "welcome-step-4",
    type: "welcome",
    order: 4,
    label: "الخطوات",
    route: "/dashboard",
    routeLabel: "الصفحة الرئيسية للوحة التحكم",
    title: "مش لازم تعمل كل حاجة مرة واحدة",
    description: "امشي خطوة خطوة… وإحنا هنوصلك لموقع جاهز في دقائق.",
  },
  {
    id: "welcome-step-5",
    type: "welcome",
    order: 5,
    label: "ابدأ",
    route: "/dashboard",
    routeLabel: "الصفحة الرئيسية للوحة التحكم",
    title: "يلا نجهز موقعك",
    description: "ابدأ بالباقات لأنها أول حاجة العميل هيشوفها.",
  },
];

const guideCards: OnboardingCardDef[] = [
  {
    id: "guide-services",
    type: "guide",
    order: 6,
    label: "الباقات",
    route: "/dashboard/services",
    routeLabel: "قسم الباقات",
    title: "الباقات — قرار العميل بيبتدي من هنا",
    description: "ظبط الأسعار والعروض. كل باقة لازم يكون اسمها وسعرها واضح — العميل بياخد قراره في ثواني.",
  },
  {
    id: "guide-site-info",
    type: "guide",
    order: 7,
    label: "التواصل",
    route: "/dashboard/site-info",
    routeLabel: "قسم التواصل",
    title: "التواصل السهل = حجوزات أكتر",
    description: "رقمك، واتسابك، وروابطك في مكان واحد. العميل يلاقيلك من غير ما يدور — وكلما كانت البيانات كاملة، زادت الثقة.",
  },
  {
    id: "guide-gallery",
    type: "guide",
    order: 8,
    label: "الصور",
    route: "/dashboard/gallery",
    routeLabel: "قسم الصور",
    title: "صورك هي كلامك — خليها تتكلم",
    description: "ارفع صورة المصور والغلاف، ونظّم أعمالك في ألبومات. كل صورة ليها مكانها على الموقع — رتّبها بعناية.",
  },
  {
    id: "guide-publish",
    type: "guide",
    order: 9,
    label: "النشر",
    route: "/dashboard/publish",
    routeLabel: "قسم النشر",
    title: "مراجعة أخيرة قبل ما الموقع يطلع",
    description: "تأكد إن الباقات والتواصل والصور كلها تمام — وبعدها اضغط نشر. الموقع هيوصل للعملاء برابط واحد.",
  },
  {
    id: "guide-templates",
    type: "guide",
    order: 10,
    label: "شكل الموقع",
    route: "/dashboard/templates",
    routeLabel: "قسم القوالب",
    title: "شكل الموقع — اختار وخصص",
    description: "كل قالب نقطة بداية. شوف المعاينة، اختار الأنسب، وعدّل الألوان والخطوط والصور. كل التعديلات بتنعكس فورًا على موقعك.",
  },
  {
    id: "guide-billing",
    type: "guide",
    order: 11,
    label: "الفواتير",
    route: "/dashboard/billing",
    routeLabel: "قسم الفواتير والاشتراك",
    title: "تفعيل الاشتراك — خطوة واحدة تفصلك",
    description: "اختار الباقة،حوّل المبلغ، وارفع إيصال التحويل. هنراجع الطلب ونفعّله في أقل من ٢٤ ساعة.",
  },
  {
    id: "guide-settings",
    type: "guide",
    order: 12,
    label: "الإعدادات",
    route: "/dashboard/settings",
    routeLabel: "قسم الإعدادات",
    title: "إعدادات حسابك وموقعك",
    description: "غيّر رابط الموقع (مرة واحدة)، شوف بيانات حسابك، أو اطلب حذف الحساب — كل حاجة من هنا.",
  },
];

export const allCards: OnboardingCardDef[] = [...welcomeCards, ...guideCards];

export const welcomeCardDefs = welcomeCards;
export const guideCardDefs = guideCards;

export function getCardById(id: string): OnboardingCardDef | undefined {
  return allCards.find((card) => card.id === id);
}

export function getCardsByType(type: CardType): OnboardingCardDef[] {
  return allCards.filter((card) => card.type === type);
}
