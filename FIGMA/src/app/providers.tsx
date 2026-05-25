"use client";

import { useEffect } from "react";
import { Toaster } from "./components/ui/sonner";
import { useThemeStore } from "@/store/theme-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
  }, [theme]);

  return (
    <>
      {children}
      <Toaster richColors position="top-right" theme={theme} />
    </>
  );
}
