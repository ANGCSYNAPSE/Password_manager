import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { mkdirSync } from "fs";
import path from "path";
import type { CredentialInput, CredentialRow, CredentialType } from "./types";
import { decrypt, encrypt } from "./crypto";

const dataDir = path.join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "vault.db");

declare global {
  // eslint-disable-next-line no-var
  var __vaultDb: Database.Database | undefined;
}

function createDb(): Database.Database {
  const database = new Database(dbPath);
  database.pragma("journal_mode = WAL");

  database.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      credential_type TEXT NOT NULL,
      username TEXT,
      email TEXT,
      password_encrypted TEXT NOT NULL,
      description TEXT,
      website_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const adminCount = database
    .prepare("SELECT COUNT(*) as count FROM admin")
    .get() as { count: number };

  if (adminCount.count === 0) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "changeme123";
    const passwordHash = bcrypt.hashSync(password, 12);
    database
      .prepare("INSERT INTO admin (username, password_hash) VALUES (?, ?)")
      .run(username, passwordHash);
  }

  return database;
}

export function getDb(): Database.Database {
  if (!global.__vaultDb) {
    global.__vaultDb = createDb();
  }
  return global.__vaultDb;
}

export function verifyAdmin(username: string, password: string): boolean {
  const row = getDb()
    .prepare("SELECT password_hash FROM admin WHERE username = ?")
    .get(username) as { password_hash: string } | undefined;

  if (!row) return false;
  return bcrypt.compareSync(password, row.password_hash);
}

export function rowToCredential(row: CredentialRow) {
  return {
    id: row.id,
    platform: row.platform,
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

export function listCredentials(filters?: {
  platform?: string;
  credential_type?: string;
  search?: string;
}) {
  let query = "SELECT * FROM credentials WHERE 1=1";
  const params: string[] = [];

  if (filters?.platform && filters.platform !== "all") {
    query += " AND platform = ?";
    params.push(filters.platform);
  }

  if (filters?.credential_type && filters.credential_type !== "all") {
    query += " AND credential_type = ?";
    params.push(filters.credential_type);
  }

  if (filters?.search) {
    query += ` AND (
      platform LIKE ? OR
      username LIKE ? OR
      email LIKE ? OR
      description LIKE ?
    )`;
    const term = `%${filters.search}%`;
    params.push(term, term, term, term);
  }

  query += " ORDER BY updated_at DESC";

  const rows = getDb().prepare(query).all(...params) as CredentialRow[];
  return rows.map(rowToCredential);
}

export function getCredential(id: string) {
  const row = getDb()
    .prepare("SELECT * FROM credentials WHERE id = ?")
    .get(id) as CredentialRow | undefined;
  return row ? rowToCredential(row) : null;
}

export function createCredential(input: CredentialInput) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  getDb()
    .prepare(
      `INSERT INTO credentials
       (id, platform, credential_type, username, email, password_encrypted, description, website_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.platform,
      input.credential_type,
      input.username || null,
      input.email || null,
      encrypt(input.password),
      input.description || null,
      input.website_url || null,
      now,
      now,
    );

  return getCredential(id)!;
}

export function updateCredential(id: string, input: CredentialInput) {
  const now = new Date().toISOString();

  getDb()
    .prepare(
      `UPDATE credentials SET
        platform = ?,
        credential_type = ?,
        username = ?,
        email = ?,
        password_encrypted = ?,
        description = ?,
        website_url = ?,
        updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.platform,
      input.credential_type,
      input.username || null,
      input.email || null,
      encrypt(input.password),
      input.description || null,
      input.website_url || null,
      now,
      id,
    );

  return getCredential(id);
}

export function deleteCredential(id: string) {
  getDb().prepare("DELETE FROM credentials WHERE id = ?").run(id);
}

export function createApiToken(name: string, rawToken: string) {
  const id = crypto.randomUUID();
  const tokenHash = bcrypt.hashSync(rawToken, 12);
  const now = new Date().toISOString();

  getDb()
    .prepare(
      "INSERT INTO api_tokens (id, token_hash, name, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(id, tokenHash, name, now);

  return { id, name, created_at: now };
}

export function verifyApiToken(rawToken: string): boolean {
  const rows = getDb()
    .prepare("SELECT token_hash FROM api_tokens")
    .all() as { token_hash: string }[];

  return rows.some((row) => bcrypt.compareSync(rawToken, row.token_hash));
}
