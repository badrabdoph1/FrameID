"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Download, RefreshCw, Share2, Smartphone, X } from "lucide-react";

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
};

type NavigatorWithInstallHints = Navigator & {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<Array<unknown>>;
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

type PwaInstallButtonProps = {
  context: "dashboard" | "admin";
};

const DISMISSED_UNTIL_KEY = "frameid:pwa-dismissed-until";
const FIRST_SEEN_KEY = "frameid:pwa-install-first-seen";
const DISMISS_DELAY_MS = 7 * 24 * 60 * 60 * 1000;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as NavigatorWithInstallHints;
  return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || nav.standalone === true;
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  const maxTouchPoints = window.navigator.maxTouchPoints;
  const isIOS = /iphone|ipad|ipod/i.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
  const isWebKit = /safari/i.test(userAgent) && !/crios|fxios|edgios|chrome/i.test(userAgent);
  return isIOS && isWebKit;
}

function canUseStorage() {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem("frameid:pwa-storage-test", "1");
    window.localStorage.removeItem("frameid:pwa-storage-test");
    return true;
  } catch {
    return false;
  }
}

function isDismissedRecently() {
  if (!canUseStorage()) return false;
  const value = window.localStorage.getItem(DISMISSED_UNTIL_KEY);
  if (!value) return false;
  const until = Number(value);
  return Number.isFinite(until) && until > Date.now();
}

function rememberDismissal() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DELAY_MS));
}

function clearDismissal() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(DISMISSED_UNTIL_KEY);
}

function shouldAnimateFirstAppearance() {
  if (!canUseStorage()) return true;
  const seen = window.localStorage.getItem(FIRST_SEEN_KEY) === "1";
  if (!seen) window.localStorage.setItem(FIRST_SEEN_KEY, "1");
  return !seen;
}

function installButtonBottomClass(context: "dashboard" | "admin") {
  if (context === "admin") return "bottom-[calc(7.8rem+env(safe-area-inset-bottom))]";
  return "bottom-[calc(5.15rem+env(safe-area-inset-bottom))]";
}

export function PwaInstallButton({ context }: PwaInstallButtonProps) {
  const pathname = usePathname();
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const installedInCurrentTabRef = useRef(false);
  const reloadingForUpdateRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [nativePromptReady, setNativePromptReady] = useState(false);
  const [iosPromptReady, setIosPromptReady] = useState(false);
  const [showIosSheet, setShowIosSheet] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [entered, setEntered] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [onboardingActive, setOnboardingActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onEvent = (e: Event) => setOnboardingActive((e as CustomEvent).detail === true);
    window.addEventListener("frameid:onboarding", onEvent);
    return () => window.removeEventListener("frameid:onboarding", onEvent);
  }, []);

  const allowedInThisRoute = useMemo(() => {
    if (!pathname) return false;
    if (pathname.startsWith("/p/")) return false;
    if (context === "dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    if (context === "admin") return pathname === "/admin" || pathname.startsWith("/admin/");
    return false;
  }, [context, pathname]);

  const hideInstallButton = useCallback(() => {
    setReady(false);
    setNativePromptReady(false);
    setIosPromptReady(false);
    setShowIosSheet(false);
    deferredPromptRef.current = null;
  }, []);

  const evaluateInstallState = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!allowedInThisRoute) {
      hideInstallButton();
      return;
    }

    if (installedInCurrentTabRef.current || isStandaloneMode() || isDismissedRecently()) {
      hideInstallButton();
      return;
    }

    const nav = window.navigator as NavigatorWithInstallHints;
    if (typeof nav.getInstalledRelatedApps === "function") {
      try {
        const relatedApps = await nav.getInstalledRelatedApps();
        if (relatedApps.length > 0) {
          hideInstallButton();
          return;
        }
      } catch {
        // Ignore unsupported/blocked install related apps checks.
      }
    }

    if (deferredPromptRef.current) {
      setReady(true);
      setNativePromptReady(true);
      setIosPromptReady(false);
      return;
    }

    if (isIosSafari()) {
      setReady(true);
      setNativePromptReady(false);
      setIosPromptReady(true);
      return;
    }

    hideInstallButton();
  }, [allowedInThisRoute, hideInstallButton]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShouldAnimate(shouldAnimateFirstAppearance());
    void evaluateInstallState();
  }, [evaluateInstallState]);

  useEffect(() => {
    if (!ready) return;
    if (!shouldAnimate) {
      setEntered(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [ready, shouldAnimate]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const onControllerChange = () => {
      if (reloadingForUpdateRef.current) return;
      reloadingForUpdateRef.current = true;
      window.location.reload();
    };

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        waitingWorkerRef.current = registration.waiting;
        setShowUpdateToast(true);
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            waitingWorkerRef.current = installing;
            setShowUpdateToast(true);
          }
        });
      });
    };

    const registerWorker = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          watchRegistration(registration);
          return registration.update().catch(() => undefined);
        })
        .catch(() => undefined);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    const win = window as WindowWithIdleCallback;
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(registerWorker, { timeout: 2500 });
      return () => {
        win.cancelIdleCallback?.(id);
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      };
    }
    const id = window.setTimeout(registerWorker, 1200);
    return () => {
      window.clearTimeout(id);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      void evaluateInstallState();
    };

    const handleInstalled = () => {
      installedInCurrentTabRef.current = true;
      clearDismissal();
      hideInstallButton();
      setShowSuccessToast(true);
      window.setTimeout(() => setShowSuccessToast(false), 2600);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [evaluateInstallState, hideInstallButton]);

  const handleInstallClick = async () => {
    if (nativePromptReady && deferredPromptRef.current) {
      const promptEvent = deferredPromptRef.current;
      deferredPromptRef.current = null;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        installedInCurrentTabRef.current = true;
        clearDismissal();
        hideInstallButton();
      } else {
        rememberDismissal();
        hideInstallButton();
      }
      return;
    }

    if (iosPromptReady) {
      setShowIosSheet(true);
    }
  };

  const dismissForNow = () => {
    rememberDismissal();
    hideInstallButton();
  };

  const updateNow = () => {
    const waitingWorker = waitingWorkerRef.current;
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  if (!allowedInThisRoute) return null;
  if (onboardingActive) return null;

  return (
    <>
      {ready ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`fixed right-3 z-[2147482400] inline-flex min-h-10 items-center gap-1.5 rounded-full border border-black/10 bg-white/92 px-3 text-[0.72rem] font-black text-[#121212] shadow-[0_12px_32px_rgba(0,0,0,0.18)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 dark:border-white/10 dark:bg-[#111720]/92 dark:text-[#fff7e8] md:right-4 md:bottom-4 md:min-h-10 md:px-3.5 ${installButtonBottomClass(context)} ${entered ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}
          aria-label="ثبت التطبيق"
        >
          <Download className="size-3.5" aria-hidden />
          ثبت التطبيق
        </button>
      ) : null}

      {showIosSheet ? (
        <div className="fixed inset-0 z-[2147483000] grid items-end bg-black/32 p-3 backdrop-blur-sm md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="pwa-ios-install-title">
          <div className="mx-auto w-full max-w-sm rounded-3xl border border-white/12 bg-[#111720] p-4 text-[#fff7e8] shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/14 text-amber-200">
                  <Smartphone className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 id="pwa-ios-install-title" className="text-base font-black">ثبت FrameID على الشاشة الرئيسية</h2>
                  <p className="mt-1 text-xs font-bold leading-6 text-white/54">Safari على iPhone لا يعرض نافذة تثبيت تلقائية. اتبع الخطوات التالية:</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowIosSheet(false)} className="grid size-9 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/65">
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <ol className="mt-4 grid gap-2 text-sm font-bold text-white/78">
              <li className="flex items-center gap-2 rounded-2xl bg-white/[0.045] px-3 py-2"><Share2 className="size-4 text-amber-200" aria-hidden /> افتح زر المشاركة من Safari.</li>
              <li className="flex items-center gap-2 rounded-2xl bg-white/[0.045] px-3 py-2"><Download className="size-4 text-amber-200" aria-hidden /> اختر إضافة إلى الشاشة الرئيسية.</li>
              <li className="flex items-center gap-2 rounded-2xl bg-white/[0.045] px-3 py-2"><CheckCircle2 className="size-4 text-emerald-300" aria-hidden /> اضغط إضافة، وسيظهر التطبيق بجانب تطبيقاتك.</li>
            </ol>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={dismissForNow} className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.045] text-sm font-black text-white/70">ليس الآن</button>
              <button type="button" onClick={() => setShowIosSheet(false)} className="min-h-11 rounded-2xl bg-amber-300 text-sm font-black text-[#17120a]">فهمت</button>
            </div>
          </div>
        </div>
      ) : null}

      {showSuccessToast ? (
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-[2147483000] -translate-x-1/2 rounded-full border border-emerald-300/20 bg-[#0f1f19] px-4 py-2 text-xs font-black text-emerald-200 shadow-2xl">
          تم تثبيت التطبيق بنجاح.
        </div>
      ) : null}

      {showUpdateToast ? (
        <button
          type="button"
          onClick={updateNow}
          className="fixed right-3 bottom-[calc(4.85rem+env(safe-area-inset-bottom))] z-[2147482450] grid size-10 place-items-center rounded-full border border-amber-300/28 bg-[#111720]/94 text-[#f3cf73] shadow-[0_14px_36px_rgba(0,0,0,0.26),0_0_22px_rgba(243,207,115,0.12)] backdrop-blur-xl transition active:scale-90 md:right-4 md:bottom-4 md:size-11"
          aria-label="تحديث التطبيق الآن"
          title="تحديث التطبيق"
        >
          <span className="absolute inset-0 rounded-full bg-amber-300/10 animate-ping" aria-hidden />
          <RefreshCw className="relative size-4 animate-spin [animation-duration:1.8s]" aria-hidden />
        </button>
      ) : null}
    </>
  );
}
