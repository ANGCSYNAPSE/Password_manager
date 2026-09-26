import { Pool } from "pg";
import bcrypt from "bcryptjs";
import type {
  CredentialInput,
  CredentialRow,
  CredentialType,
  VaultFile,
  VaultFileInput,
} from "./types";
import { decrypt, encrypt } from "./crypto";
import { DEFAULT_FILE_PLATFORMS } from "./platforms";

declare global {
  // eslint-disable-next-line no-var
  var __vaultDbPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __vaultSchemaReady: Promise<void> | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

function createPool(): Pool {
  const pool = new Pool({
    connectionString,
  });

  return pool;
}

async function ensureSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vault_files (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);
  await pool.query(`
    ALTER TABLE credentials
    ADD COLUMN IF NOT EXISTS file_id UUID REFERENCES vault_files(id) ON DELETE SET NULL;
  `);
}

export function getPool(): Pool {
  if (!global.__vaultDbPool) {
    global.__vaultDbPool = createPool();
  }
  if (!global.__vaultSchemaReady) {
    global.__vaultSchemaReady = ensureSchema(global.__vaultDbPool);
  }
  return global.__vaultDbPool;
}

async function getReadyPool(): Promise<Pool> {
  const pool = getPool();
  await global.__vaultSchemaReady;
  return pool;
}

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query("SELECT password_hash FROM admin WHERE username = $1", [username]);
  
  if (res.rows.length === 0) {
      const bootstrapUsername = process.env.ADMIN_USERNAME;
      const bootstrapPassword = process.env.ADMIN_PASSWORD;
      if (
        bootstrapUsername &&
        bootstrapPassword &&
        username === bootstrapUsername &&
        password === bootstrapPassword
      ) {
        const passwordHash = bcrypt.hashSync(bootstrapPassword, 12);
        await pool.query("INSERT INTO admin (username, password_hash) VALUES ($1, $2)", [username, passwordHash]);
        return true;
      }
      return false;
  }
  return bcrypt.compareSync(password, res.rows[0].password_hash);
}

function normalizeCredentialInput(input: CredentialInput) {
  const platform =
    input.platform === "custom" ? "other" : input.platform;
  const custom_platform_name =
    platform === "other"
      ? input.custom_platform_name?.trim() || null
      : null;

  return { platform, custom_platform_name };
}

export function rowToCredential(row: any) {
  return {
    id: row.id,
    file_id: row.file_id ?? null,
    platform: row.platform === "custom" ? "other" : row.platform,
    custom_platform_name: row.custom_platform_name ?? null,
    credential_type: row.credential_type as CredentialType,
    username: row.username,
    email: row.email,
    password: decrypt(row.password_encrypted),
    description: row.description,
    website_url: row.website_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listCredentials(filters?: {
  platform?: string;
  credential_type?: string;
  search?: string;
  file_id?: string;
}) {
  const pool = await getReadyPool();
  let query = "SELECT * FROM credentials WHERE 1=1";
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.file_id === "unfiled") {
    query += " AND file_id IS NULL";
  } else if (filters?.file_id && filters.file_id !== "all") {
    query += ` AND file_id = $${paramIndex++}`;
    params.push(filters.file_id);
  }

  if (filters?.platform && filters.platform !== "all") {
    query += ` AND platform = $${paramIndex++}`;
    params.push(filters.platform);
  }

  if (filters?.credential_type && filters.credential_type !== "all") {
    query += ` AND credential_type = $${paramIndex++}`;
    params.push(filters.credential_type);
  }

  if (filters?.search) {
    query += ` AND (
      platform ILIKE $${paramIndex} OR
      custom_platform_name ILIKE $${paramIndex} OR
      username ILIKE $${paramIndex} OR
      email ILIKE $${paramIndex} OR
      description ILIKE $${paramIndex}
    )`;
    const term = `%${filters.search}%`;
    params.push(term);
    paramIndex++;
  }

  query += " ORDER BY updated_at DESC";

  const res = await pool.query(query, params);
  return res.rows.map(rowToCredential);
}

export async function getCredential(id: string) {
  const pool = await getReadyPool();
  const res = await pool.query("SELECT * FROM credentials WHERE id = $1", [id]);
  return res.rows.length > 0 ? rowToCredential(res.rows[0]) : null;
}

export async function createCredential(input: CredentialInput) {
  const pool = await getReadyPool();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { platform, custom_platform_name } = normalizeCredentialInput(input);

  await pool.query(
    `INSERT INTO credentials
     (id, file_id, platform, custom_platform_name, credential_type, username, email, password_encrypted, description, website_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      input.file_id || null,
      platform,
      custom_platform_name,
      input.credential_type,
      input.username || null,
      input.email || null,
      encrypt(input.password),
      input.description || null,
      input.website_url || null,
      now,
      now,
    ]
  );

  return getCredential(id);
}

export async function updateCredential(id: string, input: CredentialInput) {
  const pool = await getReadyPool();
  const now = new Date().toISOString();
  const { platform, custom_platform_name } = normalizeCredentialInput(input);

  await pool.query(
    `UPDATE credentials SET
      file_id = $1,
      platform = $2,
      custom_platform_name = $3,
      credential_type = $4,
      username = $5,
      email = $6,
      password_encrypted = $7,
      description = $8,
      website_url = $9,
      updated_at = $10
     WHERE id = $11`,
    [
      input.file_id || null,
      platform,
      custom_platform_name,
      input.credential_type,
      input.username || null,
      input.email || null,
      encrypt(input.password),
      input.description || null,
      input.website_url || null,
      now,
      id,
    ]
  );

  return getCredential(id);
}

export async function deleteCredential(id: string) {
  const pool = await getReadyPool();
  await pool.query("DELETE FROM credentials WHERE id = $1", [id]);
}

function rowToVaultFile(row: {
  id: string;
  name: string;
  description: string | null;
  credential_count: string | number | null;
  created_at: string;
  updated_at: string;
}): VaultFile {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    credential_count: Number(row.credential_count ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// A credential is "unfilled" (a seeded placeholder nobody has completed
// yet) when its password is genuinely empty. AES-GCM ciphertext length
// always equals plaintext length, so an empty password's ciphertext
// segment is always empty regardless of key/IV — a reliable, migration-free
// SQL signal that needs no extra column.
const FILLED_CREDENTIAL_SQL = `c.password_encrypted !~ ':$'`;

export async function listVaultFiles(): Promise<VaultFile[]> {
  const pool = await getReadyPool();
  const res = await pool.query(`
    SELECT f.*, COUNT(c.id) FILTER (WHERE ${FILLED_CREDENTIAL_SQL}) AS credential_count
    FROM vault_files f
    LEFT JOIN credentials c ON c.file_id = f.id
    GROUP BY f.id
    ORDER BY f.name ASC
  `);
  return res.rows.map(rowToVaultFile);
}

export async function getVaultFile(id: string): Promise<VaultFile | null> {
  const pool = await getReadyPool();
  const res = await pool.query(
    `
    SELECT f.*, COUNT(c.id) FILTER (WHERE ${FILLED_CREDENTIAL_SQL}) AS credential_count
    FROM vault_files f
    LEFT JOIN credentials c ON c.file_id = f.id
    WHERE f.id = $1
    GROUP BY f.id
  `,
    [id],
  );
  return res.rows.length > 0 ? rowToVaultFile(res.rows[0]) : null;
}

export async function createVaultFile(input: VaultFileInput): Promise<VaultFile> {
  const pool = await getReadyPool();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const name = input.name.trim();
  const description = input.description?.trim() || null;

  await pool.query(
    "INSERT INTO vault_files (id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
    [id, name, description, now, now],
  );

  // One batched multi-row INSERT instead of one round trip per seeded
  // platform — this is the difference between ~1 query and ~6 for every
  // new file.
  const placeholderCols = 12;
  const values: unknown[] = [];
  const rows = DEFAULT_FILE_PLATFORMS.map((preset, i) => {
    const base = i * placeholderCols;
    values.push(
      crypto.randomUUID(),
      id,
      preset.platform,
      null,
      preset.credential_type,
      null,
      null,
      encrypt(""),
      null,
      null,
      now,
      now,
    );
    return `(${Array.from({ length: placeholderCols }, (_, j) => `$${base + j + 1}`).join(", ")})`;
  });

  await pool.query(
    `INSERT INTO credentials
     (id, file_id, platform, custom_platform_name, credential_type, username, email, password_encrypted, description, website_url, created_at, updated_at)
     VALUES ${rows.join(", ")}`,
    values,
  );

  // All seeded credentials start unfilled (excluded from credential_count),
  // so we already know the resulting file's shape without a round trip.
  return { id, name, description, credential_count: 0, created_at: now, updated_at: now };
}

export async function updateVaultFile(
  id: string,
  input: VaultFileInput,
): Promise<VaultFile | null> {
  const pool = await getReadyPool();
  const now = new Date().toISOString();

  await pool.query(
    "UPDATE vault_files SET name = $1, description = $2, updated_at = $3 WHERE id = $4",
    [input.name.trim(), input.description?.trim() || null, now, id],
  );

  return getVaultFile(id);
}

export async function deleteVaultFile(id: string): Promise<void> {
  const pool = await getReadyPool();
  await pool.query("DELETE FROM vault_files WHERE id = $1", [id]);
}

export async function getCredentialCounts(): Promise<{
  total: number;
  unfiled: number;
}> {
  const pool = await getReadyPool();
  const res = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE ${FILLED_CREDENTIAL_SQL}) AS total,
      COUNT(*) FILTER (WHERE file_id IS NULL AND ${FILLED_CREDENTIAL_SQL}) AS unfiled
    FROM credentials c
  `);
  return {
    total: Number(res.rows[0].total),
    unfiled: Number(res.rows[0].unfiled),
  };
}

export async function createApiToken(name: string, rawToken: string) {
  const pool = getPool();
  const id = crypto.randomUUID();
  const tokenHash = bcrypt.hashSync(rawToken, 12);
  const now = new Date().toISOString();

  await pool.query(
    "INSERT INTO api_tokens (id, token_hash, name, created_at) VALUES ($1, $2, $3, $4)",
    [id, tokenHash, name, now]
  );

  return { id, name, created_at: now };
}

export async function verifyApiToken(rawToken: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query("SELECT token_hash FROM api_tokens");

  return res.rows.some((row: any) => bcrypt.compareSync(rawToken, row.token_hash));
}
