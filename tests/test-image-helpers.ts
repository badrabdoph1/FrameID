import sharp from "sharp";

export async function createTestJpeg(width = 100, height = 100): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function createTestPng(width = 100, height = 100): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 255, b: 0, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

export async function createTestWebp(width = 100, height = 100): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 0, g: 0, b: 255 },
    },
  })
    .webp({ quality: 90 })
    .toBuffer();
}

export function createTestFile(buffer: Buffer, name: string, type: string): File {
  return {
    name,
    type,
    size: buffer.length,
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    },
  } as File;
}