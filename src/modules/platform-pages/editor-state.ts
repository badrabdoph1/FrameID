import {
  applyPageCommand,
  type PageCommand,
  type PlatformPageDocument,
} from "@/modules/platform-pages/page-document";

const MAX_UNDO_DEPTH = 100;

export type PageEditorState = {
  baseline: PlatformPageDocument;
  document: PlatformPageDocument;
  past: PlatformPageDocument[];
  future: PlatformPageDocument[];
  version: number;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

export type PageEditorAction =
  | { type: "apply-command"; command: PageCommand }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "discard" }
  | { type: "saved"; version: number }
  | { type: "replace-saved"; document: PlatformPageDocument; version: number };

export function createPageEditorState(
  document: PlatformPageDocument,
  version: number,
): PageEditorState {
  return withDerivedState({
    baseline: document,
    document,
    past: [],
    future: [],
    version,
  });
}

export function pageEditorReducer(
  state: PageEditorState,
  action: PageEditorAction,
): PageEditorState {
  switch (action.type) {
    case "apply-command": {
      const nextDocument = applyPageCommand(state.document, action.command);
      const past = [...state.past, state.document].slice(-MAX_UNDO_DEPTH);
      return withDerivedState({ ...state, document: nextDocument, past, future: [] });
    }

    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return withDerivedState({
        ...state,
        document: previous,
        past: state.past.slice(0, -1),
        future: [state.document, ...state.future],
      });
    }

    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return withDerivedState({
        ...state,
        document: next,
        past: [...state.past, state.document].slice(-MAX_UNDO_DEPTH),
        future: state.future.slice(1),
      });
    }

    case "discard":
      return withDerivedState({
        ...state,
        document: state.baseline,
        past: [],
        future: [],
      });

    case "saved":
      return withDerivedState({
        ...state,
        baseline: state.document,
        past: [],
        future: [],
        version: action.version,
      });

    case "replace-saved":
      return createPageEditorState(action.document, action.version);
  }
}

function withDerivedState(
  state: Omit<PageEditorState, "isDirty" | "canUndo" | "canRedo"> &
    Partial<Pick<PageEditorState, "isDirty" | "canUndo" | "canRedo">>,
): PageEditorState {
  return {
    baseline: state.baseline,
    document: state.document,
    past: state.past,
    future: state.future,
    version: state.version,
    isDirty: state.document !== state.baseline,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
