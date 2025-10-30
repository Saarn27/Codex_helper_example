"use client";

import "../styles/globals.css";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const THEME_STORAGE_KEY = "ai-chat-theme";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme = stored ?? getSystemTheme();
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""}>
      <body className="bg-background text-foreground min-h-screen">
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
              <h1 className="text-lg font-semibold">AI Chat Playground</h1>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium shadow-sm transition hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? "Switch to light" : "Switch to dark"}
              </button>
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
