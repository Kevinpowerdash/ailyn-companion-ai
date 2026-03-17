import { useState, useEffect, createContext, useContext } from "react";

export type ThemeName = "deep-forest" | "calm-ocean" | "soft-dawn";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "deep-forest", setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

const themes: Record<ThemeName, Record<string, string>> = {
  "deep-forest": {
    "--sanctuary-deep": "#0f1c1a",
    "--sanctuary-moss": "#142824",
    "--sanctuary-sage": "#a8c989",
    "--sanctuary-bone": "#FCFAF4",
    "--sanctuary-muted": "#7a9f7a",
    "--sanctuary-terracotta": "#c98989",
  },
  "calm-ocean": {
    "--sanctuary-deep": "#0a1520",
    "--sanctuary-moss": "#0f2235",
    "--sanctuary-sage": "#7bb8d4",
    "--sanctuary-bone": "#F0F6FA",
    "--sanctuary-muted": "#6a93ab",
    "--sanctuary-terracotta": "#d49a7b",
  },
  "soft-dawn": {
    "--sanctuary-deep": "#1a1520",
    "--sanctuary-moss": "#261e30",
    "--sanctuary-sage": "#d4a07b",
    "--sanctuary-bone": "#FAF4F0",
    "--sanctuary-muted": "#ab8a6a",
    "--sanctuary-terracotta": "#c98989",
  },
};

const themeLabels: Record<ThemeName, { label: string; emoji: string }> = {
  "deep-forest": { label: "Bosque", emoji: "🌿" },
  "calm-ocean": { label: "Océano", emoji: "🌊" },
  "soft-dawn": { label: "Aurora", emoji: "🌅" },
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem("ailyn_theme") as ThemeName) || "deep-forest";
  });

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem("ailyn_theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;
    const vars = themes[theme];
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const ThemeSwitcherUI = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <p className="text-sanctuary-muted text-xs font-medium uppercase tracking-wider">Tema</p>
      <div className="flex gap-1.5">
        {(Object.keys(themes) as ThemeName[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body transition-all duration-300 ${
              theme === t
                ? "bg-sanctuary-sage/20 text-sanctuary-bone border border-sanctuary-sage/30"
                : "text-sanctuary-muted/60 hover:text-sanctuary-bone/70 hover:bg-sanctuary-moss/40 border border-transparent"
            }`}
          >
            <span>{themeLabels[t].emoji}</span>
            <span>{themeLabels[t].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
