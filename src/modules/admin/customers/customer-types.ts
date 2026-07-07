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
  stats: {
    sitesCount: number;
    paymentsCount: number;
    mediaCount: number;
    supportCasesCount: number;
    totalRevenue: number;
  };
  recentPayments: CustomerPaymentInfo[];
  recentActivity: CustomerActivityEntry[];
};

export type CustomerSiteInfo = {
  id: string;
  slug: string;
  title: string;
  status: CustomerSiteStatus;
  themeName: string | null;
  templateName: string | null;
  domain: string | null;
  isPublished: boolean;
  publishedVersion: number;
  createdAt: string;
};

export type CustomerSubscriptionInfo = {
  id: string;
  status: CustomerSubscriptionStatus;
  planName: string | null;
  planPrice: number | null;
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
  createdAt: string;
  reviewedAt: string | null;
  adminNote: string | null;
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
