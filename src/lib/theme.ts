export type Theme = "light" | "dark";

export const THEME_COOKIE = "theme";

export function getStoredTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
  return match && match[1] === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
}
