"use client";

import { BiLogoHeroku } from "react-icons/bi";
import {
  FaAmazon,
  FaAws,
  FaKey,
  FaLinkedin,
  FaMicrosoft,
  FaSlack,
  FaYahoo,
} from "react-icons/fa";
import {
  SiApple,
  SiBitwarden,
  SiCloudflare,
  SiDigitalocean,
  SiDiscord,
  SiDocker,
  SiDropbox,
  SiFacebook,
  SiFigma,
  SiClaude,
  SiGithub,
  SiGitlab,
  SiGmail,
  SiGodaddy,
  SiGoogle,
  SiHostinger,
  SiInstagram,
  SiLastpass,
  SiMongodb,
  SiMysql,
  SiNetflix,
  SiNotion,
  SiPaypal,
  SiPostgresql,
  SiProtonmail,
  SiRedis,
  SiShopify,
  SiSpotify,
  SiStripe,
  SiThreads,
  SiVercel,
  SiWordpress,
  SiX,
} from "react-icons/si";
import { getPlatform, isOtherPlatform } from "@/lib/platforms";

type IconComponent = React.ComponentType<{ className?: string }>;

const ICON_MAP: Record<string, IconComponent> = {
  google: SiGoogle,
  github: SiGithub,
  gitlab: SiGitlab,
  microsoft: FaMicrosoft,
  apple: SiApple,
  amazon: FaAmazon,
  aws: FaAws,
  azure: FaMicrosoft,
  facebook: SiFacebook,
  instagram: SiInstagram,
  twitter: SiX,
  linkedin: FaLinkedin,
  threads: SiThreads,
  discord: SiDiscord,
  slack: FaSlack,
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
  heroku: BiLogoHeroku,
  mongodb: SiMongodb,
  postgresql: SiPostgresql,
  mysql: SiMysql,
  redis: SiRedis,
  wordpress: SiWordpress,
  shopify: SiShopify,
  gmail: SiGmail,
  outlook: FaMicrosoft,
  yahoo: FaYahoo,
  protonmail: SiProtonmail,
  bitwarden: SiBitwarden,
  "1password": FaKey,
  lastpass: SiLastpass,
  hostinger: SiHostinger,
  godaddy: SiGodaddy,
  claude: SiClaude,
  other: FaKey,
  custom: FaKey,
};

interface PlatformIconProps {
  platform: string;
  customLabel?: string | null;
  size?: "sm" | "md" | "lg";
}

export default function PlatformIcon({
  platform,
  customLabel,
  size = "md",
}: PlatformIconProps) {
  const info = getPlatform(platform);
  const Icon = ICON_MAP[platform] || FaKey;
  const otherInitial = customLabel?.trim().charAt(0).toUpperCase();

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-slate-900/10 dark:ring-white/10`}
      style={{ backgroundColor: `${info.color}18`, color: info.color }}
      title={customLabel?.trim() || info.label}
    >
      {isOtherPlatform(platform) && otherInitial ? (
        <span className="text-sm font-bold">{otherInitial}</span>
      ) : (
        <Icon className={iconSize} />
      )}
    </div>
  );
}
