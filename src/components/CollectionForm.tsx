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
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NewCollection, isValidDateRange, isValidISODate } from "../types/collection.types";
import {
  COLLECTION_COLORS,
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_ICONS,
  COLLECTION_NAME_MAX,
  CollectionIcon,
  DEFAULT_COLLECTION_COLOR,
  DEFAULT_COLLECTION_ICON,
} from "../constants/collections";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

interface CollectionFormProps {
  initialValues?: Partial<NewCollection>;
  onSave: (collection: NewCollection) => void;
  onCancel: () => void;
  title?: string;
  submitLabel?: string;
}

/** Keeps only digits and re-inserts the dashes, so typing stays forgiving. */
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function CollectionForm({
  initialValues,
  onSave,
  onCancel,
  title = "New Collection",
  submitLabel = "Create Collection",
}: CollectionFormProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [color, setColor] = useState(
    initialValues?.color ?? DEFAULT_COLLECTION_COLOR
  );
  const [icon, setIcon] = useState<CollectionIcon>(
    initialValues?.icon ?? DEFAULT_COLLECTION_ICON
  );

  const hasInitialDates = Boolean(
    initialValues?.startDate || initialValues?.endDate
  );
  const [datesEnabled, setDatesEnabled] = useState(hasInitialDates);
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? "");
  const [dateError, setDateError] = useState<string | null>(null);

  const trimmedName = name.trim();
  const isValid = trimmedName.length > 0;
  const nameNearLimit = name.length >= COLLECTION_NAME_MAX - 10;
  const descriptionNearLimit =
    description.length >= COLLECTION_DESCRIPTION_MAX - 30;

  const handleSave = (): void => {
    if (!isValid) return;

    let finalStart: string | null = null;
    let finalEnd: string | null = null;

    if (datesEnabled) {
      const start = startDate.trim();
      const end = endDate.trim();

      if (start && !isValidISODate(start)) {
        setDateError("Start date must be a real date in YYYY-MM-DD form.");
        return;
      }
      if (end && !isValidISODate(end)) {
        setDateError("End date must be a real date in YYYY-MM-DD form.");
        return;
      }
      if (!isValidDateRange(start || null, end || null)) {
        setDateError("The end date cannot be before the start date.");
        return;
      }

      finalStart = start || null;
      finalEnd = end || null;
    }

    setDateError(null);
    onSave({
      name: trimmedName,
      description: description.trim(),
      color,
      icon,
      startDate: finalStart,
      endDate: finalEnd,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Club places together by trip, city, or whatever ties them.
          </Text>
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.onSurface }]}>
              Name<Text style={{ color: colors.danger }}> *</Text>
            </Text>
            {nameNearLimit ? (
              <Text style={[styles.counter, { color: colors.onSurfaceMuted }]}>
                {name.length}/{COLLECTION_NAME_MAX}
              </Text>
            ) : null}
          </View>
          <View
            style={[
              styles.inputRow,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name={icon}
              size={18}
              color={color}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.inputText, { color: colors.onSurface }]}
              placeholder="e.g. Goa 2026"
              placeholderTextColor={colors.onSurfaceMuted}
              value={name}
              onChangeText={setName}
              maxLength={COLLECTION_NAME_MAX}
              accessibilityLabel="Collection name"
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.onSurface }]}>
              Description
            </Text>
            {descriptionNearLimit ? (
              <Text style={[styles.counter, { color: colors.onSurfaceMuted }]}>
                {description.length}/{COLLECTION_DESCRIPTION_MAX}
              </Text>
            ) : null}
          </View>
          <TextInput
            style={[
              styles.inputRow,
              styles.textArea,
              {
                backgroundColor: colors.surfaceCard,
                borderColor: colors.border,
                color: colors.onSurface,
              },
            ]}
            placeholder="What ties these places together?"
            placeholderTextColor={colors.onSurfaceMuted}
            value={description}
            onChangeText={setDescription}
            maxLength={COLLECTION_DESCRIPTION_MAX}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel="Collection description"
          />
        </View>

        {/* Colour */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Colour</Text>
          <View style={styles.swatchRow}>
            {COLLECTION_COLORS.map((option) => {
              const isSelected = option === color;
              return (
                <Pressable
                  key={option}
                  onPress={() => setColor(option)}
                  accessibilityRole="button"
                  accessibilityLabel={`Colour ${option}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: option,
                      borderColor: isSelected ? colors.onSurface : "transparent",
                    },
                  ]}
                >
                  {isSelected ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Icon */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Icon</Text>
          <View style={styles.iconGrid}>
            {COLLECTION_ICONS.map((option) => {
              const isSelected = option === icon;
              return (
                <Pressable
                  key={option}
                  onPress={() => setIcon(option)}
                  accessibilityRole="button"
                  accessibilityLabel={`Icon ${option.replace("-outline", "")}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.iconTile,
                    {
                      backgroundColor: isSelected
                        ? `${color}22`
                        : colors.surfaceCard,
                      borderColor: isSelected ? color : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={option}
                    size={20}
                    color={isSelected ? color : colors.onSurfaceVariant}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Trip dates */}
        <View style={styles.fieldGroup}>
          <View
            style={[
              styles.datesToggleRow,
              { backgroundColor: colors.surfaceCard, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.onSurfaceVariant}
              style={styles.inputIcon}
            />
            <View style={styles.datesToggleText}>
              <Text style={[styles.label, { color: colors.onSurface }]}>
                Trip dates
              </Text>
              <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>
                Optional, for collections tied to a date range
              </Text>
            </View>
            <Switch
              value={datesEnabled}
              onValueChange={(value) => {
                setDatesEnabled(value);
                if (!value) setDateError(null);
              }}
              trackColor={{ false: colors.surfaceHighlight, true: color }}
              thumbColor={colors.white}
              accessibilityLabel="Enable trip dates"
            />
          </View>

          {datesEnabled ? (
            <View style={styles.dateRow}>
              <View
                style={[
                  styles.inputRow,
                  styles.halfInput,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: dateError ? colors.danger : colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.inputText, { color: colors.onSurface }]}
                  placeholder="Start YYYY-MM-DD"
                  placeholderTextColor={colors.onSurfaceMuted}
                  value={startDate}
                  onChangeText={(text) => {
                    setStartDate(formatDateInput(text));
                    setDateError(null);
                  }}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  accessibilityLabel="Start date"
                />
              </View>
              <View
                style={[
                  styles.inputRow,
                  styles.halfInput,
                  {
                    backgroundColor: colors.surfaceCard,
                    borderColor: dateError ? colors.danger : colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.inputText, { color: colors.onSurface }]}
                  placeholder="End YYYY-MM-DD"
                  placeholderTextColor={colors.onSurfaceMuted}
                  value={endDate}
                  onChangeText={(text) => {
                    setEndDate(formatDateInput(text));
                    setDateError(null);
                  }}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  accessibilityLabel="End date"
                />
              </View>
            </View>
          ) : null}

          {dateError ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {dateError}
            </Text>
          ) : null}
        </View>

        {/* Save */}
        <Pressable
          onPress={handleSave}
          disabled={!isValid}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          accessibilityState={{ disabled: !isValid }}
          style={[
            styles.saveButton,
            { backgroundColor: isValid ? colors.primary : colors.surfaceHighlight },
          ]}
        >
          <Ionicons
            name="save-outline"
            size={20}
            color={isValid ? colors.white : colors.onSurfaceMuted}
          />
          <Text
            style={[
              styles.saveButtonText,
              { color: isValid ? colors.white : colors.onSurfaceMuted },
            ]}
          >
            {submitLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={onCancel}
          style={styles.discardButton}
          accessibilityRole="button"
          accessibilityLabel="Discard"
        >
          <Text style={[styles.discardText, { color: colors.onSurfaceVariant }]}>
            Discard
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 30,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 20,
  },
  fieldGroup: {
    marginTop: SPACING.lg,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: SPACING.sm,
  },
  counter: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: SPACING.sm,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 90,
    paddingTop: SPACING.md,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
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
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  datesToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  datesToggleText: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  halfInput: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 16,
    borderRadius: ROUNDNESS.md,
    marginTop: SPACING.xl,
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  discardButton: {
    alignItems: "center",
    paddingVertical: SPACING.md,
    marginTop: SPACING.xs,
  },
  discardText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
