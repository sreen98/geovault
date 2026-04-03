import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  StyleSheet,
  StatusBar,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlacesRepository } from "../db/places.repository";
import { Place, PlaceCategory } from "../types/place.types";
import { TagChip } from "../components/TagChip";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { usePlacesStore } from "../stores/places.store";
import { formatDateTime } from "../utils/date";
import { CATEGORY_COLORS, SPACING, ROUNDNESS } from "../constants/theme";
import { CATEGORY_FIELDS } from "../constants/categories";
import { useTheme } from "../contexts/ThemeContext";

export function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const deletePlace = usePlacesStore((s) => s.deletePlace);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setPlace(PlacesRepository.getById(id));
      }
    }, [id])
  );

  const openInMaps = useCallback((): void => {
    if (!place) return;
    if (place.sourceUrl) {
      Linking.openURL(place.sourceUrl);
    } else {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      );
    }
  }, [place]);

  const confirmDelete = useCallback((): void => {
    if (!place) return;
    deletePlace(place.id);
    setShowDelete(false);
    router.back();
  }, [place, deletePlace]);

  if (!place) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: "Inter_400Regular" }}>
          Place not found
        </Text>
      </View>
    );
  }

  const catColor =
    CATEGORY_COLORS[place.category as PlaceCategory] || CATEGORY_COLORS.Other;
  const isFoodCategory = place.category === "Dining" || place.category === "Cafe";
  const categoryFields = CATEGORY_FIELDS[place.category] ?? [];
  const filledExtra = categoryFields.filter((f) => place.extraFields[f.key]?.trim());

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.md }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
            {place.name}
          </Text>
          <Pressable
            onPress={() => router.push(`/place/edit/${place.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Edit place"
            hitSlop={12}
          >
            <Ionicons name="create-outline" size={26} color={colors.onSurface} />
          </Pressable>
        </View>
        {place.location ? (
          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color={catColor} />
            <Text style={[styles.locText, { color: colors.onSurfaceVariant }]}>
              {place.location}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Category */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>Category</Text>
          <Text style={[styles.value, { color: catColor }]}>{place.category}</Text>
        </View>
        <View style={[styles.sep, { backgroundColor: colors.surfaceContainerHigh }]} />

        {/* General Notes */}
        {place.noteGeneral ? (
          <>
            <View style={styles.block}>
              <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>Notes</Text>
              <View style={[styles.quoteBar, { borderLeftColor: catColor }]}>
                <Text style={[styles.quoteText, { color: colors.onSurfaceVariant }]}>
                  &ldquo;{place.noteGeneral}&rdquo;
                </Text>
              </View>
            </View>
            <View style={[styles.sep, { backgroundColor: colors.surfaceContainerHigh }]} />
          </>
        ) : null}

        {/* Extra fields */}
        {filledExtra.map((field) => (
          <View key={field.key}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>
                {field.label}
              </Text>
              <Text style={[styles.value, { color: colors.onSurface }]} numberOfLines={2}>
                {place.extraFields[field.key]}
              </Text>
            </View>
            <View style={[styles.sep, { backgroundColor: colors.surfaceContainerHigh }]} />
          </View>
        ))}

        {/* Must Order */}
        {isFoodCategory && place.noteMustOrder ? (
          <>
            <View style={styles.block}>
              <View style={styles.labelWithDot}>
                <View style={[styles.dot, { backgroundColor: colors.success }]} />
                <Text style={[styles.label, { color: colors.success }]}>
                  {place.category === "Cafe" ? "Must Try" : "Must Order"}
                </Text>
              </View>
              <Text style={[styles.body, { color: colors.onSurface }]}>
                {place.noteMustOrder}
              </Text>
            </View>
            <View style={[styles.sep, { backgroundColor: colors.surfaceContainerHigh }]} />
          </>
        ) : null}

        {/* Avoid */}
        {isFoodCategory && place.noteAvoid ? (
          <>
            <View style={styles.block}>
              <View style={styles.labelWithDot}>
                <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.label, { color: colors.danger }]}>Avoid</Text>
              </View>
              <Text style={[styles.body, { color: colors.onSurface }]}>
                {place.noteAvoid}
              </Text>
            </View>
            <View style={[styles.sep, { backgroundColor: colors.surfaceContainerHigh }]} />
          </>
        ) : null}

        {/* Map */}
        <View style={styles.block}>
          <Pressable
            onPress={openInMaps}
            accessibilityRole="link"
            accessibilityLabel="Open in Maps"
            style={[styles.mapBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.mapBtnText}>Open in Maps</Text>
          </Pressable>
        </View>
        <View style={[styles.sep, { backgroundColor: colors.surfaceContainerHigh }]} />

        {/* Coordinates */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>Coordinates</Text>
          <Text style={[styles.coords, { color: colors.onSurfaceMuted }]}>
            {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
          </Text>
        </View>
        <View style={[styles.sep, { backgroundColor: colors.surfaceContainerHigh }]} />

        {/* Tags */}
        {place.tags.length > 0 && (
          <>
            <View style={styles.block}>
              <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>Tags</Text>
              <View style={styles.tagWrap}>
                {place.tags.map((tag) => (
                  <TagChip key={tag} label={tag} size="sm" />
                ))}
              </View>
            </View>
            <View style={[styles.sep, { backgroundColor: colors.surfaceContainerHigh }]} />
          </>
        )}

        {/* Metadata */}
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.onSurfaceMuted }]}>
            Added {formatDateTime(place.createdAt)}
          </Text>
          {place.lastVisitedAt && (
            <Text style={[styles.metaText, { color: colors.onSurfaceMuted }]}>
              Last visited {formatDateTime(place.lastVisitedAt)}
            </Text>
          )}
        </View>

        {/* Delete */}
        <View style={styles.deleteRow}>
          <Pressable
            onPress={() => setShowDelete(true)}
            accessibilityRole="button"
            accessibilityLabel="Delete place"
            style={[styles.deleteBtn, { borderColor: colors.danger }]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[styles.deleteText, { color: colors.danger }]}>Delete Place</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showDelete}
        title="Delete Place"
        message={`Are you sure you want to delete "${place.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDelete(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },

  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginBottom: 4,
  },
  name: {
    fontSize: 32,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
    flex: 1,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 2,
  },
  locText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },

  scroll: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },

  /* Shared section primitives */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  block: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sep: {
    height: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
    flexShrink: 0,
  },
  value: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    flex: 1,
    marginLeft: SPACING.lg,
  },
  labelWithDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: SPACING.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 23,
  },
  quoteBar: {
    borderLeftWidth: 2,
    paddingLeft: SPACING.md,
    marginTop: SPACING.sm,
  },
  quoteText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 24,
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: ROUNDNESS.md,
  },
  mapBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  coords: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: SPACING.sm,
  },
  meta: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  deleteRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 14,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
