import { describe, expect, it } from "vitest";

import {
  buildTemplatePreviewViewModel,
  createTemplateProvisioningPayload,
  getTemplateContentSource,
} from "@/modules/templates/template-content-source";

describe("template content source", () => {
  it.each(["noir-gold", "rose-blush"])(
    "is the single source for preview and provisioning for %s",
    (templateCode) => {
      const source = getTemplateContentSource(templateCode);

      expect(source).not.toBeNull();

      const preview = buildTemplatePreviewViewModel(source!);
      const payload = createTemplateProvisioningPayload(source!, {
        ownerName: "محمود سامي",
      });

      expect(preview.themeCode).toBe(source!.themeCode);
      expect(preview.hero.headline).toBe(source!.content.sections.hero.headline);
      expect(preview.hero.subheadline).toBe(source!.content.sections.hero.subheadline);
      expect(preview.gallery.map((image) => image.url)).toEqual(
        source!.content.gallery.images.map((image) => image.url),
      );
      expect(preview.packages.map((item) => item.name)).toEqual(
        source!.content.packages.map((item) => item.name),
      );
      expect(payload.site.title).toBe("محمود سامي");
      expect(payload.contact.studioName).toBe("محمود سامي");
      expect(payload.sections.map((section) => section.type)).toEqual([
        "hero",
        "gallery",
        "packages",
        "extras",
        "contact",
      ]);
      expect(payload.gallery.images.map((image) => image.url)).toEqual(
        source!.content.gallery.images.map((image) => image.url),
      );
      expect(payload.packages.map((item) => item.imageUrl)).toEqual(
        source!.content.packages.map((item) => item.imageUrl),
      );
      expect(payload.extras.map((item) => item.name)).toEqual(
        source!.content.extras.map((item) => item.name),
      );
    },
  );

  it("replaces only the demo photographer identity fields", () => {
    const source = getTemplateContentSource("noir-gold")!;
    const payload = createTemplateProvisioningPayload(source, {
      ownerName: "محمود سامي",
    });

    expect(payload.site.title).toBe("محمود سامي");
    expect(payload.sections.find((section) => section.type === "hero")?.data).toMatchObject({
      headline: "محمود سامي",
    });
    expect(payload.seo.title).toBe("محمود سامي");
    expect(payload.packages).toEqual(
      createTemplateProvisioningPayload(source, {
        ownerName: source.content.site.title,
      }).packages,
    );
    expect(payload.gallery).toEqual(
      createTemplateProvisioningPayload(source, {
        ownerName: source.content.site.title,
      }).gallery,
    );
  });
});
