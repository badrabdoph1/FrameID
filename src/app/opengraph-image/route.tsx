import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const image = await readFile(join(process.cwd(), "public", "frameid-social-preview.png"));

  return new Response(image, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(image.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": 'inline; filename="frameid-social-preview.png"',
      "X-Content-Type-Options": "nosniff",
    },
  });
}
