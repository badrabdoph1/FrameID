"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type MouseEvent,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Layers3,
  Monitor,
  Redo2,
  RotateCcw,
  Save,
  Smartphone,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import {
  restorePlatformPageRevisionAction,
  savePlatformPageAction,
} from "@/app/(admin)/admin/content/pages/actions";
import { InlineEditableText } from "@/components/content/page-workspace/inline-editable-text";
import { ImageReplaceSheet } from "@/components/content/page-workspace/image-replace-sheet";
import { MarketingFooter, type MarketingFooterContent } from "@/components/layout/marketing-footer";
import { MarketingNav, type NavLink } from "@/components/layout/marketing-nav";
import {
  type EditableImageField,
  type EditableTextField,
  type FeaturedTemplatePreview,
} from "@/components/marketing/home-page-renderer";
import { PlatformPageRenderer } from "@/components/platform-pages/platform-page-renderer";
import { cn } from "@/lib/utils/cn";
import {
  createPageEditorState,
  pageEditorReducer,
} from "@/modules/platform-pages/editor-state";
import {
  getPlatformPageDefinition,
  getSectionDefinition,
} from "@/modules/platform-pages/page-catalog";
import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";

type PageWorkspaceProps = {
  definitionKey: string;
  initialDocument: PlatformPageDocument;
  initialVersion: number;
  featuredTemplate?: FeaturedTemplatePreview | null;
  revisions?: Array<{
    id: string;
    version: number;
    actorName: string | null;
    createdAt: string;
    changeSummary: string | null;
  }>;
  siteChrome?: { navLinks: NavLink[]; footer: MarketingFooterContent };
};

type SelectedButton = {
  sectionId: string;
  path: Array<string | number>;
  labelField: string;
};

type EditableButtonValue = {
  label: string;
  href: string;
  icon?: "arrow" | "external" | "none";
  style?: "primary" | "secondary" | "quiet";
};

export function PageWorkspace({
  definitionKey,
  initialDocument,
  initialVersion,
  featuredTemplate,
  revisions = [],
  siteChrome,
}: PageWorkspaceProps) {
  const [state, dispatch] = useReducer(
    pageEditorReducer,
    createPageEditorState(initialDocument, initialVersion),
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(initialDocument.sections[0]?.id ?? null);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [viewport, setViewport] = useState<"fluid" | "mobile">("fluid");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageField, setImageField] = useState<EditableImageField | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(null);
  const [selectedButton, setSelectedButton] = useState<SelectedButton | null>(null);
  const [revisionItems, setRevisionItems] = useState(revisions);
  const definition = getPlatformPageDefinition(definitionKey);

  const selectedSection = useMemo(
    () => state.document.sections.find((section) => section.id === selectedSectionId) ?? null,
    [selectedSectionId, state.document.sections],
  );
  const selectedDefinition = selectedSection
    ? getSectionDefinition(definitionKey, selectedSection.type)
    : undefined;
  const selectedButtonValue = useMemo(
    () => selectedButton ? getButtonValue(state.document, selectedButton) : null,
    [selectedButton, state.document],
  );

  const commitText = useCallback((field: EditableTextField, value: string) => {
    dispatch({
      type: "apply-command",
      command: {
        type: "update-field",
        sectionId: field.sectionId,
        path: field.path,
        value,
      },
    });
    setMessage(null);
    setSaveError(null);
  }, []);

  const renderText = useCallback(
    (field: EditableTextField) => (
      <InlineEditableText field={field} onCommit={commitText} />
    ),
    [commitText],
  );

  const renderImage = useCallback((field: EditableImageField, image: React.ReactNode) => (
    <div className="absolute inset-0">
      {image}
      <button
        type="button"
        aria-label="تغيير الصورة الرئيسية"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelectedSectionId(field.sectionId);
          setImageField(field);
        }}
        className="absolute end-3 top-3 z-20 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/18 bg-black/62 px-3 text-xs font-black text-white shadow-lg backdrop-blur-md transition hover:bg-black/78 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3cf73]"
      >
        <ImagePlus className="size-3.5" aria-hidden />
        تغيير الصورة
      </button>
    </div>
  ), []);

  const handleCanvasClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const link = target.closest("a");
    if (link) {
      event.preventDefault();
      if (link.dataset.pageButton === "true" && link.dataset.pageButtonSection && link.dataset.pageButtonPath) {
        setSelectedButton({
          sectionId: link.dataset.pageButtonSection,
          path: link.dataset.pageButtonPath.split(".").map((segment) => /^\d+$/.test(segment) ? Number(segment) : segment),
          labelField: link.dataset.pageButtonLabelField ?? "label",
        });
        setSectionsOpen(true);
      }
    }

    const section = target.closest<HTMLElement>("[data-page-section]");
    if (section?.dataset.pageSection) {
      setSelectedSectionId(section.dataset.pageSection);
      if (!link?.dataset.pageButton) setSelectedButton(null);
    }
  }, []);

  const save = useCallback(async () => {
    if (!state.isDirty || saving) return;
    setSaving(true);
    setMessage(null);
    setSaveError(null);

    const result = await savePlatformPageAction({
      pageKey: definitionKey,
      expectedVersion: state.version,
      document: state.document,
    });

    setSaving(false);
    if (result.success) {
      dispatch({ type: "saved", version: result.version });
      if (result.revision) {
        setRevisionItems((items) => [result.revision, ...items]);
      }
      setMessage("تم الحفظ");
    } else {
      setSaveError(result.message);
    }
  }, [definitionKey, saving, state.document, state.isDirty, state.version]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!state.isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.isDirty]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      } else if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        dispatch({ type: "redo" });
      } else if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: "undo" });
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [save]);

  useEffect(() => {
    if (!draggedSectionId) return;

    const finishDrag = (event: PointerEvent) => {
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-section-row]");
      const targetId = target?.dataset.sectionRow;
      if (targetId && targetId !== draggedSectionId) {
        const targetIndex = state.document.sections.findIndex((section) => section.id === targetId);
        if (targetIndex >= 0) {
          dispatch({
            type: "apply-command",
            command: { type: "move-section", sectionId: draggedSectionId, toIndex: targetIndex },
          });
        }
      }
      setDraggedSectionId(null);
    };

    window.addEventListener("pointerup", finishDrag, { once: true });
    return () => window.removeEventListener("pointerup", finishDrag);
  }, [draggedSectionId, state.document.sections]);

  if (!definition) return null;

  const visibleSections = state.document.sections.filter((section) => section.status === "visible");
  const selectedIndex = selectedSection
    ? visibleSections.findIndex((section) => section.id === selectedSection.id)
    : -1;

  const moveSelectedSection = (direction: -1 | 1) => {
    if (!selectedSection) return;
    const target = visibleSections[selectedIndex + direction];
    if (!target) return;
    const targetDocumentIndex = state.document.sections.findIndex((section) => section.id === target.id);
    dispatch({
      type: "apply-command",
      command: { type: "move-section", sectionId: selectedSection.id, toIndex: targetDocumentIndex },
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#090b0f] text-[#fff7e8]">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#090b0f]/94 px-3 py-2 backdrop-blur-xl md:px-5">
        <div className="mx-auto flex max-w-[1800px] items-center gap-2">
          <Link
            href="/admin/content"
            aria-label="العودة إلى المحتوى"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-white/58 transition hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-[#fff7e8] md:text-base">{definition.label}</h1>
            <p className="truncate text-[0.68rem] font-semibold text-white/38">
              {state.isDirty ? "تعديلات غير محفوظة" : `النسخة ${state.version || "الجديدة"}`}
            </p>
          </div>

          <div className="hidden items-center rounded-xl border border-white/8 bg-white/[0.035] p-1 sm:flex">
            <ToolbarButton label="عرض كامل" active={viewport === "fluid"} onClick={() => setViewport("fluid")}>
              <Monitor className="size-3.5" aria-hidden />
            </ToolbarButton>
            <ToolbarButton label="عرض الهاتف" active={viewport === "mobile"} onClick={() => setViewport("mobile")}>
              <Smartphone className="size-3.5" aria-hidden />
            </ToolbarButton>
          </div>

          <ToolbarButton label="تراجع" disabled={!state.canUndo} onClick={() => dispatch({ type: "undo" })}>
            <Undo2 className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="إعادة" disabled={!state.canRedo} onClick={() => dispatch({ type: "redo" })}>
            <Redo2 className="size-4" aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="سجل الإصدارات" onClick={() => setHistoryOpen(true)}>
            <Clock3 className="size-4" aria-hidden />
          </ToolbarButton>
          <button
            type="button"
            aria-label="حفظ التغييرات"
            onClick={() => void save()}
            disabled={!state.isDirty || saving}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#f3cf73] px-3 text-xs font-black text-[#17120a] transition hover:bg-[#f7d989] disabled:cursor-not-allowed disabled:opacity-38 md:px-4 md:text-sm"
          >
            {saving ? <RotateCcw className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Save className="size-4" aria-hidden />}
            <span className="hidden sm:inline">{saving ? "جارٍ الحفظ" : "حفظ"}</span>
          </button>
        </div>
        {message || saveError ? (
          <div className={cn("mx-auto mt-2 flex max-w-[1800px] items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold", saveError ? "bg-red-500/10 text-red-200" : "bg-emerald-500/10 text-emerald-200")} role="status">
            {saveError ? <X className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
            {saveError ?? message}
          </div>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-[1800px] lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 bg-[#11141a] p-0 sm:p-3 lg:p-5">
          <div
            id="page-workspace-canvas"
            tabIndex={-1}
            className={cn(
              "mx-auto overflow-hidden bg-white shadow-[0_24px_80px_rgba(0,0,0,.34)] transition-[max-width,border-radius] duration-200",
              viewport === "mobile" ? "max-w-[390px] rounded-[1.75rem]" : "max-w-none sm:rounded-2xl",
            )}
            onClickCapture={handleCanvasClick}
            data-editor-canvas
          >
            {siteChrome ? <MarketingNav links={siteChrome.navLinks} previewMode /> : null}
            <PlatformPageRenderer
              definitionKey={definitionKey}
              document={state.document}
              featuredTemplate={featuredTemplate}
              renderText={renderText}
              renderImage={renderImage}
            />
            {siteChrome ? <MarketingFooter content={siteChrome.footer} /> : null}
          </div>
        </div>

        <aside
          className={cn(
            "border-r border-white/8 bg-[#0c0e13]",
            sectionsOpen
              ? "fixed inset-x-0 bottom-0 z-40 max-h-[72dvh] overflow-y-auto rounded-t-[1.75rem] border-t border-white/10 p-4 shadow-2xl"
              : "hidden",
            "lg:static lg:block lg:max-h-none lg:overflow-visible lg:rounded-none lg:border-t-0 lg:p-4 lg:shadow-none",
          )}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <strong className="text-sm">أقسام الصفحة</strong>
            <button type="button" onClick={() => setSectionsOpen(false)} aria-label="إغلاق الأقسام" className="grid size-9 place-items-center rounded-xl bg-white/6 text-white/65">
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid gap-1.5">
            {state.document.sections.filter((section) => section.status === "visible").map((section) => {
              const sectionDefinition = getSectionDefinition(definitionKey, section.type);
              const selected = section.id === selectedSectionId;
              return (
                <div
                  key={section.id}
                  data-section-row={section.id}
                  className={cn(
                    "flex min-h-11 items-center rounded-xl transition",
                    selected ? "bg-[#f3cf73] text-[#17120a]" : "text-white/68 hover:bg-white/6 hover:text-white",
                    draggedSectionId === section.id && "opacity-55",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      document.querySelector(`[data-page-section="${section.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3 px-3 text-start text-sm font-bold"
                  >
                    <span className="truncate">{sectionDefinition?.label ?? section.type}</span>
                    <Eye className="size-3.5 shrink-0 opacity-60" aria-hidden />
                  </button>
                  {sectionDefinition?.capabilities.move ? (
                    <button
                      type="button"
                      aria-label={`سحب ${sectionDefinition.label}`}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setDraggedSectionId(section.id);
                      }}
                      className="grid size-10 shrink-0 touch-none place-items-center rounded-xl opacity-48 transition hover:opacity-100"
                    >
                      <GripVertical className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          {selectedSection && selectedDefinition ? (
            <div className="mt-5 border-t border-white/8 pt-4">
              <p className="text-xs font-bold text-white/38">القسم المحدد</p>
              <h2 className="mt-1 text-sm font-black">{selectedDefinition.label}</h2>
              {selectedButton && selectedButtonValue && selectedButton.sectionId === selectedSection.id ? (
                <ButtonSettings
                  key={`${selectedButton.sectionId}-${selectedButton.path.join(".")}`}
                  value={selectedButtonValue}
                  onCommit={(field, value) => dispatch({
                    type: "apply-command",
                    command: {
                      type: "update-field",
                      sectionId: selectedButton.sectionId,
                      path: [...selectedButton.path, field === "label" ? selectedButton.labelField : field],
                      value,
                    },
                  })}
                />
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {selectedDefinition.capabilities.hide ? (
                  <SectionAction label="إخفاء القسم" onClick={() => dispatch({ type: "apply-command", command: { type: "set-section-status", sectionId: selectedSection.id, status: "hidden" } })}>
                    <EyeOff className="size-3.5" aria-hidden />
                  </SectionAction>
                ) : null}
                {selectedDefinition.capabilities.move ? (
                  <>
                    <SectionAction label="تحريك لأعلى" disabled={selectedIndex <= 0} onClick={() => moveSelectedSection(-1)}>
                      <ArrowUp className="size-3.5" aria-hidden />
                    </SectionAction>
                    <SectionAction label="تحريك لأسفل" disabled={selectedIndex >= visibleSections.length - 1} onClick={() => moveSelectedSection(1)}>
                      <ArrowDown className="size-3.5" aria-hidden />
                    </SectionAction>
                  </>
                ) : null}
                {selectedDefinition.capabilities.duplicate ? (
                  <SectionAction
                    label="نسخ القسم"
                    onClick={() =>
                      dispatch({
                        type: "apply-command",
                        command: {
                          type: "duplicate-section",
                          sectionId: selectedSection.id,
                          newSectionId: `${selectedSection.type}-${globalThis.crypto.randomUUID()}`,
                        },
                      })
                    }
                  >
                    <Copy className="size-3.5" aria-hidden />
                  </SectionAction>
                ) : null}
              </div>
            </div>
          ) : null}

          {state.document.sections.some((section) => section.status === "hidden") ? (
            <div className="mt-5 border-t border-white/8 pt-4">
              <h2 className="text-xs font-black text-white/52">الأقسام المخفية</h2>
              <div className="mt-2 grid gap-1.5">
                {state.document.sections.filter((section) => section.status === "hidden").map((section) => {
                  const sectionDefinition = getSectionDefinition(definitionKey, section.type);
                  const label = sectionDefinition?.label ?? section.type;
                  return (
                    <div key={section.id} className="flex items-center gap-1 rounded-xl bg-white/[0.035] p-1">
                      <button
                        type="button"
                        aria-label={`استعادة ${label}`}
                        onClick={() => dispatch({ type: "apply-command", command: { type: "set-section-status", sectionId: section.id, status: "visible" } })}
                        className="flex min-h-10 min-w-0 flex-1 items-center justify-between px-2 text-start text-sm font-bold text-white/62 transition hover:text-white"
                      >
                        <span className="truncate">{label}</span>
                        <Eye className="size-3.5 shrink-0" aria-hidden />
                      </button>
                      {sectionDefinition?.capabilities.delete ? (
                        confirmDeleteId === section.id ? (
                          <button
                            type="button"
                            aria-label="تأكيد الحذف النهائي"
                            onClick={() => {
                              dispatch({ type: "apply-command", command: { type: "delete-section", sectionId: section.id } });
                              setConfirmDeleteId(null);
                              if (selectedSectionId === section.id) setSelectedSectionId(null);
                            }}
                            className="min-h-10 rounded-lg bg-red-500/18 px-2 text-[0.68rem] font-black text-red-200"
                          >
                            تأكيد الحذف
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`حذف ${label} نهائيًا`}
                            onClick={() => setConfirmDeleteId(section.id)}
                            className="grid size-10 place-items-center rounded-lg text-white/35 transition hover:bg-red-500/12 hover:text-red-200"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        )
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {state.isDirty ? (
            <button type="button" onClick={() => dispatch({ type: "discard" })} className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-bold text-white/55 transition hover:bg-white/6 hover:text-white">
              <RotateCcw className="size-3.5" aria-hidden />
              تجاهل التغييرات
            </button>
          ) : null}
        </aside>
      </div>

      <div className="fixed inset-x-3 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0c0e13]/96 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
        <button type="button" aria-label="الأقسام" onClick={() => setSectionsOpen(true)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white/6 text-xs font-black text-white/78">
          <Layers3 className="size-4" aria-hidden />
          الأقسام
        </button>
        <button type="button" aria-label="عرض الهاتف" onClick={() => setViewport((value) => value === "mobile" ? "fluid" : "mobile")} className="grid size-11 place-items-center rounded-xl bg-white/6 text-white/70">
          {viewport === "mobile" ? <Monitor className="size-4" aria-hidden /> : <Smartphone className="size-4" aria-hidden />}
        </button>
      </div>

      {imageField ? (
        <ImageReplaceSheet
          currentUrl={imageField.value}
          alt={imageField.alt}
          onClose={() => setImageField(null)}
          onReplace={(reference) => {
            dispatch({
              type: "apply-command",
              command: {
                type: "update-field",
                sectionId: imageField.sectionId,
                path: imageField.path,
                value: reference,
              },
            });
            setImageField(null);
            setMessage("تم تجهيز الصورة. احفظ الصفحة لنشرها.");
            setSaveError(null);
          }}
        />
      ) : null}

      {historyOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/68 backdrop-blur-sm sm:items-center sm:justify-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHistoryOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label="سجل الإصدارات" className="max-h-[86dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-white/10 bg-[#0c0e13] p-4 shadow-2xl sm:max-w-lg sm:rounded-[1.75rem] sm:p-5">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-black">سجل الإصدارات</h2>
                <p className="mt-1 text-xs leading-5 text-white/45">استعادة أي نسخة تنشئ إصدارًا جديدًا، ولا تمحو ما حدث بعدها.</p>
              </div>
              <button type="button" onClick={() => setHistoryOpen(false)} aria-label="إغلاق سجل الإصدارات" className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/6 text-white/58 hover:text-white"><X className="size-4" aria-hidden /></button>
            </header>

            {state.isDirty ? <p className="mt-4 rounded-xl bg-amber-300/8 px-3 py-2 text-xs font-bold text-amber-100/78">احفظ تعديلاتك الحالية أو تجاهلها قبل استعادة نسخة.</p> : null}

            <div className="mt-4 grid gap-2">
              {revisionItems.length ? revisionItems.map((revision) => (
                <article key={revision.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black">النسخة {revision.version}</p>
                    <p className="mt-1 truncate text-[0.7rem] text-white/40">
                      {revision.actorName || "مسؤول المنصة"} · {formatRevisionDate(revision.createdAt)}
                    </p>
                  </div>
                  {revision.version === state.version ? (
                    <span className="rounded-lg bg-emerald-400/10 px-2 py-1 text-[0.68rem] font-black text-emerald-200">الحالية</span>
                  ) : (
                    <button
                      type="button"
                      disabled={state.isDirty || restoringRevisionId !== null}
                      onClick={async () => {
                        setRestoringRevisionId(revision.id);
                        setSaveError(null);
                        const result = await restorePlatformPageRevisionAction({ pageKey: definitionKey, revisionId: revision.id, expectedVersion: state.version });
                        setRestoringRevisionId(null);
                        if (result.success) {
                          dispatch({ type: "replace-saved", document: result.document, version: result.version });
                          if (result.revision) setRevisionItems((items) => [result.revision, ...items]);
                          setHistoryOpen(false);
                          setSelectedSectionId(result.document.sections[0]?.id ?? null);
                          setMessage(`تمت استعادة النسخة ${revision.version}`);
                        } else {
                          setSaveError(result.message);
                        }
                      }}
                      className="min-h-9 rounded-lg border border-white/10 px-3 text-xs font-black text-white/62 hover:bg-white/7 hover:text-white disabled:opacity-30"
                    >
                      {restoringRevisionId === revision.id ? "جارٍ الاستعادة" : "استعادة"}
                    </button>
                  )}
                </article>
              )) : <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-white/38">سيظهر السجل بعد أول حفظ.</p>}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function getButtonValue(document: PlatformPageDocument, selected: SelectedButton): EditableButtonValue | null {
  const section = document.sections.find((item) => item.id === selected.sectionId);
  if (!section) return null;

  let value: unknown = section.content;
  for (const key of selected.path) {
    if (Array.isArray(value) && typeof key === "number") {
      value = value[key];
    } else if (value && typeof value === "object" && !Array.isArray(value) && typeof key === "string") {
      value = (value as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const button = value as Record<string, unknown>;
  const label = button[selected.labelField];
  if (typeof label !== "string" || typeof button.href !== "string") return null;

  return {
    label,
    href: button.href,
    icon: button.icon === "external" || button.icon === "none" ? button.icon : "arrow",
    style: button.style === "secondary" || button.style === "quiet" ? button.style : "primary",
  };
}

function ButtonSettings({ value, onCommit }: { value: EditableButtonValue; onCommit: (field: keyof EditableButtonValue, value: string) => void }) {
  return (
    <div className="mt-3 rounded-xl border border-[#f3cf73]/18 bg-[#f3cf73]/[0.055] p-3">
      <p className="text-xs font-black text-[#f3cf73]">الزر المحدد</p>
      <div className="mt-3 grid gap-3">
        <label className="grid gap-1.5 text-[0.7rem] font-bold text-white/48">
          نص الزر
          <input
            key={`label-${value.label}`}
            defaultValue={value.label}
            onBlur={(event) => { if (event.target.value.trim() && event.target.value !== value.label) onCommit("label", event.target.value.trim()); }}
            className="min-h-10 rounded-lg border border-white/10 bg-black/22 px-3 text-sm font-bold text-white outline-none focus:border-[#f3cf73]/50"
          />
        </label>
        <label className="grid gap-1.5 text-[0.7rem] font-bold text-white/48">
          الرابط
          <input
            key={`href-${value.href}`}
            dir="ltr"
            defaultValue={value.href}
            onBlur={(event) => { if (event.target.value.trim() && event.target.value !== value.href) onCommit("href", event.target.value.trim()); }}
            className="min-h-10 rounded-lg border border-white/10 bg-black/22 px-3 text-left text-sm text-white outline-none focus:border-[#f3cf73]/50"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1.5 text-[0.7rem] font-bold text-white/48">
            الشكل
            <select value={value.style ?? "primary"} onChange={(event) => onCommit("style", event.target.value)} className="min-h-10 rounded-lg border border-white/10 bg-[#11141a] px-2 text-xs font-bold text-white outline-none">
              <option value="primary">أساسي</option>
              <option value="secondary">ثانوي</option>
              <option value="quiet">هادئ</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-[0.7rem] font-bold text-white/48">
            العلامة
            <select value={value.icon ?? "arrow"} onChange={(event) => onCommit("icon", event.target.value)} className="min-h-10 rounded-lg border border-white/10 bg-[#11141a] px-2 text-xs font-bold text-white outline-none">
              <option value="arrow">سهم</option>
              <option value="external">رابط خارجي</option>
              <option value="none">بدون</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function formatRevisionDate(value: string): string {
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function ToolbarButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={cn("grid size-9 place-items-center rounded-lg text-white/52 transition hover:bg-white/7 hover:text-white disabled:opacity-25", active && "bg-white/9 text-[#f3cf73]")}>
      {children}
    </button>
  );
}

function SectionAction({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.035] px-2 text-[0.7rem] font-bold text-white/62 transition hover:bg-white/7 hover:text-white disabled:opacity-25">
      {children}
      <span>{label}</span>
    </button>
  );
}
