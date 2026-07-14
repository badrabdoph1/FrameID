import { spawn } from "node:child_process";
import { createGzip, createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export type CompressionCodec = "gzip" | "zstd";

export type CompressionInfo = {
  codec: CompressionCodec;
  extension: string;
  compressFile(input: string, output: string): Promise<void>;
  decompressFile(input: string, output: string): Promise<void>;
  tarFlags: string;
};

async function isZstdAvailable(): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("which", ["zstd"], { stdio: ["ignore", "ignore", "pipe"] });
      child.on("close", (code) => resolve());
      child.on("error", reject);
    });
    return true;
  } catch {
    return false;
  }
}

let _zstdAvailable: boolean | null = null;
let _zstdCheck: Promise<boolean> | null = null;

export async function getZstdAvailability(): Promise<boolean> {
  if (_zstdAvailable !== null) return _zstdAvailable;
  if (!_zstdCheck) _zstdCheck = isZstdAvailable().then((a) => { _zstdAvailable = a; return a; });
  return _zstdCheck;
}

export function shouldUseZstd(): boolean {
  return process.env.BACKUP_ZSTD_ENABLED === "true";
}

export async function getCompressionCodec(): Promise<CompressionCodec> {
  if (shouldUseZstd() && await getZstdAvailability()) return "zstd";
  return "gzip";
}

export async function getCompressionInfo(): Promise<CompressionInfo> {
  const codec = await getCompressionCodec();
  if (codec === "zstd") {
    return {
      codec: "zstd",
      extension: ".zst",
      tarFlags: "-I zstd -cf",
      async compressFile(input, output) {
        await mkdir(dirname(output), { recursive: true });
        await new Promise<void>((resolve, reject) => {
          const child = spawn("zstd", ["-19", "-T0", "-o", output, input], { stdio: ["ignore", "pipe", "pipe"] });
          let stderr = "";
          child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
          child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.trim() || `zstd exited with ${code}`)));
          child.on("error", reject);
        });
      },
      async decompressFile(input, output) {
        await mkdir(dirname(output), { recursive: true });
        await new Promise<void>((resolve, reject) => {
          const child = spawn("zstd", ["-d", "-o", output, input], { stdio: ["ignore", "pipe", "pipe"] });
          let stderr = "";
          child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
          child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.trim() || `zstd -d exited with ${code}`)));
          child.on("error", reject);
        });
      },
    };
  }
  return {
    codec: "gzip",
    extension: ".gz",
    tarFlags: "-czf",
    async compressFile(input, output) {
      await mkdir(dirname(output), { recursive: true });
      await pipeline(createReadStream(input), createGzip({ level: 9 }), createWriteStream(output));
    },
    async decompressFile(input, output) {
      await mkdir(dirname(output), { recursive: true });
      await pipeline(createReadStream(input), createGunzip(), createWriteStream(output));
    },
  };
}
