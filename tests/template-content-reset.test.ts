import { describe, expect, it } from "vitest";

import { replaceSiteContentFromTemplate } from "@/modules/templates/prisma-template-content-reset";
import {
  createTemplateProvisioningPayload,
  getTemplateContentSource,
} from "@/modules/templates/template-content-source";

describe("template content reset", () => {
  it("snapshots the current site before replacing customer-owned content in one transaction", async () => {
    const operations: string[] = [];
    const payload = createTemplateProvisioningPayload(
      getTemplateContentSource("rose-blush")!,
      { ownerName: "Ali Studio" },
    );

    const transaction = {
      theme: {
        async upsert() {
          operations.push("theme");
          return { id: "theme_rose" };
        },
      },
      template: {
        async upsert() {
          operations.push("template");
          return { id: "template_rose" };
        },
      },
      site: {
        async findUnique() {
          operations.push("read-current-site");
          return {
            id: "site_1",
            title: "Old Site",
            sections: [{ id: "section_old", type: "hero" }],
            packages: [{ id: "package_old", name: "Old package" }],
            extraServices: [],
            galleryAlbums: [],
          };
        },
        async update() {
          operations.push("site-update");
          return {};
        },
      },
      siteContentSnapshot: {
        async create() {
          operations.push("snapshot");
          return { id: "snapshot_1" };
        },
      },
      siteThemeConfig: {
        async updateMany() {
          operations.push("config-update");
          return { count: 1 };
        },
        async create() {
          operations.push("config-create");
          return { id: "config_1" };
        },
      },
      siteSection: {
        async updateMany() {
          operations.push("sections-soft-delete");
          return { count: 1 };
        },
        async createMany(args: { data: unknown[] }) {
          operations.push(`sections-create:${args.data.length}`);
          return { count: args.data.length };
        },
      },
      contactProfile: {
        async upsert() {
          operations.push("contact-upsert");
          return { id: "contact_1" };
        },
      },
      package: {
        async updateMany() {
          operations.push("packages-soft-delete");
          return { count: 1 };
        },
        async createMany(args: { data: unknown[] }) {
          operations.push(`packages-create:${args.data.length}`);
          return { count: args.data.length };
        },
      },
      extraService: {
        async updateMany() {
          operations.push("extras-soft-delete");
          return { count: 1 };
        },
        async createMany(args: { data: unknown[] }) {
          operations.push(`extras-create:${args.data.length}`);
          return { count: args.data.length };
        },
      },
      galleryAlbum: {
        async findMany() {
          operations.push("albums-read");
          return [{ id: "album_old" }];
        },
        async updateMany() {
          operations.push("albums-soft-delete");
          return { count: 1 };
        },
        async create() {
          operations.push("album-create");
          return { id: "album_new" };
        },
      },
      galleryImage: {
        async updateMany() {
          operations.push("images-soft-delete");
          return { count: 1 };
        },
        async create() {
          operations.push("image-create");
          return { id: "image_new" };
        },
      },
      mediaAsset: {
        async create() {
          operations.push("asset-create");
          return { id: "asset_new" };
        },
      },
      sEOSettings: {
        async upsert() {
          operations.push("seo-upsert");
          return { id: "seo_1" };
        },
      },
    };

    const prisma = {
      async $transaction<T>(callback: (tx: typeof transaction) => Promise<T>) {
        operations.push("begin");
        const result = await callback(transaction);
        operations.push("commit");
        return result;
      },
    };

    await expect(
      replaceSiteContentFromTemplate(prisma, {
        siteId: "site_1",
        tenantId: "tenant_1",
        payload,
        reason: "confirmed-template-content-reset",
      }),
    ).resolves.toEqual({
      snapshotId: "snapshot_1",
      templateCode: "rose-blush",
      templateVersion: "1.0.0",
    });

    expect(operations.slice(0, 7)).toEqual([
      "begin",
      "read-current-site",
      "snapshot",
      "theme",
      "template",
      "site-update",
      "config-update",
    ]);
    expect(operations).toContain("sections-soft-delete");
    expect(operations).toContain("sections-create:5");
    expect(operations).toContain("packages-create:3");
    expect(operations).toContain("extras-create:3");
    expect(operations.filter((operation) => operation === "asset-create")).toHaveLength(
      payload.gallery.images.length,
    );
    expect(operations.at(-1)).toBe("commit");
  });
});
