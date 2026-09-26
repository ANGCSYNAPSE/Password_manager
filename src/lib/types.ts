export type CredentialType =
  | "username_password"
  | "email_password"
  | "api_key"
  | "token"
  | "other";

export interface Credential {
  id: string;
  file_id: string | null;
  platform: string;
  custom_platform_name: string | null;
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
  file_id: string | null;
  platform: string;
  custom_platform_name: string | null;
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
  file_id?: string | null;
  platform: string;
  custom_platform_name?: string;
  credential_type: CredentialType;
  username?: string;
  email?: string;
  password: string;
  description?: string;
  website_url?: string;
}

export interface VaultFile {
  id: string;
  name: string;
  description: string | null;
  credential_count: number;
  created_at: string;
  updated_at: string;
}

export interface VaultFileInput {
  name: string;
  description?: string;
}

export interface PlatformOption {
  id: string;
  label: string;
  color: string;
  category: "social" | "tools" | "email" | "websites";
}
