import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchCurrentUser, login, signup, type User } from "../api/auth";
import { registerTokenProvider } from "../api/client";
import { registerUnauthorizedHandler } from "../api/interceptors";
import { useTranslation } from "./LanguageProvider";
import { useThemePreference } from "./ThemePreferenceProvider";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  signupAndLogin: (email: string, name: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const tokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { setMode } = useThemePreference();
  const TOKEN_KEY = "access_token";

  useEffect(() => {
    registerTokenProvider(async () => tokenRef.current);
    return () => {
      registerTokenProvider(null);
    };
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      tokenRef.current = null;
      void AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
      Alert.alert(t("auth.login_required"));
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, [t]);

  useEffect(() => {
    let canceled = false;

    async function bootstrap() {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (!stored) {
          if (!canceled) {
            setLoading(false);
          }
          return;
        }
        tokenRef.current = stored;
        const current = await fetchCurrentUser();
        if (!canceled) {
          setUser(current);
        }
      } catch {
        tokenRef.current = null;
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      canceled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    async function loginWithCredentials(username: string, password: string) {
      const { access_token } = await login({ username, password });
      tokenRef.current = access_token;
      await AsyncStorage.setItem(TOKEN_KEY, access_token);
      const current = await fetchCurrentUser();
      setUser(current);
    }

    async function signupAndLogin(email: string, name: string, password: string) {
      await signup({ email, name, password });
      await loginWithCredentials(email, password);
    }

    async function refreshUser() {
      const current = await fetchCurrentUser();
      setUser(current);
    }

    function logout() {
      tokenRef.current = null;
      void AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
    }

    function assignUser(next: User) {
      setUser(next);
    }

    return {
      user,
      loading,
      loginWithCredentials,
      signupAndLogin,
      refreshUser,
      setUser: assignUser,
      logout
    };
  }, [user, loading]);

  useEffect(() => {
    if (user?.theme_preference === "dark" || user?.theme_preference === "light") {
      setMode(user.theme_preference);
    } else if (user) {
      setMode("light");
    }
  }, [user, user?.theme_preference, setMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
