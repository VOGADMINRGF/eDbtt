"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function ThemeClassSync() {
  const { theme, systemTheme } = useTheme();

  React.useEffect(() => {
    const resolved = (theme === "system" ? systemTheme : theme) ?? "dark";
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.classList.toggle("light", resolved === "light");
  }, [theme, systemTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeClassSync />
      {children}
    </NextThemesProvider>
  );
}
