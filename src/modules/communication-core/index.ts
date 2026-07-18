export { createCommunicationCore } from "./service";
export {
  CommunicationConflictError,
  createPrismaCommunicationRepository,
} from "./prisma-communication-repository";
export type { CommunicationRepository } from "./repository";
export type {
  AppendEntryInput,
  AppendSystemEventInput,
  AttachContextInput,
  MarkReadInput,
  OpenConversationInput,
  PublishCampaignInput,
  TransitionWorkItemInput,
} from "./types";
