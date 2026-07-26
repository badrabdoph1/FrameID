export const SERVICES_PLATFORM_UI_FEATURE_KEY = "services-platform-ui-visible";

type VisibilityFlag = {
  id: string;
  enabled: boolean;
};

type ServicesPlatformVisibilityReader = {
  featureFlag: {
    findFirst(args: {
      where: {
        key: string;
        scope: "PLATFORM";
        tenantId: null;
        siteId: null;
      };
      orderBy: { updatedAt: "desc" };
      select: { id: true; enabled: true };
    }): Promise<VisibilityFlag | null>;
  };
};

type ServicesPlatformVisibilityWriter = ServicesPlatformVisibilityReader & {
  featureFlag: ServicesPlatformVisibilityReader["featureFlag"] & {
    update(args: { where: { id: string }; data: { enabled: boolean } }): Promise<unknown>;
    create(args: {
      data: {
        key: string;
        scope: "PLATFORM";
        tenantId: null;
        siteId: null;
        enabled: boolean;
      };
    }): Promise<unknown>;
  };
};

const platformFlagWhere = {
  key: SERVICES_PLATFORM_UI_FEATURE_KEY,
  scope: "PLATFORM" as const,
  tenantId: null,
  siteId: null,
};

export async function isServicesPlatformUiVisible(client: ServicesPlatformVisibilityReader): Promise<boolean> {
  const flag = await client.featureFlag.findFirst({
    where: platformFlagWhere,
    orderBy: { updatedAt: "desc" },
    select: { id: true, enabled: true },
  });
  return flag?.enabled ?? false;
}

export async function setServicesPlatformUiVisible(client: ServicesPlatformVisibilityWriter, enabled: boolean): Promise<void> {
  const existing = await client.featureFlag.findFirst({
    where: platformFlagWhere,
    orderBy: { updatedAt: "desc" },
    select: { id: true, enabled: true },
  });

  if (existing) {
    await client.featureFlag.update({ where: { id: existing.id }, data: { enabled } });
    return;
  }

  await client.featureFlag.create({
    data: {
      ...platformFlagWhere,
      enabled,
    },
  });
}
