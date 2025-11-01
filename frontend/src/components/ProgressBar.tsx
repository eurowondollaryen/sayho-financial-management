import { StyleSheet, View } from "react-native";

import { useThemePreference } from "../providers/ThemePreferenceProvider";

interface ProgressBarProps {
  value: number;
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const { colors } = useThemePreference();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View style={[styles.track, { backgroundColor: colors.border }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 5
  }
});
