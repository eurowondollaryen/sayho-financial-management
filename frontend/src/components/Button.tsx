import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { useThemePreference } from "../providers/ThemePreferenceProvider";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "text";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style
}: ButtonProps) {
  const { colors } = useThemePreference();
  const isPrimary = variant === "primary";
  const isText = variant === "text";
  const backgroundColor = isPrimary ? colors.primary : isText ? "transparent" : colors.surface;
  const borderColor = isPrimary ? colors.primary : colors.border;
  const textColor = isPrimary ? "#ffffff" : isText ? colors.primary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor,
          opacity: disabled || loading ? 0.6 : pressed ? 0.8 : 1
        },
        isText && styles.textVariant,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  label: {
    fontSize: 16,
    fontWeight: "600"
  },
  textVariant: {
    borderWidth: 0,
    paddingVertical: 10
  }
});
