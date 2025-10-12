import { ReactNode, useMemo } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";

import { useAuth } from "../providers/AuthProvider";
import { useLanguage, useTranslation } from "../providers/LanguageProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = useMemo(
    () => [
      { label: t("nav.dashboard"), path: "/dashboard" },
      { label: t("nav.status"), path: "/status" },
      { label: t("nav.goals"), path: "/goals" },
      { label: t("nav.transactions"), path: "/transactions" },
      { label: t("nav.settings"), path: "/settings" }
    ],
    [t]
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLanguageChange = (_: unknown, value: "ko" | "en" | null) => {
    if (value) {
      setLanguage(value);
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t("app.title")}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mr: 4 }}>
            {links.map((item) => (
              <Link
                key={item.path}
                component={RouterLink}
                to={item.path}
                color="inherit"
                underline={location.pathname === item.path ? "always" : "hover"}
              >
                {item.label}
              </Link>
            ))}
          </Stack>
          <Box sx={{ display: "flex", alignItems: "center", mr: 3 }}>
            <Typography variant="body2" sx={{ mr: 1, color: "inherit" }}>
              {t("language.label")}:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={language}
              exclusive
              onChange={handleLanguageChange}
              sx={{
                "& .MuiToggleButton-root": {
                  color: "inherit",
                  borderColor: "rgba(255,255,255,0.3)",
                  paddingInline: 1.5
                },
                "& .Mui-selected": {
                  backgroundColor: "rgba(255,255,255,0.9)",
                  color: "primary.main"
                }
              }}
            >
              <ToggleButton value="ko">{t("language.korean")}</ToggleButton>
              <ToggleButton value="en">{t("language.english")}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Typography variant="subtitle2" sx={{ mr: 2 }}>
            {user?.name}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            {t("app.logout")}
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
