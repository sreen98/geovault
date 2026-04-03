import { View, Text, Pressable, Modal, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

/** Legacy helper — uses system Alert for screens not yet migrated to the modal */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void
): void {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Confirm", style: "destructive", onPress: onConfirm },
  ]);
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            { backgroundColor: colors.surfaceElevated },
          ]}
        >
          {/* Icon */}
          <View
            style={[styles.iconCircle, { backgroundColor: colors.dangerMuted }]}
          >
            <Ionicons name="warning-outline" size={28} color={colors.danger} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={[
                styles.button,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.onSurface }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={[styles.button, { backgroundColor: colors.danger }]}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
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
    width: 56,
    height: 56,
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
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    width: "100%",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: ROUNDNESS.md,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
