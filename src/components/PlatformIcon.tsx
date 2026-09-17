"use client";

import {
  SiAmazon,
  SiApple,
  SiAzuredevops,
  SiBitwarden,
  SiCloudflare,
  SiDigitalocean,
  SiDiscord,
  SiDocker,
  SiDropbox,
  SiFacebook,
  SiFigma,
  SiGithub,
  SiGitlab,
  SiGmail,
  SiGoogle,
  SiHeroku,
  SiInstagram,
  SiLastpass,
  SiLinkedin,
  SiMongodb,
  SiMysql,
  SiNetflix,
  SiNotion,
  SiOnepassword,
  SiOutlook,
  SiPaypal,
  SiPostgresql,
  SiProtonmail,
  SiRedis,
  SiShopify,
  SiSlack,
  SiSpotify,
  SiStripe,
  SiVercel,
  SiWordpress,
  SiX,
  SiYahoo,
} from "react-icons/si";
import { FaAws, FaKey } from "react-icons/fa";
import { getPlatform } from "@/lib/platforms";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  google: SiGoogle,
  github: SiGithub,
  gitlab: SiGitlab,
  microsoft: SiOutlook,
  apple: SiApple,
  amazon: SiAmazon,
  aws: FaAws,
  azure: SiAzuredevops,
  facebook: SiFacebook,
  instagram: SiInstagram,
  twitter: SiX,
  linkedin: SiLinkedin,
  discord: SiDiscord,
  slack: SiSlack,
  notion: SiNotion,
  figma: SiFigma,
  stripe: SiStripe,
  paypal: SiPaypal,
  netflix: SiNetflix,
  spotify: SiSpotify,
  dropbox: SiDropbox,
  docker: SiDocker,
  vercel: SiVercel,
  cloudflare: SiCloudflare,
  digitalocean: SiDigitalocean,
  heroku: SiHeroku,
  mongodb: SiMongodb,
  postgresql: SiPostgresql,
  mysql: SiMysql,
  redis: SiRedis,
  wordpress: SiWordpress,
  shopify: SiShopify,
  gmail: SiGmail,
  outlook: SiOutlook,
  yahoo: SiYahoo,
  protonmail: SiProtonmail,
  bitwarden: SiBitwarden,
  "1password": SiOnepassword,
  lastpass: SiLastpass,
  custom: FaKey,
};

interface PlatformIconProps {
  platform: string;
  size?: "sm" | "md" | "lg";
}

export default function PlatformIcon({ platform, size = "md" }: PlatformIconProps) {
  const info = getPlatform(platform);
  const Icon = ICON_MAP[platform] || FaKey;

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-white/10`}
      style={{ backgroundColor: `${info.color}18`, color: info.color }}
      title={info.label}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"} />
    </div>
  );
}
