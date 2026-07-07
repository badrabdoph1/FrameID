"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void
    dataLayer: unknown[]
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID

export function Analytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || process.env.NODE_ENV !== "production") return

    const script1 = document.createElement("script")
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    script1.async = true
    document.head.appendChild(script1)

    const script2 = document.createElement("script")
    script2.id = "google-analytics"
    script2.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_path: window.location.pathname,
      });
    `
    document.head.appendChild(script2)

    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    const handleRouteChange = () => {
      window.gtag?.("config", GA_MEASUREMENT_ID, {
        page_path: window.location.pathname,
      })
    }

    history.pushState = function (...args) {
      originalPushState.apply(this, args)
      handleRouteChange()
    }

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      handleRouteChange()
    }

    window.addEventListener("popstate", handleRouteChange)

    return () => {
      window.removeEventListener("popstate", handleRouteChange)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [])

  return null
}
