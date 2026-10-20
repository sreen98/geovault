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
import { CollectionsRepository } from "../db/collections.repository";
import { Place, PlaceCategory } from "../types/place.types";
import { Collection } from "../types/collection.types";
import { TagChip } from "../components/TagChip";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CollectionPickerDialog } from "../components/CollectionPickerDialog";
import { usePlacesStore } from "../stores/places.store";
import { formatDateTime } from "../utils/date";
import { CATEGORY_COLORS, SPACING, ROUNDNESS } from "../constants/theme";
import { CATEGORY_FIELDS, CATEGORY_ICONS } from "../constants/categories";
import { useTheme } from "../contexts/ThemeContext";

export function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const deletePlace = usePlacesStore((s) => s.deletePlace);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const refreshCollections = useCallback((): void => {
    if (!id) return;
    setCollections(CollectionsRepository.getForPlace(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        setPlace(PlacesRepository.getById(id));
        setCollections(CollectionsRepository.getForPlace(id));
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
        <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          This place no longer exists.
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Text style={[styles.emptyAction, { color: colors.accent }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const catColor =
    CATEGORY_COLORS[place.category as PlaceCategory] || CATEGORY_COLORS.Other;
  const catIcon =
    CATEGORY_ICONS[place.category as PlaceCategory] || CATEGORY_ICONS.Other;
  const isFoodCategory = place.category === "Dining" || place.category === "Cafe";
  const categoryFields = CATEGORY_FIELDS[place.category] ?? [];
  const filledExtra = categoryFields.filter((f) => place.extraFields[f.key]?.trim());

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
        </Pressable>
        <Pressable
          onPress={() => router.push(`/place/edit/${place.id}`)}
          accessibilityRole="button"
          accessibilityLabel="Edit place"
          hitSlop={12}
          style={styles.navButton}
        >
          <Ionicons name="create-outline" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 112 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={styles.titleBlock}>
          <View
            style={[styles.categoryPill, { backgroundColor: `${catColor}26` }]}
            accessibilityLabel={`Category: ${place.category}`}
          >
            <Ionicons name={catIcon} size={14} color={catColor} />
            <Text style={[styles.categoryPillText, { color: catColor }]}>
              {place.category}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={3}>
            {place.name}
          </Text>
          {place.location ? (
            <View style={styles.locRow}>
              <Ionicons name="location-outline" size={16} color={colors.onSurfaceMuted} />
              <Text style={[styles.locText, { color: colors.onSurfaceVariant }]}>
                {place.location}
              </Text>
            </View>
          ) : null}
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

        {/* Collections */}
        <View style={styles.block}>
          <View style={styles.collectionHeader}>
            <Text style={[styles.label, { color: colors.onSurfaceMuted }]}>
              Collections
            </Text>
            <Pressable
              onPress={() => setShowCollectionPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Add this place to a collection"
              hitSlop={8}
              style={styles.collectionAdd}
            >
              <Ionicons name="add-circle-outline" size={16} color={catColor} />
              <Text style={[styles.collectionAddText, { color: catColor }]}>
                {collections.length > 0 ? "Edit" : "Add"}
              </Text>
            </Pressable>
          </View>

          {collections.length > 0 ? (
            <View style={styles.collectionWrap}>
              {collections.map((collection) => (
                <Pressable
                  key={collection.id}
                  onPress={() => router.push(`/collection/${collection.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open collection ${collection.name}`}
                  style={[
                    styles.collectionChip,
                    {
                      backgroundColor: `${collection.color}1F`,
                      borderColor: collection.color,
                    },
                  ]}
                >
                  <Ionicons
                    name={collection.icon}
                    size={13}
                    color={collection.color}
                  />
                  <Text
                    style={[styles.collectionChipText, { color: collection.color }]}
                    numberOfLines={1}
                  >
                    {collection.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={[styles.collectionEmpty, { color: colors.onSurfaceMuted }]}>
              Not in any collection yet.
            </Text>
          )}
        </View>
        <View style={[styles.sep, { backgroundColor: colors.surfaceContainerHigh }]} />

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

      {/* Primary action pinned to the thumb zone */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, SPACING.md),
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={openInMaps}
          accessibilityRole="link"
          accessibilityLabel={`Open ${place.name} in Maps`}
          style={[styles.mapBtn, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="navigate" size={20} color={colors.background} />
          <Text style={[styles.mapBtnText, { color: colors.background }]}>Open in Maps</Text>
        </Pressable>
      </View>

      <CollectionPickerDialog
        visible={showCollectionPicker}
        placeId={place.id}
        placeName={place.name}
        onSaved={() => {
          setShowCollectionPicker(false);
          refreshCollections();
        }}
        onCancel={() => setShowCollectionPicker(false)}
      />

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
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  emptyAction: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm + SPACING.xs,
    height: 28,
    borderRadius: ROUNDNESS.full,
  },
  categoryPillText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  name: {
    fontSize: 32,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs + 2,
  },
  locText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    flex: 1,
  },

  scroll: {
    paddingTop: SPACING.sm,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    height: 52,
    borderRadius: ROUNDNESS.lg,
  },
  mapBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  coords: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: SPACING.sm,
  },
  collectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collectionAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  collectionAddText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  collectionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: SPACING.sm,
  },
  collectionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ROUNDNESS.full,
    borderWidth: 1,
  },
  collectionChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  collectionEmpty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
