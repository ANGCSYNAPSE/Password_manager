import { Pool } from "pg";
import bcrypt from "bcryptjs";
import type { CredentialInput, CredentialRow, CredentialType } from "./types";
import { decrypt, encrypt } from "./crypto";

declare global {
  // eslint-disable-next-line no-var
  var __vaultDbPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_UwcxeE8oD5tH@ep-late-cloud-aq81lis3-pooler.c-8.us-east-1.aws.neon.tech/cred_vault?sslmode=require&channel_binding=require';

function createPool(): Pool {
  const pool = new Pool({
    connectionString,
  });

  return pool;
}

export function getPool(): Pool {
  if (!global.__vaultDbPool) {
    global.__vaultDbPool = createPool();
  }
  return global.__vaultDbPool;
}

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  const pool = getPool();
  const res = await pool.query("SELECT password_hash FROM admin WHERE username = $1", [username]);
  
  if (res.rows.length === 0) {
      if (username === (process.env.ADMIN_USERNAME || "admin")) {
          const defaultPassword = process.env.ADMIN_PASSWORD || "changeme123";
          if (password === defaultPassword) {
            const passwordHash = bcrypt.hashSync(defaultPassword, 12);
            await pool.query("INSERT INTO admin (username, password_hash) VALUES ($1, $2)", [username, passwordHash]);
            return true;
          }
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
}) {
  const pool = getPool();
  let query = "SELECT * FROM credentials WHERE 1=1";
  const params: any[] = [];
  let paramIndex = 1;

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
  const pool = getPool();
  const res = await pool.query("SELECT * FROM credentials WHERE id = $1", [id]);
  return res.rows.length > 0 ? rowToCredential(res.rows[0]) : null;
}

export async function createCredential(input: CredentialInput) {
  const pool = getPool();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { platform, custom_platform_name } = normalizeCredentialInput(input);

  await pool.query(
    `INSERT INTO credentials
     (id, platform, custom_platform_name, credential_type, username, email, password_encrypted, description, website_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
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
  const pool = getPool();
  const now = new Date().toISOString();
  const { platform, custom_platform_name } = normalizeCredentialInput(input);

  await pool.query(
    `UPDATE credentials SET
      platform = $1,
      custom_platform_name = $2,
      credential_type = $3,
      username = $4,
      email = $5,
      password_encrypted = $6,
      description = $7,
      website_url = $8,
      updated_at = $9
     WHERE id = $10`,
    [
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
  const pool = getPool();
  await pool.query("DELETE FROM credentials WHERE id = $1", [id]);
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
