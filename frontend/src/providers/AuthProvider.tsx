import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, login, signup, type User } from "../api/auth";
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { setMode } = useThemePreference();

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      localStorage.removeItem("access_token");
      setUser(null);
      window.alert(t("auth.login_required"));
      window.location.href = "/login";
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, [t]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("access_token");
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    async function loginWithCredentials(username: string, password: string) {
      const { access_token } = await login({ username, password });
      localStorage.setItem("access_token", access_token);
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
      localStorage.removeItem("access_token");
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
