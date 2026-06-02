const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function run() {
  const databaseUrl =
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/lme";

  const migrationPath = path.join(
    __dirname,
    "..",
    "migrations",
    "001_initial_schema.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf8");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Migration applied:", migrationPath);
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
