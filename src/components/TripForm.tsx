import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusDialog } from "./StatusDialog";
import { DatePickerModal } from "./DatePickerModal";
import { NewTrip } from "../types/trip.types";
import {
  TRIP_COLORS,
  TRIP_ICONS,
  DEFAULT_TRIP_COLOR,
  DEFAULT_TRIP_ICON,
} from "../constants/trips";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { formatDate } from "../utils/date";
import { useTheme } from "../contexts/ThemeContext";

interface TripFormProps {
  initialValues?: Partial<NewTrip>;
  onSave: (trip: NewTrip) => void;
  onCancel: () => void;
  submitLabel?: string;
  title?: string;
}

export function TripForm({
  initialValues,
  onSave,
  onCancel,
  submitLabel = "Save Trip",
  title = "New Trip",
}: TripFormProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [color, setColor] = useState(initialValues?.color || DEFAULT_TRIP_COLOR);
  const [icon, setIcon] = useState(initialValues?.icon || DEFAULT_TRIP_ICON);
  const [startDate, setStartDate] = useState<string | null>(
    initialValues?.startDate ?? null
  );
  const [endDate, setEndDate] = useState<string | null>(
    initialValues?.endDate ?? null
  );
  const [pickerTarget, setPickerTarget] = useState<"start" | "end" | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string } | null>(null);

  const handleSave = (): void => {
    if (!name.trim()) {
      setErrorDialog({
        title: "Name Required",
        message: "Give your trip a name so you can find it later.",
      });
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setErrorDialog({
        title: "Invalid Dates",
        message: "The end date cannot be before the start date.",
      });
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      startDate,
      endDate,
    });
  };

  const isValid = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Group places together for a trip or theme.
          </Text>
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>
            Name<Text style={{ color: colors.danger }}> *</Text>
          </Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Ionicons name="map-outline" size={18} color={colors.onSurfaceMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputText, { color: colors.onSurface }]}
              placeholder="e.g. Tokyo 2026"
              placeholderTextColor={colors.onSurfaceMuted}
              value={name}
              onChangeText={setName}
              accessibilityLabel="Trip name"
            />
          </View>
        </View>

        {/* Color */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Color</Text>
          <View style={styles.swatchRow}>
            {TRIP_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityRole="button"
                accessibilityLabel={`Select color ${c}`}
                accessibilityState={{ selected: c === color }}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  c === color && { borderColor: colors.onSurface, borderWidth: 3 },
                ]}
              >
                {c === color ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Icon */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Icon</Text>
          <View style={styles.iconRow}>
            {TRIP_ICONS.map((ic) => {
              const active = ic === icon;
              return (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select icon ${ic}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: active ? color : colors.surfaceCard,
                      borderColor: active ? color : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={ic}
                    size={22}
                    color={active ? "#FFFFFF" : colors.onSurfaceVariant}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Dates</Text>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => setPickerTarget("start")}
              accessibilityRole="button"
              accessibilityLabel="Set start date"
              style={[styles.dateInput, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceMuted} />
              <Text
                style={[
                  styles.dateText,
                  { color: startDate ? colors.onSurface : colors.onSurfaceMuted },
                ]}
              >
                {startDate ? formatDate(startDate) : "Start"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPickerTarget("end")}
              accessibilityRole="button"
              accessibilityLabel="Set end date"
              style={[styles.dateInput, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceMuted} />
              <Text
                style={[
                  styles.dateText,
                  { color: endDate ? colors.onSurface : colors.onSurfaceMuted },
                ]}
              >
                {endDate ? formatDate(endDate) : "End"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surfaceCard, borderColor: colors.border, color: colors.onSurface }]}
            placeholder="Notes about this trip..."
            placeholderTextColor={colors.onSurfaceMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Trip description"
          />
        </View>

        {/* Save */}
        <Pressable
          onPress={handleSave}
          disabled={!isValid}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          style={[
            styles.saveButton,
            { backgroundColor: isValid ? colors.primary : colors.surfaceHighlight },
          ]}
        >
          <Ionicons name="save-outline" size={20} color={isValid ? colors.white : colors.onSurfaceMuted} />
          <Text style={[styles.saveButtonText, { color: isValid ? colors.white : colors.onSurfaceMuted }]}>
            {submitLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={onCancel}
          style={styles.discardButton}
          accessibilityRole="button"
          accessibilityLabel="Discard"
        >
          <Text style={[styles.discardText, { color: colors.onSurfaceVariant }]}>Discard</Text>
        </Pressable>
      </ScrollView>

      <DatePickerModal
        visible={pickerTarget === "start"}
        title="Start Date"
        value={startDate}
        onSelect={setStartDate}
        onClose={() => setPickerTarget(null)}
      />
      <DatePickerModal
        visible={pickerTarget === "end"}
        title="End Date"
        value={endDate}
        onSelect={setEndDate}
        onClose={() => setPickerTarget(null)}
      />

      {errorDialog && (
        <StatusDialog
          visible
          title={errorDialog.title}
          message={errorDialog.message}
          type="error"
          onDismiss={() => setErrorDialog(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  inputText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    flex: 1,
    paddingVertical: 12,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: ROUNDNESS.full,
    justifyContent: "center",
    alignItems: "center",
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dateRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  dateText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 16,
    borderRadius: ROUNDNESS.lg,
    marginTop: SPACING.lg,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  discardButton: {
    alignItems: "center",
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  discardText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
