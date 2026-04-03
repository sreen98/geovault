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
import { useTheme } from "../contexts/ThemeContext";
import { Place } from "../types/place.types";
import { CATEGORIES } from "../constants/categories";
import { CATEGORY_COLORS, SPACING, ROUNDNESS } from "../constants/theme";

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    places,
    activeCategory,
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

  const ListHeader = useCallback(() => (
    <View style={styles.headerContent}>
      <Text style={[styles.appTitle, { color: colors.onSurface }]}>GeoVault</Text>

      {hasPlaces && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {filterOptions.map((filter) => {
            const isActive = filter === "All Places" ? !activeCategory : activeCategory === filter;
            const chipColor = filter === "All Places"
              ? colors.primary
              : CATEGORY_COLORS[filter as keyof typeof CATEGORY_COLORS] ?? colors.primary;

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
                    ? { backgroundColor: chipColor }
                    : { backgroundColor: "transparent", borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? colors.white : colors.onSurfaceVariant },
                  ]}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  ), [colors, filterOptions, activeCategory, handleFilterPress, hasPlaces]);

  if (!hasPlaces) {
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
          <View style={styles.emptyCenter}>
            <Ionicons name="location-outline" size={48} color={colors.onSurfaceMuted} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No places yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.onSurfaceMuted }]}>
              Tap the + button to save your first location.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/place/new")}
          accessibilityRole="button"
          accessibilityLabel="Add new place"
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent items-center justify-center z-10"
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </Pressable>
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
      <Pressable
        onPress={() => router.push("/place/new")}
        accessibilityRole="button"
        accessibilityLabel="Add new place"
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-accent items-center justify-center z-10"
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>
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
    marginBottom: SPACING.md,
  },
  filterScroll: {
    marginTop: SPACING.sm,
  },
  filterRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ROUNDNESS.full,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  emptyScreen: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  emptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Manrope_700Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
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
