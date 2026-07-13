"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

interface PagePreviewProps {
  pageUrl: string;
  selectedSectionId: string | null;
  selectedTextPath: string | null;
  selectedImagePath: string | null;
  onSectionClick: (sectionId: string, rect: DOMRect) => void;
  onTextClick: (path: string, rect: DOMRect, currentValue: string) => void;
  onImageClick: (path: string, rect: DOMRect, currentSrc: string) => void;
  previewMode: boolean;
}

export function PagePreview({
  pageUrl,
  selectedSectionId,
  selectedTextPath,
  selectedImagePath,
  onSectionClick,
  onTextClick,
  onImageClick,
  previewMode,
}: PagePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const sendToIframe = useCallback((message: unknown) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, window.location.origin);
    }
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      
      const data = event.data;
      if (!data || typeof data !== "object" || !data.type) return;

      switch (data.type) {
        case "section-click":
          onSectionClick(data.sectionId, data.rect);
          break;
        case "text-click":
          onTextClick(data.path, data.rect, data.value);
          break;
        case "image-click":
          onImageClick(data.path, data.rect, data.src);
          break;
      }
    };

    messageHandlerRef.current = handler;
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSectionClick, onTextClick, onImageClick]);

  useEffect(() => {
    if (!iframeRef.current || !iframeLoaded) return;
    sendToIframe({ type: "set-selection", sectionId: selectedSectionId, textPath: selectedTextPath, imagePath: selectedImagePath, previewMode });
  }, [selectedSectionId, selectedTextPath, selectedImagePath, previewMode, iframeLoaded, sendToIframe]);

  const handleLoad = () => {
    setIframeLoaded(true);
    // Inject editor script
    const iframe = iframeRef.current;
    if (iframe?.contentDocument && iframe.contentWindow) {
      injectEditorScript(iframe.contentWindow);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-[#0b0d12] rounded-xl overflow-hidden border border-white/10">
      {!mounted && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0b0d12]">
          <div className="size-12 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={pageUrl}
        onLoad={handleLoad}
        className={cn(
          "w-full h-full border-0 bg-white",
          previewMode && "pointer-events-none"
        )}
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"
        title="Page Preview"
      />
      
      {iframeLoaded && !previewMode && (
        <EditorOverlay
          selectedSectionId={selectedSectionId}
          selectedTextPath={selectedTextPath}
          selectedImagePath={selectedImagePath}
        />
      )}
    </div>
  );
}

function injectEditorScript(window: Window) {

  const sendMessage = (data: object) => {
    window.parent.postMessage(data, window.location.origin);
  };

  // Add data attributes to sections
  const observer = new MutationObserver(() => {
    document.querySelectorAll("[data-page-section]").forEach((el) => {
      if (el.hasAttribute("data-ps-bound")) return;
      el.setAttribute("data-ps-bound", "true");
      
      el.addEventListener("click", (e) => {
        if (e.target === el || (e.target as Element).closest("[data-page-text], [data-page-image]")) return;
        e.stopPropagation();
        const sectionId = el.getAttribute("data-page-section");
        if (sectionId) {
          const rect = el.getBoundingClientRect();
          sendMessage({ type: "section-click", sectionId, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } });
        }
      });
    });

    // Text elements
    document.querySelectorAll("[data-page-text]").forEach((el) => {
      if (el.hasAttribute("data-ps-bound")) return;
      el.setAttribute("data-ps-bound", "true");
      
      (el as HTMLElement).style.cursor = "text";
      el.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const path = el.getAttribute("data-page-text");
        if (path) {
          const rect = el.getBoundingClientRect();
          sendMessage({ type: "text-click", path, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, value: el.textContent || "" });
        }
      });
    });

    // Image elements
    document.querySelectorAll("[data-page-image]").forEach((el) => {
      if (el.hasAttribute("data-ps-bound")) return;
      el.setAttribute("data-ps-bound", "true");
      
      (el as HTMLElement).style.cursor = "pointer";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const path = el.getAttribute("data-page-image");
        if (path) {
          const rect = el.getBoundingClientRect();
          const src = (el as HTMLImageElement).src || (el as HTMLDivElement).style.backgroundImage?.replace(/^url\(["']?/, "").replace(/["']?\)$/, "") || "";
          sendMessage({ type: "image-click", path, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, src });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  
  // Initial scan
  setTimeout(() => observer.takeRecords(), 100);

  // Listen for selection changes from parent
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "set-selection") {
      updateVisualSelection(event.data);
    }
  });

  function updateVisualSelection({
  sectionId,
  textPath,
  imagePath,
  previewMode,
}: {
  sectionId?: string;
  textPath?: string;
  imagePath?: string;
  previewMode?: boolean;
}) {
    // Remove previous highlights
    document.querySelectorAll(".ps-highlight").forEach((el) => el.classList.remove("ps-highlight"));
    document.querySelectorAll(".ps-selected").forEach((el) => el.classList.remove("ps-selected"));

    if (previewMode) return;

    if (sectionId) {
      const section = document.querySelector(`[data-page-section="${sectionId}"]`);
      section?.classList.add("ps-selected");
    }

    if (textPath) {
      const textEl = document.querySelector(`[data-page-text="${textPath}"]`);
      textEl?.classList.add("ps-highlight");
    }

    if (imagePath) {
      const imgEl = document.querySelector(`[data-page-image="${imagePath}"]`);
      imgEl?.classList.add("ps-highlight");
    }
  }

  // Inject styles
  const style = document.createElement("style");
  style.textContent = `
    .ps-selected {
      outline: 2px solid #f3cf73 !important;
      outline-offset: 2px !important;
      position: relative;
    }
    .ps-selected::before {
      content: attr(data-page-section);
      position: absolute;
      top: -20px;
      left: 0;
      background: #f3cf73;
      color: #0b0d12;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: bold;
      border-radius: 2px;
      z-index: 1000;
      white-space: nowrap;
    }
    .ps-highlight {
      outline: 2px dashed #f3cf73 !important;
      outline-offset: 1px !important;
      background: rgba(243, 207, 115, 0.1) !important;
    }
    [data-page-text]:hover,
    [data-page-image]:hover {
      outline: 1px dashed #f3cf73 !important;
      outline-offset: 1px !important;
    }
    .ps-highlight[data-page-text]:hover,
    .ps-highlight[data-page-image]:hover {
      outline: 2px solid #f3cf73 !important;
    }
  `;
  document.head.appendChild(style);
}

function EditorOverlay({
  selectedSectionId,
  selectedTextPath,
  selectedImagePath,
}: {
  selectedSectionId: string | null;
  selectedTextPath: string | null;
  selectedImagePath: string | null;
}) {
  // This renders selection indicators on top of the iframe
  // Since we can't easily overlay on iframe, we rely on injected styles
  return null;
}