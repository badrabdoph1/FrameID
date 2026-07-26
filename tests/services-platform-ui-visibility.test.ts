import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { vi } from "vitest";

import * as visibilityModule from "@/modules/services-platform/ui-visibility";

type VisibilityModule = {
  SERVICES_PLATFORM_UI_FEATURE_KEY?: string;
  isServicesPlatformUiVisible?: (client: unknown) => Promise<boolean>;
  setServicesPlatformUiVisible?: (client: unknown, enabled: boolean) => Promise<void>;
};

const visibility = visibilityModule as VisibilityModule;

describe("services platform UI visibility", () => {
  it("has a dedicated platform-level visibility module", () => {
    expect(existsSync(resolve(process.cwd(), "src/modules/services-platform/ui-visibility.ts"))).toBe(true);
  });

  it("is hidden by default and reads the platform feature flag", async () => {
    expect(visibility.SERVICES_PLATFORM_UI_FEATURE_KEY).toBe("services-platform-ui-visible");
    expect(typeof visibility.isServicesPlatformUiVisible).toBe("function");
    if (!visibility.isServicesPlatformUiVisible) return;

    const findFirst = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ enabled: true });
    const client = { featureFlag: { findFirst } };

    await expect(visibility.isServicesPlatformUiVisible(client)).resolves.toBe(false);
    await expect(visibility.isServicesPlatformUiVisible(client)).resolves.toBe(true);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        key: "services-platform-ui-visible",
        scope: "PLATFORM",
        tenantId: null,
        siteId: null,
      },
    }));
  });

  it("updates the single platform flag or creates it when missing", async () => {
    expect(typeof visibility.setServicesPlatformUiVisible).toBe("function");
    if (!visibility.setServicesPlatformUiVisible) return;

    const update = vi.fn().mockResolvedValue({});
    const create = vi.fn().mockResolvedValue({});
    const existingClient = {
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue({ id: "flag-1" }),
        update,
        create,
      },
    };
    await visibility.setServicesPlatformUiVisible(existingClient, false);
    expect(update).toHaveBeenCalledWith({ where: { id: "flag-1" }, data: { enabled: false } });
    expect(create).not.toHaveBeenCalled();

    const missingClient = {
      featureFlag: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
        create: vi.fn().mockResolvedValue({}),
      },
    };
    await visibility.setServicesPlatformUiVisible(missingClient, true);
    expect(missingClient.featureFlag.create).toHaveBeenCalledWith({
      data: {
        key: "services-platform-ui-visible",
        scope: "PLATFORM",
        tenantId: null,
        siteId: null,
        enabled: true,
      },
    });
  });
});
