import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Credential Vault — Secure Password Manager",
  description:
    "A beautiful, secure portal to store and manage all your credentials.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const theme: Theme = cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
