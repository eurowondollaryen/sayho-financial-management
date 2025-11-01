import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../providers/AuthProvider";
import { useThemePreference } from "../providers/ThemePreferenceProvider";
import { useTranslation } from "../providers/LanguageProvider";
import DashboardScreen from "../screens/DashboardScreen";
import GoalsScreen from "../screens/GoalsScreen";
import LoginScreen from "../screens/LoginScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SignupScreen from "../screens/SignupScreen";
import StatusScreen from "../screens/StatusScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LoadingView() {
  const { colors } = useThemePreference();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function AppTabs() {
  const { colors } = useThemePreference();
  const { t } = useTranslation();

  const screenOptions = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border
    }
  } as const;

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarIcon: ({ color, size }) => {
          const iconName = (() => {
            switch (route.name) {
              case "Dashboard":
                return "dashboard";
              case "Status":
                return "insights";
              case "Goals":
                return "flag";
              case "Settings":
                return "settings";
              default:
                return "circle";
            }
          })();
          return <MaterialIcons name={iconName} color={color} size={size ?? 22} />;
        }
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: t("nav.dashboard") }}
      />
      <Tab.Screen
        name="Status"
        component={StatusScreen}
        options={{ title: t("nav.status") }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{ title: t("nav.goals") }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t("nav.settings") }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingView />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="AppTabs" component={AppTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
