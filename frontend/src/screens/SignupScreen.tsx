import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";

import Button from "../components/Button";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import { useAuth } from "../providers/AuthProvider";
import { useThemePreference } from "../providers/ThemePreferenceProvider";
import { useTranslation } from "../providers/LanguageProvider";

interface SignupFormData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export default function SignupScreen() {
  const navigation = useNavigation();
  const { signupAndLogin } = useAuth();
  const { colors } = useThemePreference();
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await signupAndLogin(data.email, data.name, data.password);
    } catch (error) {
      console.error(error);
      setSubmitError(t("signup.error"));
    }
  });

  return (
    <Screen>
      <View style={{ gap: 24, marginTop: 32 }}>
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>{t("signup.title")}</Text>
          <Text style={{ color: colors.muted }}>{t("app.title")}</Text>
        </View>

        <View style={{ gap: 16 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t("signup.email")}
                autoCapitalize="none"
                keyboardType="email-address"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t("signup.name")}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t("signup.password")}
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t("signup.confirm_password")}
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          {submitError ? <Text style={{ color: colors.danger }}>{submitError}</Text> : null}

          <Button title={t("signup.submit")} onPress={onSubmit} loading={isSubmitting} />
        </View>

        <View style={{ alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>
            {t("signup.login_prompt")}{" "}
            <TouchableOpacity onPress={() => navigation.navigate("Login" as never)}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>{t("signup.login_link")}</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </Screen>
  );
}
