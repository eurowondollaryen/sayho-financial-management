import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, Theme } from "@react-navigation/native";
import {
  Appearance,
  type ColorSchemeName
} from "react-native";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  primary: string;
  secondary: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
}

interface ThemePreferenceContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  navigationTheme: Theme;
}

const STORAGE_KEY = "theme_mode";

const lightColors: ThemeColors = {
  background: "#f5f5f5",
  surface: "#ffffff",
  card: "#ffffff",
  primary: "#1976d2",
  secondary: "#00a86b",
  text: "#1f2933",
  muted: "#52606d",
  border: "#d0d7de",
  danger: "#d32f2f"
};

const darkColors: ThemeColors = {
  background: "#101418",
  surface: "#1a1f24",
  card: "#20262d",
  primary: "#90caf9",
  secondary: "#66bb6a",
  text: "#e0e6ed",
  muted: "#9aa7b6",
  border: "#2d3742",
  danger: "#f87171"
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

function buildNavigationTheme(mode: ThemeMode, colors: ThemeColors): Theme {
  const base = mode === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.danger
    }
  };
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const scheme: ColorSchemeName = Appearance.getColorScheme();
    return scheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") {
          setModeState(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const colors = useMemo(() => (mode === "dark" ? darkColors : lightColors), [mode]);

  const navigationTheme = useMemo(() => buildNavigationTheme(mode, colors), [mode, colors]);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      colors,
      setMode,
      toggleMode,
      navigationTheme
    }),
    [mode, colors, setMode, toggleMode, navigationTheme]
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error("useThemePreference must be used within ThemePreferenceProvider");
  }
  return ctx;
}
