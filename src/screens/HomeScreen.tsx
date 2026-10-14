import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlacesStore } from "../stores/places.store";
import { PlaceCard } from "../components/PlaceCard";
import { EmptyState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FAB } from "../components/FAB";
import { useTheme } from "../contexts/ThemeContext";
import { Place } from "../types/place.types";
import { CATEGORIES, CATEGORY_ICONS } from "../constants/categories";
import { CATEGORY_COLORS, SPACING, ROUNDNESS } from "../constants/theme";
import { pluralize } from "../utils/plural";

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    places,
    activeCategory,
    totalCount,
    hasMore,
    isLoadingMore,
    loadPlaces,
    loadMore,
    deletePlace,
    setCategory,
  } = usePlacesStore();

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [loadPlaces])
  );

  const keyExtractor = useCallback((item: Place) => item.id, []);

  const handlePress = useCallback((place: Place): void => {
    router.push(`/place/${place.id}`);
  }, []);

  const handleAdd = useCallback((): void => {
    router.push("/place/new");
  }, []);

  const [deleteTarget, setDeleteTarget] = useState<Place | null>(null);

  const handleDelete = useCallback((place: Place): void => {
    setDeleteTarget(place);
  }, []);

  const confirmDelete = useCallback((): void => {
    if (deleteTarget) {
      deletePlace(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deletePlace]);

  const renderItem = useCallback(
    ({ item }: { item: Place }) => (
      <PlaceCard
        place={item}
        onPress={() => handlePress(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [handlePress, handleDelete]
  );

  const filterOptions = useMemo(() => {
    return ["All Places", ...CATEGORIES];
  }, []);

  const handleFilterPress = useCallback(
    (filter: string): void => {
      setCategory(filter === "All Places" ? null : filter);
    },
    [setCategory]
  );

  const hasPlaces = places.length > 0;
  // A filter that matches nothing is not an empty vault — keep the chips on
  // screen so the user can clear it.
  const isVaultEmpty = !hasPlaces && !activeCategory;

  const ListHeader = useCallback(() => (
    <View style={styles.headerContent}>
      <Text style={[styles.appTitle, { color: colors.onSurface }]}>GeoVault</Text>
      <Text style={[styles.headerCount, { color: colors.onSurfaceMuted }]}>
        {activeCategory
          ? `${pluralize(totalCount, "place")} in ${activeCategory}`
          : pluralize(totalCount, "place")}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {filterOptions.map((filter) => {
          const isAll = filter === "All Places";
          const isActive = isAll ? !activeCategory : activeCategory === filter;
          const category = isAll ? null : CATEGORIES.find((c) => c === filter) ?? null;
          const chipColor = category ? CATEGORY_COLORS[category] : colors.accent;
          const chipIcon = category ? CATEGORY_ICONS[category] : "apps-outline";

          // Active chips use a soft tint of their colour rather than a solid fill,
          // so nine category colours never compete with the content below.
          return (
            <Pressable
              key={filter}
              onPress={() => handleFilterPress(filter)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${filter}`}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.filterChip,
                isActive
                  ? { backgroundColor: `${chipColor}26`, borderColor: chipColor }
                  : { backgroundColor: "transparent", borderColor: colors.border },
              ]}
            >
              <Ionicons
                name={chipIcon}
                size={16}
                color={isActive ? chipColor : colors.onSurfaceMuted}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? chipColor : colors.onSurfaceVariant },
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  ), [colors, filterOptions, activeCategory, handleFilterPress, totalCount]);

  if (isVaultEmpty) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={styles.emptyScreen}>
          <Text style={[styles.appTitle, { color: colors.onSurface }]}>GeoVault</Text>
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.onSurface }]}>Vaulted</Text>
            <Text style={[styles.heroTitleAccent, { color: colors.accent }]}>Places.</Text>
            <Text style={[styles.heroSubtitle, { color: colors.onSurfaceVariant }]}>
              Your curated selection of{"\n"}discoveries and hidden gems.
            </Text>
          </View>
          <EmptyState
            icon="location-outline"
            title="No places yet"
            subtitle="Paste a Google or Apple Maps link, or drop a pin where you stand."
            actionLabel="Save your first place"
            onAction={handleAdd}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <FlatList
        data={places}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        style={styles.flatList}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.filterEmpty}>
            <Text style={[styles.filterEmptyText, { color: colors.onSurfaceVariant }]}>
              No {activeCategory} places saved yet.
            </Text>
            <Pressable
              onPress={() => setCategory(null)}
              accessibilityRole="button"
              accessibilityLabel="Show all places"
              hitSlop={8}
            >
              <Text style={[styles.filterEmptyAction, { color: colors.accent }]}>
                Show all places
              </Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={styles.loadingMore}
            />
          ) : null
        }
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={15}
        windowSize={10}
        initialNumToRender={15}
      />
      <FAB onPress={handleAdd} />
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete Place"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  flatList: {
    flex: 1,
    zIndex: 1,
  },
  headerContent: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -0.8,
    paddingHorizontal: SPACING.lg,
  },
  headerCount: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
  },
  filterScroll: {
    marginTop: SPACING.md,
  },
  filterRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    height: 36,
    borderRadius: ROUNDNESS.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  filterEmpty: {
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  filterEmptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  filterEmptyAction: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  emptyScreen: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  heroTitle: {
    fontSize: 44,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  heroTitleAccent: {
    fontSize: 44,
    fontFamily: "Manrope_700Bold",
    letterSpacing: -1.5,
    lineHeight: 50,
    fontStyle: "italic",
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  listContent: {
    paddingTop: SPACING.sm,
    paddingBottom: 120,
  },
  loadingMore: {
    paddingVertical: SPACING.lg,
  },
});
