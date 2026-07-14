import { describe, expect, it } from "vitest";

import {
  createPageEditorState,
  pageEditorReducer,
} from "@/modules/platform-pages/editor-state";
import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";

const document: PlatformPageDocument = {
  pageKey: "home",
  schemaVersion: 1,
  sections: [
    {
      id: "hero",
      type: "home.hero",
      status: "visible",
      content: { headline: "العنوان الأول" },
    },
  ],
};

describe("page editor state", () => {
  it("records commands for undo and clears redo after a new edit", () => {
    let state = createPageEditorState(document, 2);
    state = pageEditorReducer(state, {
      type: "apply-command",
      command: {
        type: "update-field",
        sectionId: "hero",
        path: ["headline"],
        value: "العنوان الثاني",
      },
    });
    state = pageEditorReducer(state, { type: "undo" });

    expect(state.document.sections[0].content.headline).toBe("العنوان الأول");
    expect(state.canRedo).toBe(true);

    state = pageEditorReducer(state, {
      type: "apply-command",
      command: {
        type: "update-field",
        sectionId: "hero",
        path: ["headline"],
        value: "عنوان مختلف",
      },
    });

    expect(state.canRedo).toBe(false);
    expect(state.isDirty).toBe(true);
  });

  it("discard returns to the last saved baseline rather than the current history entry", () => {
    let state = createPageEditorState(document, 2);
    state = pageEditorReducer(state, {
      type: "apply-command",
      command: { type: "set-section-status", sectionId: "hero", status: "hidden" },
    });
    state = pageEditorReducer(state, { type: "discard" });

    expect(state.document).toEqual(document);
    expect(state.isDirty).toBe(false);
    expect(state.canUndo).toBe(false);
  });

  it("marks the saved document as the new baseline and advances its version", () => {
    let state = createPageEditorState(document, 2);
    state = pageEditorReducer(state, {
      type: "apply-command",
      command: {
        type: "update-field",
        sectionId: "hero",
        path: ["headline"],
        value: "عنوان محفوظ",
      },
    });
    state = pageEditorReducer(state, { type: "saved", version: 3 });

    expect(state.version).toBe(3);
    expect(state.baseline).toEqual(state.document);
    expect(state.isDirty).toBe(false);
  });

  it("replaces local history with a restored saved revision", () => {
    const restored = {
      ...document,
      sections: [{ ...document.sections[0], content: { headline: "عنوان من نسخة قديمة" } }],
    };
    let state = createPageEditorState(document, 3);
    state = pageEditorReducer(state, {
      type: "apply-command",
      command: { type: "set-section-status", sectionId: "hero", status: "hidden" },
    });
    state = pageEditorReducer(state, { type: "replace-saved", document: restored, version: 4 });

    expect(state.document).toEqual(restored);
    expect(state.baseline).toEqual(restored);
    expect(state.version).toBe(4);
    expect(state.isDirty).toBe(false);
    expect(state.canUndo).toBe(false);
  });
});
