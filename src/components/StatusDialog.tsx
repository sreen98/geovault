import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface StatusDialogProps {
  visible: boolean;
  title: string;
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export function StatusDialog({
  visible,
  title,
  message,
  type,
  onDismiss,
}: StatusDialogProps) {
  const { colors } = useTheme();

  const iconName: keyof typeof Ionicons.glyphMap =
    type === "success" ? "checkmark-circle-outline" : "alert-circle-outline";
  const iconColor = type === "success" ? colors.accent : colors.danger;
  const iconBg = type === "success" ? colors.accentMuted : colors.dangerMuted;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.dialog, { backgroundColor: colors.surfaceElevated }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName} size={32} color={iconColor} />
          </View>

          <Text style={[styles.title, { color: colors.onSurface }]}>
            {title}
          </Text>

          <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
            {message}
          </Text>

          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="OK"
            style={[
              styles.button,
              {
                backgroundColor:
                  type === "success" ? colors.accent : colors.danger,
              },
            ]}
          >
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  dialog: {
    width: "100%",
    borderRadius: ROUNDNESS.xl,
    padding: SPACING.lg,
    alignItems: "center",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: ROUNDNESS.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  button: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: ROUNDNESS.md,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
