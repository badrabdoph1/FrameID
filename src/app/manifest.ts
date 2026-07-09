import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FrameID - لوحة مواقع المصورين",
    short_name: "FrameID",
    description: "لوحة تحكم وموقع احترافي للمصورين في رابط واحد.",
    lang: "ar",
    dir: "rtl",
    id: "/dashboard",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait-primary",
    theme_color: "#0b0d12",
    background_color: "#0b0d12",
    categories: ["business", "productivity", "photo"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/pwa/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "لوحة العميل",
        short_name: "العميل",
        description: "افتح لوحة تحكم العميل",
        url: "/dashboard?source=pwa-shortcut",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "لوحة الأدمن",
        short_name: "الأدمن",
        description: "افتح لوحة إدارة FrameID",
        url: "/admin?source=pwa-shortcut",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
    screenshots: [
      {
        src: "/pwa/screenshot-dashboard.svg",
        sizes: "1280x720",
        type: "image/svg+xml",
        form_factor: "wide",
        label: "لوحة تحكم FrameID",
      },
      {
        src: "/pwa/screenshot-mobile.svg",
        sizes: "390x844",
        type: "image/svg+xml",
        form_factor: "narrow",
        label: "FrameID على الهاتف",
      },
    ],
  } as MetadataRoute.Manifest;
}
