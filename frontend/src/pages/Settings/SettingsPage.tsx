import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import { useAuth } from "../../providers/AuthProvider";
import { updateCurrentUser, updatePassword } from "../../api/users";
import { useTranslation } from "../../providers/LanguageProvider";

type ProfileForm = {
  name: string;
  theme_preference: "light" | "dark";
};

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const [profileStatus, setProfileStatus] = useState<"success" | "error" | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<"success" | "error" | null>(null);

  const profileSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: t("validation.name_min") }),
        theme_preference: z.enum(["light", "dark"])
      }),
    [t]
  );

  const passwordSchema = useMemo(
    () =>
      z
        .object({
          current_password: z.string().min(8, { message: t("validation.password_min") }),
          new_password: z.string().min(8, { message: t("validation.password_min") }),
          confirm_password: z.string().min(8, { message: t("validation.password_min") })
        })
        .refine((values) => values.new_password === values.confirm_password, {
          message: t("error.password_mismatch"),
          path: ["confirm_password"]
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      theme_preference: (user?.theme_preference as "light" | "dark") ?? "light"
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: ""
    }
  });

  const profileMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (data) => {
      setUser(data);
      setProfileStatus("success");
    },
    onError: () => setProfileStatus("error")
  });

  const passwordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      setPasswordStatus("success");
      resetPassword();
    },
    onError: () => setPasswordStatus("error")
  });

  const onSubmitProfile = handleSubmit(async (values) => {
    setProfileStatus(null);
    await profileMutation.mutateAsync(values);
    resetProfile(values);
  });

  const onSubmitPassword = handlePasswordSubmit(async (values) => {
    setPasswordStatus(null);
    await passwordMutation.mutateAsync({
      current_password: values.current_password,
      new_password: values.new_password
    });
  });

  return (
    <Stack gap={3}>
      <Typography variant="h4">{t("settings.title")}</Typography>

      <Paper sx={{ p: 3, maxWidth: 480 }}>
        <Typography variant="h6" gutterBottom>
          {t("settings.profile.title")}
        </Typography>
        {profileStatus ? (
          <Alert severity={profileStatus}>
            {profileStatus === "success"
              ? t("settings.profile.success")
              : t("settings.profile.error")}
          </Alert>
        ) : null}
        <Stack component="form" gap={2} onSubmit={onSubmitProfile}>
          <TextField
            label={t("settings.profile.name")}
            error={!!profileErrors.name}
            helperText={profileErrors.name?.message}
            {...register("name")}
          />
          <FormControl>
            <Typography variant="subtitle2">{t("settings.profile.theme")}</Typography>
            <RadioGroup row {...register("theme_preference")}>
              <FormControlLabel
                value="light"
                control={<Radio />}
                label={t("settings.profile.theme.light")}
              />
              <FormControlLabel
                value="dark"
                control={<Radio />}
                label={t("settings.profile.theme.dark")}
              />
            </RadioGroup>
          </FormControl>
          <Button type="submit" variant="contained" disabled={profileMutation.isPending}>
            {profileMutation.isPending ? t("settings.profile.submitting") : t("settings.profile.submit")}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, maxWidth: 480 }}>
        <Typography variant="h6" gutterBottom>
          {t("settings.password.title")}
        </Typography>
        {passwordStatus ? (
          <Alert severity={passwordStatus}>
            {passwordStatus === "success"
              ? t("settings.password.success")
              : t("settings.password.error")}
          </Alert>
        ) : null}
        <Stack component="form" gap={2} onSubmit={onSubmitPassword}>
          <TextField
            label={t("settings.password.current")}
            type="password"
            error={!!passwordErrors.current_password}
            helperText={passwordErrors.current_password?.message}
            {...registerPassword("current_password")}
          />
          <TextField
            label={t("settings.password.new")}
            type="password"
            error={!!passwordErrors.new_password}
            helperText={passwordErrors.new_password?.message}
            {...registerPassword("new_password")}
          />
          <TextField
            label={t("settings.password.confirm")}
            type="password"
            error={!!passwordErrors.confirm_password}
            helperText={passwordErrors.confirm_password?.message}
            {...registerPassword("confirm_password")}
          />
          <Button type="submit" variant="outlined" disabled={passwordMutation.isPending}>
            {passwordMutation.isPending
              ? t("settings.password.submitting")
              : t("settings.password.submit")}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
