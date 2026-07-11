import {
  createTemplateProvisioningPayload,
  getDefaultTemplateContentSourceCode,
  getTemplateContentSource,
  type ProvisionedTemplatePayload,
} from "@/modules/templates/template-content-source";

export type TemplateProvisioningRepository = {
  isTemplateAvailable(templateCode: string): Promise<boolean>;
};

export type TemplateProvisioningService = {
  buildSiteFromTemplate(input: {
    templateCode?: string | null;
    ownerName: string;
  }): Promise<ProvisionedTemplatePayload>;
};

export function createTemplateProvisioningService({
  repository,
  defaultTemplateCode = getDefaultTemplateContentSourceCode(),
}: {
  repository: TemplateProvisioningRepository;
  defaultTemplateCode?: string;
}): TemplateProvisioningService {
  return {
    async buildSiteFromTemplate(input) {
      const templateCode = input.templateCode || defaultTemplateCode;
      const source = getTemplateContentSource(templateCode);

      if (!source || !(await repository.isTemplateAvailable(templateCode))) {
        throw new Error("Selected template is not available");
      }

      return createTemplateProvisioningPayload(source, {
        ownerName: input.ownerName,
      });
    },
  };
}
