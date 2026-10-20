import { View, Pressable, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface FABProps {
  onPress: () => void;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function FAB({ onPress, label = "Add new place", icon = "add" }: FABProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
        // Plain style array, not a ({ pressed }) function: NativeWind's Pressable
        // interop drops function styles, which renders the button invisible.
        style={[
          styles.button,
          {
            backgroundColor: colors.accent,
            // Shadow tinted with the button's own colour so it reads as a glow,
            // not a grey smudge, on both themes.
            ...Platform.select({
              ios: { shadowColor: colors.accent },
              default: {},
            }),
          },
        ]}
      >
        <Ionicons name={icon} size={28} color={colors.background} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: SPACING.lg,
    zIndex: 10,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: ROUNDNESS.full,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
