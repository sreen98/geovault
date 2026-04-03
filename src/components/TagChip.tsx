import { Text, Pressable, StyleSheet } from "react-native";
import { ROUNDNESS } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface TagChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
}

export function TagChip({ label, selected = false, onPress, size = "sm" }: TagChipProps) {
  const { colors } = useTheme();

  const containerStyle = [
    styles.container,
    size === "sm" ? styles.sizeSm : styles.sizeMd,
    {
      backgroundColor: selected ? colors.accent : colors.surfaceHighlight,
    },
    selected && [styles.selectedBorder, { borderColor: colors.accent }],
  ];

  const textStyle = [
    styles.text,
    size === "sm" ? styles.textSm : styles.textMd,
    {
      color: selected ? colors.background : colors.onSurfaceVariant,
    },
  ];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Tag: ${label}`}
      accessibilityState={{ selected }}
      style={containerStyle}
    >
      <Text style={textStyle}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: ROUNDNESS.full,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sizeSm: {
    paddingVertical: 4,
  },
  sizeMd: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  selectedBorder: {
    borderWidth: 1.5,
  },
  text: {
    fontFamily: "Inter_500Medium",
  },
  textSm: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  textMd: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
});
