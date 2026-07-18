export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith("/uploads/")) {
    const params = new URLSearchParams();
    params.set("w", width.toString());
    if (quality) params.set("q", quality.toString());
    return `${src}?${params.toString()}`;
  }

  const params = new URLSearchParams();
  params.set("url", src);
  params.set("w", width.toString());
  if (quality) params.set("q", quality.toString());
  return `/_next/image?${params.toString()}`;
}