import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { pipeline } from "node:stream/promises";

export type BackupEncryptor = {
  encryptFile(inputPath: string, outputPath: string): Promise<string>;
  decryptFile(inputPath: string, outputPath: string): Promise<void>;
};

function deriveKey(encryptionKey: string, salt: Buffer): Buffer {
  return createHash("sha256")
    .update(encryptionKey)
    .update(salt)
    .digest();
}

function deriveIV(encryptionKey: string, salt: Buffer): Buffer {
  return createHash("md5")
    .update(encryptionKey)
    .update(salt)
    .digest()
    .subarray(0, 16);
}

export function createBackupEncryptor(
  encryptionKey: string | undefined
): BackupEncryptor | null {
  if (!encryptionKey) return null;

  return {
    async encryptFile(inputPath: string, outputPath: string): Promise<string> {
      const salt = randomBytes(16);
      const key = deriveKey(encryptionKey, salt);
      const iv = deriveIV(encryptionKey, salt);

      await mkdir(dirname(outputPath), { recursive: true });

      const cipher = createCipheriv("aes-256-cbc", key, iv);
      const outputHandle = createWriteStream(outputPath);

      outputHandle.write(salt);

      const inputHandle = createReadStream(inputPath);
      await pipeline(inputHandle, cipher, outputHandle);

      const checksum = createHash("sha256")
        .update(encryptionKey)
        .update(await readFileAsBuffer(outputPath))
        .digest("hex");

      return checksum;
    },

    async decryptFile(inputPath: string, outputPath: string): Promise<void> {
      const inputHandle = createReadStream(inputPath, { start: 0, end: 15 });
      const salt = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        inputHandle.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        inputHandle.on("end", () => resolve(Buffer.concat(chunks)));
        inputHandle.on("error", reject);
      });

      const key = deriveKey(encryptionKey, salt);
      const iv = deriveIV(encryptionKey, salt);

      const decipher = createDecipheriv("aes-256-cbc", key, iv);
      const encryptedHandle = createReadStream(inputPath, { start: 16 });
      const outputHandle = createWriteStream(outputPath);

      await mkdir(dirname(outputPath), { recursive: true });
      await pipeline(encryptedHandle, decipher, outputHandle);
    },
  };
}

async function readFileAsBuffer(path: string): Promise<Buffer> {
  const fs = await import("node:fs/promises");
  return fs.readFile(path);
}
