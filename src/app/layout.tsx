import type { Metadata, Viewport } from "next";
import { Playfair_Display, Tajawal } from "next/font/google";
import type { ReactNode } from "react";

import { Analytics } from "@/components/analytics";
import { ToastRootProvider } from "@/components/errors/toast-root-provider";
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

export const metadata: Metadata = {
  title: {
    default: "FrameID | موقع احترافي لكل مصور",
    template: "%s | FrameID"
  },
  description:
    "منصة بتدي المصور موقع احترافي ولوحة تحكم ورابط خاص في دقايق.",
  metadataBase: new URL(seoBaseUrl),
  applicationName: "FrameID"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f4ee"
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
        <ToastRootProvider>
          {children}
        </ToastRootProvider>
      </body>
    </html>
  );
}
