import { useMemo, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";

import { useAuth } from "../../providers/AuthProvider";
import { useTranslation } from "../../providers/LanguageProvider";

type FormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email({ message: t("validation.email") }),
        password: z.string().min(8, { message: t("validation.password_min") })
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await loginWithCredentials(data.email, data.password);
      navigate("/dashboard");
    } catch (err) {
      setError(t("login.error"));
      console.error(err);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" gutterBottom>
          {t("login.title")}
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Box component="form" display="grid" gap={2} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label={t("login.email")}
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label={t("login.password")}
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? t("login.submitting") : t("login.submit")}
          </Button>
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t("login.signup_prompt")} {" "}
          <Link component={RouterLink} to="/signup">
            {t("login.signup_link")}
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
