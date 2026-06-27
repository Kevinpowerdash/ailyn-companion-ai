import { useState, useEffect, createContext, useContext } from "react";

export type ThemeName = "aurora-pearl" | "ocean-sereno" | "twilight-violet";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "aurora-pearl", setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

const themes: Record<ThemeName, Record<string, string>> = {
  // Default: luminous pearl + soft gold. Light, airy, "lumina"
  "aurora-pearl": {
    "--sanctuary-deep": "#f6f1e8",
    "--sanctuary-moss": "#ffffff",
    "--sanctuary-sage": "#c9a24a",
    "--sanctuary-bone": "#1a1714",
    "--sanctuary-muted": "#7a6f5c",
    "--sanctuary-terracotta": "#d4a574",
    "--particle-color": "232, 210, 160",
  },
  "ocean-sereno": {
    "--sanctuary-deep": "#eaf2f6",
    "--sanctuary-moss": "#ffffff",
    "--sanctuary-sage": "#3a8fb0",
    "--sanctuary-bone": "#0d2235",
    "--sanctuary-muted": "#5a7a8c",
    "--sanctuary-terracotta": "#d49a7b",
    "--particle-color": "130, 195, 220",
  },
  "twilight-violet": {
    "--sanctuary-deep": "#1a1525",
    "--sanctuary-moss": "#251e34",
    "--sanctuary-sage": "#d4a5ff",
    "--sanctuary-bone": "#faf4f0",
    "--sanctuary-muted": "#9a8aab",
    "--sanctuary-terracotta": "#c98989",
    "--particle-color": "212, 165, 255",
  },
};

const themeLabels: Record<ThemeName, { label: string; emoji: string; preview: string }> = {
  "aurora-pearl": { label: "Aurora", emoji: "✦", preview: "#c9a24a" },
  "ocean-sereno": { label: "Sereno", emoji: "❍", preview: "#3a8fb0" },
  "twilight-violet": { label: "Crepúsculo", emoji: "◐", preview: "#d4a5ff" },
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("lumina_theme") as ThemeName | null;
    if (saved && themes[saved]) return saved;
    return "aurora-pearl";
  });

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem("lumina_theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;
    const vars = themes[theme];
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
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
      <p className="text-[var(--sanctuary-muted)] text-xs font-medium uppercase tracking-wider">Atmósfera</p>
      <div className="flex gap-1.5">
        {(Object.keys(themes) as ThemeName[]).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-body transition-all duration-500 ${
              theme === t ? "border shadow-sm" : "border border-transparent opacity-60 hover:opacity-90"
            }`}
            style={{
              background: theme === t ? `${themeLabels[t].preview}25` : "transparent",
              color: theme === t ? "var(--sanctuary-bone)" : "var(--sanctuary-muted)",
              borderColor: theme === t ? `${themeLabels[t].preview}55` : "transparent",
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
