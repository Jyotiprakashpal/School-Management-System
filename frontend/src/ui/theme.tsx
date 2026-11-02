import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "violet" | "teal" | "blue" | "dark";
export type DensityName = "comfortable" | "compact";

type ThemeContextValue = {
  density: DensityName;
  setDensity: (density: DensityName) => void;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<DensityName>(() => {
    if (typeof window === "undefined") return "comfortable";
    return window.localStorage.getItem("pal-density") === "compact" ? "compact" : "comfortable";
  });
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "teal";
    const saved = window.localStorage.getItem("pal-theme");
    return saved === "violet" || saved === "blue" || saved === "teal" || saved === "dark" ? saved : "teal";
  });

  const setDensity = (nextDensity: DensityName) => {
    setDensityState(nextDensity);
    window.localStorage.setItem("pal-density", nextDensity);
  };

  const setTheme = (nextTheme: ThemeName) => {
    setThemeState(nextTheme);
    window.localStorage.setItem("pal-theme", nextTheme);
  };

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <ThemeContext.Provider value={{ density, setDensity, theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const themes: { name: ThemeName; label: string; color: string }[] = [
    { name: "violet", label: "Violet theme", color: "bg-fuchsia-600" },
    { name: "teal", label: "Teal theme", color: "bg-teal-600" },
    { name: "blue", label: "Blue theme", color: "bg-blue-700" },
    { name: "dark", label: "Dark mode", color: "theme-dot-dark" },
  ];

  return <div className="theme-picker" aria-label="Choose application color theme">
    {themes.map((item) => <button
      key={item.name}
      type="button"
      title={item.label}
      aria-label={item.label}
      aria-pressed={theme === item.name}
      onClick={() => setTheme(item.name)}
      className={`theme-dot ${item.color} ${theme === item.name ? "theme-dot-active" : ""}`}
    >
      {item.name === "dark" && <svg aria-hidden="true" className="m-auto size-3.5 text-slate-100 sm:size-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 15.2A8.7 8.7 0 0 1 8.8 3.5 9 9 0 1 0 20.5 15.2Z" /></svg>}
    </button>)}
  </div>;
}
