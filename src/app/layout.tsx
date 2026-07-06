import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FrameID | مواقع احترافية للمصورين",
    template: "%s | FrameID"
  },
  description:
    "منصة SaaS تمنح المصور موقعًا احترافيًا ولوحة تحكم ورابطًا خاصًا خلال دقائق.",
  metadataBase: new URL("https://frameid.app")
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
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
