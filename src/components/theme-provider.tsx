"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { applyTheme, type Theme } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
