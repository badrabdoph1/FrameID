import type { Metadata, Viewport } from "next";
import { Playfair_Display, Tajawal } from "next/font/google";
import type { ReactNode } from "react";

import { Analytics } from "@/components/analytics";
import { ToastRootProvider } from "@/components/errors/toast-root-provider";
import { HomepageTemplateLinkNormalizer } from "@/components/marketing/homepage-template-link-normalizer";
import { SupportFloatingButton } from "@/components/support/support-floating-button";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-arabic",
  display: "swap"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display-face",
  display: "swap"
});

const seoBaseUrl = "https://frameid.app";
const defaultDescription =
  "FrameID منصة عربية للمصورين تساعدك تنشئ موقعًا احترافيًا ورابطًا واحدًا يجمع صورك وباقاتك وأسعارك وبيانات التواصل.";

export const metadata: Metadata = {
  metadataBase: new URL(seoBaseUrl),
  title: {
    default: "FrameID | موقع احترافي لكل مصور",
    template: "%s | FrameID"
  },
  description: defaultDescription,
  applicationName: "FrameID",
  referrer: "origin-when-cross-origin",
  keywords: [
    "FrameID",
    "موقع مصور",
    "مواقع للمصورين",
    "باقات تصوير",
    "معرض صور",
    "رابط مصور",
    "موقع استوديو تصوير"
  ],
  authors: [{ name: "FrameID" }],
  creator: "FrameID",
  publisher: "FrameID",
  category: "SaaS",
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    siteName: "FrameID",
    url: seoBaseUrl,
    title: "FrameID | موقع احترافي لكل مصور",
    description: defaultDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FrameID - موقع احترافي للمصورين في رابط واحد"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FrameID | موقع احترافي لكل مصور",
    description: defaultDescription,
    images: ["/opengraph-image"]
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FrameID",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" }
    ],
    apple: [{ url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d12"
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${tajawal.variable} ${playfair.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://i.ibb.co" />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
      </head>
      <body>
        <Analytics />
        <ToastRootProvider>{children}</ToastRootProvider>
        <HomepageTemplateLinkNormalizer />
        <SupportFloatingButton />
      </body>
    </html>
  );
}
