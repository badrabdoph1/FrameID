export const CUSTOMER_DATA_COUNT_QUERIES = {
  usersCount: `SELECT COUNT(*) FROM "User"`,
  sessionsCount: `SELECT COUNT(*) FROM "Session"`,
  passwordResetTokensCount: `SELECT COUNT(*) FROM "PasswordResetToken"`,
  tenantsCount: `SELECT COUNT(*) FROM "Tenant"`,
  sitesCount: `SELECT COUNT(*) FROM "Site"`,
  siteContentSnapshotsCount: `SELECT COUNT(*) FROM "SiteContentSnapshot"`,
  siteThemeConfigsCount: `SELECT COUNT(*) FROM "SiteThemeConfig"`,
  domainsCount: `SELECT COUNT(*) FROM "Domain"`,
  siteSectionsCount: `SELECT COUNT(*) FROM "SiteSection"`,
  galleryAlbumsCount: `SELECT COUNT(*) FROM "GalleryAlbum"`,
  galleryImagesCount: `SELECT COUNT(*) FROM "GalleryImage"`,
  mediaFilesCount: `SELECT COUNT(*) FROM "MediaAsset"`,
  contactProfilesCount: `SELECT COUNT(*) FROM "ContactProfile"`,
  seoSettingsCount: `SELECT COUNT(*) FROM "SEOSettings"`,
  packagesCount: `SELECT COUNT(*) FROM "Package"`,
  extraServicesCount: `SELECT COUNT(*) FROM "ExtraService"`,
  lifecycleEventsCount: `SELECT COUNT(*) FROM "LifecycleEvent"`,
  subscriptionsCount: `SELECT COUNT(*) FROM "Subscription"`,
  subscriptionChangesCount: `SELECT COUNT(*) FROM "SubscriptionChange"`,
  paymentRequestsCount: `SELECT COUNT(*) FROM "PaymentRequest"`,
  paymentRequestLogsCount: `SELECT COUNT(*) FROM "PaymentRequestLog"`,
  notificationsCount: `SELECT COUNT(*) FROM "Notification"`,
  customerNotificationLogsCount: `SELECT COUNT(*) FROM "NotificationLog" WHERE "tenantId" IS NOT NULL`,
  adminNotesCount: `SELECT COUNT(*) FROM "AdminNote"`,
  supportCasesCount: `SELECT COUNT(*) FROM "SupportCase"`,
  customerFeatureFlagsCount: `SELECT COUNT(*) FROM "FeatureFlag" WHERE "tenantId" IS NOT NULL OR "siteId" IS NOT NULL`,
  customerIssuesCount: `SELECT COUNT(*) FROM "CustomerIssue" WHERE "tenantId" IS NOT NULL OR "siteId" IS NOT NULL OR "userId" IS NOT NULL`,
  customerIssueEventsCount: `SELECT COUNT(*) FROM "CustomerIssueEvent" AS cie WHERE EXISTS (SELECT 1 FROM "CustomerIssue" AS ci WHERE ci.id = cie."issueId" AND (ci."tenantId" IS NOT NULL OR ci."siteId" IS NOT NULL OR ci."userId" IS NOT NULL))`,
  customerErrorLogsCount: `SELECT COUNT(*) FROM "ErrorLog" WHERE "tenantId" IS NOT NULL OR "siteId" IS NOT NULL OR "userId" IS NOT NULL`,
} as const;

export type CustomerDataCounts = Record<string, number>;

export function validateCustomerDataCounts(expected: CustomerDataCounts, actual: CustomerDataCounts) {
  const errors = Object.keys(expected)
    .filter((key) => expected[key] !== actual[key])
    .map((key) => `${key}: المتوقع ${expected[key]} والفعلي ${actual[key] ?? 0}`);
  return { valid: errors.length === 0, errors };
}
