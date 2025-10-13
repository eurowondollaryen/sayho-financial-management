import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { CssBaseline, PaletteMode, ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material";

type ThemeMode = "light" | "dark";

interface ThemePreferenceContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "theme_mode";

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

function buildTheme(mode: ThemeMode) {
  if (mode === "dark") {
    return createTheme({
      palette: {
        mode: "dark" as PaletteMode,
        primary: { main: "#90caf9" },
        secondary: { main: "#66bb6a" },
        background: {
          default: "#101418",
          paper: "#1a1f24"
        },
        text: {
          primary: "#e0e6ed",
          secondary: "#a7b4c2"
        }
      }
    });
  }

  return createTheme({
      palette: {
        mode: "light" as PaletteMode,
      primary: { main: "#1976d2" },
      secondary: { main: "#00a86b" },
      background: {
        default: "#fafafa",
        paper: "#ffffff"
      },
      text: {
        primary: "#1f2933",
        secondary: "#52606d"
      }
    }
  });
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      mode,
      setMode
    }),
    [mode, setMode]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error("useThemePreference must be used within ThemePreferenceProvider");
  }
  return ctx;
}
