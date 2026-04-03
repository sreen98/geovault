import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

const { width } = Dimensions.get("window");
const TAB_BAR_WIDTH = width * 0.9;

export const GlassTabDock: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <BlurView
        intensity={80}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.blurContainer,
          {
            borderColor: colors.borderLight,
            ...Platform.select({
              ios: {
                shadowColor: colors.black,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
              },
              android: {
                elevation: 10,
              },
            }),
          }
        ]}
      >
        <View style={styles.tabContainer}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            const getIconName = (routeName: string, focused: boolean): keyof typeof Ionicons.glyphMap => {
              switch (routeName) {
                case "index":
                  return focused ? "location" : "location-outline";
                case "search":
                  return focused ? "search" : "search-outline";
                case "add":
                  return focused ? "add-circle" : "add-circle-outline";
                case "settings":
                  return focused ? "settings" : "settings-outline";
                default:
                  return "help";
              }
            };

            return (
              <TouchableOpacity
                key={route.name}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabButton}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
                accessibilityState={{ selected: isFocused }}
              >
                <Animated.View
                  style={isFocused ? [styles.activeIndicator, { backgroundColor: colors.accent }] : null}
                />
                <Ionicons
                  name={getIconName(route.name, isFocused)}
                  size={24}
                  color={isFocused ? colors.accent : colors.onSurfaceMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20,
    width: width,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  blurContainer: {
    width: TAB_BAR_WIDTH,
    height: 64,
    borderRadius: ROUNDNESS.xl,
    overflow: "hidden",
    borderWidth: 1,
  },
  tabContainer: {
    flexDirection: "row",
    height: "100%",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  tabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
