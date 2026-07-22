# فصل Catalog وAcquisition وCommunication وEntitlements

تعتمد FrameID منصة خدمات داخل Modular Monolith مع PostgreSQL كمصدر الحقيقة التشغيلي لإصدارات Catalog المنشورة، وتبقى ملفات Git مصدر baseline والنسخ القابلة للاستعادة. يملك Services Platform الحالة التجارية والتنفيذ والاستحقاقات، بينما يملك Communication Core المحادثة وWorkItem فقط عبر weak context references؛ وتصبح Entitlements المصدر الوحيد للوصول بدل Plan checks أو Feature Flags. اخترنا هذا الفصل لأن توسيع `Plan` أو `CustomerRequest` كان سيعيد ربط المنصة بالمنتج الأول ويجعل الأسعار والرسائل والتفعيل مصادر حقيقة متنافسة.

تعتمد عمليات ما بعد المعاملة على Transactional Outbox محلي. تُعالج الأحداث بعامل مؤجّر idempotent، وتُراقب بالمصالحة الدورية. هذا ليس قرارًا بالانتقال إلى Microservices؛ بل يحفظ إمكانية إضافة broker أو analytics sink لاحقًا عبر extension interfaces من دون تغيير كتابات النطاق.
