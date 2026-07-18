import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminInboxView } from "@/components/communication/admin-inbox-view";
import { ConversationTimeline } from "@/components/communication/conversation-timeline";
import { CustomerInboxView } from "@/components/communication/customer-inbox-view";

const NOW = new Date("2026-07-18T12:00:00.000Z");

describe("communication center user interface", () => {
  it("shows customer unread state, request number, and announcement type", () => {
    render(<CustomerInboxView items={[
      {
        id: "conversation-1",
        number: 1042,
        mode: "BROADCAST",
        typeKey: "announcement.update",
        subject: "تحديث جديد",
        replyMode: "DISABLED",
        lastActivityAt: NOW,
        lastEntry: { body: "أضفنا ميزة جديدة", kind: "MESSAGE", authorType: "ADMIN", createdAt: NOW },
        unread: true,
        unreadCount: 1,
        status: null,
        priority: null,
      },
    ]} />);

    expect(screen.getByText("تحديث جديد")).toBeInTheDocument();
    expect(screen.getByText("#1042")).toBeInTheDocument();
    expect(screen.getByText("إعلان")).toBeInTheDocument();
    expect(screen.getByLabelText("رسالة غير مقروءة")).toBeInTheDocument();
  });

  it("defensively hides internal notes from the customer timeline", () => {
    render(<ConversationTimeline perspective="customer" counterpartyLastReadSequence={1} entries={[
      {
        id: "entry-1",
        sequence: 1,
        kind: "MESSAGE",
        visibility: "CUSTOMER_AND_ADMIN",
        authorType: "CUSTOMER",
        authorName: "نور",
        body: "المشكلة ما زالت موجودة",
        eventName: null,
        metadata: null,
        createdAt: NOW,
        attachments: [],
      },
      {
        id: "entry-2",
        sequence: 2,
        kind: "INTERNAL_NOTE",
        visibility: "ADMIN_ONLY",
        authorType: "ADMIN",
        authorName: "الدعم",
        body: "ملاحظة سرية",
        eventName: null,
        metadata: null,
        createdAt: NOW,
        attachments: [],
      },
    ]} />);

    expect(screen.getByText("المشكلة ما زالت موجودة")).toBeInTheDocument();
    expect(screen.getByText("قرأها الفريق")).toBeInTheDocument();
    expect(screen.queryByText("ملاحظة سرية")).not.toBeInTheDocument();
  });

  it("labels internal notes clearly in the admin timeline", () => {
    render(<ConversationTimeline perspective="admin" entries={[
      {
        id: "entry-2",
        sequence: 2,
        kind: "INTERNAL_NOTE",
        visibility: "ADMIN_ONLY",
        authorType: "ADMIN",
        authorName: "الدعم",
        body: "ملاحظة سرية",
        eventName: null,
        metadata: null,
        createdAt: NOW,
        attachments: [],
      },
    ]} />);

    expect(screen.getByText("ملاحظة داخلية")).toBeInTheDocument();
    expect(screen.getByText("ملاحظة سرية")).toBeInTheDocument();
  });

  it("shows operational status and customer identity in the admin inbox", () => {
    render(<AdminInboxView items={[
      {
        id: "conversation-1",
        number: 1042,
        mode: "DIRECT",
        typeKey: "support.problem",
        subject: "تعذر النشر",
        replyMode: "ENABLED",
        lastActivityAt: NOW,
        lastEntry: null,
        unread: true,
        unreadCount: 1,
        status: "NEW",
        priority: "URGENT",
        tenantId: "tenant-1",
        customerName: "نور",
        customerEmail: "noor@example.com",
        queueKey: "support",
        assigneeAdminUserId: null,
        waitingSince: NOW,
      },
    ]} total={1} />);

    expect(screen.getByText("تعذر النشر")).toBeInTheDocument();
    expect(screen.getByText("نور")).toBeInTheDocument();
    expect(screen.getByText("جديد")).toBeInTheDocument();
    expect(screen.getByText("عاجلة")).toBeInTheDocument();
  });
});
