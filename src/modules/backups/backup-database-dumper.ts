import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { createGzip } from "node:zlib";
import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { join, dirname } from "node:path";

const execFileAsync = promisify(execFile);

export type DatabaseDumpResult = {
  dumpPath: string;
  sizeBytes: number;
  durationMs: number;
};

export type DatabaseDumper = {
  dumpDatabase(outputDir: string, backupId: string): Promise<DatabaseDumpResult>;
  getDatabaseSize(): Promise<number>;
  getMigrationVersion(): Promise<string>;
};

export function createDatabaseDumper(databaseUrl: string): DatabaseDumper {
  function parseDatabaseUrl(url: string): {
    host: string;
    port: string;
    user: string;
    password: string;
    database: string;
  } {
    try {
      const u = new URL(url);
      return {
        host: u.hostname,
        port: u.port || "5432",
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ""),
      };
    } catch {
      throw new Error("Invalid DATABASE_URL");
    }
  }

  function psqlArgs(parsed: ReturnType<typeof parseDatabaseUrl>, command: string): string[] {
    return [
      `--host=${parsed.host}`,
      `--port=${parsed.port}`,
      `--username=${parsed.user}`,
      "--no-password",
      `--dbname=${parsed.database}`,
      "--tuples-only",
      `--command=${command}`,
    ];
  }

  return {
    async dumpDatabase(outputDir: string): Promise<DatabaseDumpResult> {
      const parsed = parseDatabaseUrl(databaseUrl);
      const dumpPath = join(outputDir, "database.sql.gz");
      await mkdir(dirname(dumpPath), { recursive: true });

      const startTime = Date.now();

      const pgDumpArgs = [
        `--host=${parsed.host}`,
        `--port=${parsed.port}`,
        `--username=${parsed.user}`,
        "--no-password",
        "--format=custom",
        "--compress=9",
        "--no-owner",
        "--no-acl",
        "--file=-",
        parsed.database,
      ];

      const env = { ...process.env, PGPASSWORD: parsed.password };
      const dumpChild = spawn("pg_dump", pgDumpArgs, { env, stdio: ["ignore", "pipe", "pipe"] });

      const exitPromise = new Promise<number | null>((resolve, reject) => {
        dumpChild.on("error", reject);
        dumpChild.on("close", resolve);
      });

      const gzipStream = createGzip({ level: 9 });
      const writeStream = createWriteStream(dumpPath);

      if (!dumpChild.stdout) {
        throw new Error("pg_dump failed to produce stdout");
      }

      let stderr = "";
      dumpChild.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      await pipeline(dumpChild.stdout, gzipStream, writeStream);

      const exitCode = await exitPromise;

      if (exitCode !== 0) {
        throw new Error(`pg_dump failed with exit code ${exitCode}: ${stderr.trim()}`);
      }

      const durationMs = Date.now() - startTime;
      const sizeBytes = (await stat(dumpPath)).size;

      return { dumpPath, sizeBytes, durationMs };
    },

    async getDatabaseSize(): Promise<number> {
      const parsed = parseDatabaseUrl(databaseUrl);
      const env = { ...process.env, PGPASSWORD: parsed.password };
      const query = "SELECT pg_database_size(current_database())";

      const { stdout } = await execFileAsync("psql", psqlArgs(parsed, query), { env });

      return parseInt(stdout.trim(), 10);
    },

    async getMigrationVersion(): Promise<string> {
      const parsed = parseDatabaseUrl(databaseUrl);
      const env = { ...process.env, PGPASSWORD: parsed.password };
      try {
        const { stdout } = await execFileAsync(
          "psql",
          psqlArgs(parsed, "SELECT MAX(migration_name) FROM _prisma_migrations"),
          { env }
        );
        return stdout.trim() || "unknown";
      } catch {
        return "unknown";
      }
    },
  };
}
