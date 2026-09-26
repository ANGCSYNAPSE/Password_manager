import type { PlatformOption } from "./types";

export const PLATFORMS: PlatformOption[] = [
  { id: "google", label: "Google", color: "#4285F4", category: "tools" },
  { id: "github", label: "GitHub", color: "#181717", category: "tools" },
  { id: "gitlab", label: "GitLab", color: "#FC6D26", category: "tools" },
  { id: "microsoft", label: "Microsoft", color: "#0078D4", category: "tools" },
  { id: "apple", label: "Apple", color: "#555555", category: "tools" },
  { id: "amazon", label: "Amazon", color: "#FF9900", category: "websites" },
  { id: "aws", label: "AWS", color: "#232F3E", category: "tools" },
  { id: "azure", label: "Azure", color: "#0078D4", category: "tools" },
  { id: "facebook", label: "Facebook", color: "#1877F2", category: "social" },
  { id: "instagram", label: "Instagram", color: "#E4405F", category: "social" },
  { id: "twitter", label: "Twitter / X", color: "#1DA1F2", category: "social" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", category: "social" },
  { id: "threads", label: "Threads", color: "#000000", category: "social" },
  { id: "discord", label: "Discord", color: "#5865F2", category: "social" },
  { id: "slack", label: "Slack", color: "#4A154B", category: "tools" },
  { id: "notion", label: "Notion", color: "#000000", category: "tools" },
  { id: "figma", label: "Figma", color: "#F24E1E", category: "tools" },
  { id: "stripe", label: "Stripe", color: "#635BFF", category: "tools" },
  { id: "paypal", label: "PayPal", color: "#003087", category: "websites" },
  { id: "netflix", label: "Netflix", color: "#E50914", category: "websites" },
  { id: "spotify", label: "Spotify", color: "#1DB954", category: "websites" },
  { id: "dropbox", label: "Dropbox", color: "#0061FF", category: "tools" },
  { id: "docker", label: "Docker", color: "#2496ED", category: "tools" },
  { id: "vercel", label: "Vercel", color: "#000000", category: "tools" },
  { id: "cloudflare", label: "Cloudflare", color: "#F38020", category: "tools" },
  { id: "digitalocean", label: "DigitalOcean", color: "#0080FF", category: "tools" },
  { id: "heroku", label: "Heroku", color: "#430098", category: "tools" },
  { id: "mongodb", label: "MongoDB", color: "#47A248", category: "tools" },
  { id: "postgresql", label: "PostgreSQL", color: "#4169E1", category: "tools" },
  { id: "mysql", label: "MySQL", color: "#4479A1", category: "tools" },
  { id: "redis", label: "Redis", color: "#DC382D", category: "tools" },
  { id: "wordpress", label: "WordPress", color: "#21759B", category: "websites" },
  { id: "shopify", label: "Shopify", color: "#96BF48", category: "websites" },
  { id: "gmail", label: "Gmail", color: "#EA4335", category: "email" },
  { id: "outlook", label: "Outlook", color: "#0078D4", category: "email" },
  { id: "yahoo", label: "Yahoo", color: "#6001D2", category: "email" },
  { id: "protonmail", label: "Proton Mail", color: "#6D4AFF", category: "email" },
  { id: "bitwarden", label: "Bitwarden", color: "#175DDC", category: "tools" },
  { id: "1password", label: "1Password", color: "#0094F5", category: "tools" },
  { id: "lastpass", label: "LastPass", color: "#D32D27", category: "tools" },
  { id: "hostinger", label: "Hostinger", color: "#673DE6", category: "websites" },
  { id: "godaddy", label: "GoDaddy", color: "#1BDBDB", category: "websites" },
  { id: "claude", label: "Claude AI", color: "#D97757", category: "tools" },
  { id: "other", label: "Other", color: "#6366F1", category: "websites" },
];

export const OTHER_PLATFORM_ID = "other";

// Seeded into every newly created company file so common accounts are
// ready to fill in right away.
export const DEFAULT_FILE_PLATFORMS: {
  platform: string;
  credential_type: "username_password" | "email_password";
}[] = [
  { platform: "gmail", credential_type: "email_password" },
  { platform: "twitter", credential_type: "username_password" },
  { platform: "linkedin", credential_type: "username_password" },
  { platform: "facebook", credential_type: "username_password" },
  { platform: "instagram", credential_type: "username_password" },
  { platform: "threads", credential_type: "username_password" },
];

export const CREDENTIAL_TYPES = [
  { id: "username_password", label: "Username + Password" },
  { id: "email_password", label: "Email + Password" },
  { id: "api_key", label: "API Key" },
  { id: "token", label: "Token / Secret" },
  { id: "other", label: "Other" },
] as const;

export function normalizePlatformId(id: string): string {
  return id === "custom" ? OTHER_PLATFORM_ID : id;
}

export function isOtherPlatform(id: string): boolean {
  const normalized = normalizePlatformId(id);
  return normalized === OTHER_PLATFORM_ID;
}

export function getPlatform(id: string): PlatformOption {
  const normalized = normalizePlatformId(id);
  return (
    PLATFORMS.find((p) => p.id === normalized) ??
    PLATFORMS.find((p) => p.id === OTHER_PLATFORM_ID)!
  );
}

export function getPlatformDisplayName(
  platformId: string,
  customPlatformName?: string | null,
): string {
  if (isOtherPlatform(platformId)) {
    const name = customPlatformName?.trim();
    return name || "Other";
  }
  return getPlatform(platformId).label;
}
