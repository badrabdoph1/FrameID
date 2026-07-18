export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const params = new URLSearchParams();
  params.set("w", width.toString());
  if (quality) params.set("q", quality.toString());
  return `${src}?${params.toString()}`;
}