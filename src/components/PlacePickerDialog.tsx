import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlacesRepository } from "../db/places.repository";
import { Place, PlaceCategory } from "../types/place.types";
import { CATEGORY_COLORS, ROUNDNESS, SPACING } from "../constants/theme";
import { pluralize } from "../utils/plural";
import { useTheme } from "../contexts/ThemeContext";

const PAGE_SIZE = 30;

interface PlacePickerDialogProps {
  visible: boolean;
  collectionId: string;
  collectionName: string;
  onConfirm: (placeIds: string[]) => void;
  onCancel: () => void;
}

export function PlacePickerDialog({
  visible,
  collectionId,
  collectionName,
  onConfirm,
  onCancel,
}: PlacePickerDialogProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [hasAddablePlaces, setHasAddablePlaces] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runQuery = useCallback(
    (searchText: string): void => {
      const results = PlacesRepository.getAddableToCollection(
        collectionId,
        searchText,
        PAGE_SIZE,
        0
      );
      setPlaces(results);
      setHasMore(results.length === PAGE_SIZE);
    },
    [collectionId]
  );

  // Reset every time the sheet opens so a previous session's search and
  // selection never leak into the next one.
  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setSelected([]);
    runQuery("");
    // Probes for a single row so the empty state can tell "nothing left to add"
    // apart from "nothing matches that search".
    setHasAddablePlaces(
      PlacesRepository.getAddableToCollection(collectionId, "", 1, 0).length > 0
    );
  }, [visible, collectionId, runQuery]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleQueryChange = useCallback(
    (text: string): void => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runQuery(text), 300);
    },
    [runQuery]
  );

  const loadMore = useCallback((): void => {
    if (!hasMore) return;
    const next = PlacesRepository.getAddableToCollection(
      collectionId,
      query,
      PAGE_SIZE,
      places.length
    );
    setPlaces((current) => [...current, ...next]);
    setHasMore(next.length === PAGE_SIZE);
  }, [collectionId, hasMore, places.length, query]);

  const toggle = useCallback((placeId: string): void => {
    setSelected((current) =>
      current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : [...current, placeId]
    );
  }, []);

  const keyExtractor = useCallback((item: Place) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: Place }) => {
      const isSelected = selected.includes(item.id);
      const categoryColor =
        CATEGORY_COLORS[item.category as PlaceCategory] ?? CATEGORY_COLORS.Other;

      return (
        <Pressable
          onPress={() => toggle(item.id)}
          accessibilityRole="checkbox"
          accessibilityLabel={`${item.name}, ${item.category}`}
          accessibilityState={{ checked: isSelected }}
          style={[
            styles.row,
            {
              backgroundColor: isSelected
                ? colors.surfaceElevated
                : colors.surfaceCard,
              borderColor: isSelected ? colors.accent : colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: isSelected ? colors.accent : "transparent",
                borderColor: isSelected ? colors.accent : colors.borderLight,
              },
            ]}
          >
            {isSelected ? (
              <Ionicons name="checkmark" size={14} color={colors.background} />
            ) : null}
          </View>

          <View style={styles.rowText}>
            <Text
              style={[styles.rowTitle, { color: colors.onSurface }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowCategory, { color: categoryColor }]}>
                {item.category}
              </Text>
              {item.location ? (
                <>
                  <Text
                    style={[styles.rowDot, { color: colors.onSurfaceMuted }]}
                  >
                    {"•"}
                  </Text>
                  <Text
                    style={[styles.rowLocation, { color: colors.onSurfaceMuted }]}
                    numberOfLines={1}
                  >
                    {item.location}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </Pressable>
      );
    },
    [colors, selected, toggle]
  );

  const emptyMessage = !hasAddablePlaces
    ? "Every saved place is already in this collection."
    : query
      ? "No places match that search."
      : "No places available to add.";

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.onSurface }]}>
                Add Places
              </Text>
              <Text
                style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                to {collectionName}
              </Text>
            </View>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
            >
              <Ionicons name="close" size={26} color={colors.onSurface} />
            </Pressable>
          </View>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={colors.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: colors.onSurface }]}
              placeholder="Search places to add..."
              placeholderTextColor={colors.secondary}
              value={query}
              onChangeText={handleQueryChange}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
              accessibilityLabel="Search places to add"
            />
          </View>
        </View>

        <FlatList
          data={places}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            places.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="location-outline"
                size={44}
                color={colors.onSurfaceMuted}
              />
              <Text
                style={[styles.emptyText, { color: colors.onSurfaceVariant }]}
              >
                {emptyMessage}
              </Text>
            </View>
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={10}
          initialNumToRender={15}
        />

        <View
          style={[
            styles.footer,
            {
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ]}
        >
          <Pressable
            onPress={() => onConfirm(selected)}
            disabled={selected.length === 0}
            accessibilityRole="button"
            accessibilityLabel={`Add ${pluralize(selected.length, "place")}`}
            accessibilityState={{ disabled: selected.length === 0 }}
            style={[
              styles.confirmButton,
              {
                backgroundColor:
                  selected.length > 0 ? colors.primary : colors.surfaceHighlight,
              },
            ]}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={
                selected.length > 0 ? colors.white : colors.onSurfaceMuted
              }
            />
            <Text
              style={[
                styles.confirmText,
                {
                  color:
                    selected.length > 0 ? colors.white : colors.onSurfaceMuted,
                },
              ]}
            >
              {selected.length > 0
                ? `Add ${pluralize(selected.length, "place")}`
                : "Select places to add"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: ROUNDNESS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    marginTop: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    borderRadius: ROUNDNESS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: ROUNDNESS.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowCategory: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  rowDot: {
    fontSize: 12,
  },
  rowLocation: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  empty: {
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 15,
    borderRadius: ROUNDNESS.md,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
