import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";

import Button from "../components/Button";
import Card from "../components/Card";
import PickerField from "../components/PickerField";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import { updateCurrentUser, updatePassword } from "../api/users";
import { useAuth } from "../providers/AuthProvider";
import { useLanguage, useTranslation } from "../providers/LanguageProvider";
import { useThemePreference } from "../providers/ThemePreferenceProvider";

type ProfileFormData = {
  name: string;
  theme_preference: "light" | "dark";
};

type PasswordFormData = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export default function SettingsScreen() {
  const { user, refreshUser, setUser, logout } = useAuth();
  const { colors, setMode } = useThemePreference();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

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
          current_password: z.string().min(1),
          new_password: z.string().min(8, { message: t("validation.password_min") }),
          confirm_password: z.string().min(8, { message: t("validation.password_min") })
        })
        .refine((data) => data.new_password === data.confirm_password, {
          message: t("error.password_mismatch"),
          path: ["confirm_password"]
        }),
    [t]
  );

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isUpdatingProfile },
    reset: resetProfileForm
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      theme_preference: (user?.theme_preference ?? "light") as "light" | "dark"
    }
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isUpdatingPassword },
    reset: resetPasswordForm
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: ""
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateCurrentUser
  });

  const updatePasswordMutation = useMutation({
    mutationFn: updatePassword
  });

  useEffect(() => {
    resetProfileForm({
      name: user?.name ?? "",
      theme_preference: (user?.theme_preference ?? "light") as "light" | "dark"
    });
  }, [user, resetProfileForm]);

  const onUpdateProfile = handleProfileSubmit(async (data) => {
    setProfileFeedback(null);
    try {
      const updatedUser = await updateProfileMutation.mutateAsync({
        name: data.name,
        theme_preference: data.theme_preference
      });
      setUser(updatedUser);
      setMode(data.theme_preference);
      setProfileFeedback(t("settings.profile.success"));
    } catch (error) {
      console.error(error);
      setProfileFeedback(t("settings.profile.error"));
    } finally {
      await refreshUser().catch(() => undefined);
    }
  });

  const onUpdatePassword = handlePasswordSubmit(async (data) => {
    setPasswordFeedback(null);
    try {
      await updatePasswordMutation.mutateAsync({
        current_password: data.current_password,
        new_password: data.new_password
      });
      resetPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      setPasswordFeedback(t("settings.password.success"));
    } catch (error) {
      console.error(error);
      setPasswordFeedback(t("settings.password.error"));
    }
  });

  return (
    <Screen>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>{t("settings.title")}</Text>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("settings.profile.title")}</Text>
          <View style={{ gap: 12 }}>
            <Controller
              control={profileControl}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("settings.profile.name")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={profileErrors.name?.message}
                />
              )}
            />

            <Controller
              control={profileControl}
              name="theme_preference"
              render={({ field: { value, onChange } }) => (
                <PickerField
                  label={t("settings.profile.theme")}
                  selectedValue={value}
                  onValueChange={onChange}
                  items={[
                    { label: t("settings.profile.theme.light"), value: "light" },
                    { label: t("settings.profile.theme.dark"), value: "dark" }
                  ]}
                />
              )}
            />

            <Button
              title={t("settings.profile.submit")}
              onPress={onUpdateProfile}
              loading={isUpdatingProfile || updateProfileMutation.isPending}
            />
            {profileFeedback ? (
              <Text style={{ color: profileFeedback === t("settings.profile.success") ? colors.secondary : colors.danger }}>
                {profileFeedback}
              </Text>
            ) : null}
          </View>
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("settings.password.title")}</Text>
          <View style={{ gap: 12 }}>
            <Controller
              control={passwordControl}
              name="current_password"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("settings.password.current")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  error={passwordErrors.current_password?.message}
                />
              )}
            />

            <Controller
              control={passwordControl}
              name="new_password"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("settings.password.new")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  error={passwordErrors.new_password?.message}
                />
              )}
            />

            <Controller
              control={passwordControl}
              name="confirm_password"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField
                  label={t("settings.password.confirm")}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  error={passwordErrors.confirm_password?.message}
                />
              )}
            />

            <Button
              title={t("settings.password.submit")}
              onPress={onUpdatePassword}
              loading={isUpdatingPassword || updatePasswordMutation.isPending}
            />
            {passwordFeedback ? (
              <Text
                style={{
                  color: passwordFeedback === t("settings.password.success") ? colors.secondary : colors.danger
                }}
              >
                {passwordFeedback}
              </Text>
            ) : null}
          </View>
        </Card>

        <Card>
          <PickerField
            label={t("language.label")}
            selectedValue={language}
            onValueChange={(value) => setLanguage(value as "ko" | "en")}
            items={[
              { label: t("language.korean"), value: "ko" },
              { label: t("language.english"), value: "en" }
            ]}
          />
        </Card>

        <Card>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>{t("app.logout")}</Text>
          <Button title={t("app.logout")} variant="secondary" onPress={logout} />
        </Card>
      </View>
    </Screen>
  );
}