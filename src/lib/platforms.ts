import type { PlatformOption } from "./types";

export const PLATFORMS: PlatformOption[] = [
  { id: "google", label: "Google", color: "#4285F4" },
  { id: "github", label: "GitHub", color: "#181717" },
  { id: "gitlab", label: "GitLab", color: "#FC6D26" },
  { id: "microsoft", label: "Microsoft", color: "#0078D4" },
  { id: "apple", label: "Apple", color: "#555555" },
  { id: "amazon", label: "Amazon", color: "#FF9900" },
  { id: "aws", label: "AWS", color: "#232F3E" },
  { id: "azure", label: "Azure", color: "#0078D4" },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "instagram", label: "Instagram", color: "#E4405F" },
  { id: "twitter", label: "Twitter / X", color: "#1DA1F2" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { id: "discord", label: "Discord", color: "#5865F2" },
  { id: "slack", label: "Slack", color: "#4A154B" },
  { id: "notion", label: "Notion", color: "#000000" },
  { id: "figma", label: "Figma", color: "#F24E1E" },
  { id: "stripe", label: "Stripe", color: "#635BFF" },
  { id: "paypal", label: "PayPal", color: "#003087" },
  { id: "netflix", label: "Netflix", color: "#E50914" },
  { id: "spotify", label: "Spotify", color: "#1DB954" },
  { id: "dropbox", label: "Dropbox", color: "#0061FF" },
  { id: "docker", label: "Docker", color: "#2496ED" },
  { id: "vercel", label: "Vercel", color: "#000000" },
  { id: "cloudflare", label: "Cloudflare", color: "#F38020" },
  { id: "digitalocean", label: "DigitalOcean", color: "#0080FF" },
  { id: "heroku", label: "Heroku", color: "#430098" },
  { id: "mongodb", label: "MongoDB", color: "#47A248" },
  { id: "postgresql", label: "PostgreSQL", color: "#4169E1" },
  { id: "mysql", label: "MySQL", color: "#4479A1" },
  { id: "redis", label: "Redis", color: "#DC382D" },
  { id: "wordpress", label: "WordPress", color: "#21759B" },
  { id: "shopify", label: "Shopify", color: "#96BF48" },
  { id: "gmail", label: "Gmail", color: "#EA4335" },
  { id: "outlook", label: "Outlook", color: "#0078D4" },
  { id: "yahoo", label: "Yahoo", color: "#6001D2" },
  { id: "protonmail", label: "Proton Mail", color: "#6D4AFF" },
  { id: "bitwarden", label: "Bitwarden", color: "#175DDC" },
  { id: "1password", label: "1Password", color: "#0094F5" },
  { id: "lastpass", label: "LastPass", color: "#D32D27" },
  { id: "custom", label: "Custom", color: "#6366F1" },
];

export const CREDENTIAL_TYPES = [
  { id: "username_password", label: "Username + Password" },
  { id: "email_password", label: "Email + Password" },
  { id: "api_key", label: "API Key" },
  { id: "token", label: "Token / Secret" },
  { id: "other", label: "Other" },
] as const;

export function getPlatform(id: string): PlatformOption {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[PLATFORMS.length - 1];
}
