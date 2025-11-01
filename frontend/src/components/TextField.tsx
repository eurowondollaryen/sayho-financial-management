import { forwardRef } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from "react-native";

import { useThemePreference } from "../providers/ThemePreferenceProvider";

interface TextFieldProps extends TextInputProps {
  label: string;
  helperText?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, helperText, error, containerStyle, style, ...props },
  ref
) {
  const { colors } = useThemePreference();

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
            backgroundColor: colors.surface
          },
          style
        ]}
        {...props}
      />
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helper, { color: colors.muted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 6
  },
  label: {
    fontSize: 14,
    fontWeight: "500"
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16
  },
  helper: {
    fontSize: 12
  },
  error: {
    fontSize: 12,
    fontWeight: "500"
  }
});

export default TextField;
