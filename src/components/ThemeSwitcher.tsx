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
    "--particle-color": "168, 201, 137",
  },
  "calm-ocean": {
    "--sanctuary-deep": "#0a1520",
    "--sanctuary-moss": "#0f2235",
    "--sanctuary-sage": "#5fb3d4",
    "--sanctuary-bone": "#F0F6FA",
    "--sanctuary-muted": "#6a93ab",
    "--sanctuary-terracotta": "#d49a7b",
    "--particle-color": "95, 179, 212",
  },
  "soft-dawn": {
    "--sanctuary-deep": "#1a1520",
    "--sanctuary-moss": "#261e30",
    "--sanctuary-sage": "#d4a5ff",
    "--sanctuary-bone": "#FAF4F0",
    "--sanctuary-muted": "#ab8a6a",
    "--sanctuary-terracotta": "#c98989",
    "--particle-color": "212, 165, 255",
  },
};

const themeLabels: Record<ThemeName, { label: string; emoji: string; preview: string }> = {
  "deep-forest": { label: "Bosque", emoji: "🌿", preview: "#a8c989" },
  "calm-ocean": { label: "Océano", emoji: "🌊", preview: "#5fb3d4" },
  "soft-dawn": { label: "Aurora", emoji: "🌅", preview: "#d4a5ff" },
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
    // Also update body background immediately
    document.body.style.background = vars["--sanctuary-deep"];
    document.body.style.color = vars["--sanctuary-bone"];
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
      <p className="text-[var(--sanctuary-muted)] text-xs font-medium uppercase tracking-wider">Tema</p>
      <div className="flex gap-1.5">
        {(Object.keys(themes) as ThemeName[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body transition-all duration-500 ${
              theme === t
                ? "border shadow-sm"
                : "border border-transparent opacity-60 hover:opacity-90"
            }`}
            style={{
              background: theme === t ? `${themeLabels[t].preview}20` : "transparent",
              color: theme === t ? "var(--sanctuary-bone)" : "var(--sanctuary-muted)",
              borderColor: theme === t ? `${themeLabels[t].preview}40` : "transparent",
            }}
          >
            <span>{themeLabels[t].emoji}</span>
            <span>{themeLabels[t].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
