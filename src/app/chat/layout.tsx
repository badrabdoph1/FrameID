import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Chat with AI models using Puter.js",
};

export default function ChatLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="bg-neutral-950 text-white antialiased">{children}</body>
    </html>
  );
}
