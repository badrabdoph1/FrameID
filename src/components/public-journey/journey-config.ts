export type JourneyPersonality = "ignition" | "prism" | "screen" | "threshold" | "assembly";
export type JourneyTrigger = "settled" | "preview-progress";

export type JourneyMoment = {
  id: "home-start" | "templates-pick" | "preview-real" | "preview-use" | "signup-create";
  source: string;
  copy: readonly [string, string];
  dismissLabel: "تمام" | "فهمت";
  personality: JourneyPersonality;
  trigger: JourneyTrigger;
  placement: "above" | "below" | "side";
};

const homeMoment: JourneyMoment = {
  id: "home-start",
  source: "home-start",
  copy: ["ابدأ من هنا.", "اختار شكل موقعك، وبعدها هنجهزه باسمك."],
  dismissLabel: "تمام",
  personality: "ignition",
  trigger: "settled",
  placement: "below",
};

const templatesMoment: JourneyMoment = {
  id: "templates-pick",
  source: "templates-grid",
  copy: ["اختار الشكل الأقرب لشغلك.", "الصور والألوان والكلام كله هتغيره بعدين."],
  dismissLabel: "فهمت",
  personality: "prism",
  trigger: "settled",
  placement: "above",
};

const previewMoments: readonly JourneyMoment[] = [
  {
    id: "preview-real",
    source: "preview-screen",
    copy: ["اتفرج عليه بعين عميلك.", "ده الشكل الحقيقي، وكل تفصيلة هتقدر تغيرها بعدين."],
    dismissLabel: "فهمت",
    personality: "screen",
    trigger: "settled",
    placement: "side",
  },
  {
    id: "preview-use",
    source: "preview-use",
    copy: ["القالب جاهز يبقى موقعك.", "اضغط «استخدام هذا القالب» وابدأ تحط صورك وبياناتك."],
    dismissLabel: "تمام",
    personality: "threshold",
    trigger: "preview-progress",
    placement: "above",
  },
];

const signupMoment: JourneyMoment = {
  id: "signup-create",
  source: "signup-create",
  copy: ["فاضل بياناتك.", "اضغط «إنشاء موقعي» وهنجهز القالب والرابط تلقائيًا."],
  dismissLabel: "تمام",
  personality: "assembly",
  trigger: "settled",
  placement: "above",
};

export function getJourneyMoments(pathname: string): JourneyMoment[] {
  if (pathname === "/") return [homeMoment];
  if (pathname === "/templates") return [templatesMoment];
  if (/^\/templates\/[^/]+\/preview$/.test(pathname)) return [...previewMoments];
  if (pathname === "/signup") return [signupMoment];
  return [];
}
