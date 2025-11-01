import { ReactNode } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useThemePreference } from "../providers/ThemePreferenceProvider";

interface ScreenProps {
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function Screen({ children, scrollable = true, contentStyle }: ScreenProps) {
  const { colors } = useThemePreference();

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.base, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, contentStyle]}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.base, styles.content, { backgroundColor: colors.background }, contentStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1
  },
  content: {
    padding: 16,
    gap: 16
  }
});
