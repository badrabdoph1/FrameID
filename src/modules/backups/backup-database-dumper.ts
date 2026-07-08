import { exec } from "node:child_process";
import { promisify } from "node:util";
import { createGzip } from "node:zlib";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { join, dirname } from "node:path";

const execAsync = promisify(exec);

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
      throw new Error(`Invalid DATABASE_URL: ${url}`);
    }
  }

  return {
    async dumpDatabase(
      outputDir: string,
      _backupId: string
    ): Promise<DatabaseDumpResult> {
      const parsed = parseDatabaseUrl(databaseUrl);
      const dumpPath = join(outputDir, "database.sql.gz");
      await mkdir(dirname(dumpPath), { recursive: true });

      const startTime = Date.now();

      const pgDumpArgs = [
        `--host=${parsed.host}`,
        `--port=${parsed.port}`,
        `--username=${parsed.user}`,
        `--no-password`,
        `--format=custom`,
        `--compress=9`,
        `--no-owner`,
        `--no-acl`,
        `--file=-`,
        parsed.database,
      ];

      const env = { ...process.env, PGPASSWORD: parsed.password };
      const dumpChild = exec(`pg_dump ${pgDumpArgs.join(" ")}`, {
        env,
        maxBuffer: 1024 * 1024 * 1024,
      });

      const gzipStream = createGzip({ level: 9 });
      const writeStream = createWriteStream(dumpPath);

      if (!dumpChild.stdout) {
        throw new Error("pg_dump failed to produce stdout");
      }

      await pipeline(dumpChild.stdout, gzipStream, writeStream);

      const { stdout: sizeOutput } = await execAsync(
        `wc -c < "${dumpPath}"`,
        { env: { ...process.env } }
      );
      const durationMs = Date.now() - startTime;
      const sizeBytes = parseInt(sizeOutput.trim(), 10);

      return { dumpPath, sizeBytes, durationMs };
    },

    async getDatabaseSize(): Promise<number> {
      const parsed = parseDatabaseUrl(databaseUrl);
      const env = { ...process.env, PGPASSWORD: parsed.password };
      const query = `SELECT pg_database_size('${parsed.database}')`;

      const { stdout } = await execAsync(
        `psql --host=${parsed.host} --port=${parsed.port} --username=${parsed.user} --no-password --dbname=${parsed.database} --tuples-only --command="${query}"`,
        { env }
      );

      return parseInt(stdout.trim(), 10);
    },

    async getMigrationVersion(): Promise<string> {
      const parsed = parseDatabaseUrl(databaseUrl);
      const env = { ...process.env, PGPASSWORD: parsed.password };
      try {
        const { stdout } = await execAsync(
          `psql --host=${parsed.host} --port=${parsed.port} --username=${parsed.user} --no-password --dbname=${parsed.database} --tuples-only --command="SELECT MAX(migration_name) FROM _prisma_migrations"`,
          { env }
        );
        return stdout.trim() || "unknown";
      } catch {
        return "unknown";
      }
    },
  };
}
