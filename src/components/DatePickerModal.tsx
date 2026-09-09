import { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface DatePickerModalProps {
  visible: boolean;
  title: string;
  value: string | null; // ISO string
  onSelect: (iso: string | null) => void;
  onClose: () => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function DatePickerModal({
  visible,
  title,
  value,
  onSelect,
  onClose,
}: DatePickerModalProps) {
  const { colors } = useTheme();
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const selected = value ? startOfDay(new Date(value)) : null;

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrevMonth = (): void => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNextMonth = (): void => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number): void => {
    const picked = new Date(viewYear, viewMonth, day);
    onSelect(picked.toISOString());
    onClose();
  };

  const isSelected = (day: number): boolean => {
    if (!selected) return false;
    return (
      selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === day
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>

          {/* Month navigation */}
          <View style={styles.navRow}>
            <Pressable
              onPress={goPrevMonth}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              hitSlop={10}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.onSurface }]}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Pressable
              onPress={goNextMonth}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              hitSlop={10}
              style={styles.navButton}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <View key={`${w}-${i}`} style={styles.cell}>
                <Text style={[styles.weekday, { color: colors.onSurfaceMuted }]}>
                  {w}
                </Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.cell} />;
              }
              const active = isSelected(day);
              return (
                <View key={`day-${day}`} style={styles.cell}>
                  <Pressable
                    onPress={() => handleSelectDay(day)}
                    accessibilityRole="button"
                    accessibilityLabel={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.dayButton,
                      active && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: active ? colors.background : colors.onSurface },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear date"
              style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
            >
              <Text style={[styles.actionText, { color: colors.onSurface }]}>Clear</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
            >
              <Text style={[styles.actionText, { color: colors.onSurface }]}>Cancel</Text>
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
  },
  title: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  navButton: {
    padding: SPACING.xs,
  },
  monthLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: SPACING.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  weekday: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: ROUNDNESS.full,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  actionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: ROUNDNESS.md,
  },
  actionText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
