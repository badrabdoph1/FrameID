import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FrameID",
    short_name: "FrameID",
    description: "منصة المصورين المحترفين لعمل مواقعهم",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#d8b46a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    lang: "ar",
    dir: "rtl",
  }
}
