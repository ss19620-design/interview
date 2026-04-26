"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeToggle() {
  // Always start with "light" on server to avoid hydration mismatch,
  // then sync to the real value in useEffect.
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const real = getStoredTheme();
    setTheme(real);
    applyTheme(real);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    window.localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Avoid flash of wrong label before hydration
  if (!mounted) {
    return (
      <button
        type="button"
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        Dark
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
