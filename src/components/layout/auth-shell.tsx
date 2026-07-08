import Link from "next/link";
import React from "react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-background px-4 py-8 md:grid-cols-[1fr_1.1fr] md:p-0">
      <section className="hidden bg-ink p-10 text-white md:flex md:flex-col md:justify-between">
        <Link href="/" className="font-display text-2xl font-semibold">
          FrameID
        </Link>
        <div className="max-w-md">
          <p className="text-sm font-semibold text-champagne">
            منصة لكل مصور
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight">
            موقع، رابط، لوحة تحكم—وتجربة مجانية من أول دخول.
          </h2>
        </div>
      </section>
      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <Link href="/" className="mb-10 font-display text-2xl font-semibold md:hidden">
          FrameID
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
        </div>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}
