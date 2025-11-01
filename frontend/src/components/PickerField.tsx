
import { Picker, type PickerProps } from "@react-native-picker/picker";
import { StyleSheet, Text, View } from "react-native";

import { useThemePreference } from "../providers/ThemePreferenceProvider";

type Item = {
  label: string;
  value: string | number;
};

type PickerFieldProps = {
  label: string;
  items: Item[];
  error?: string;
} & PickerProps;

export default function PickerField({
  label,
  items,
  error,
  ...pickerProps
}: PickerFieldProps) {
  const { colors } = useThemePreference();

  const styles = StyleSheet.create({
    container: {
      gap: 6
    },
    label: {
      color: colors.muted,
      fontSize: 12
    },
    pickerContainer: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: error ? colors.danger : colors.border,
      borderRadius: 10,
      overflow: "hidden",
      justifyContent: "center"
    },
    picker: {
      color: colors.text,
      // The picker has a default padding on android that we can't easily remove,
      // so we use negative margin to make it look more like the text field.
      marginVertical: -10
    },
    errorText: {
      color: colors.danger,
      fontSize: 12
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker style={styles.picker} {...pickerProps}>
          {items.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
