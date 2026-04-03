import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface ImportDialogProps {
  visible: boolean;
  onAppend: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
}

export function ImportDialog({
  visible,
  onAppend,
  onOverwrite,
  onCancel,
}: ImportDialogProps) {
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
          style={[styles.dialog, { backgroundColor: colors.surfaceElevated }]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.accentMuted },
            ]}
          >
            <Ionicons
              name="download-outline"
              size={28}
              color={colors.accent}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Import Places
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
            Choose how to handle existing data when importing.
          </Text>

          {/* Option cards */}
          <Pressable
            onPress={onAppend}
            accessibilityRole="button"
            accessibilityLabel="Append to existing places"
            style={[
              styles.optionCard,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.accentMuted },
              ]}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.onSurface }]}>
                Append
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                Add new places, skip duplicates
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.onSurfaceMuted}
            />
          </Pressable>

          <Pressable
            onPress={onOverwrite}
            accessibilityRole="button"
            accessibilityLabel="Overwrite all existing places"
            style={[
              styles.optionCard,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: colors.dangerMuted },
              ]}
            >
              <Ionicons name="swap-horizontal-outline" size={22} color={colors.danger} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.onSurface }]}>
                Overwrite All
              </Text>
              <Text
                style={[
                  styles.optionSubtitle,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                Replace all data with imported file
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.onSurfaceMuted}
            />
          </Pressable>

          {/* Cancel */}
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={[
              styles.cancelButton,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <Text
              style={[styles.cancelText, { color: colors.onSurfaceVariant }]}
            >
              Cancel
            </Text>
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
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    padding: SPACING.md,
    borderRadius: ROUNDNESS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: ROUNDNESS.full,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  optionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  cancelButton: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: ROUNDNESS.md,
    marginTop: SPACING.xs,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
