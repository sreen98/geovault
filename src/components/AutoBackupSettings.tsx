import { View, Text, Pressable, StyleSheet, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../stores/settings.store";
import { AutoBackupInterval } from "../services/auto-backup.service";
import { formatRelativeDate } from "../utils/date";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

const INTERVALS: { label: string; value: AutoBackupInterval }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

export function AutoBackupSettings() {
  const { colors } = useTheme();
  const {
    autoBackupEnabled,
    autoBackupInterval,
    lastAutoBackupTime,
    setAutoBackup,
    setAutoBackupInterval,
  } = useSettingsStore();

  return (
    <View style={styles.container}>
      {/* Toggle row */}
      <View style={[styles.row, { borderBottomColor: colors.surfaceContainerHigh }]}>
        <View style={styles.rowLeft}>
          <Ionicons name="sync-outline" size={18} color={colors.onSurfaceVariant} />
          <Text style={[styles.rowLabel, { color: colors.onSurface }]}>Auto Backup</Text>
        </View>
        <Switch
          value={autoBackupEnabled}
          onValueChange={setAutoBackup}
          trackColor={{ false: colors.surfaceHighlight, true: colors.accent }}
          thumbColor={colors.white}
        />
      </View>

      {/* Interval picker — only when enabled */}
      {autoBackupEnabled && (
        <View style={styles.intervalSection}>
          <Text style={[styles.intervalLabel, { color: colors.onSurfaceMuted }]}>
            BACKUP FREQUENCY
          </Text>
          <View style={styles.intervalRow}>
            {INTERVALS.map((item) => {
              const isActive = autoBackupInterval === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setAutoBackupInterval(item.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set backup frequency to ${item.label}`}
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.intervalChip,
                    isActive
                      ? { backgroundColor: colors.accent }
                      : { backgroundColor: colors.surfaceHighlight },
                  ]}
                >
                  <Text
                    style={[
                      styles.intervalChipText,
                      { color: isActive ? colors.background : colors.onSurfaceVariant },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Last auto-backup time */}
          {lastAutoBackupTime && (
            <View style={styles.lastBackupRow}>
              <Ionicons name="time-outline" size={12} color={colors.onSurfaceMuted} />
              <Text style={[styles.lastBackupText, { color: colors.onSurfaceMuted }]}>
                Last auto-backup: {formatRelativeDate(lastAutoBackupTime).toLowerCase()}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  intervalSection: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  intervalLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  intervalRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  intervalChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: ROUNDNESS.md,
  },
  intervalChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  lastBackupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: SPACING.sm,
  },
  lastBackupText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
