import { Picker, type PickerProps } from "@react-native-picker/picker";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import MuiSelect from "@mui/material/Select";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useThemePreference } from "../providers/ThemePreferenceProvider";

type Item = {
  label: string;
  value: string | number;
};

type PickerFieldProps = {
  label: string;
  items: Item[];
  error?: string;
  // This is a bit of a hack to make the props compatible
} & (PickerProps & { onValueChange: (value: any) => void });

function NativePickerField({
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
      height: 56,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: error ? colors.danger : colors.border,
      borderRadius: 10,
      justifyContent: "center",
      paddingHorizontal: 4
    },
    picker: {
      color: colors.text
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

function WebPickerField({
  label,
  items,
  error,
  selectedValue,
  onValueChange,
  ...pickerProps
}: PickerFieldProps) {
  return (
    <FormControl fullWidth error={!!error}>
      <InputLabel>{label}</InputLabel>
      <MuiSelect
        label={label}
        value={selectedValue}
        onChange={(e) => onValueChange(e.target.value)}
        {...(pickerProps as any)}
      >
        {items.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {error ? (
        <Text style={{ color: "#d32f2f", fontSize: 12, marginLeft: 14, marginTop: 3 }}>
          {error}
        </Text>
      ) : null}
    </FormControl>
  );
}

export default function PickerField(props: PickerFieldProps) {
  if (Platform.OS === "web") {
    return <WebPickerField {...props} />;
  }

  return <NativePickerField {...props} />;
}