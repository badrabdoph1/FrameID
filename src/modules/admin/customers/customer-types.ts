export type CustomerStatus =
  | "TRIAL"
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "ARCHIVED";

export type CustomerSiteStatus = "DRAFT" | "PUBLISHED" | "EXPIRED" | "SUSPENDED";
export type CustomerSubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "EXPIRED"
  | "PAST_DUE"
  | "CANCELLED"
  | "SUSPENDED";

export type CustomerSummary = {
  id: string;
  displayName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  status: CustomerStatus;
  trialEndsAt: string | null;
  sitesCount: number;
  paymentsCount: number;
  totalRevenue: number;
  createdAt: string;
};

export type CustomerDetail = {
  id: string;
  displayName: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
    emailVerifiedAt: string | null;
    role: string;
  };
  status: CustomerStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sites: CustomerSiteInfo[];
  subscription: CustomerSubscriptionInfo | null;
  allSubscriptions: CustomerSubscriptionInfo[];
  stats: {
    sitesCount: number;
    paymentsCount: number;
    mediaCount: number;
    supportCasesCount: number;
    auditLogsCount: number;
    notificationsCount: number;
    adminNotesCount: number;
    totalRevenue: number;
    totalStorageBytes: number;
    totalVisits: number;
    totalImages: number;
    totalPackages: number;
    totalOrders: number;
  };
  recentPayments: CustomerPaymentInfo[];
  recentActivity: CustomerActivityEntry[];
  sessions: CustomerSessionInfo[];
  supportCases: CustomerSupportCaseInfo[];
};

export type CustomerSiteInfo = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: CustomerSiteStatus;
  themeName: string | null;
  themeCode: string | null;
  templateName: string | null;
  domain: string | null;
  domains: { domain: string; status: string }[];
  isPublished: boolean;
  publishedVersion: number;
  locale: string;
  createdAt: string;
  updatedAt: string;
  packagesCount: number;
  albumsCount: number;
  extrasCount: number;
  seo: { title: string; description: string | null } | null;
};

export type CustomerSubscriptionInfo = {
  id: string;
  status: CustomerSubscriptionStatus;
  planName: string | null;
  planPrice: number | null;
  planCode: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type CustomerPaymentInfo = {
  id: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
  proofUrl: string | null;
  reviewedByName: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type CustomerActivityEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  actorName: string | null;
  createdAt: string;
};

export type CustomerSessionInfo = {
  id: string;
  lastSeenAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
};

export type CustomerSupportCaseInfo = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
};

export type CustomerMediaAsset = {
  id: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
};

export type CustomerNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: string;
  readAt: string | null;
  createdAt: string;
};

export type CustomerAdminNote = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

export type CustomerAuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  actorName: string | null;
  createdAt: string;
};

export type CustomerFilter = {
  search?: string;
  status?: CustomerStatus;
  plan?: string;
  sortBy?: "createdAt" | "displayName" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type CustomerListResult = {
  customers: CustomerSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CustomerExport = {
  customer: CustomerDetail;
  payments: CustomerPaymentInfo[];
  activity: CustomerActivityEntry[];
  sessions: CustomerSessionInfo[];
};
