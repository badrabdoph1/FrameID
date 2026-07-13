import { describe, expect, it } from "vitest";

import {
  CUSTOMER_DATA_COUNT_QUERIES,
  validateCustomerDataCounts,
} from "@/modules/backups/customer-data-inventory";

describe("جرد بيانات العملاء", () => {
  it("يغطي كل الجداول المهمة الموجودة فعليًا", () => {
    expect(Object.keys(CUSTOMER_DATA_COUNT_QUERIES)).toEqual(expect.arrayContaining([
      "usersCount",
      "sessionsCount",
      "passwordResetTokensCount",
      "tenantsCount",
      "sitesCount",
      "siteSectionsCount",
      "galleryAlbumsCount",
      "galleryImagesCount",
      "mediaFilesCount",
      "contactProfilesCount",
      "packagesCount",
      "extraServicesCount",
      "subscriptionsCount",
      "subscriptionChangesCount",
      "paymentRequestsCount",
      "paymentRequestLogsCount",
      "notificationsCount",
      "customerNotificationLogsCount",
      "supportCasesCount",
      "customerIssuesCount",
      "customerIssueEventsCount",
      "customerErrorLogsCount",
    ]));
  });

  it("يرفض نجاح Restore عند فقد أي جدول مسجل في Manifest", () => {
    expect(validateCustomerDataCounts(
      { subscriptionsCount: 3, paymentRequestsCount: 2, notificationsCount: 5 },
      { subscriptionsCount: 3, paymentRequestsCount: 1, notificationsCount: 5 },
    )).toEqual({ valid: false, errors: ["paymentRequestsCount: المتوقع 2 والفعلي 1"] });
  });
});
