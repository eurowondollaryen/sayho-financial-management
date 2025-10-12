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
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";

import { useAuth } from "../../providers/AuthProvider";
import { useTranslation } from "../../providers/LanguageProvider";

type FormData = {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
};

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signupAndLogin } = useAuth();
  const { t } = useTranslation();

  const schema = useMemo(
    () =>
      z
        .object({
          email: z.string().email({ message: t("validation.email") }),
          name: z.string().min(2, { message: t("validation.name_min") }),
          password: z.string().min(8, { message: t("validation.password_min") }),
          confirmPassword: z.string().min(8, { message: t("validation.password_min") })
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: t("error.password_mismatch"),
          path: ["confirmPassword"]
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await signupAndLogin(data.email, data.name, data.password);
      navigate("/dashboard");
    } catch (err) {
      setError(t("signup.error"));
      console.error(err);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" gutterBottom>
          {t("signup.title")}
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Box component="form" display="grid" gap={2} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label={t("signup.email")}
            type="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label={t("signup.name")}
            error={!!errors.name}
            helperText={errors.name?.message}
            {...register("name")}
          />
          <TextField
            label={t("signup.password")}
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register("password")}
          />
          <TextField
            label={t("signup.confirm_password")}
            type="password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? t("signup.submitting") : t("signup.submit")}
          </Button>
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t("signup.login_prompt")}{" "}
          <Link component={RouterLink} to="/login">
            {t("signup.login_link")}
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
