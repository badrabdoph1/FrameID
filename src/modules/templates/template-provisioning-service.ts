import {
  createTemplateProvisioningPayload,
  getDefaultTemplateContentSourceCode,
  getTemplateContentSource,
  type ProvisionedTemplatePayload,
  type TemplateContentSourceOptions,
} from "@/modules/templates/template-content-source";
import { loadTemplateContentSourceOptions } from "@/modules/templates/template-starter-defaults-repository";

export type TemplateProvisioningRepository = {
  isTemplateAvailable(templateCode: string): Promise<boolean>;
  getTemplateContentSourceOptions?(templateCode: string): Promise<TemplateContentSourceOptions>;
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
      const options = repository.getTemplateContentSourceOptions
        ? await repository.getTemplateContentSourceOptions(templateCode)
        : await loadTemplateContentSourceOptions(templateCode);
      const source = getTemplateContentSource(templateCode, options);

      if (!source || !(await repository.isTemplateAvailable(templateCode))) {
        throw new Error("Selected template is not available");
      }

      return createTemplateProvisioningPayload(source, {
        ownerName: input.ownerName,
      });
    },
  };
}
