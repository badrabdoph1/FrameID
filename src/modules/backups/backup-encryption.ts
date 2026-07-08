import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  pbkdf2Sync,
} from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_DIGEST = "sha512";

export type EncryptionResult = {
  encryptedFilePath: string;
  iv: string;
  salt: string;
  authTag: string;
};

function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}

export async function encryptBackupFile(
  filePath: string,
  password: string
): Promise<EncryptionResult> {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const input = await readFile(filePath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const outputPath = `${filePath}.encrypted`;
  const header = Buffer.concat([salt, iv, authTag, encrypted]);
  await writeFile(outputPath, header);

  return {
    encryptedFilePath: outputPath,
    iv: iv.toString("hex"),
    salt: salt.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export async function decryptBackupFile(
  filePath: string,
  password: string
): Promise<Buffer> {
  const data = await readFile(filePath);

  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = data.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(password, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}
