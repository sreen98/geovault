import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.onSurfaceMuted} style={styles.icon} />
      <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xxl,
  },
  icon: {
    marginBottom: SPACING.md,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.7,
  },
});
