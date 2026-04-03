import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/contexts/ThemeContext";
import { ROUNDNESS, SPACING } from "../../src/constants/theme";

type IoniconsName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  color,
  size,
  focused,
  accentColor,
}: {
  name: IoniconsName;
  color: string;
  size: number;
  focused: boolean;
  accentColor: string;
}) {
  return (
    <View style={styles.tabIconWrapper}>
      <Ionicons name={name} size={size} color={color} />
      {focused && <View style={[styles.activeIndicator, { backgroundColor: accentColor }]} />}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bottomPadding = Math.max(insets.bottom, SPACING.sm);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.onSurfaceMuted,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + bottomPadding + SPACING.sm,
          paddingTop: SPACING.sm,
          paddingBottom: bottomPadding,
          ...Platform.select({
            ios: {
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
            },
            android: {
              elevation: 16,
            },
          }),
        },
        tabBarItemStyle: {
          gap: 2,
        },
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.onSurface,
        headerTitleStyle: {
          fontFamily: "Manrope_600SemiBold",
          color: colors.onSurface,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Places",
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon
              name="location-outline"
              color={color}
              size={24}
              focused={focused}
              accentColor={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon
              name={focused ? "search" : "search-outline"}
              color={color}
              size={24}
              focused={focused}
              accentColor={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon
              name={focused ? "settings" : "settings-outline"}
              color={color}
              size={24}
              focused={focused}
              accentColor={colors.accent}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
    minHeight: 28,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -4,
    width: 5,
    height: 5,
    borderRadius: ROUNDNESS.full,
  },
});
