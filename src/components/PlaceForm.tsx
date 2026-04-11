import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import { StatusDialog } from "./StatusDialog";
import { NewPlace, PlaceCategory, isValidCoordinates } from "../types/place.types";
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_FIELDS } from "../constants/categories";
import { TagSelector } from "./TagSelector";
import { ROUNDNESS, SPACING } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { parseMapUrl, extractUrl } from "../services/url-parser.service";
import { openMapsApp } from "../services/map-launcher.service";
import * as Clipboard from "expo-clipboard";

interface PlaceFormProps {
  initialValues?: Partial<NewPlace>;
  onSave: (place: NewPlace) => void;
  onCancel: () => void;
  submitLabel?: string;
  title?: string;
}

export function PlaceForm({
  initialValues,
  onSave,
  onCancel,
  submitLabel = "Save Place to Vault",
  title = "Add Place",
}: PlaceFormProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [latitude, setLatitude] = useState(
    initialValues?.latitude?.toString() ?? ""
  );
  const [longitude, setLongitude] = useState(
    initialValues?.longitude?.toString() ?? ""
  );
  const [category, setCategory] = useState<PlaceCategory>(
    initialValues?.category ?? "Dining"
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [noteMustOrder, setNoteMustOrder] = useState(
    initialValues?.noteMustOrder ?? ""
  );
  const [noteAvoid, setNoteAvoid] = useState(initialValues?.noteAvoid ?? "");
  const [noteGeneral, setNoteGeneral] = useState(
    initialValues?.noteGeneral ?? ""
  );
  const [extraFields, setExtraFields] = useState<Record<string, string>>(
    initialValues?.extraFields ?? {}
  );
  const [sourceUrl, setSourceUrl] = useState(initialValues?.sourceUrl ?? "");
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [parsingUrl, setParsingUrl] = useState(false);
  const [pickingFromMap, setPickingFromMap] = useState(false);
  const [showMapInstructions, setShowMapInstructions] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string } | null>(null);

  const updateExtraField = (key: string, value: string): void => {
    setExtraFields((prev) => ({ ...prev, [key]: value }));
  };

  const useCurrentLocation = async (): Promise<void> => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorDialog({
          title: "Permission Denied",
          message: "Location access is needed to use this feature. You can enter coordinates manually.",
        });
        setFetchingLocation(false);
        return;
      }

      let loc: Location.LocationObject | null = null;

      // Try last known position first (instant, avoids first-attempt failure)
      loc = await Location.getLastKnownPositionAsync();

      if (!loc) {
        // Fall back to current position with balanced accuracy and timeout
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
        });
      }

      setLatitude(loc.coords.latitude.toFixed(6));
      setLongitude(loc.coords.longitude.toFixed(6));
      setPickingFromMap(false);
    } catch (_error: unknown) {
      setErrorDialog({
        title: "Location Error",
        message: "Could not retrieve your location. Please try again or enter coordinates manually.",
      });
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleMapLinkChange = async (url: string): Promise<void> => {
    setSourceUrl(url);
    if (url.includes("http")) {
      setParsingUrl(true);
      try {
        const parsed = await parseMapUrl(url);
        if (parsed.latitude !== null && parsed.longitude !== null) {
          setLatitude(parsed.latitude.toFixed(6));
          setLongitude(parsed.longitude.toFixed(6));
          setPickingFromMap(false);
        }
        if (parsed.name && !name) {
          setName(parsed.name);
        }
      } catch (_error: unknown) {
        // URL parsing failed silently, user can enter coords manually
      } finally {
        setParsingUrl(false);
      }
    }
  };

  const handlePickOnMap = (): void => {
    setShowMapInstructions(true);
  };

  const handleOpenMapsApp = (): void => {
    setShowMapInstructions(false);
    setPickingFromMap(true);
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const hasCoords = !isNaN(lat) && !isNaN(lng);

    // Delay opening maps to let the modal fully close first
    setTimeout(async () => {
      try {
        await openMapsApp(hasCoords ? { latitude: lat, longitude: lng } : undefined);
      } catch (_error: unknown) {
        setErrorDialog({
          title: "Could Not Open Maps",
          message: "No maps application was found on your device. You can enter coordinates manually or paste a map link below.",
        });
      }
    }, 500);
  };

  const handlePasteFromMaps = async (): Promise<void> => {
    setParsingUrl(true);
    try {
      const clipboardText = await Clipboard.getStringAsync();
      if (!clipboardText) {
        setErrorDialog({
          title: "Clipboard Empty",
          message: "No text found on your clipboard. In the maps app, tap Share then Copy Link, and try again.",
        });
        setParsingUrl(false);
        return;
      }

      const url = extractUrl(clipboardText);
      if (!url) {
        setErrorDialog({
          title: "No Map Link Found",
          message: "The clipboard doesn't contain a maps URL. In the maps app, tap Share then Copy Link, and try again.",
        });
        setParsingUrl(false);
        return;
      }

      await handleMapLinkChange(url);
    } catch (_error: unknown) {
      setErrorDialog({
        title: "Paste Failed",
        message: "Could not read from clipboard. Please paste the link manually in the Map Link field below.",
      });
    } finally {
      setParsingUrl(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return;
    let lat = parseFloat(latitude);
    let lng = parseFloat(longitude);

    // If coordinates are missing but we have a map link, try parsing it
    if ((isNaN(lat) || isNaN(lng)) && sourceUrl.trim()) {
      try {
        const parsed = await parseMapUrl(sourceUrl.trim());
        if (parsed.latitude !== null && parsed.longitude !== null) {
          lat = parsed.latitude;
          lng = parsed.longitude;
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
        }
      } catch (_error: unknown) {
        // parsing failed
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      setErrorDialog({
        title: "Coordinates Required",
        message: "Use GPS, pick on map, or paste a valid Google/Apple Maps link to set coordinates.",
      });
      return;
    }

    if (!isValidCoordinates(lat, lng)) {
      setErrorDialog({
        title: "Invalid Coordinates",
        message: "Latitude must be between -90 and 90, longitude between -180 and 180.",
      });
      return;
    }

    onSave({
      name: name.trim(),
      location: location.trim(),
      latitude: lat,
      longitude: lng,
      category,
      tags,
      noteMustOrder: noteMustOrder.trim(),
      noteAvoid: noteAvoid.trim(),
      noteGeneral: noteGeneral.trim(),
      extraFields,
      sourceUrl: sourceUrl.trim(),
      lastVisitedAt: null,
    });
  };

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);
  const hasCoordinates = !isNaN(latNum) && !isNaN(lngNum) && isValidCoordinates(latNum, lngNum);
  const hasMapLink = sourceUrl.trim().length > 0;
  const isValid = name.trim().length > 0 && (hasCoordinates || hasMapLink);

  const categoryFields = CATEGORY_FIELDS[category];
  const showMustOrderAvoid = category === "Dining" || category === "Cafe";

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Capture your latest discovery with all the details.
          </Text>
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Name<Text style={{ color: colors.danger }}> *</Text></Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Ionicons name="business-outline" size={18} color={colors.onSurfaceMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputText, { color: colors.onSurface }]}
              placeholder="e.g. The Hidden Bistro"
              placeholderTextColor={colors.onSurfaceMuted}
              value={name}
              onChangeText={setName}
              accessibilityLabel="Place name"
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Location</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={18} color={colors.onSurfaceMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputText, { color: colors.onSurface }]}
              placeholder="e.g. Koramangala, Bangalore"
              placeholderTextColor={colors.onSurfaceMuted}
              value={location}
              onChangeText={setLocation}
              accessibilityLabel="Location"
            />
          </View>
        </View>

        {/* Category Dropdown */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Category</Text>
          <Pressable
            style={[styles.inputRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            accessibilityRole="button"
            accessibilityLabel={`Category: ${category}`}
          >
            <Ionicons name={CATEGORY_ICONS[category]} size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
            <Text style={[styles.inputText, { color: colors.onSurface, flex: 1 }]}>{category}</Text>
            <Ionicons name={showCategoryPicker ? "chevron-up" : "chevron-down"} size={18} color={colors.onSurfaceMuted} />
          </Pressable>
          {showCategoryPicker && (
            <View style={[styles.dropdown, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.dropdownItem,
                    cat === category && { backgroundColor: colors.accentMuted },
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryPicker(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${cat}`}
                >
                  <Ionicons name={CATEGORY_ICONS[cat]} size={18} color={cat === category ? colors.accent : colors.onSurfaceVariant} />
                  <Text style={[
                    styles.dropdownText,
                    { color: cat === category ? colors.accent : colors.onSurface },
                  ]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Coordinates */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.onSurface }]}>Coordinates</Text>
            <View style={styles.coordActions}>
              <Pressable
                onPress={handlePickOnMap}
                style={styles.gpsButton}
                accessibilityRole="button"
                accessibilityLabel="Pick location on map"
              >
                <Ionicons name="map-outline" size={14} color={colors.accent} />
                <Text style={[styles.gpsText, { color: colors.accent }]}>Pick on Map</Text>
              </Pressable>
              <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
              <Pressable
                onPress={useCurrentLocation}
                disabled={fetchingLocation}
                style={styles.gpsButton}
                accessibilityRole="button"
                accessibilityLabel="Use current GPS location"
              >
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                    <Text style={[styles.gpsText, { color: colors.primary }]}>Use GPS</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
          <View style={styles.coordRow}>
            <View style={[styles.inputRow, styles.halfInput, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <TextInput
                style={[styles.inputText, { color: colors.onSurface }]}
                placeholder="Latitude"
                placeholderTextColor={colors.onSurfaceMuted}
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
                accessibilityLabel="Latitude"
              />
            </View>
            <View style={[styles.inputRow, styles.halfInput, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <TextInput
                style={[styles.inputText, { color: colors.onSurface }]}
                placeholder="Longitude"
                placeholderTextColor={colors.onSurfaceMuted}
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
                accessibilityLabel="Longitude"
              />
            </View>
          </View>
          {pickingFromMap && (
            <Pressable
              onPress={handlePasteFromMaps}
              disabled={parsingUrl}
              style={[styles.pasteFromMapsButton, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}
              accessibilityRole="button"
              accessibilityLabel="Paste map link from clipboard"
            >
              {parsingUrl ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <Ionicons name="clipboard-outline" size={16} color={colors.accent} />
                  <View style={styles.pasteTextGroup}>
                    <Text style={[styles.pasteTitle, { color: colors.accent }]}>Paste from Maps</Text>
                    <Text style={[styles.pasteHint, { color: colors.onSurfaceVariant }]}>
                      Copy the link in the maps app, then tap here
                    </Text>
                  </View>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Map Link */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>Map Link</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Ionicons name="link-outline" size={18} color={colors.onSurfaceMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputText, { color: colors.onSurface, flex: 1 }]}
              placeholder="Paste Google or Apple Maps URL"
              placeholderTextColor={colors.onSurfaceMuted}
              value={sourceUrl}
              onChangeText={handleMapLinkChange}
              autoCapitalize="none"
              keyboardType="url"
              accessibilityLabel="Map link"
            />
            {parsingUrl && <ActivityIndicator size="small" color={colors.accent} />}
          </View>
        </View>

        {/* Tags */}
        <TagSelector selectedTags={tags} onChange={setTags} />

        {/* Category-specific fields */}
        {showMustOrderAvoid && (
          <View style={styles.fieldGroup}>
            <View style={[styles.noteCard, { backgroundColor: colors.successMuted, borderColor: colors.success }]}>
              <View style={styles.noteCardHeader}>
                <Ionicons name="heart" size={16} color={colors.success} />
                <Text style={[styles.noteCardLabel, { color: colors.success }]}>
                  {category === "Cafe" ? "MUST TRY" : "MUST ORDER"}
                </Text>
              </View>
              <TextInput
                style={[styles.noteInput, { backgroundColor: colors.surfaceCard, color: colors.onSurface }]}
                placeholder={category === "Cafe" ? "Signature drinks or pastries..." : "Dishes or drinks worth returning for..."}
                placeholderTextColor={colors.onSurfaceMuted}
                value={noteMustOrder}
                onChangeText={setNoteMustOrder}
                multiline
                accessibilityLabel={category === "Cafe" ? "Must try" : "Must order"}
              />
            </View>

            <View style={[styles.noteCard, { backgroundColor: colors.dangerMuted, borderColor: colors.danger, marginTop: SPACING.md }]}>
              <View style={styles.noteCardHeader}>
                <Ionicons name="warning" size={16} color={colors.danger} />
                <Text style={[styles.noteCardLabel, { color: colors.danger }]}>AVOID</Text>
              </View>
              <TextInput
                style={[styles.noteInput, { backgroundColor: colors.surfaceCard, color: colors.onSurface }]}
                placeholder="Dishes or times to skip..."
                placeholderTextColor={colors.onSurfaceMuted}
                value={noteAvoid}
                onChangeText={setNoteAvoid}
                multiline
                accessibilityLabel="Avoid"
              />
            </View>
          </View>
        )}

        {!showMustOrderAvoid && categoryFields.length > 0 && (
          <View style={styles.fieldGroup}>
            <View style={[styles.sectionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="clipboard-outline" size={16} color={colors.accent} />
                <Text style={[styles.sectionCardTitle, { color: colors.accent }]}>
                  {category.toUpperCase()} DETAILS
                </Text>
              </View>
              {categoryFields.map((field) => (
                <View key={field.key} style={styles.sectionFieldGroup}>
                  <Text style={[styles.sectionFieldLabel, { color: colors.onSurfaceVariant }]}>
                    {field.label}
                  </Text>
                  <TextInput
                    style={[
                      styles.sectionFieldInput,
                      field.multiline && styles.textArea,
                      { backgroundColor: colors.surfaceElevated, color: colors.onSurface },
                    ]}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.onSurfaceMuted}
                    value={extraFields[field.key] ?? ""}
                    onChangeText={(text) => updateExtraField(field.key, text)}
                    multiline={field.multiline}
                    accessibilityLabel={field.label}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* General Notes */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.onSurface }]}>General Notes</Text>
          <TextInput
            style={[styles.inputRow, styles.textArea, { backgroundColor: colors.surfaceCard, borderColor: colors.border, color: colors.onSurface }]}
            placeholder="Atmosphere, parking, best time to visit..."
            placeholderTextColor={colors.onSurfaceMuted}
            value={noteGeneral}
            onChangeText={setNoteGeneral}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="General notes"
          />
        </View>

        {/* Save Button */}
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
          <Text style={[
            styles.saveButtonText,
            { color: isValid ? colors.white : colors.onSurfaceMuted },
          ]}>
            {submitLabel}
          </Text>
        </Pressable>

        {/* Discard */}
        <Pressable
          onPress={onCancel}
          style={styles.discardButton}
          accessibilityRole="button"
          accessibilityLabel="Discard draft"
        >
          <Text style={[styles.discardText, { color: colors.onSurfaceVariant }]}>Discard Draft</Text>
        </Pressable>
      </ScrollView>
      {errorDialog && (
        <StatusDialog
          visible
          title={errorDialog.title}
          message={errorDialog.message}
          type="error"
          onDismiss={() => setErrorDialog(null)}
        />
      )}
      {showMapInstructions && (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setShowMapInstructions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalDialog, { backgroundColor: colors.surfaceElevated }]}>
              <View style={[styles.modalIconCircle, { backgroundColor: colors.accentMuted }]}>
                <Ionicons name="map-outline" size={28} color={colors.accent} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                Pick on Map
              </Text>
              <Text style={[styles.modalMessage, { color: colors.onSurfaceVariant }]}>
                {"1. Find the place in the maps app\n2. Tap the Share button\n3. Tap Copy Link\n4. Come back to GeoVault\n5. Tap Paste from Maps"}
              </Text>
              <View style={styles.modalButtonRow}>
                <Pressable
                  onPress={() => setShowMapInstructions(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  style={[styles.modalButton, { backgroundColor: colors.surfaceContainerHigh }]}
                >
                  <Text style={[styles.modalButtonText, { color: colors.onSurface }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleOpenMapsApp}
                  accessibilityRole="button"
                  accessibilityLabel="Open Maps"
                  style={[styles.modalButton, { backgroundColor: colors.accent }]}
                >
                  <Ionicons name="open-outline" size={16} color={colors.white} style={styles.modalButtonIcon} />
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>Open Maps</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  coordRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  halfInput: {
    flex: 1,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gpsText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  coordActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  actionDivider: {
    width: 1,
    height: 14,
  },
  pasteFromMapsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
  },
  pasteTextGroup: {
    flex: 1,
  },
  pasteTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  pasteHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  dropdown: {
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    marginTop: SPACING.xs,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  noteCard: {
    borderRadius: ROUNDNESS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  noteCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  noteCardLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  noteInput: {
    borderRadius: ROUNDNESS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  sectionCard: {
    borderRadius: ROUNDNESS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionCardTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  sectionFieldGroup: {
    marginBottom: SPACING.md,
  },
  sectionFieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  sectionFieldInput: {
    borderRadius: ROUNDNESS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: SPACING.sm,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  modalDialog: {
    width: "100%",
    borderRadius: ROUNDNESS.xl,
    padding: SPACING.lg,
    alignItems: "center",
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: ROUNDNESS.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.3,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    textAlign: "left",
    marginBottom: SPACING.lg,
    alignSelf: "stretch",
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: ROUNDNESS.md,
  },
  modalButtonIcon: {
    marginRight: 6,
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
