"use client";

import { useTheme } from "@/components/theme-provider";
import GradientWaves from "@/components/ui/gradient-waves";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0">
        <GradientWaves
          horizonColor={isDark ? "#020617" : "#f8fafc"}
          waveColor={isDark ? "#475569" : "#cbd5e1"}
          crestColor={isDark ? "#94a3b8" : "#ffffff"}
          speed={0.3}
          amplitude={2}
          waveScale={0.6}
          waveRatio={0.9}
          swell={30}
          turbulence={15}
          brightness={1}
          opacity={0.45}
          detail="low"
          mouseInteraction={false}
          grain
          grainIntensity={0.03}
        />
      </div>
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}
