import { useMemo } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

import { useAuth } from "./providers/AuthProvider";
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import StatusPage from "./pages/Status/StatusPage";
import GoalsPage from "./pages/Goals/GoalsPage";
import TransactionsPage from "./pages/Transactions/TransactionsPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import AppLayout from "./components/AppLayout";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const protectedRoutes = useMemo(
    () => (
      <AppLayout>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
    ),
    []
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/*" element={<RequireAuth>{protectedRoutes}</RequireAuth>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
