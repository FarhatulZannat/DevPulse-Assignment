import { Pool, type PoolConfig } from "pg";
import config from "../config/index.js";

const poolConfig: PoolConfig = {};

if (config.databaseUrl) {
  poolConfig.connectionString = config.databaseUrl;
}

if (config.databaseSsl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

export const initDB = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(320) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'contributor'
        CHECK (role IN ('contributor', 'maintainer')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      title VARCHAR(150) NOT NULL CHECK (CHAR_LENGTH(title) BETWEEN 1 AND 150),
      description TEXT NOT NULL CHECK (CHAR_LENGTH(description) >= 20),
      type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
      status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved')),
      reporter_id INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION refresh_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await pool.query("DROP TRIGGER IF EXISTS users_refresh_updated_at ON users");
  await pool.query(`
    CREATE TRIGGER users_refresh_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION refresh_updated_at()
  `);

  await pool.query("DROP TRIGGER IF EXISTS issues_refresh_updated_at ON issues");
  await pool.query(`
    CREATE TRIGGER issues_refresh_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION refresh_updated_at()
  `);

  await pool.query(
    "CREATE INDEX IF NOT EXISTS issues_reporter_id_idx ON issues (reporter_id)",
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS issues_status_type_idx ON issues (status, type)",
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS issues_created_at_idx ON issues (created_at)",
  );
};
