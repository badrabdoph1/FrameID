import type { ErrorCodeDef } from "./types";

const errorCodes: Record<string, ErrorCodeDef> = {
  // ── Auth ──────────────────────────────────────
  "FID-AUTH-001": {
    code: "FID-AUTH-001",
    category: "AUTH",
    level: "ERROR",
    message: "البريد أو كلمة المرور غلط.",
    suggestion: "تأكد إن البريد وكلمة المرور صح وحاول تاني.",
    httpStatus: 401,
  },
  "FID-AUTH-002": {
    code: "FID-AUTH-002",
    category: "AUTH",
    level: "ERROR",
    message: "البريد أو رقم الهاتف ده متسجل قبل كده.",
    suggestion: "سجل دخول لو عندك حساب، أو استخدم بريد تاني.",
    httpStatus: 409,
  },
  "FID-AUTH-003": {
    code: "FID-AUTH-003",
    category: "AUTH",
    level: "ERROR",
    message: "الجلسة انتهت. سجل دخول تاني عشان تكمل.",
    suggestion: "سجل دخول عشان تقدر تكمل.",
    httpStatus: 401,
  },
  "FID-AUTH-004": {
    code: "FID-AUTH-004",
    category: "AUTH",
    level: "WARN",
    message: "م عندكش صلاحية تدخل الصفحة دي.",
    suggestion: "كلم المشرف لو حاسس إن ده غلط.",
    httpStatus: 403,
  },
  "FID-AUTH-005": {
    code: "FID-AUTH-005",
    category: "AUTH",
    level: "ERROR",
    message: "إنشاء الحساب مفشل. ادخل البيانات تاني.",
    suggestion: "تأكد إن كل الحقول صح وحاول تاني.",
    httpStatus: 400,
  },
  "FID-AUTH-006": {
    code: "FID-AUTH-006",
    category: "AUTH",
    level: "WARN",
    message: "رابط استعادة كلمة المرور مش شغال أو خلاص انتهى.",
    suggestion: "طلب رابط استعادة جديد من صفحة نسيت كلمة المرور.",
    httpStatus: 400,
  },
  "FID-AUTH-007": {
    code: "FID-AUTH-007",
    category: "AUTH",
    level: "INFO",
    message: "تم تغيير كلمة المرور بنجاح.",
    suggestion: "سجل دخول بكلمة المرور الجديدة.",
    httpStatus: 200,
  },
  "FID-AUTH-008": {
    code: "FID-AUTH-008",
    category: "AUTH",
    level: "WARN",
    message: "الرابط ده اتستخدم قبل كده ومينفعش يتستخدم تاني.",
    suggestion: "طلب رابط استعادة جديد من صفحة نسيت كلمة المرور.",
    httpStatus: 400,
  },
  "FID-AUTH-009": {
    code: "FID-AUTH-009",
    category: "AUTH",
    level: "WARN",
    message: "طلبات الاستعادة كتير أوي. حاول بعد 15 دقيقة.",
    suggestion: "استنى 15 دقيقةแล้ว حاول تاني.",
    httpStatus: 429,
  },
  "FID-AUTH-010": {
    code: "FID-AUTH-010",
    category: "AUTH",
    level: "ERROR",
    message: "إرسال رابط الاستعادة فشل. حاول تاني.",
    suggestion: "حاول تاني بعد شوية.",
    httpStatus: 500,
  },
  "FID-AUTH-011": {
    code: "FID-AUTH-011",
    category: "AUTH",
    level: "WARN",
    message: "كلمة المرور ضعيفة. اختر كلمة أقوى.",
    suggestion: "لازم كلمة المرور فيها حرف كبير وصغير ورقم.",
    httpStatus: 400,
  },

  // ── Upload ─────────────────────────────────────
  "FID-UPLOAD-001": {
    code: "FID-UPLOAD-001",
    category: "UPLOAD",
    level: "ERROR",
    message: "فشل رفع الصورة. قد يكون الحجم أكبر من المسموح.",
    suggestion: "حاول رفع صورة بحجم أقل من 10MB.",
    httpStatus: 413,
  },
  "FID-UPLOAD-002": {
    code: "FID-UPLOAD-002",
    category: "UPLOAD",
    level: "ERROR",
    message: "نوع الملف غير مدعوم. الصيغ المسموحة: JPG, PNG, WebP.",
    suggestion: "حول الملف إلى صيغة مدعومة وحاول مرة أخرى.",
    httpStatus: 415,
  },
  "FID-UPLOAD-003": {
    code: "FID-UPLOAD-003",
    category: "UPLOAD",
    level: "ERROR",
    message: "لم يتم اختيار صورة للرفع.",
    suggestion: "اختر صورة من جهازك ثم حاول مرة أخرى.",
    httpStatus: 400,
  },
  "FID-UPLOAD-004": {
    code: "FID-UPLOAD-004",
    category: "UPLOAD",
    level: "ERROR",
    message: "تعذر حفظ الصورة على الخادم.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-UPLOAD-005": {
    code: "FID-UPLOAD-005",
    category: "UPLOAD",
    level: "ERROR",
    message: "فشل رفع الصور. حدث خطأ أثناء التحميل.",
    suggestion: "تحقق من اتصالك بالإنترنت وحاول مرة أخرى.",
    httpStatus: 500,
  },

  // ── Payment ────────────────────────────────────
  "FID-PAY-001": {
    code: "FID-PAY-001",
    category: "PAYMENT",
    level: "ERROR",
    message: "فشل معالجة الدفع. يرجى التحقق من بيانات الدفع.",
    suggestion: "تأكد من صحة طريقة الدفع وحاول مرة أخرى.",
    httpStatus: 400,
  },
  "FID-PAY-002": {
    code: "FID-PAY-002",
    category: "PAYMENT",
    level: "ERROR",
    message: "الاشتراك غير نشط. يرجى تجديد الاشتراك.",
    suggestion: "انتقل إلى صفحة الفوترة لتفعيل الاشتراك.",
    httpStatus: 402,
  },
  "FID-PAY-003": {
    code: "FID-PAY-003",
    category: "PAYMENT",
    level: "WARN",
    message: "التجربة المجانية ستنتهي قريباً.",
    suggestion: "فعل اشتراكك الآن لضمان استمرارية موقعك.",
    httpStatus: 200,
  },
  "FID-PAY-004": {
    code: "FID-PAY-004",
    category: "PAYMENT",
    level: "ERROR",
    message: "انتهت صلاحية الاشتراك.",
    suggestion: "جدد اشتراكك للاستمرار في استخدام الموقع.",
    httpStatus: 402,
  },
  "FID-PAY-005": {
    code: "FID-PAY-005",
    category: "PAYMENT",
    level: "ERROR",
    message: "طريقة الدفع غير مدعومة.",
    suggestion: "استخدم إحدى طرق الدفع المتاحة.",
    httpStatus: 400,
  },
  "FID-PAY-006": {
    code: "FID-PAY-006",
    category: "PAYMENT",
    level: "ERROR",
    message: "المبلغ المطلوب غير صحيح.",
    suggestion: "تأكد من صحة المبلغ وحاول مرة أخرى.",
    httpStatus: 400,
  },
  "FID-PAY-007": {
    code: "FID-PAY-007",
    category: "PAYMENT",
    level: "ERROR",
    message: "فشل تأكيد الدفع. يرجى المحاولة مرة أخرى.",
    suggestion: "إذا استمرت المشكلة، تواصل مع الدعم الفني.",
    httpStatus: 500,
  },
  "FID-PAY-008": {
    code: "FID-PAY-008",
    category: "PAYMENT",
    level: "ERROR",
    message: "تعذر تفعيل الاشتراك. حدث خطأ غير متوقع.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-PAY-009": {
    code: "FID-PAY-009",
    category: "PAYMENT",
    level: "WARN",
    message: "التجربة المجانية ستنتهي خلال يومين.",
    suggestion: "فضلًا فعّل اشتراكك قبل انتهاء الفترة التجريبية.",
    httpStatus: 200,
  },
  "FID-PAY-010": {
    code: "FID-PAY-010",
    category: "PAYMENT",
    level: "ERROR",
    message: "طلب الدفع مكرر. هذا الطلب تم معالجته مسبقاً.",
    suggestion: "تأكد من عدم إرسال طلب الدفع مرتين.",
    httpStatus: 409,
  },
  "FID-PAY-011": {
    code: "FID-PAY-011",
    category: "PAYMENT",
    level: "ERROR",
    message: "الاشتراك معلق بسبب عدم الدفع.",
    suggestion: "قم بسداد المستحقات لتفعيل الخدمة.",
    httpStatus: 402,
  },
  "FID-PAY-012": {
    code: "FID-PAY-012",
    category: "PAYMENT",
    level: "ERROR",
    message: "لم يتم العثور على طلب الدفع.",
    suggestion: "تأكد من رابط الدفع أو تواصل مع الدعم.",
    httpStatus: 404,
  },
  "FID-PAY-013": {
    code: "FID-PAY-013",
    category: "PAYMENT",
    level: "ERROR",
    message: "الاشتراك ملغي ولا يمكن تفعيله.",
    suggestion: "أنشئ اشتراكاً جديداً للمتابعة.",
    httpStatus: 400,
  },
  "FID-PAY-014": {
    code: "FID-PAY-014",
    category: "PAYMENT",
    level: "ERROR",
    message: "حدث خطأ أثناء معالجة الدفع. لم يتم خصم أي مبلغ.",
    suggestion: "حاول مرة أخرى. إذا تكررت المشكلة، تواصل مع البنك أو الدعم الفني.",
    httpStatus: 500,
  },

  // ── Site ───────────────────────────────────────
  "FID-SITE-001": {
    code: "FID-SITE-001",
    category: "SITE",
    level: "ERROR",
    message: "الرابط المطلوب غير متاح. اختر رابطاً آخر.",
    suggestion: "اختر اسماً مختلفاً للموقع.",
    httpStatus: 409,
  },
  "FID-SITE-002": {
    code: "FID-SITE-002",
    category: "SITE",
    level: "ERROR",
    message: "تعذر إنشاء الموقع. حدث خطأ غير متوقع.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-SITE-003": {
    code: "FID-SITE-003",
    category: "SITE",
    level: "WARN",
    message: "لم يتم اختيار قالب للموقع.",
    suggestion: "اختر قالباً من معرض القوالب.",
    httpStatus: 200,
  },
  "FID-SITE-004": {
    code: "FID-SITE-004",
    category: "SITE",
    level: "ERROR",
    message: "القالب المختار غير متاح حالياً.",
    suggestion: "اختر قالباً آخر من معرض القوالب.",
    httpStatus: 404,
  },
  "FID-SITE-005": {
    code: "FID-SITE-005",
    category: "SITE",
    level: "ERROR",
    message: "تعذر حفظ التصميم. حدث خطأ غير متوقع.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-SITE-006": {
    code: "FID-SITE-006",
    category: "SITE",
    level: "ERROR",
    message: "الموقع غير موجود.",
    suggestion: "تأكد من رابط الموقع أو تواصل مع صاحب الموقع.",
    httpStatus: 404,
  },
  "FID-SITE-007": {
    code: "FID-SITE-007",
    category: "SITE",
    level: "ERROR",
    message: "فشل تحديث المحتوى. حدث خطأ غير متوقع.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-SITE-008": {
    code: "FID-SITE-008",
    category: "SITE",
    level: "ERROR",
    message: "تعذر نشر الموقع. حدث خطأ غير متوقع.",
    suggestion: "حاول مرة أخرى. إذا تكررت المشكلة تواصل مع الدعم.",
    httpStatus: 500,
  },

  // ── Content ────────────────────────────────────
  "FID-CONTENT-001": {
    code: "FID-CONTENT-001",
    category: "CONTENT",
    level: "ERROR",
    message: "تعذر حفظ المحتوى. حدث خطأ غير متوقع.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-CONTENT-002": {
    code: "FID-CONTENT-002",
    category: "CONTENT",
    level: "ERROR",
    message: "فشل تحديث البيانات. حدث خطأ غير متوقع.",
    suggestion: "تأكد من صحة البيانات وحاول مرة أخرى.",
    httpStatus: 500,
  },
  "FID-CONTENT-003": {
    code: "FID-CONTENT-003",
    category: "CONTENT",
    level: "WARN",
    message: "بعض البيانات غير مكتملة.",
    suggestion: "املأ جميع الحقول المطلوبة قبل الحفظ.",
    httpStatus: 200,
  },

  // ── Database ───────────────────────────────────
  "FID-DB-001": {
    code: "FID-DB-001",
    category: "DB",
    level: "ERROR",
    message: "تعذر الاتصال بقاعدة البيانات.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-DB-002": {
    code: "FID-DB-002",
    category: "DB",
    level: "ERROR",
    message: "تعذر حفظ البيانات. حدث خطأ في قاعدة البيانات.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-DB-003": {
    code: "FID-DB-003",
    category: "DB",
    level: "FATAL",
    message: "انقطع الاتصال بقاعدة البيانات بشكل مفاجئ.",
    suggestion: "يرجى المحاولة بعد دقائق. إذا استمرت المشكلة، تواصل مع الدعم الفني.",
    httpStatus: 503,
  },

  // ── Admin ──────────────────────────────────────
  "FID-ADMIN-001": {
    code: "FID-ADMIN-001",
    category: "ADMIN",
    level: "ERROR",
    message: "فشل تسجيل دخول المشرف. البريد أو كلمة المرور غير صحيحة.",
    suggestion: "تأكد من بيانات الدخول وحاول مرة أخرى.",
    httpStatus: 401,
  },
  "FID-ADMIN-002": {
    code: "FID-ADMIN-002",
    category: "ADMIN",
    level: "ERROR",
    message: "ليس لديك صلاحية مشرف للوصول إلى هذه الصفحة.",
    suggestion: "تواصل مع مشرف النظام إذا كنت تعتقد أن هذا خطأ.",
    httpStatus: 403,
  },
  "FID-ADMIN-003": {
    code: "FID-ADMIN-003",
    category: "ADMIN",
    level: "ERROR",
    message: "فشل تنفيذ العملية. حدث خطأ غير متوقع في لوحة الإدارة.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-ADMIN-004": {
    code: "FID-ADMIN-004",
    category: "ADMIN",
    level: "ERROR",
    message: "تعذر تحميل البيانات. حدث خطأ أثناء جلب المعلومات.",
    suggestion: "حاول تحديث الصفحة أو تواصل مع الدعم الفني.",
    httpStatus: 500,
  },

  // ── Backup ─────────────────────────────────────
  "FID-BACKUP-001": {
    code: "FID-BACKUP-001",
    category: "BACKUP",
    level: "ERROR",
    message: "فشل إنشاء النسخة الاحتياطية.",
    suggestion: "حاول مرة أخرى. إذا تكررت المشكلة، راجع سجلات النظام.",
    httpStatus: 500,
  },
  "FID-BACKUP-002": {
    code: "FID-BACKUP-002",
    category: "BACKUP",
    level: "ERROR",
    message: "فشل رفع النسخة الاحتياطية إلى GitHub.",
    suggestion: "تأكد من إعدادات الاتصال بـ GitHub وحاول مرة أخرى.",
    httpStatus: 500,
  },
  "FID-BACKUP-003": {
    code: "FID-BACKUP-003",
    category: "BACKUP",
    level: "WARN",
    message: "النسخة الاحتياطية التالية مجدولة قريباً.",
    suggestion: "تأكد من وجود مساحة تخزين كافية.",
    httpStatus: 200,
  },

  // ── Media ──────────────────────────────────────
  "FID-MEDIA-001": {
    code: "FID-MEDIA-001",
    category: "MEDIA",
    level: "ERROR",
    message: "فشل تحميل الوسائط. حدث خطأ غير متوقع.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
  "FID-MEDIA-002": {
    code: "FID-MEDIA-002",
    category: "MEDIA",
    level: "ERROR",
    message: "الوسائط المطلوبة غير موجودة.",
    suggestion: "تأكد من أن الملف لم يتم حذفه.",
    httpStatus: 404,
  },

  // ── Security ───────────────────────────────────
  "FID-SEC-001": {
    code: "FID-SEC-001",
    category: "SECURITY",
    level: "ERROR",
    message: "تم رفض الطلب. يرجى تسجيل الدخول أولاً.",
    suggestion: "سجل الدخول للمتابعة.",
    httpStatus: 401,
  },
  "FID-SEC-002": {
    code: "FID-SEC-002",
    category: "SECURITY",
    level: "ERROR",
    message: "نشاط مشبوه. تم حظر الطلب مؤقتاً.",
    suggestion: "حاول مرة أخرى بعد 15 دقيقة.",
    httpStatus: 429,
  },

  // ── Validation ─────────────────────────────────
  "FID-VAL-001": {
    code: "FID-VAL-001",
    category: "VALIDATION",
    level: "WARN",
    message: "البيانات المدخلة غير صحيحة.",
    suggestion: "راجع البيانات وحاول مرة أخرى.",
    httpStatus: 400,
  },
  "FID-VAL-002": {
    code: "FID-VAL-002",
    category: "VALIDATION",
    level: "WARN",
    message: "بعض الحقول المطلوبة فارغة.",
    suggestion: "املأ جميع الحقول المطلوبة.",
    httpStatus: 400,
  },

  // ── Unknown ────────────────────────────────────
  "FID-UNK-001": {
    code: "FID-UNK-001",
    category: "UNKNOWN",
    level: "ERROR",
    message: "حدث خطأ غير متوقع.",
    suggestion: "حاول مرة أخرى بعد قليل.",
    httpStatus: 500,
  },
};

export function getErrorCodeDef(code: string): ErrorCodeDef {
  return errorCodes[code] ?? errorCodes["FID-UNK-001"];
}

export function getAllErrorCodes(): ErrorCodeDef[] {
  return Object.values(errorCodes);
}

export function getErrorCodesByCategory(
  category: string,
): ErrorCodeDef[] {
  return Object.values(errorCodes).filter((e) => e.category === category);
}

export {
  errorCodes,
};
