export const communicationEventNames = {
  conversationOpened: "communication.conversation.opened.v1",
  entryAppended: "communication.entry.appended.v1",
  contextAttached: "communication.context.attached.v1",
  workItemTransitioned: "communication.work_item.transitioned.v1",
  campaignPublished: "communication.campaign.published.v1",
} as const;

export const communicationCategoryKeys = {
  reply: "communication.reply",
  directMessage: "communication.direct_message",
  systemEvent: "communication.system_event",
  campaign: "campaign.announcement",
  workflow: "workflow.action_required",
} as const;
