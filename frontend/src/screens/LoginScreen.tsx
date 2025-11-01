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

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const { loginWithCredentials } = useAuth();
  const { colors } = useThemePreference();
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email({ message: t("validation.email") }),
        password: z.string().min(8, { message: t("validation.password_min") })
      }),
    [t]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await loginWithCredentials(data.email, data.password);
    } catch (error) {
      console.error(error);
      setSubmitError(t("login.error"));
    }
  });

  return (
    <Screen>
      <View
        style={{
          gap: 24,
          marginTop: 32
        }}
      >
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>{t("login.title")}</Text>
          <Text style={{ color: colors.muted }}>{t("app.title")}</Text>
        </View>

        <View style={{ gap: 16 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t("login.email")}
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
            name="password"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label={t("login.password")}
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          {submitError ? <Text style={{ color: colors.danger }}>{submitError}</Text> : null}

          <Button title={t("login.submit")} onPress={onSubmit} loading={isSubmitting} />
        </View>

        <View style={{ alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>
            {t("login.signup_prompt")}{" "}
            <TouchableOpacity onPress={() => navigation.navigate("Signup" as never)}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>{t("login.signup_link")}</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
    </Screen>
  );
}
