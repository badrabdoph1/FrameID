import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ImagePlus, Images } from "lucide-react";

import { uploadGalleryImageAction } from "@/app/(dashboard)/dashboard/gallery/actions";
import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GalleryPageProps = {
  searchParams: Promise<{
    uploaded?: string;
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: "معرض الصور | FrameID"
};

export const dynamic = "force-dynamic";

export default async function DashboardGalleryPage({
  searchParams
}: GalleryPageProps) {
  const session = await getCurrentRequestSession();
  const { uploaded, error } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const images = await prisma.galleryImage.findMany({
    where: {
      deletedAt: null,
      album: {
        siteId: session.site.id,
        deletedAt: null
      },
      asset: {
        deletedAt: null
      }
    },
    orderBy: {
      sortOrder: "asc"
    },
    select: {
      id: true,
      caption: true,
      asset: {
        select: {
          url: true,
          alt: true
        }
      }
    }
  });

  return (
    <main className="space-y-5">
      <section>
        <Badge tone="luxury">المعرض</Badge>
        <h1 className="mt-4 text-3xl font-semibold">معرض الصور</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          ارفع أفضل أعمالك وسيتم عرضها داخل موقعك مباشرة.
        </p>
      </section>

      {uploaded ? (
        <p className="rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          تم رفع الصورة وإضافتها إلى موقعك.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-panel)] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          تعذر رفع الصورة. استخدم JPG أو PNG أو WebP بحجم مناسب.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>إضافة صورة</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadGalleryImageAction} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="image">الصورة</Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">وصف مختصر</Label>
              <Input id="caption" name="caption" placeholder="مثال: تفاصيل جلسة زفاف في القاهرة" />
            </div>
            <Button type="submit" variant="luxury">
              <ImagePlus className="size-4" aria-hidden />
              رفع الصورة
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">الصور الحالية</h2>
          <span className="text-sm text-muted-foreground">{images.length} صورة</span>
        </div>

        {images.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((item) => (
              <figure
                key={item.id}
                className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={item.asset.url}
                    alt={item.asset.alt || item.caption || "صورة من معرض المصور"}
                    fill
                    sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 92vw"
                    className="object-cover"
                  />
                </div>
                {item.caption ? (
                  <figcaption className="px-3 py-2 text-sm text-muted-foreground">
                    {item.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="grid justify-items-center gap-3 py-10 text-center text-muted-foreground">
              <Images className="size-8" aria-hidden />
              <p>لم تتم إضافة صور بعد.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
