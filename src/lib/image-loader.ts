export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!Number.isFinite(width) || width <= 0) return src
  const separator = src.includes("?") ? "&" : "?"
  const params = new URLSearchParams()
  params.set("w", Math.round(width).toString())
  if (quality && quality > 0 && quality <= 100) params.set("q", quality.toString())
  return `${src}${separator}${params.toString()}`
}