export type CustomerDetail = {
  id: string
  displayName: string
  status: string
  createdAt: string
  updatedAt: string
  trialStartedAt: string | null
  trialEndsAt: string | null
  owner: { id: string; name: string; email: string; phone: string | null; emailVerifiedAt: string | null }
  stats: {
    sitesCount: number; paymentsCount: number; mediaCount: number
    totalImages: number; totalStorageBytes: number; totalPackages: number
    supportCasesCount: number; totalRevenue: number
  }
  subscription: CustomerSubscription | null
  sites: CustomerSite[]
  recentActivity: TimelineEvent[]
  recentPayments: PaymentItem[]
  sessions: SessionItem[]
}

export type CustomerSubscription = {
  id: string; planName: string | null; planPrice: number | null
  status: string; currentPeriodStart: string | null; currentPeriodEnd: string | null
  expiresAt: string | null; activatedAt: string | null
}

export type CustomerSite = {
  id: string; slug: string; title: string; status: string
  isPublished: boolean; themeName: string | null; locale: string
  publishedVersion: number; packagesCount: number; albumsCount: number
  extrasCount: number; createdAt: string; updatedAt: string
  domains: { domain: string; status: string }[]
  seo: { title: string; description: string | null } | null
}

export type TimelineEvent = {
  id: string; action: string; entityType: string; entityId: string | null
  actorName: string | null; createdAt: string
}

export type PaymentItem = {
  id: string; amount: number; currency: string; method: string
  status: string; reference: string | null; proofUrl: string | null
  reviewedByName: string | null; createdAt: string
}

export type SessionItem = {
  id: string; ipAddress: string | null; userAgent: string | null
  createdAt: string; lastSeenAt: string | null
}

export type CustomerMediaAsset = {
  id: string; url: string; alt: string | null; mimeType: string
  sizeBytes: number
}

export type CustomerNotification = {
  id: string; type: string; title: string; body: string; createdAt: string; readAt: string | null
}

export type CustomerAdminNote = {
  id: string; body: string; authorName: string | null; createdAt: string
}

export type CustomerSubscriptionInfo = {
  id: string; planName: string | null; status: string
  currentPeriodStart: string | null; currentPeriodEnd: string | null
  createdAt: string
}
