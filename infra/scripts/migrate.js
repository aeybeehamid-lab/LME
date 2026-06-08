const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function run() {
  const databaseUrl =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/lme";

  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const usersTable = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'users'`
    );
    if (usersTable.rowCount > 0) {
      await client.query(
        `INSERT INTO schema_migrations (filename)
         VALUES ('001_initial_schema.sql')
         ON CONFLICT (filename) DO NOTHING`
      );
    }

    for (const file of files) {
      const applied = await client.query(
        `SELECT 1 FROM schema_migrations WHERE filename = $1`,
        [file]
      );
      if (applied.rowCount > 0) {
        console.log("Skipped (already applied):", file);
        continue;
      }

      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (filename) VALUES ($1)`,
          [file]
        );
        await client.query("COMMIT");
        console.log("Migration applied:", file);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
