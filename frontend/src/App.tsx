import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ReactNode } from "react";

import { AuthProvider } from "./providers/AuthProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { ThemePreferenceProvider, useThemePreference } from "./providers/ThemePreferenceProvider";
import { RootNavigator } from "./navigation/RootNavigator";

function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ThemePreferenceProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemePreferenceProvider>
    </LanguageProvider>
  );
}

function NavigationHost() {
  const { navigationTheme, isDark } = useThemePreference();

  return (
    <>
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function AppRoot() {
  return (
    <Providers>
      <NavigationHost />
    </Providers>
  );
}
