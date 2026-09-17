export type CredentialType =
  | "username_password"
  | "email_password"
  | "api_key"
  | "token"
  | "other";

export interface Credential {
  id: string;
  platform: string;
  credential_type: CredentialType;
  username: string | null;
  email: string | null;
  password: string;
  description: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CredentialRow {
  id: string;
  platform: string;
  credential_type: CredentialType;
  username: string | null;
  email: string | null;
  password_encrypted: string;
  description: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CredentialInput {
  platform: string;
  credential_type: CredentialType;
  username?: string;
  email?: string;
  password: string;
  description?: string;
  website_url?: string;
}

export interface PlatformOption {
  id: string;
  label: string;
  color: string;
}
